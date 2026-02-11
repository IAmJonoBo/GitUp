import { DesignSpec, RepoSpec } from "../spec";

export interface RecommendationCandidate {
  id: string;
  label: string;
  score: number;
  fit: number;
  maintenanceCost: number;
  complexityRisk: number;
  botPrsPerMonth: number;
  ciMinutesProxy: number;
  securityPostureNote: string;
  dependabot: RepoSpec["automation"]["dependabot"];
  ci: RepoSpec["automation"]["ci"];
}

export const resolveNoiseLevel = (noiseBudget: DesignSpec["noiseBudget"]): number => {
  if (typeof noiseBudget === "number" && Number.isFinite(noiseBudget)) {
    return Math.max(0, Math.min(100, noiseBudget));
  }

  switch (noiseBudget) {
    case "low":
      return 20;
    case "high":
      return 80;
    case "medium":
    default:
      return 50;
  }
};

export const resolveAutomationFromNoise = (
  noiseLevel: number,
): RepoSpec["automation"] => {
  if (noiseLevel <= 33) {
    return {
      dependabot: {
        schedule: "monthly",
        grouping: "broad",
        estimatedMonthlyPrs: 2,
      },
      ci: {
        matrixBreadth: "minimal",
        dimensions: ["node-lts"],
      },
    };
  }

  if (noiseLevel >= 67) {
    return {
      dependabot: {
        schedule: "daily",
        grouping: "none",
        estimatedMonthlyPrs: 24,
      },
      ci: {
        matrixBreadth: "broad",
        dimensions: ["node-lts", "node-current", "ubuntu", "windows"],
      },
    };
  }

  return {
    dependabot: {
      schedule: "weekly",
      grouping: "language",
      estimatedMonthlyPrs: 6,
    },
    ci: {
      matrixBreadth: "standard",
      dimensions: ["node-lts", "ubuntu"],
    },
  };
};

const estimateCiMinutesProxy = (
  dimensions: string[],
  includeTests: boolean,
  includeBuild: boolean,
): number => {
  const basePerDimension = includeTests && includeBuild ? 20 : 12;
  const qualityFactor = includeTests ? 1.2 : 0.9;
  return Math.round(dimensions.length * basePerDimension * qualityFactor);
};

const buildSecurityPostureNote = (
  designSpec: DesignSpec,
  schedule: RepoSpec["automation"]["dependabot"]["schedule"],
): string => {
  const scanCoverage =
    designSpec.security.codeScanning && designSpec.security.secretScanning
      ? "Full scanning coverage"
      : designSpec.security.codeScanning || designSpec.security.secretScanning
        ? "Partial scanning coverage"
        : "Manual scanning posture";

  return `${scanCoverage}; dependency updates ${schedule}.`;
};

const scoreCandidate = (
  designSpec: DesignSpec,
  repoSpec: RepoSpec,
  label: string,
  targetNoiseLevel: number,
): RecommendationCandidate => {
  const requestedNoise = resolveNoiseLevel(designSpec.noiseBudget);
  const automation = resolveAutomationFromNoise(targetNoiseLevel);

  const noiseDistance = Math.abs(requestedNoise - targetNoiseLevel);
  const fit = Math.max(
    5,
    110 - noiseDistance * 1.8 - (repoSpec.governance.posture === "Strict" ? 10 : 0),
  );

  const ciMinutesProxy = estimateCiMinutesProxy(
    automation.ci.dimensions,
    designSpec.quality.testing,
    designSpec.ci.buildArtifacts,
  );
  const maintenanceCost =
    automation.dependabot.estimatedMonthlyPrs * 1.5 + ciMinutesProxy / 12;

  const matrixRiskByBreadth: Record<
    RepoSpec["automation"]["ci"]["matrixBreadth"],
    number
  > = {
    minimal: 8,
    standard: 14,
    broad: 26,
  };
  const complexityRisk =
    matrixRiskByBreadth[automation.ci.matrixBreadth] +
    (automation.dependabot.grouping === "none" ? 12 : 4) +
    (repoSpec.governance.branch.requireStatusChecks ? 6 : 0);

  const score = Number((fit - maintenanceCost - complexityRisk).toFixed(1));

  return {
    id: label.toLowerCase().replace(/\s+/g, "-"),
    label,
    score,
    fit,
    maintenanceCost: Number(maintenanceCost.toFixed(1)),
    complexityRisk: Number(complexityRisk.toFixed(1)),
    botPrsPerMonth: automation.dependabot.estimatedMonthlyPrs,
    ciMinutesProxy,
    securityPostureNote: buildSecurityPostureNote(
      designSpec,
      automation.dependabot.schedule,
    ),
    dependabot: automation.dependabot,
    ci: automation.ci,
  };
};

export const recommendAutomationCandidates = (
  designSpec: DesignSpec,
  repoSpec: RepoSpec,
): RecommendationCandidate[] => {
  const candidates = [
    scoreCandidate(designSpec, repoSpec, "Quiet Guardrails", 20),
    scoreCandidate(designSpec, repoSpec, "Balanced Throughput", 50),
    scoreCandidate(designSpec, repoSpec, "Aggressive Freshness", 80),
  ];

  return candidates.sort((left, right) => right.score - left.score).slice(0, 3);
};
