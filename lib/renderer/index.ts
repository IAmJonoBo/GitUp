import { DesignSpec, PublisherArtifact, RepoSpec } from "../spec";

export interface RenderOptions {
  dryRun?: boolean;
  enableRustExperimental?: boolean;
}

const buildGovernanceArtifacts = (
  repoSpec: RepoSpec,
  dryRun: boolean,
): PublisherArtifact[] => {
  const { artifactModel, posture, securityDefaults } = repoSpec.governance;

  const governanceHints = {
    posture,
    rulesetProfile: artifactModel.rulesetProfile,
    requiredChecks: artifactModel.requiredChecks,
    reviewConstraints: artifactModel.reviewConstraints,
    securityDefaults,
  };

  return [
    {
      path: ".github/governance-hints.json",
      kind: "artifact",
      content: JSON.stringify(governanceHints, null, 2),
      description: dryRun
        ? "Would publish governance hints artifact"
        : "Published governance hints artifact",
    },
    {
      path: ".github/rulesets/preview.json",
      kind: "planned-action",
      content: JSON.stringify(
        {
          mode: "preview",
          ruleset: artifactModel.rulesetProfile,
          requiredChecks: artifactModel.requiredChecks,
          reviewConstraints: artifactModel.reviewConstraints,
        },
        null,
        2,
      ),
      description: "Governance ruleset preview (non-destructive)",
    },
  ];
};

const buildProjenArtifacts = (
  designSpec: DesignSpec,
  repoSpec: RepoSpec,
  dryRun: boolean,
): PublisherArtifact[] => {
  const projenPath =
    designSpec.stack.language === "Python" ? ".projenrc.py" : ".projenrc.ts";
  const projenContent =
    designSpec.stack.language === "Python"
      ? `from projen import Project\n\nproject = Project(name='${designSpec.projectName}')\nproject.synth()\n`
      : `import { javascript } from 'projen';\n\nconst project = new javascript.NodeProject({\n  name: '${designSpec.projectName}',\n});\nproject.synth();\n`;

  const synthArtifacts = repoSpec.files.slice(0, 6).map((filePath) => ({
    path: filePath,
    kind: dryRun ? ("planned-action" as const) : ("artifact" as const),
    description: dryRun
      ? `Would synthesize ${filePath}`
      : `Synthesized ${filePath}`,
  }));

  return [
    {
      path: projenPath,
      kind: "file",
      content: projenContent,
      description: dryRun ? `Would write ${projenPath}` : `Wrote ${projenPath}`,
    },
    ...synthArtifacts,
  ];
};

const buildRustTemplateArtifacts = (
  repoSpec: RepoSpec,
  dryRun: boolean,
): PublisherArtifact[] => [
  {
    path: "templates/rust/template-manifest.md",
    kind: "file",
    content: [
      "# Rust Template Mode Manifest",
      "",
      "Mode: template",
      "",
      ...repoSpec.files.map((filePath) => `- ${filePath}`),
    ].join("\n"),
    description: dryRun
      ? "Would render Rust template mode manifest"
      : "Rendered Rust template mode manifest",
  },
];

const buildRustExperimentalArtifacts = (
  repoSpec: RepoSpec,
  dryRun: boolean,
): PublisherArtifact[] => {
  const experimentalSummary = {
    mode: "projen-experimental",
    synthTargets: repoSpec.files.slice(0, 8),
    generatedAt: "deterministic-preview",
  };

  return [
    {
      path: ".projenrc.ts",
      kind: dryRun ? "planned-action" : "file",
      content: "// Rust mode: projen-experimental\n",
      description: dryRun
        ? "Would synthesize projen Rust project (experimental mode)"
        : "Synthesized projen Rust project (experimental mode)",
    },
    {
      path: ".projen/rust-experimental-summary.json",
      kind: dryRun ? "planned-action" : "artifact",
      content: JSON.stringify(experimentalSummary, null, 2),
      description: dryRun
        ? "Would emit projen experimental mode summary"
        : "Emitted projen experimental mode summary",
    },
  ];
};

export const renderPublisherArtifacts = (
  designSpec: DesignSpec,
  repoSpec: RepoSpec,
  { dryRun = true, enableRustExperimental = false }: RenderOptions = {},
): PublisherArtifact[] => {
  const governanceArtifacts = buildGovernanceArtifacts(repoSpec, dryRun);

  if (
    designSpec.stack.language === "TypeScript" ||
    designSpec.stack.language === "Python"
  ) {
    return [
      ...buildProjenArtifacts(designSpec, repoSpec, dryRun),
      ...governanceArtifacts,
    ];
  }

  if (designSpec.stack.language === "Rust") {
    if (
      designSpec.stack.rustMode === "projen-experimental" &&
      enableRustExperimental
    ) {
      return [
        ...buildRustExperimentalArtifacts(repoSpec, dryRun),
        ...governanceArtifacts,
      ];
    }

    return [...buildRustTemplateArtifacts(repoSpec, dryRun), ...governanceArtifacts];
  }

  return [
    ...repoSpec.files.slice(0, 4).map((path) => ({
      path,
      kind: dryRun ? ("planned-action" as const) : ("artifact" as const),
      description: dryRun ? `Would publish ${path}` : `Published ${path}`,
    })),
    ...governanceArtifacts,
  ];
};
