import { DesignSpec, RepoSpec } from "../spec";
import { normalizeDesignSpec } from "./normalize";
import { resolvePacks } from "./resolve-packs";

const resolveFiles = (designSpec: DesignSpec): string[] => {
  const files = [".github/settings.yml", ".gitignore", "package.json"];

  if (designSpec.docs.readme) files.push("README.md");
  if (designSpec.docs.contributing) files.push("CONTRIBUTING.md");
  if (designSpec.stack.language === "TypeScript") files.push("tsconfig.json");
  if (designSpec.quality.linter === "ESLint") files.push(".eslintrc.json");
  if (designSpec.ci.runTests || designSpec.ci.buildArtifacts)
    files.push(".github/workflows/ci.yml");
  if (designSpec.security.manageEnv) files.push(".env.example");

  if (designSpec.architecture === "Hexagonal") {
    files.push(
      "src/adapters/http/handler.ts",
      "src/domain/entity.ts",
      "src/ports/repository.ts",
    );
  } else {
    files.push("src/index.ts", "src/utils.ts");
  }

  return [...files].sort();
};

const resolveNoiseLevel = (noiseBudget: DesignSpec["noiseBudget"]): number => {
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

const compileAutomation = (designSpec: DesignSpec): RepoSpec["automation"] => {
  const noiseLevel = resolveNoiseLevel(designSpec.noiseBudget);

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

const compileGovernance = (
  designSpec: DesignSpec,
  automation: RepoSpec["automation"],
): RepoSpec["governance"] => {
  const frequency = automation.dependabot.schedule;

  if (designSpec.governancePosture === "Relaxed") {
    return {
      posture: "Relaxed",
      ruleset: "lenient",
      branch: {
        requirePr: false,
        requiredReviewers: 0,
        requireStatusChecks: false,
        requireLinearHistory: false,
        requireCodeOwners: false,
        requireSignedCommits: false,
      },
      statusChecks: [],
      securityDefaults: {
        codeScanning: false,
        secretScanning: false,
        dependencyUpdates: true,
        dependencyUpdateFrequency: frequency,
      },
    };
  }

  if (designSpec.governancePosture === "Strict") {
    return {
      posture: "Strict",
      ruleset: "strict",
      branch: {
        requirePr: true,
        requiredReviewers: 2,
        requireStatusChecks: true,
        requireLinearHistory: true,
        requireCodeOwners: true,
        requireSignedCommits: true,
      },
      statusChecks: ["lint", "test", "build", "codeql"],
      securityDefaults: {
        codeScanning: true,
        secretScanning: true,
        dependencyUpdates: true,
        dependencyUpdateFrequency: frequency,
      },
    };
  }

  return {
    posture: "Team Standard",
    ruleset: "standard",
    branch: {
      requirePr: true,
      requiredReviewers: 1,
      requireStatusChecks: true,
      requireLinearHistory: true,
      requireCodeOwners: false,
      requireSignedCommits: false,
    },
    statusChecks: ["lint", "test", "build"],
    securityDefaults: {
      codeScanning: true,
      secretScanning: true,
      dependencyUpdates: true,
      dependencyUpdateFrequency: frequency,
    },
  };
};

export const compileRepoSpec = (
  designSpec: DesignSpec,
  options?: { capabilityOwnerOverrides?: Record<string, string> },
): RepoSpec => {
  const normalized = normalizeDesignSpec(designSpec);
  const automation = compileAutomation(normalized);
  const governance = compileGovernance(normalized, automation);

  return {
    name: normalized.projectName,
    packageManager: normalized.stack.packageManager,
    architecture: normalized.architecture,
    automation,
    governance,
    files: resolveFiles(normalized),
    packs: resolvePacks(normalized, options),
  };
};
