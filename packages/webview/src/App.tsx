import React, { useCallback, useEffect, useState } from "react";
import JSZip from "jszip";
import { SidebarItem } from "./components/ui/Layouts";
import { StepBasics, StepStack, StepGovernance, StepAutomation } from "./components/Steps";
import { RepoDoctor } from "./components/RepoDoctor";
import {
  WizardState,
  Language,
  ProjectType,
  GeneratedFile,
  AppMode,
  ValidationResult,
  SecurityScanResult,
  GenerationResponse,
  NodeVersionInfo,
  RECOMMENDED_NODE_VERSION,
  ModelProvider,
  ExtensionSettings,
} from "@gitup/shared";
import { hostBridge } from "./transport/hostBridge";
import {
  ChevronRight,
  ChevronLeft,
  Loader2,
  FileText,
  Code,
  Terminal,
  Sparkles,
  Hammer,
  Stethoscope,
  Archive,
  ShieldAlert,
} from "lucide-react";

const INITIAL_STATE: WizardState = {
  step: 1,
  modelProvider: ModelProvider.VSCODE,
  projectDetails: {
    name: "my-new-repo",
    description: "",
    aiPrompt: "",
    type: ProjectType.WEB_APP,
    license: "MIT",
    visibility: "public",
    defaultBranch: "main",
  },
  techStack: {
    language: Language.TYPESCRIPT,
    packageManager: "",
    nodeVersion: "",
    frameworks: [],
    tools: [],
  },
  governance: {
    codeOfConduct: "none",
    contributionGuide: true,
    issueTemplates: false,
    pullRequestTemplate: false,
  },
  automation: {
    ci: true,
    docker: false,
    docs: false,
    tests: true,
    linting: true,
    formatting: true,
    dependabot: true,
    husky: false,
    release: false,
    securityDocs: true,
  },
};

