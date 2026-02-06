import React, { useEffect, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  WizardState,
  ProjectType,
  Language,
  NodeVersionInfo,
  RECOMMENDED_NODE_VERSION,
  ModelProvider,
} from "@gitup/shared";
import {
  PROJECT_TYPES,
  LANGUAGES,
  LICENSES,
  TECH_OPTIONS,
  LANGUAGE_ICONS,
  CODES_OF_CONDUCT,
  PACKAGE_MANAGERS,
  RECIPES,
  MODEL_PROVIDERS,
} from "@gitup/shared";
import { StepContainer, Tooltip } from "./ui/Layouts";
import { hostBridge } from "../transport/hostBridge";
import {
  Sparkles,
  Check,
  Info,
  Server,
  Layout,
  Database,
  Terminal,
  Code2,
  MessageSquareText,
  Shield,
  Users,
  BookOpen,
  GitBranch,
  Lock,
  Globe,
  FileJson,
  Package,
  Zap,
} from "lucide-react";

interface StepProps {
  state: WizardState;
  updateState: (updates: Partial<WizardState>) => void;
  updateNestedState: <K extends keyof WizardState>(category: K, updates: WizardState[K]) => void;
  nodeVersionInfo?: NodeVersionInfo | null;
}

interface FeatureToggleProps {
  icon: LucideIcon;
  title: string;
  desc: string;
  active: boolean;
  onClick: () => void;
  badge?: string;
}

