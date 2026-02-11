import { Edge, Node } from 'reactflow';

export enum ProjectType {
  LIBRARY = 'Library',
  SERVICE = 'Service',
  WEB = 'Web App',
  CLI = 'CLI Tool',
  DESKTOP = 'Desktop App',
}

export enum RepoStructure {
  MONO = 'Monorepo',
  POLY = 'Polyrepo',
}

export type Architecture = 'Standard' | 'Hexagonal' | 'Clean' | 'Vertical Slice' | 'MVC' | 'Event-Driven';
export type DependencyStrategy = 'semver' | 'pinned'; // ^1.0.0 vs 1.0.0
export type Builder = 'None' | 'Vite' | 'Webpack' | 'Esbuild' | 'Tsc' | 'Rollup' | 'Go Build' | 'Cargo' | 'Maven' | 'Gradle';

export type DocFramework = 'none' | 'docusaurus' | 'vitepress' | 'mkdocs';
export type DocStyle = 'none' | 'diataxis' | 'microsoft' | 'google';

// New Tooling Types
export type BuildTool = 'None' | 'Nx' | 'Turborepo';
export type Linter = 'ESLint' | 'Biome' | 'None';
export type Formatter = 'Prettier' | 'Biome' | 'None';
export type QualityPlatform = 'None' | 'Trunk.io';

// New Testing Types
export type TestFramework = 'Jest' | 'Vitest' | 'Mocha' | 'Pytest' | 'Go Test' | 'Cargo Test' | 'JUnit' | 'RSpec' | 'None';
export type E2EFramework = 'Playwright' | 'Cypress' | 'None';

export interface Webhook {
  id: string;
  url: string;
  contentType: 'json' | 'form';
  events: ('push' | 'pull_request' | 'release' | '*')[];
  active: boolean;
}

export interface PlanConfig {
  projectName: string;
  visibility: 'public' | 'private';
  license: 'MIT' | 'Apache-2.0' | 'GPL-3.0' | 'None';
  basics: {
      i18n: boolean;
      description: string;
  };
  structure: RepoStructure;
  type: ProjectType;
  architecture: Architecture;
  github: {
    topics: string[];
    features: {
      issues: boolean;
      projects: boolean;
      wiki: boolean;
      discussions: boolean;
    };
    pr: {
      allowMergeCommit: boolean;
      allowSquashMerge: boolean;
      allowRebaseMerge: boolean;
      deleteBranchOnMerge: boolean;
    };
    branches: {
        default: string;
        protection: {
            requirePr: boolean;
            requiredReviewers: number;
            requireStatusChecks: boolean;
            requireLinearHistory: boolean;
            requireCodeOwners: boolean;
            requireSignedCommits: boolean;
        }
    };
    actions: {
        permissions: 'all' | 'local' | 'none';
        allowPr: boolean;
        runners: 'github' | 'self-hosted';
    };
    copilot: boolean;
    webhooks: Webhook[];
    environments: string[];
    secrets: string[]; // List of required secret names
  };
  stack: {
    language: 'TypeScript' | 'Go' | 'Rust' | 'Python' | 'Java' | 'Ruby';
    languageVersion: string; // e.g. "20.0.0", "3.11"
    framework: string;
    packageManager: 'npm' | 'pnpm' | 'yarn' | 'cargo' | 'pip' | 'pipenv' | 'bun' | 'maven' | 'gradle' | 'bundler' | 'poetry' | 'go mod';
    dependencyStrategy: DependencyStrategy;
    buildTool: BuildTool; // Monorepo tool
    builder: Builder; // Compiler/Bundler
  };
  quality: {
    linter: Linter;
    formatter: Formatter;
    qualityPlatform: QualityPlatform;
    testing: boolean;
    testFramework: TestFramework;
    integrationTests: boolean;
    e2eTests: boolean;
    e2eFramework: E2EFramework;
    coverageTarget: number;
  };
  ci: {
    runTests: boolean;
    buildArtifacts: boolean;
    automaticRelease: boolean;
    deployToCloud: boolean;
  };
  security: {
    codeScanning: boolean;
    dependencyUpdates: boolean;
    dependencyUpdateFrequency: 'daily' | 'weekly' | 'monthly';
    secretScanning: boolean;
    manageEnv: boolean; // New: .env file handling
  };
  docs: {
    readme: boolean;
    contributing: boolean;
    adr: boolean;
    codeowners: boolean;
    issueTemplates: boolean;
    pullRequestTemplate: boolean;
    framework: DocFramework;
    styleGuide: DocStyle;
    deployToPages: boolean;
  };
}

export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends Array<infer U>
    ? U extends object
      ? U[]
      : T[K]
    : T[K] extends object
      ? DeepPartial<T[K]>
      : T[K];
};

export type PlanConfigPatch = DeepPartial<PlanConfig>;

export interface Preset {
  id: string;
  name: string;
  description: string;
  config: Partial<PlanConfig>;
}

export interface TreeNode {
  name: string;
  type: 'file' | 'folder';
  children?: TreeNode[];
  content?: string; // For mocked file content
}

// Zod Schema Helpers
export interface DecisionPoint {
  title: string;
  recommendation: string;
  why: string;
  tradeOffs: string[];
  alternatives: string[];
  confidence: 'High' | 'Medium' | 'Low';
}

export interface SimulationLogEntry {
  id: string;
  type: 'info' | 'file' | 'success';
  message: string;
  fileName?: string;
}
