import React, { useState } from "react";
// import { analyzeProjectManifest } from "../services/geminiService";
import { AuditAnalysis, AuditIssue } from "@repoforge/shared";
import {
  FileText,
  Activity,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  Stethoscope,
  Play,
  Download,
} from "lucide-react";

export const RepoDoctor: React.FC = () => {
  const [manifest, setManifest] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AuditAnalysis | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<AuditIssue | null>(null);
  const [cooldownUntil, setCooldownUntil] = useState<number>(0);

  const COOLDOWN_MS = 3000;

  const handleAnalyze = async () => {
    if (Date.now() < cooldownUntil) return;
    if (!manifest.trim()) return;
    setCooldownUntil(Date.now() + COOLDOWN_MS);
    setTimeout(() => setCooldownUntil(0), COOLDOWN_MS + 50);
    setIsAnalyzing(true);
    try {
        // const result = await analyzeProjectManifest(manifest);
        // setAnalysis(result);
        // Mocking for now as we migrate
        setAnalysis({ score: 100, summary: "Analysis disabled during migration.", issues: [] });
    } catch(e) {
        console.error(e);
    }
    setIsAnalyzing(false);
    // if (result.issues.length > 0) setSelectedIssue(result.issues[0]);
  };

  const handleDownloadPatch = () => {
    if (!selectedIssue || !selectedIssue.fixFile) return;
    const element = document.createElement("a");
    const file = new Blob([selectedIssue.fixFile.content], {
      type: "text/plain",
    });
    element.href = URL.createObjectURL(file);
    const filename =
      selectedIssue.fixFile.path.split("/").pop() || "fixed-file.txt";
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  if (isAnalyzing) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400 animate-fade-in gap-6">
        <div className="relative">
          <div className="absolute inset-0 bg-red-500 blur-2xl opacity-20 rounded-full animate-pulse"></div>
          <Stethoscope
            size={64}
            className="text-red-400 relative z-10 animate-bounce-subtle"
          />
        </div>
        <div className="text-center">
          <h3 className="text-2xl text-white font-bold mb-2">
            Examining Vital Signs...
          </h3>
          <p className="max-w-md mx-auto text-slate-400">
            Our AI specialists are auditing your configuration for security
            risks, performance bottlenecks, and best practices.
          </p>
        </div>
      </div>
    );
  }

  if (analysis) {
    return (
      <div className="flex h-full gap-6 animate-fade-in p-2 pb-20">
        {/* Sidebar: Score & Issue List */}
        <div className="w-1/3 flex flex-col gap-4">
          {/* Score Card */}
          <div className="bg-slate-900 rounded-xl border border-slate-700 p-6 flex flex-col items-center text-center">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
              Health Score
            </div>
            <div
              className={`text-5xl font-black mb-2 ${
                analysis.score > 80
                  ? "text-green-400"
                  : analysis.score > 50
                    ? "text-yellow-400"
                    : "text-red-400"
              }`}
            >
              {analysis.score}
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-1000 ${
                  analysis.score > 80
                    ? "bg-green-500"
                    : analysis.score > 50
                      ? "bg-yellow-500"
                      : "bg-red-500"
                }`}
                style={{ width: `${analysis.score}%` }}
              />
            </div>
            <p className="text-sm text-slate-400 mt-4 leading-relaxed">
              {analysis.summary}
            </p>
          </div>

          {/* Issues List */}
          <div className="flex-1 bg-slate-900 rounded-xl border border-slate-700 overflow-hidden flex flex-col">
            <div className="p-3 border-b border-slate-800 bg-slate-900/50">
              <h3 className="text-sm font-bold text-slate-300">Diagnoses</h3>
            </div>
            <div className="overflow-y-auto flex-1 p-2 space-y-2 custom-scrollbar">
              {analysis.issues.map((issue, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedIssue(issue)}
                  className={`w-full text-left p-3 rounded-lg border transition-all flex items-start gap-3 ${
                    selectedIssue === issue
                      ? "bg-slate-800 border-slate-600"
                      : "bg-transparent border-transparent hover:bg-slate-800/50"
                  }`}
                >
                  {issue.severity === "critical" && (
                    <AlertTriangle
                      size={16}
                      className="text-red-500 mt-0.5 shrink-0"
                    />
                  )}
                  {issue.severity === "warning" && (
                    <AlertTriangle
                      size={16}
                      className="text-yellow-500 mt-0.5 shrink-0"
                    />
                  )}
                  {issue.severity === "info" && (
                    <CheckCircle
                      size={16}
                      className="text-blue-500 mt-0.5 shrink-0"
                    />
                  )}
                  <div>
                    <div
                      className={`text-sm font-medium ${selectedIssue === issue ? "text-white" : "text-slate-300"}`}
                    >
                      {issue.title}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content: Details & Fix */}
        <div className="w-2/3 bg-slate-900 rounded-xl border border-slate-700 flex flex-col overflow-hidden">
          {selectedIssue ? (
            <>
              <div className="p-6 border-b border-slate-800">
                <div className="flex items-center gap-3 mb-4">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider border ${
                      selectedIssue.severity === "critical"
                        ? "bg-red-500/10 text-red-400 border-red-500/20"
                        : selectedIssue.severity === "warning"
                          ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                          : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                    }`}
                  >
                    {selectedIssue.severity} Priority
                  </span>
                </div>
                <h2 className="text-xl font-bold text-white mb-2">
                  {selectedIssue.title}
                </h2>
                <p className="text-slate-400 leading-relaxed">
                  {selectedIssue.description}
                </p>
              </div>

              <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
                <h4 className="text-sm font-bold text-slate-300 mb-3 flex items-center gap-2">
                  <Activity size={16} className="text-brand-400" /> Suggested
                  Remedy
                </h4>
                <div className="bg-slate-950 rounded-lg p-4 border border-slate-800 mb-6 text-slate-300 text-sm">
                  {selectedIssue.suggestion}
                </div>

                {selectedIssue.fixFile && (
                  <>
                    <h4 className="text-sm font-bold text-slate-300 mb-3 flex items-center gap-2">
                      <FileText size={16} className="text-brand-400" /> Fixed
                      File: {selectedIssue.fixFile.path}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-slate-950 rounded-lg border border-slate-800 overflow-hidden">
                        <div className="px-3 py-2 text-[10px] uppercase tracking-wider text-slate-500 border-b border-slate-800">
                          Original
                        </div>
                        <pre className="p-4 text-xs font-mono text-slate-400 overflow-x-auto">
                          {manifest}
                        </pre>
                      </div>
                      <div className="bg-slate-950 rounded-lg border border-slate-800 overflow-hidden relative group">
                        <div className="px-3 py-2 text-[10px] uppercase tracking-wider text-slate-500 border-b border-slate-800 flex justify-between items-center">
                          Fixed
                          <button
                            onClick={() =>
                              navigator.clipboard.writeText(
                                selectedIssue.fixFile?.content || "",
                              )
                            }
                            className="text-xs bg-slate-800 text-slate-400 px-2 py-1 rounded hover:text-white"
                          >
                            Copy
                          </button>
                        </div>
                        <pre className="p-4 text-xs font-mono text-slate-400 overflow-x-auto">
                          {selectedIssue.fixFile.content}
                        </pre>
                      </div>
                    </div>
                  </>
                )}
              </div>
              <div className="p-4 border-t border-slate-800 bg-slate-900 flex justify-end">
                <button
                  onClick={handleDownloadPatch}
                  className="bg-brand-600 hover:bg-brand-500 text-white px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-colors"
                >
                  <Download size={16} /> Download Fixed File
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-500">
              <Activity size={48} className="mb-4 opacity-20" />
              <p>Select an issue from the list to view details.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto flex flex-col h-full animate-fade-in pt-12">
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-orange-600 shadow-lg shadow-red-900/50 mb-6">
          <Stethoscope size={32} className="text-white" />
        </div>
        <h2 className="text-4xl font-bold text-white mb-4">Repo Doctor</h2>
        <p className="text-lg text-slate-400">
          Paste your configuration file (package.json, go.mod, etc.) below.
          <br />
          Our AI will analyze it for deprecated packages, security risks, and
          missed best practices.
        </p>
      </div>

      <div className="flex-1 flex flex-col gap-4">
        <textarea
          value={manifest}
          onChange={(e) => setManifest(e.target.value)}
          placeholder='Paste content here... e.g. { "dependencies": { ... } }'
          className="flex-1 bg-slate-900 border border-slate-700 rounded-xl p-6 text-slate-300 font-mono text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none resize-none shadow-inner"
        />
        <div className="flex justify-end pb-12">
          <button
            onClick={handleAnalyze}
            disabled={!manifest.trim() || Date.now() < cooldownUntil}
            className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg shadow-red-900/30 transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 flex items-center gap-3"
          >
            <Play fill="currentColor" size={20} /> Run Diagnostics
          </button>
        </div>
      </div>
    </div>
  );
};