const FeatureToggle: React.FC<FeatureToggleProps> = ({
  icon: Icon,
  title,
  desc,
  active,
  onClick,
  badge,
}) => (
  <div
    onClick={onClick}
    className={`p-4 rounded-xl border cursor-pointer transition-all group ${
      active
        ? "bg-brand-500/10 border-brand-500 shadow-[0_0_15px_rgba(14,165,233,0.1)]"
        : "bg-slate-900 border-slate-700 hover:border-slate-600"
    }`}
  >
    <div className="flex items-start gap-4">
      <div
        className={`p-2 rounded-lg transition-colors ${
          active
            ? "bg-brand-500/20 text-brand-300"
            : "bg-slate-800 text-slate-500 group-hover:bg-slate-700"
        }`}
      >
        <Icon size={24} />
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <h4 className={`font-medium ${active ? "text-white" : "text-slate-300"}`}>
            {title}
            {badge && (
              <span className="ml-2 text-[10px] uppercase tracking-wider bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded border border-purple-500/30">
                {badge}
              </span>
            )}
          </h4>
          <div
            className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
              active ? "bg-brand-500 border-brand-500" : "border-slate-600 bg-slate-800"
            }`}
          >
            {active && <Check size={12} className="text-white" />}
          </div>
        </div>
        <p className="text-sm text-slate-500 mt-1 group-hover:text-slate-400 transition-colors">
          {desc}
        </p>
      </div>
    </div>
  </div>
);

// --- Step 1: Basics ---
export const StepBasics: React.FC<StepProps> = ({ state, updateNestedState }) => {
  return (
    <StepContainer
      title="Project Identity"
      description="Define the core metadata and visibility of your repository."
    >
      <div className="grid gap-6">
        {/* Name & Desc */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
              Repository Name
            </label>
            <input
              type="text"
              value={state.projectDetails.name}
              onChange={(e) =>
                updateNestedState("projectDetails", {
                  ...state.projectDetails,
                  name: e.target.value,
                })
              }
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all placeholder-slate-600 font-mono text-sm"
              placeholder="my-awesome-project"
            />
          </div>
          <div className="space-y-2">
            <Tooltip content="Choose 'Public' for open source, 'Private' for internal projects.">
              <label className="text-sm font-medium text-slate-300 flex items-center gap-2 cursor-help">
                Visibility <Info size={14} className="text-slate-500" />
              </label>
            </Tooltip>
            <div className="grid grid-cols-2 gap-2 bg-slate-900 p-1 rounded-lg border border-slate-700">
              {["public", "private"].map((vis) => (
                <button
                  key={vis}
                  onClick={() =>
                    updateNestedState("projectDetails", {
                      ...state.projectDetails,
                      visibility: vis,
                    })
                  }
                  className={`text-sm py-2 rounded-md transition-all flex items-center justify-center gap-2 capitalize ${
                    state.projectDetails.visibility === vis
                      ? "bg-slate-800 text-white shadow-sm font-medium"
                      : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  {vis === "public" ? <Globe size={14} /> : <Lock size={14} />}
                  {vis}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300">Description</label>
          <textarea
            value={state.projectDetails.description}
            onChange={(e) =>
              updateNestedState("projectDetails", {
                ...state.projectDetails,
                description: e.target.value,
              })
            }
            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-brand-500 outline-none transition-all placeholder-slate-600 min-h-[80px]"
            placeholder="A brief summary of your project... (Will appear in README and package.json)"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <Tooltip content="Determines the initial file structure template.">
              <label className="text-sm font-medium text-slate-300 flex items-center gap-2 cursor-help">
                Project Type <Info size={14} className="text-slate-500" />
              </label>
            </Tooltip>
            <select
              value={state.projectDetails.type}
              onChange={(e) =>
                updateNestedState("projectDetails", {
                  ...state.projectDetails,
                  type: e.target.value as ProjectType,
                })
              }
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-brand-500 outline-none"
            >
              {PROJECT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">License</label>
            <select
              value={state.projectDetails.license}
              onChange={(e) =>
                updateNestedState("projectDetails", {
                  ...state.projectDetails,
                  license: e.target.value,
                })
              }
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-brand-500 outline-none"
            >
              {LICENSES.map((lic) => (
                <option key={lic} value={lic}>
                  {lic}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Tooltip content="The name of your main git branch (e.g. main, master, trunk).">
              <label className="text-sm font-medium text-slate-300 flex items-center gap-2 cursor-help">
                Default Branch <Info size={14} className="text-slate-500" />
              </label>
            </Tooltip>
            <div className="relative">
              <GitBranch size={16} className="absolute left-3 top-3.5 text-slate-500" />
              <input
                type="text"
                value={state.projectDetails.defaultBranch}
                onChange={(e) =>
                  updateNestedState("projectDetails", {
                    ...state.projectDetails,
                    defaultBranch: e.target.value,
                  })
                }
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 pl-10 text-white focus:ring-2 focus:ring-brand-500 outline-none font-mono text-sm"
              />
            </div>
          </div>
        </div>
      </div>
    </StepContainer>
  );
};

// --- Step 2: Tech Stack ---
export const StepStack: React.FC<StepProps> = ({
  state,
  updateState,
  updateNestedState,
  nodeVersionInfo,
}) => {
  const [suggestion, setSuggestion] = useState<string>("");
  const [loadingSuggestion, setLoadingSuggestion] = useState(false);

  useEffect(() => {
    if (state.modelProvider === ModelProvider.EXTERNAL) {
      setSuggestion("");
      setLoadingSuggestion(false);
      return;
    }

    if (state.techStack.language) {
      // Default package manager selection when language changes
      const defaultPkg = PACKAGE_MANAGERS[state.techStack.language]?.[0];
      if (defaultPkg && !state.techStack.packageManager) {
        updateNestedState("techStack", {
          ...state.techStack,
          packageManager: defaultPkg,
        });
      }

      setLoadingSuggestion(true);
      // Debounce automation via timeouts is okay, but ideal would be useEffect cleanup
      const timer = setTimeout(async () => {
        try {
          const result = await hostBridge.rpc("SUGGEST_STACK", state);
          if (result && typeof result === "string") {
            setSuggestion(result);
          }
        } catch (e) {
          console.error(e);
        } finally {
          setLoadingSuggestion(false);
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [state, updateNestedState]);

  const toggleFramework = (id: string) => {
    const current = state.techStack.frameworks;
    const updated = current.includes(id) ? current.filter((f) => f !== id) : [...current, id];
    updateNestedState("techStack", { ...state.techStack, frameworks: updated });
  };

  const applyRecipe = (recipeId: string) => {
    const recipe = RECIPES.find((r) => r.id === recipeId);
    if (!recipe) return;

    // Merge recipe config into state
    // We need to carefully merge nested objects if we were doing deep merge,
    // but here we know the structure.
    const {
      ci,
      docker,
      linting,
      docs,
      dependabot,
      husky,
      tests,
      formatting,
      release,
      securityDocs,
      ...techProps
    } = recipe.config;
    updateNestedState("techStack", { ...state.techStack, ...techProps });
    updateNestedState("automation", {
      ...state.automation,
      ci: ci ?? state.automation.ci,
      docker: docker ?? state.automation.docker,
      linting: linting ?? state.automation.linting,
      docs: docs ?? state.automation.docs,
      dependabot: dependabot ?? state.automation.dependabot,
      husky: husky ?? state.automation.husky,
      tests: tests ?? state.automation.tests,
      formatting: formatting ?? state.automation.formatting,
      release: release ?? state.automation.release,
      securityDocs: securityDocs ?? state.automation.securityDocs,
    });
  };

  const filteredOptions = TECH_OPTIONS.filter(
    (opt) => !opt.recommendedFor || opt.recommendedFor.includes(state.techStack.language),
  );

  const isNodeProject =
    state.techStack.language === Language.TYPESCRIPT ||
    state.techStack.language === Language.JAVASCRIPT;
  const recommendedNodeVersion = isNodeProject
    ? nodeVersionInfo?.recommendedVersion || RECOMMENDED_NODE_VERSION
    : "";
  const providerLabel =
    state.modelProvider === ModelProvider.EXTERNAL ? "External Provider" : "VS Code LM (Copilot)";

  return (
    <StepContainer
      title="Tech Stack & Context"
      description="Choose the engine for your application and guide the AI."
    >
      <div className="grid gap-8">
        {/* Recipes / Bundles */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-medium flex items-center gap-2">
              <Zap size={18} className="text-yellow-400" />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-200 to-yellow-500 font-bold">
                Quick Start Recipes
              </span>
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {RECIPES.map((recipe) => (
              <button
                key={recipe.id}
                onClick={() => applyRecipe(recipe.id)}
                className="p-3 bg-slate-900/50 border border-slate-700/50 hover:border-yellow-500/50 hover:bg-slate-800 rounded-xl text-left transition-all group"
              >
                <div className="flex items-center gap-2 mb-2">
                  <i className={`${recipe.icon} text-2xl`}></i>
                  <span className="font-semibold text-slate-200 group-hover:text-yellow-400 transition-colors">
                    {recipe.name}
                  </span>
                </div>
                <p className="text-xs text-slate-500">{recipe.description}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="h-px bg-slate-800 w-full"></div>

        {/* Language Selection */}
        <div className="space-y-4">
          <h3 className="text-white font-medium flex items-center gap-2">
            <Code2 size={18} /> Primary Language
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {LANGUAGES.map((lang) => (
              <button
                key={lang}
                onClick={() =>
                  updateNestedState("techStack", {
                    ...state.techStack,
                    language: lang,
                    frameworks: [],
                    packageManager: PACKAGE_MANAGERS[lang]?.[0] || "",
                  })
                }
                className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border transition-all duration-300 group relative ${
                  state.techStack.language === lang
                    ? "bg-brand-500/10 border-brand-500 shadow-lg shadow-brand-500/10 ring-1 ring-brand-500/50"
                    : "bg-slate-900 border-slate-800 hover:border-slate-600 hover:bg-slate-800"
                }`}
              >
                <i
                  className={`${LANGUAGE_ICONS[lang]} text-4xl mb-1 group-hover:scale-110 transition-transform`}
                ></i>
                <span
                  className={`text-sm font-medium ${state.techStack.language === lang ? "text-white" : "text-slate-400"}`}
                >
                  {lang}
                </span>
                {state.techStack.language === lang && (
                  <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-brand-400 shadow-[0_0_8px_rgba(56,189,248,0.8)]"></div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Package Manager Selection */}
        {state.techStack.language && (
          <div className="space-y-3 animate-fade-in">
            <Tooltip content="The tool used to manage dependencies and run scripts.">
              <h3 className="text-white font-medium flex items-center gap-2 cursor-help">
                <Package size={18} /> Package Manager <Info size={14} className="text-slate-500" />
              </h3>
            </Tooltip>
            <div className="flex flex-wrap gap-2">
              {PACKAGE_MANAGERS[state.techStack.language]?.map((pm) => (
                <button
                  key={pm}
                  onClick={() =>
                    updateNestedState("techStack", {
                      ...state.techStack,
                      packageManager: pm,
                    })
                  }
                  className={`px-4 py-2 rounded-lg border text-sm font-mono transition-all ${
                    state.techStack.packageManager === pm
                      ? "bg-brand-500/20 border-brand-500 text-brand-200"
                      : "bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600"
                  }`}
                >
                  {pm}
                </button>
              ))}
            </div>
          </div>
        )}

        {isNodeProject && (
          <div className="space-y-3 animate-fade-in">
            <Tooltip content="Pinned Node.js version for scaffolds. You can override this at any time.">
              <h3 className="text-white font-medium flex items-center gap-2 cursor-help">
                <FileJson size={18} /> Node Version <Info size={14} className="text-slate-500" />
              </h3>
            </Tooltip>
            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3">
              <input
                type="text"
                value={state.techStack.nodeVersion || ""}
                onChange={(e) =>
                  updateNestedState("techStack", {
                    ...state.techStack,
                    nodeVersion: e.target.value,
                  })
                }
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none font-mono text-sm"
                placeholder={recommendedNodeVersion}
              />
              <div className="flex items-center gap-2">
                {nodeVersionInfo?.detectedVersion && (
                  <button
                    onClick={() =>
                      updateNestedState("techStack", {
                        ...state.techStack,
                        nodeVersion: nodeVersionInfo.detectedVersion || "",
                      })
                    }
                    className="px-3 py-2 rounded-lg border text-xs font-medium bg-slate-900 border-slate-700 text-slate-300 hover:border-brand-500 hover:text-brand-200 transition-colors"
                  >
                    Use detected
                  </button>
                )}
                {recommendedNodeVersion && (
                  <button
                    onClick={() =>
                      updateNestedState("techStack", {
                        ...state.techStack,
                        nodeVersion: recommendedNodeVersion,
                      })
                    }
                    className="px-3 py-2 rounded-lg border text-xs font-medium bg-brand-500/10 border-brand-500/40 text-brand-200 hover:bg-brand-500/20 transition-colors"
                  >
                    Use recommended
                  </button>
                )}
              </div>
            </div>
            <div className="text-xs text-slate-500 flex flex-wrap gap-4">
              {nodeVersionInfo?.detectedVersion && (
                <span>Detected: {nodeVersionInfo.detectedVersion}</span>
              )}
              {recommendedNodeVersion && <span>Recommended: {recommendedNodeVersion}</span>}
            </div>
          </div>
        )}

        {/* Model Provider */}
        <div className="space-y-3 animate-fade-in">
          <Tooltip content="Select which model provider to use for generation.">
            <h3 className="text-white font-medium flex items-center gap-2 cursor-help">
              <Server size={18} /> Model Provider <Info size={14} className="text-slate-500" />
            </h3>
          </Tooltip>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {MODEL_PROVIDERS.map((provider) => {
              const isActive = state.modelProvider === provider.id;
              const isExternal = provider.id === ModelProvider.EXTERNAL;
              return (
                <button
                  key={provider.id}
                  onClick={() => updateState({ modelProvider: provider.id })}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    isActive
                      ? "bg-brand-500/10 border-brand-500"
                      : "bg-slate-900 border-slate-700 hover:border-slate-600"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`font-medium ${isActive ? "text-white" : "text-slate-300"}`}>
                      {provider.label}
                    </span>
                    {isExternal && (
                      <span className="text-[10px] uppercase tracking-wider bg-amber-500/10 text-amber-300 px-2 py-0.5 rounded border border-amber-500/20">
                        Requires server
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-2">{provider.description}</p>
                </button>
              );
            })}
          </div>
          {state.modelProvider === ModelProvider.EXTERNAL && (
            <div className="text-xs text-amber-300/90 bg-amber-500/10 border border-amber-500/20 rounded-lg p-2">
              External providers are not configured in this build. Generation will be disabled until
              a server integration is added.
            </div>
          )}
        </div>

        {/* AI Suggestion */}
        {(loadingSuggestion || suggestion) && (
          <div className="bg-slate-900/50 border border-indigo-500/30 rounded-xl p-4 animate-fade-in flex gap-4 items-start relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 pointer-events-none"></div>
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
              <Sparkles size={20} className={loadingSuggestion ? "animate-pulse" : ""} />
            </div>
            <div>
              <h4 className="text-indigo-200 text-sm font-semibold mb-1">AI Recommendation</h4>
              {loadingSuggestion ? (
                <div className="h-4 w-64 bg-slate-700/50 rounded animate-pulse"></div>
              ) : (
                <p className="text-slate-300 text-sm leading-relaxed">{suggestion}</p>
              )}
            </div>
          </div>
        )}

        {/* Frameworks */}
        <div className="space-y-3">
          <h3 className="text-white font-medium flex items-center gap-2">
            <Layout size={18} /> Frameworks & Tools
          </h3>
          {filteredOptions.length === 0 ? (
            <div className="p-8 border border-dashed border-slate-700 rounded-xl text-center text-slate-500">
              Select a language above to see compatible tools.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredOptions.map((opt) => (
                <div
                  key={opt.id}
                  onClick={() => toggleFramework(opt.id)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all group flex items-start gap-4 hover:bg-slate-800/80 ${
                    state.techStack.frameworks.includes(opt.id)
                      ? "bg-brand-500/10 border-brand-500/50"
                      : "bg-slate-900 border-slate-800"
                  }`}
                >
                  <div className="text-3xl mt-1 min-w-[32px] text-center">
                    {opt.iconClass && <i className={opt.iconClass}></i>}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={`font-medium ${state.techStack.frameworks.includes(opt.id) ? "text-brand-300" : "text-slate-300"}`}
                      >
                        {opt.name}
                      </span>
                      {state.techStack.frameworks.includes(opt.id) && (
                        <Check size={16} className="text-brand-400" />
                      )}
                    </div>
                    <p className="text-xs text-slate-500 leading-tight mb-2">{opt.description}</p>
                    <div className="flex flex-wrap gap-1">
                      {opt.tags?.map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* AI Context */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-medium flex items-center gap-2">
              <MessageSquareText size={18} />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand-300 to-purple-300">
                AI Code Generation Prompt
              </span>
            </h3>
          </div>
          <div className="relative group">
            <textarea
              value={state.projectDetails.aiPrompt}
              onChange={(e) =>
                updateNestedState("projectDetails", {
                  ...state.projectDetails,
                  aiPrompt: e.target.value,
                })
              }
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-white focus:ring-2 focus:ring-brand-500 outline-none transition-all placeholder-slate-600 min-h-[120px] text-sm group-hover:border-slate-600"
              placeholder="Describe your project logic to get tailored starter code.&#10;Ex: 'A CLI tool that parses CSV files and converts them to JSON. Include a helper function for date formatting.'"
            />
            <div className="absolute bottom-3 right-3 text-xs text-slate-500 flex items-center gap-1 opacity-70">
              <Sparkles size={12} /> Powered by {providerLabel}
            </div>
          </div>
        </div>
      </div>
    </StepContainer>
  );
};

// --- Step 3: Governance & Community (NEW) ---
export const StepGovernance: React.FC<StepProps> = ({ state, updateNestedState }) => {
  return (
    <StepContainer
      title="Community & Governance"
      description="Set the rules of engagement and templates for your contributors."
    >
      <div className="grid gap-6">
        {/* Code of Conduct */}
        <div className="space-y-2">
          <Tooltip content="A Code of Conduct sets expectations for contributor behavior.">
            <label className="text-sm font-medium text-slate-300 flex items-center gap-2 cursor-help">
              Code of Conduct <Shield size={14} className="text-slate-500" />
            </label>
          </Tooltip>
          <select
            value={state.governance.codeOfConduct}
            onChange={(e) =>
              updateNestedState("governance", {
                ...state.governance,
                codeOfConduct: e.target.value,
              })
            }
            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-brand-500 outline-none"
          >
            {CODES_OF_CONDUCT.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        {/* Toggles */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            onClick={() =>
              updateNestedState("governance", {
                ...state.governance,
                contributionGuide: !state.governance.contributionGuide,
              })
            }
            className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${state.governance.contributionGuide ? "bg-brand-500/10 border-brand-500/50" : "bg-slate-900 border-slate-700 hover:border-slate-600"}`}
          >
            <div
              className={`mt-1 p-1.5 rounded ${state.governance.contributionGuide ? "bg-brand-500 text-white" : "bg-slate-800 text-slate-500"}`}
            >
              <Users size={16} />
            </div>
            <div>
              <h4
                className={`text-sm font-semibold ${state.governance.contributionGuide ? "text-brand-100" : "text-slate-300"}`}
              >
                CONTRIBUTING.md
              </h4>
              <p className="text-xs text-slate-500 mt-1">Add guidelines for how people can help.</p>
            </div>
          </div>

          <div
            onClick={() =>
              updateNestedState("governance", {
                ...state.governance,
                issueTemplates: !state.governance.issueTemplates,
              })
            }
            className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${state.governance.issueTemplates ? "bg-brand-500/10 border-brand-500/50" : "bg-slate-900 border-slate-700 hover:border-slate-600"}`}
          >
            <div
              className={`mt-1 p-1.5 rounded ${state.governance.issueTemplates ? "bg-brand-500 text-white" : "bg-slate-800 text-slate-500"}`}
            >
              <FileJson size={16} />
            </div>
            <div>
              <h4
                className={`text-sm font-semibold ${state.governance.issueTemplates ? "text-brand-100" : "text-slate-300"}`}
              >
                Issue Templates
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Pre-defined forms for bug reports & features.
              </p>
            </div>
          </div>

          <div
            onClick={() =>
              updateNestedState("governance", {
                ...state.governance,
                pullRequestTemplate: !state.governance.pullRequestTemplate,
              })
            }
            className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${state.governance.pullRequestTemplate ? "bg-brand-500/10 border-brand-500/50" : "bg-slate-900 border-slate-700 hover:border-slate-600"}`}
          >
            <div
              className={`mt-1 p-1.5 rounded ${state.governance.pullRequestTemplate ? "bg-brand-500 text-white" : "bg-slate-800 text-slate-500"}`}
            >
              <GitBranch size={16} />
            </div>
            <div>
              <h4
                className={`text-sm font-semibold ${state.governance.pullRequestTemplate ? "text-brand-100" : "text-slate-300"}`}
              >
                PR Template
              </h4>
              <p className="text-xs text-slate-500 mt-1">Checklist for merging code.</p>
            </div>
          </div>
        </div>
      </div>
    </StepContainer>
  );
};

// --- Step 4: Automation & DevOps (Renamed/Expanded) ---
export const StepAutomation: React.FC<StepProps> = ({ state, updateNestedState }) => {
  return (
    <StepContainer
      title="DevOps & Automation"
      description="Configure the robots that will maintain your code."
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FeatureToggle
          icon={Server}
          title="GitHub Actions"
          desc="CI/CD workflows for testing and building."
          active={state.automation.ci}
          onClick={() =>
            updateNestedState("automation", {
              ...state.automation,
              ci: !state.automation.ci,
            })
          }
        />
        <FeatureToggle
          icon={Database}
          title="Docker"
          desc="Containerization setup with Dockerfile."
          active={state.automation.docker}
          onClick={() =>
            updateNestedState("automation", {
              ...state.automation,
              docker: !state.automation.docker,
            })
          }
        />
        <FeatureToggle
          icon={Check}
          title="Tests"
          desc="Unit/integration test setup and scripts."
          active={state.automation.tests}
          onClick={() =>
            updateNestedState("automation", {
              ...state.automation,
              tests: !state.automation.tests,
            })
          }
        />
        <FeatureToggle
          icon={Terminal}
          title="Formatting"
          desc="Prettier or formatter configuration."
          active={state.automation.formatting}
          onClick={() =>
            updateNestedState("automation", {
              ...state.automation,
              formatting: !state.automation.formatting,
            })
          }
        />
        <FeatureToggle
          icon={Lock}
          title="Dependabot"
          desc="Automated dependency updates."
          active={state.automation.dependabot}
          onClick={() =>
            updateNestedState("automation", {
              ...state.automation,
              dependabot: !state.automation.dependabot,
            })
          }
          badge="Security"
        />
        <FeatureToggle
          icon={Shield}
          title="Security Docs"
          desc="Add SECURITY.md and safety guidelines."
          active={state.automation.securityDocs}
          onClick={() =>
            updateNestedState("automation", {
              ...state.automation,
              securityDocs: !state.automation.securityDocs,
            })
          }
          badge="Policy"
        />
        <FeatureToggle
          icon={GitBranch}
          title="Husky & Hooks"
          desc="Pre-commit hooks to ensure code quality."
          active={state.automation.husky}
          onClick={() =>
            updateNestedState("automation", {
              ...state.automation,
              husky: !state.automation.husky,
            })
          }
        />
        <FeatureToggle
          icon={BookOpen}
          title="Documentation Site"
          desc="MkDocs or Docusaurus scaffold."
          active={state.automation.docs}
          onClick={() =>
            updateNestedState("automation", {
              ...state.automation,
              docs: !state.automation.docs,
            })
          }
        />
        <FeatureToggle
          icon={Terminal}
          title="Linting & Formatting"
          desc="Strict ESLint/Prettier configuration."
          active={state.automation.linting}
          onClick={() =>
            updateNestedState("automation", {
              ...state.automation,
              linting: !state.automation.linting,
            })
          }
        />
        <FeatureToggle
          icon={Sparkles}
          title="Release Automation"
          desc="Add release workflows and changelog."
          active={state.automation.release}
          onClick={() =>
            updateNestedState("automation", {
              ...state.automation,
              release: !state.automation.release,
            })
          }
        />
      </div>
    </StepContainer>
  );
};
