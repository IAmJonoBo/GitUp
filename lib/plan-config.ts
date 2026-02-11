import { PlanConfig, PlanConfigPatch, ProjectType, RepoStructure } from '../types';

export const FINAL_WIZARD_STEP = 8;

const DEFAULT_PLAN_CONFIG: PlanConfig = {
  projectName: 'my-awesome-project',
  visibility: 'public',
  license: 'MIT',
  basics: {
    i18n: false,
    description: 'A new project bootstrapped with best practices.',
  },
  structure: RepoStructure.POLY,
  type: ProjectType.WEB,
  architecture: 'Standard',
  github: {
    topics: [],
    features: {
      issues: true,
      projects: false,
      wiki: false,
      discussions: false,
    },
    pr: {
      allowMergeCommit: false,
      allowSquashMerge: true,
      allowRebaseMerge: false,
      deleteBranchOnMerge: true,
    },
    branches: {
      default: 'main',
      protection: {
        requirePr: true,
        requiredReviewers: 1,
        requireStatusChecks: true,
        requireLinearHistory: true,
        requireCodeOwners: false,
        requireSignedCommits: false,
      },
    },
    actions: {
      permissions: 'local',
      allowPr: false,
      runners: 'github',
    },
    copilot: false,
    webhooks: [],
    environments: ['production', 'staging'],
    secrets: ['NPM_TOKEN'],
  },
  stack: {
    language: 'TypeScript',
    languageVersion: '20.x',
    framework: 'Next.js',
    packageManager: 'pnpm',
    dependencyStrategy: 'semver',
    buildTool: 'None',
    builder: 'None',
  },
  quality: {
    linter: 'ESLint',
    formatter: 'Prettier',
    qualityPlatform: 'None',
    testing: true,
    testFramework: 'Vitest',
    integrationTests: false,
    e2eTests: false,
    e2eFramework: 'None',
    coverageTarget: 80,
  },
  ci: {
    runTests: true,
    buildArtifacts: true,
    automaticRelease: false,
    deployToCloud: false,
  },
  security: {
    codeScanning: true,
    dependencyUpdates: true,
    dependencyUpdateFrequency: 'weekly',
    secretScanning: true,
    manageEnv: true,
  },
  docs: {
    readme: true,
    contributing: true,
    adr: false,
    codeowners: false,
    issueTemplates: false,
    pullRequestTemplate: false,
    framework: 'none',
    styleGuide: 'none',
    deployToPages: false,
  },
};

export const createDefaultPlanConfig = (): PlanConfig => structuredClone(DEFAULT_PLAN_CONFIG);

export const mergePlanConfig = (base: PlanConfig, updates: PlanConfigPatch): PlanConfig => ({
  ...base,
  ...updates,
  basics: {
    ...base.basics,
    ...(updates.basics ?? {}),
  },
  github: {
    ...base.github,
    ...(updates.github ?? {}),
    features: {
      ...base.github.features,
      ...(updates.github?.features ?? {}),
    },
    pr: {
      ...base.github.pr,
      ...(updates.github?.pr ?? {}),
    },
    branches: {
      ...base.github.branches,
      ...(updates.github?.branches ?? {}),
      protection: {
        ...base.github.branches.protection,
        ...(updates.github?.branches?.protection ?? {}),
      },
    },
    actions: {
      ...base.github.actions,
      ...(updates.github?.actions ?? {}),
    },
  },
  stack: {
    ...base.stack,
    ...(updates.stack ?? {}),
  },
  quality: {
    ...base.quality,
    ...(updates.quality ?? {}),
  },
  ci: {
    ...base.ci,
    ...(updates.ci ?? {}),
  },
  security: {
    ...base.security,
    ...(updates.security ?? {}),
  },
  docs: {
    ...base.docs,
    ...(updates.docs ?? {}),
  },
});

export const applyPresetConfig = (preset: PlanConfigPatch): PlanConfig =>
  mergePlanConfig(createDefaultPlanConfig(), preset);
