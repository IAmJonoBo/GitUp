import {
  ChangeOperation,
  ChangePlan,
  ChangePlanDiff,
  DesignSpec,
  EngineDecisionPayload,
  PublisherAction,
  RepoSpec,
  SimulationLogEntry,
} from "../types";
import { PublishTarget, publishFromChangePlan } from "./publisher";
import { compileRepoSpec } from "./engine/compile-repospec";
import { materializeChangePlan } from "./engine/materialize-changeplan";
import { recommendAutomationCandidates } from "./engine/recommend";

export const SIMULATION_TICK_MS = 400;

export const compileDesignSpecToChangePlan = (
  designSpec: DesignSpec,
  options?: { capabilityOwnerOverrides?: Record<string, string> },
): ChangePlan => materializeChangePlan(compileRepoSpec(designSpec, options));

const operationFingerprint = (operation: ChangeOperation) =>
  `${operation.type}|${operation.target ?? ""}|${operation.message}`;

export const buildChangePlanDiff = (
  previous: ChangePlan,
  next: ChangePlan,
): ChangePlanDiff => {
  const previousFingerprints = new Set(
    previous.operations.map(operationFingerprint),
  );
  const nextFingerprints = new Set(next.operations.map(operationFingerprint));

  return {
    added: next.operations.filter(
      (operation) => !previousFingerprints.has(operationFingerprint(operation)),
    ),
    removed: previous.operations.filter(
      (operation) => !nextFingerprints.has(operationFingerprint(operation)),
    ),
  };
};

export const createEngineDecisionPayloads = (
  designSpec: DesignSpec,
  repoSpec: RepoSpec,
  changePlan: ChangePlan,
): EngineDecisionPayload[] => {
  const dependencyPosture =
    designSpec.stack.dependencyStrategy === "pinned"
      ? "pinning dependencies for deterministic builds"
      : "using semver for faster library adoption";

  const securityRecommendation =
    designSpec.security.codeScanning && designSpec.security.secretScanning
      ? "comprehensive repository scanning enabled"
      : "incremental scanning posture enabled";

  const rankedCandidates = recommendAutomationCandidates(designSpec, repoSpec);
  const [recommendedCandidate, ...alternativeCandidates] = rankedCandidates;

  const governanceImpactSummary = `${repoSpec.governance.artifactModel.rulesetProfile.label} posture enforces ${repoSpec.governance.artifactModel.requiredChecks.checks.length} required checks and ${repoSpec.governance.artifactModel.reviewConstraints.requiredReviewers} reviewer(s).`;

  const rustModeDecision =
    designSpec.stack.language === "Rust"
      ? {
          key: "rust-mode",
          stage: "repo-spec" as const,
          title: "Rust Mode",
          recommendation:
            designSpec.stack.rustMode === "projen-experimental"
              ? "Projen Rust (experimental)"
              : "Template renderer (stable)",
          why:
            designSpec.stack.rustMode === "projen-experimental"
              ? "Experimental projen synthesis is enabled for Rust to evaluate generated project ergonomics and automation parity."
              : "Template mode keeps Rust scaffolding deterministic and avoids experimental synthesis paths.",
          tradeOffs:
            designSpec.stack.rustMode === "projen-experimental"
              ? [
                  "Experimental behavior may change between releases",
                  "Requires Power mode to unlock advanced synthesis",
                ]
              : [
                  "Fewer generated automations than projen mode",
                  "Template updates require manual refresh",
                ],
          alternatives:
            designSpec.stack.rustMode === "projen-experimental"
              ? ["Template renderer (stable)"]
              : ["Projen Rust (experimental)"],
          confidence:
            designSpec.stack.rustMode === "projen-experimental"
              ? ("Medium" as const)
              : ("High" as const),
        }
      : null;

  return [
    {
      key: "architecture-normalization",
      stage: "normalize",
      title: "Architecture Baseline",
      recommendation: designSpec.architecture,
      why: `${designSpec.type} workflows are normalized around ${designSpec.architecture} boundaries to keep service ownership explicit.`,
      tradeOffs: [
        "Higher initial scaffolding effort",
        "Requires team alignment on folder contracts",
      ],
      alternatives: ["Standard", "Vertical Slice", "MVC"].filter(
        (candidate) => candidate !== designSpec.architecture,
      ),
      confidence: "High",
    },
    {
      key: "stack-resolution",
      stage: "repo-spec",
      title: "Stack Resolution",
      recommendation: `${designSpec.stack.language} + ${designSpec.stack.framework || "Core runtime"}`,
      why: `Repo pack resolution selected ${designSpec.stack.packageManager} with ${dependencyPosture} and ${repoSpec.files.length} generated files. ${governanceImpactSummary}`,
      tradeOffs: [
        "Switching package manager later can invalidate lockfiles",
        "Framework-specific conventions reduce portability",
      ],
      alternatives: ["TypeScript + Express", "Go + Gin", "Python + FastAPI"],
      confidence: "Medium",
    },
    ...(rustModeDecision ? [rustModeDecision] : []),
    {
      key: "change-plan-publishing",
      stage: "change-plan",
      title: "Publishing Sequence",
      recommendation:
        recommendedCandidate?.label ?? securityRecommendation,
      why: `Change plan emits ${changePlan.operations.length} operations to realize repository bootstrap and governance automation. ${governanceImpactSummary} Recommended profile scores ${recommendedCandidate?.score ?? "n/a"} using Fit - MaintenanceCost - ComplexityRisk.`,
      tradeOffs: [
        "More guardrails may slow first merge",
        "Automation requires permissions upfront",
      ],
      alternatives: alternativeCandidates.map((candidate) => candidate.label),
      rankedCandidates: rankedCandidates.map((candidate) => ({
        label: candidate.label,
        score: candidate.score,
        botPrsPerMonth: candidate.botPrsPerMonth,
        ciMinutesProxy: candidate.ciMinutesProxy,
        securityPostureNote: candidate.securityPostureNote,
      })),
      confidence: "High",
    },
  ];
};

export const mapChangePlanToPublisherActions = (
  designSpec: DesignSpec,
  repoSpec: RepoSpec,
  changePlan: ChangePlan,
  options?: {
    dryRun?: boolean;
    userMode?: "basic" | "power";
    target?: PublishTarget;
  },
): PublisherAction[] =>
  publishFromChangePlan(designSpec, repoSpec, changePlan, options);

export const renderChangePlanSimulationLog = (
  changePlan: ChangePlan,
): SimulationLogEntry[] =>
  changePlan.operations.map((operation) => ({
    id: operation.id,
    type:
      operation.type === "create_file"
        ? "file"
        : operation.type === "complete"
          ? "success"
          : "info",
    message: operation.message,
    fileName: operation.target,
  }));

export const buildSimulationSteps = (
  designSpec: DesignSpec,
): SimulationLogEntry[] =>
  renderChangePlanSimulationLog(compileDesignSpecToChangePlan(designSpec));
