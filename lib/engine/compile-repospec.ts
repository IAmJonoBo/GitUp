import {
  DesignSpec,
  GovernanceArtifactModel,
  GovernancePosture,
  RepoSpec,
} from "../spec";
import { normalizeDesignSpec } from "./normalize";
import { resolvePacks } from "./resolve-packs";
import { resolveAutomationFromNoise, resolveNoiseLevel } from "./recommend";

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

const compileAutomation = (designSpec: DesignSpec): RepoSpec["automation"] =>
  resolveAutomationFromNoise(resolveNoiseLevel(designSpec.noiseBudget));

const resolveGovernanceArtifactModel = (
  posture: GovernancePosture,
): GovernanceArtifactModel => {
  if (posture === "Relaxed") {
    return {
      rulesetProfile: {
        id: "lenient",
        label: "Relaxed",
        description:
          "Minimal branch protections for fast iteration and optional policy checks.",
      },
      requiredChecks: {
        requireStatusChecks: false,
        checks: [],
      },
      reviewConstraints: {
        requirePr: false,
        requiredReviewers: 0,
        requireCodeOwners: false,
        requireLinearHistory: false,
        requireSignedCommits: false,
      },
    };
  }

  if (posture === "Strict") {
    return {
      rulesetProfile: {
        id: "strict",
        label: "Strict",
        description:
          "High-assurance governance with mandatory reviews, checks, and signed history.",
      },
      requiredChecks: {
        requireStatusChecks: true,
        checks: ["lint", "test", "build", "codeql"],
      },
      reviewConstraints: {
        requirePr: true,
        requiredReviewers: 2,
        requireCodeOwners: true,
        requireLinearHistory: true,
        requireSignedCommits: true,
      },
    };
  }

  return {
    rulesetProfile: {
      id: "standard",
      label: "Team Standard",
      description:
        "Balanced governance with required PRs and core CI checks for team delivery.",
    },
    requiredChecks: {
      requireStatusChecks: true,
      checks: ["lint", "test", "build"],
    },
    reviewConstraints: {
      requirePr: true,
      requiredReviewers: 1,
      requireCodeOwners: false,
      requireLinearHistory: true,
      requireSignedCommits: false,
    },
  };
};

const compileGovernance = (
  designSpec: DesignSpec,
  automation: RepoSpec["automation"],
): RepoSpec["governance"] => {
  const frequency = automation.dependabot.schedule;
  const artifactModel = resolveGovernanceArtifactModel(
    designSpec.governancePosture,
  );

  return {
    posture: designSpec.governancePosture,
    ruleset: artifactModel.rulesetProfile.id,
    branch: {
      ...artifactModel.reviewConstraints,
      requireStatusChecks: artifactModel.requiredChecks.requireStatusChecks,
    },
    statusChecks: [...artifactModel.requiredChecks.checks],
    artifactModel,
    securityDefaults: {
      codeScanning: artifactModel.rulesetProfile.id !== "lenient",
      secretScanning: artifactModel.rulesetProfile.id !== "lenient",
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