type UpdateNestedState = <K extends keyof WizardState>(
  category: K,
  updates: WizardState[K],
) => void;

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>("landing");
  const [state, setState] = useState<WizardState>(INITIAL_STATE);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationPhase, setGenerationPhase] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [generatedFiles, setGeneratedFiles] = useState<GeneratedFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<GeneratedFile | null>(null);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [securityScan, setSecurityScan] = useState<SecurityScanResult | null>(null);
  const [nodeVersionInfo, setNodeVersionInfo] = useState<NodeVersionInfo | null>(null);
  const [allowDownloadWithErrors, setAllowDownloadWithErrors] = useState(false);
  const [isCooldownActive, setIsCooldownActive] = useState(false);
  const COOLDOWN_MS = 4000;

  const isExternalProvider = state.modelProvider === ModelProvider.EXTERNAL;
  const providerLabel = isExternalProvider ? "External Provider" : "VS Code LM (Copilot)";

  const updateState = (updates: Partial<WizardState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  };

  const updateStateAndPersist = (updates: Partial<WizardState>) => {
    if (updates.modelProvider) {
      hostBridge
        .rpc<void, ExtensionSettings>("SET_SETTINGS", {
          modelProvider: updates.modelProvider,
        })
        .catch(() => {
          // Ignore when not running in VS Code.
        });
    }
    updateState(updates);
  };

  const updateNestedState = useCallback<UpdateNestedState>((category, updates) => {
    setState((prev) => ({
      ...prev,
      [category]: updates,
    }));
  }, []);

  useEffect(() => {
    const loadNodeVersion = async () => {
      try {
        const info = await hostBridge.rpc<NodeVersionInfo, { language: Language }>(
          "GET_NODE_VERSION_INFO",
          { language: state.techStack.language },
        );
        setNodeVersionInfo(info);

        if (
          (state.techStack.language === Language.TYPESCRIPT ||
            state.techStack.language === Language.JAVASCRIPT) &&
          !state.techStack.nodeVersion
        ) {
          const fallback =
            info.detectedVersion || info.recommendedVersion || RECOMMENDED_NODE_VERSION;
          setState((prev) => {
            if (prev.techStack.nodeVersion) return prev;
            return { ...prev, techStack: { ...prev.techStack, nodeVersion: fallback } };
          });
        }
      } catch {
        // Ignore when not running in VS Code.
      }
    };

    loadNodeVersion();
  }, [state.techStack.language, state.techStack.nodeVersion]);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await hostBridge.rpc<ExtensionSettings, undefined>(
          "GET_SETTINGS",
          undefined,
        );
        setState((prev) => ({ ...prev, modelProvider: settings.modelProvider }));
      } catch {
        // Ignore when not running in VS Code.
      }
    };

    loadSettings();
  }, []);

  const nextStep = () => {
    if (state.step < 4) updateState({ step: state.step + 1 });
    else handleGenerate();
  };

  const prevStep = () => {
    if (state.step > 1) updateState({ step: state.step - 1 });
  };

  const handleGenerate = async () => {
    if (isExternalProvider) {
      setGeneratedFiles([]);
      setSelectedFile(null);
      setValidationResult(null);
      setSecurityScan(null);
      setAllowDownloadWithErrors(false);
      setError("External model providers require a server integration that is not configured.");
      updateState({ step: 5 });
      return;
    }
    if (isCooldownActive) return;
    setIsCooldownActive(true);
    setTimeout(() => setIsCooldownActive(false), COOLDOWN_MS + 50);
    setIsGenerating(true);
    setError(null);
    setValidationResult(null);
    setSecurityScan(null);
    setAllowDownloadWithErrors(false);
    updateState({ step: 5 }); // Step 5 is results

    try {
      setGenerationPhase("Constructing architecture...");
      const result = await hostBridge.rpc<GenerationResponse, WizardState>(
        "GENERATE_SCAFFOLD",
        state,
      );

      setGeneratedFiles(result.files);
      setSelectedFile(result.files[0] || null);
      setValidationResult(result.validation);
      setSecurityScan(result.security);
    } catch (err) {
      console.error(err);
      const message =
        err instanceof Error ? err.message : "An unexpected error occurred during generation.";
      setError(message);
    } finally {
      setIsGenerating(false);
      setGenerationPhase("");
    }
  };

  const handleDownloadZip = async () => {
    // Legacy ZIP download - kept for browser/standalone usage if needed,
    // but we prefer Apply to Workspace in VS Code.
    // Use hostBridge to check if we are in VS Code? hostBridge handles it.
    if (generatedFiles.length === 0) return;
    if (validationResult && validationResult.errors.length > 0 && !allowDownloadWithErrors) return;

    const zip = new JSZip();

    // Add files to zip
    generatedFiles.forEach((file) => {
      zip.file(file.path, file.content);
    });

    try {
      const blob = await zip.generateAsync({ type: "blob" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${state.projectDetails.name || "repo-forge"}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error("Failed to generate zip", err);
    }
  };

  // --- Rendering ---

  const renderLanding = () => (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-3rem)] p-8 animate-fade-in">
      <div className="mb-12 text-center">
        <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-brand-300 to-indigo-300 mb-4 tracking-tight">
          Forge or Fix?
        </h1>
        <p className="text-xl text-slate-400 max-w-xl mx-auto">
          Bootstrap a new production-ready repository or diagnose an existing one with AI-powered
          insights.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl w-full">
        {/* Forge Option */}
        <button
          onClick={() => setMode("wizard")}
          className="group relative p-8 bg-slate-900 border border-slate-700 rounded-2xl hover:border-brand-500 transition-all hover:bg-slate-800 text-left overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-32 bg-brand-500/10 blur-[80px] rounded-full group-hover:bg-brand-500/20 transition-all"></div>
          <div className="relative z-10">
            <div className="w-16 h-16 rounded-xl bg-brand-500/20 text-brand-400 flex items-center justify-center mb-6">
              <Hammer size={32} />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Repo Forge</h2>
            <p className="text-slate-400 mb-6">
              Start fresh. Create a comprehensive, best-practice repository scaffold with CI/CD,
              linting, and more.
            </p>
            <div className="flex items-center text-brand-400 font-medium">
              Start New Project{" "}
              <ChevronRight
                size={16}
                className="ml-1 group-hover:translate-x-1 transition-transform"
              />
            </div>
          </div>
        </button>

        {/* Doctor Option */}
        <button
          onClick={() => setMode("doctor")}
          className="group relative p-8 bg-slate-900 border border-slate-700 rounded-2xl hover:border-red-500 transition-all hover:bg-slate-800 text-left overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-32 bg-red-500/10 blur-[80px] rounded-full group-hover:bg-red-500/20 transition-all"></div>
          <div className="relative z-10">
            <div className="w-16 h-16 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center mb-6">
              <Stethoscope size={32} />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Repo Doctor</h2>
            <p className="text-slate-400 mb-6">
              Audit existing configs. Get an AI health check on your manifest files and security
              posture.
            </p>
            <div className="flex items-center text-red-400 font-medium">
              Run Diagnostics{" "}
              <ChevronRight
                size={16}
                className="ml-1 group-hover:translate-x-1 transition-transform"
              />
            </div>
          </div>
        </button>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (state.step) {
      case 1:
        return (
          <StepBasics
            state={state}
            updateState={updateStateAndPersist}
            updateNestedState={updateNestedState}
          />
        );
      case 2:
        return (
          <StepStack
            state={state}
            updateState={updateStateAndPersist}
            updateNestedState={updateNestedState}
            nodeVersionInfo={nodeVersionInfo}
          />
        );
      case 3:
        return (
          <StepGovernance
            state={state}
            updateState={updateStateAndPersist}
            updateNestedState={updateNestedState}
          />
        );
      case 4:
        return (
          <StepAutomation
            state={state}
            updateState={updateStateAndPersist}
            updateNestedState={updateNestedState}
          />
        );
      case 5:
        return renderResults();
      default:
        return null;
    }
  };

  const renderResults = () => {
    if (isGenerating) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-slate-400 animate-fade-in text-center p-8">
          <div className="relative mb-8">
            <div className="absolute inset-0 bg-brand-500 blur-xl opacity-20 rounded-full animate-pulse"></div>
            <Loader2 className="animate-spin text-brand-400 relative z-10" size={64} />
          </div>
          <h3 className="text-2xl text-white font-bold mb-2 tracking-tight">Forging Repository</h3>
          <p className="max-w-md mx-auto text-slate-400">{generationPhase}</p>
          <div className="mt-4 flex flex-col gap-2 text-sm text-slate-500 font-mono">
            <span className="animate-slide-up" style={{ animationDelay: "0s" }}>
              ✓ Analyzing constraints...
            </span>
            <span className="animate-slide-up" style={{ animationDelay: "1s" }}>
              ✓ Scanning for security risks...
            </span>
            <span className="animate-slide-up" style={{ animationDelay: "2s" }}>
              ✓ Validating CI contracts...
            </span>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center p-8 animate-fade-in">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
            <ShieldAlert size={32} className="text-red-500" />
          </div>
          <h3 className="text-xl text-white font-bold mb-2">Generation Blocked</h3>
          <p className="text-red-400 max-w-md mx-auto whitespace-pre-line mb-6 border border-red-500/20 bg-red-500/5 p-4 rounded-lg font-mono text-sm">
            {error}
          </p>
          <button
            onClick={() => {
              setState(INITIAL_STATE);
              setValidationResult(null);
              setSecurityScan(null);
              setAllowDownloadWithErrors(false);
            }}
            className="px-6 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      );
    }

    return (
      <div className="flex h-full gap-4 animate-fade-in overflow-hidden pb-20">
        {/* Validation & Security Summary */}
        {(validationResult || (securityScan && securityScan.warnings.length > 0)) && (
          <div className="absolute top-16 right-6 left-6 z-10 space-y-3">
            {validationResult &&
              (validationResult.errors.length > 0 || validationResult.warnings.length > 0) && (
                <div
                  className={`border rounded-xl p-4 text-sm ${validationResult.errors.length > 0 ? "border-red-500/30 bg-red-500/5 text-red-300" : "border-yellow-500/30 bg-yellow-500/5 text-yellow-300"}`}
                >
                  <div className="font-semibold mb-2">
                    {validationResult.errors.length > 0
                      ? "Validation errors detected (export blocked)"
                      : "Validation warnings detected"}
                  </div>
                  <ul className="list-disc pl-5 space-y-1">
                    {validationResult.errors.map((err, idx) => (
                      <li key={`err-${idx}`}>{err}</li>
                    ))}
                    {validationResult.warnings.map((warn, idx) => (
                      <li key={`warn-${idx}`}>{warn}</li>
                    ))}
                  </ul>
                </div>
              )}
            {securityScan && securityScan.warnings.length > 0 && (
              <div className="border rounded-xl p-4 text-sm border-yellow-500/30 bg-yellow-500/5 text-yellow-300">
                <div className="font-semibold mb-2">Security warnings detected</div>
                <ul className="list-disc pl-5 space-y-1">
                  {securityScan.warnings.map((warn, idx) => (
                    <li key={`sec-${idx}`}>
                      {warn.label} in {warn.file}:{warn.line} → {warn.excerpt}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
        {/* File Tree */}
        <div className="w-1/3 bg-slate-900/50 rounded-xl border border-slate-700/50 flex flex-col overflow-hidden shadow-2xl">
          <div className="p-3 border-b border-slate-700/50 bg-slate-900/80 backdrop-blur flex justify-between items-center">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Explorer</h3>
            <span className="text-[10px] bg-slate-800 text-slate-500 px-2 py-0.5 rounded-full">
              {generatedFiles.length} files
            </span>
          </div>
          <div className="overflow-y-auto flex-1 p-2 space-y-0.5 custom-scrollbar">
            {generatedFiles.map((file) => (
              <button
                key={file.path}
                onClick={() => setSelectedFile(file)}
                className={`w-full text-left px-3 py-2 rounded-md text-sm flex items-center gap-2 truncate transition-colors ${
                  selectedFile?.path === file.path
                    ? "bg-brand-500/10 text-brand-300 border border-brand-500/20 font-medium"
                    : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                }`}
              >
                <FileText
                  size={14}
                  className={selectedFile?.path === file.path ? "text-brand-400" : "text-slate-600"}
                />
                {file.path}
              </button>
            ))}
          </div>
        </div>

        {/* Code Preview */}
        <div className="w-2/3 bg-slate-950 rounded-xl border border-slate-800 flex flex-col overflow-hidden relative group shadow-2xl">
          {selectedFile ? (
            <>
              <div className="absolute top-0 left-0 right-0 h-10 bg-gradient-to-b from-slate-900/50 to-transparent pointer-events-none"></div>
              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity z-10 flex gap-2">
                <button
                  className="bg-slate-800 text-xs text-slate-300 px-3 py-1.5 rounded-md border border-slate-700 hover:bg-slate-700 hover:text-white transition-colors shadow-lg"
                  onClick={() => navigator.clipboard.writeText(selectedFile.content)}
                >
                  Copy
                </button>
              </div>
              <div className="p-6 overflow-auto flex-1 font-mono text-sm text-slate-300 custom-scrollbar leading-relaxed">
                <pre>{selectedFile.content}</pre>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-600">
              <Code size={48} className="opacity-20" />
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderWizard = () => (
    <div className="flex flex-1 overflow-hidden max-w-7xl w-full mx-auto">
      {/* Sidebar Wizard Nav */}
      <aside className="w-72 border-r border-slate-800 p-6 hidden md:flex flex-col gap-2 bg-slate-950/50">
        <div className="mb-4 pl-2 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Setup Wizard
          </h3>
        </div>
        <SidebarItem
          number={1}
          label="Identity & Basics"
          active={state.step === 1}
          completed={state.step > 1}
        />
        <SidebarItem
          number={2}
          label="Tech Stack"
          active={state.step === 2}
          completed={state.step > 2}
        />
        <SidebarItem
          number={3}
          label="Governance"
          active={state.step === 3}
          completed={state.step > 3}
        />
        <SidebarItem
          number={4}
          label="Automation"
          active={state.step === 4}
          completed={state.step > 4}
        />
        <SidebarItem
          number={5}
          label="Result"
          active={state.step === 5}
          completed={state.step > 5}
        />

        <div className="mt-auto p-4 bg-gradient-to-br from-slate-900 to-slate-900/50 rounded-xl border border-slate-800">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Powered by</p>
          <div className="flex items-center gap-2 text-slate-200 font-semibold">
            <Sparkles size={16} className="text-brand-400" /> {providerLabel}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-12 relative flex flex-col">
        {renderContent()}

        {/* Footer Controls */}
        {state.step < 5 && (
          <div className="absolute bottom-0 left-0 right-0 p-6 md:px-12 md:pb-12 bg-gradient-to-t from-slate-950 via-slate-950 to-transparent flex justify-between items-center pointer-events-none">
            <div className="pointer-events-auto">
              {state.step > 1 && (
                <button
                  onClick={prevStep}
                  className="px-6 py-3 rounded-lg text-slate-400 font-medium hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-2 group"
                >
                  <ChevronLeft
                    size={18}
                    className="group-hover:-translate-x-1 transition-transform"
                  />{" "}
                  Back
                </button>
              )}
            </div>

            <div className="pointer-events-auto">
              <button
                onClick={nextStep}
                disabled={isCooldownActive || (state.step === 4 && isExternalProvider)}
                className={`
                                    px-8 py-3 rounded-lg font-bold text-white shadow-lg shadow-brand-500/20 transition-all flex items-center gap-2
                                    ${
                                      state.step === 4
                                        ? "bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 hover:shadow-indigo-500/25"
                                        : "bg-brand-600 hover:bg-brand-500"
                                    }
                                    ${
                                      isCooldownActive || (state.step === 4 && isExternalProvider)
                                        ? "opacity-50 cursor-not-allowed"
                                        : ""
                                    }
                                `}
              >
                {state.step === 4 ? (
                  <>
                    Generate Repo <Sparkles size={18} />
                  </>
                ) : (
                  <>
                    Next Step <ChevronRight size={18} />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Result Actions */}
        {state.step === 5 && !isGenerating && !error && (
          <div className="absolute bottom-0 left-0 right-0 p-6 md:px-12 md:pb-12 bg-gradient-to-t from-slate-950 via-slate-950 to-transparent flex justify-end items-center pointer-events-none">
            <div className="pointer-events-auto flex gap-4 items-center">
              <button
                onClick={() => {
                  setState(INITIAL_STATE);
                  setValidationResult(null);
                  setSecurityScan(null);
                  setAllowDownloadWithErrors(false);
                }}
                className="px-6 py-3 rounded-lg text-slate-400 font-medium hover:text-white hover:bg-slate-800 transition-colors"
              >
                Start Over
              </button>
              {validationResult && validationResult.errors.length > 0 && (
                <label className="flex items-center gap-2 text-xs text-red-300 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg">
                  <input
                    type="checkbox"
                    checked={allowDownloadWithErrors}
                    onChange={(e) => setAllowDownloadWithErrors(e.target.checked)}
                  />
                  I understand this download contains validation errors
                </label>
              )}
              <button
                onClick={handleDownloadZip}
                disabled={validationResult?.errors.length ? !allowDownloadWithErrors : false}
                className={`px-6 py-3 rounded-lg font-bold text-slate-900 transition-colors flex items-center gap-2 shadow-lg shadow-brand-500/20 hover:scale-105 ${validationResult?.errors.length ? "bg-slate-700 text-slate-300 cursor-not-allowed" : "bg-brand-400 hover:bg-brand-300"}`}
              >
                <Archive size={18} />{" "}
                {validationResult?.errors.length ? "Download Blocked" : "Download ZIP"}
              </button>

              <button
                onClick={async () => {
                  await hostBridge.rpc("APPLY_TO_WORKSPACE", generatedFiles);
                }}
                disabled={!!validationResult?.errors.length}
                className={`px-6 py-3 rounded-lg font-bold text-slate-900 transition-colors flex items-center gap-2 shadow-lg shadow-brand-500/20 hover:scale-105 ${validationResult?.errors.length ? "bg-slate-700 text-slate-300 cursor-not-allowed" : "bg-green-400 hover:bg-green-300"}`}
              >
                <Archive size={18} /> Apply to Workspace
              </button>

              {validationResult?.errors.length ? (
                <button
                  onClick={handleDownloadZip}
                  disabled={!allowDownloadWithErrors}
                  className={`px-6 py-3 rounded-lg font-bold text-white transition-colors flex items-center gap-2 shadow-lg ${allowDownloadWithErrors ? "bg-red-600 hover:bg-red-500" : "bg-red-900 cursor-not-allowed"}`}
                >
                  <Archive size={18} /> Download with Errors
                </button>
              ) : null}
            </div>
          </div>
        )}
      </main>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col font-sans selection:bg-brand-500/30">
      {/* Header */}
      <header className="h-12 border-b border-slate-800 flex items-center px-6 bg-slate-900/80 backdrop-blur-md sticky top-0 z-20 justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 group">
            <div className="w-3 h-3 rounded-full bg-red-500/80 group-hover:bg-red-500 transition-colors" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80 group-hover:bg-yellow-500 transition-colors" />
            <div className="w-3 h-3 rounded-full bg-green-500/80 group-hover:bg-green-500 transition-colors" />
          </div>
          <button
            onClick={() => setMode("landing")}
            className="font-medium text-slate-400 text-sm flex items-center gap-2 hover:text-white transition-colors"
          >
            <Terminal size={16} className="text-brand-500" />
            <span className="text-slate-200">GitUp</span>
          </button>
        </div>

        {mode !== "landing" && (
          <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-800">
            <button
              onClick={() => setMode("wizard")}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${mode === "wizard" ? "bg-slate-800 text-brand-400 shadow-sm" : "text-slate-500 hover:text-slate-300"}`}
            >
              Forge
            </button>
            <button
              onClick={() => setMode("doctor")}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${mode === "doctor" ? "bg-slate-800 text-red-400 shadow-sm" : "text-slate-500 hover:text-slate-300"}`}
            >
              Doctor
            </button>
          </div>
        )}

        <div className="w-16"></div>
      </header>

      {mode === "landing" && renderLanding()}
      {mode === "wizard" && renderWizard()}
      {mode === "doctor" && <RepoDoctor />}
    </div>
  );
};

export default App;
