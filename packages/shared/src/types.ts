export enum ProjectType {
  WEB_APP = "Web Application",
  API = "Backend API",
  CLI = "CLI Tool",
  LIBRARY = "Library/Package",
}

export enum Language {
  TYPESCRIPT = "TypeScript",
  JAVASCRIPT = "JavaScript",
  PYTHON = "Python",
  GO = "Go",
  RUST = "Rust",
}

export enum ModelProvider {
  VSCODE = "vscode",
  EXTERNAL = "external",
}

export type AppMode = "landing" | "wizard" | "doctor";

export type NodeVersionSource = "nvm" | "setting" | "recommended" | "unknown";

export interface NodeVersionInfo {
  detectedVersion?: string;
  recommendedVersion?: string;
  source: NodeVersionSource;
}

export interface Recipe {
  id: string;
  name: string;
  description: string;
  icon: string; // devicon class or lucide icon name
  config: Partial<WizardState["techStack"] & WizardState["automation"]>;
}

export interface TechStackOption {
  id: string;
  name: string;
  description: string;
  category: "frontend" | "backend" | "database" | "styling" | "testing" | "devtools";
  iconClass?: string; // devicon class
  recommendedFor?: Language[];
  tags?: string[];
}

export interface WizardState {
  step: number;
  modelProvider: ModelProvider;
  projectDetails: {
    name: string;
    description: string;
    aiPrompt: string;
    type: ProjectType;
    license: string;
    visibility: "public" | "private";
    defaultBranch: string;
  };
  techStack: {
    language: Language;
    packageManager: string; // New field
    nodeVersion?: string;
    frameworks: string[];
    tools: string[];
  };
  governance: {
    codeOfConduct: string; // e.g. 'Contributor Covenant'
    contributionGuide: boolean;
    issueTemplates: boolean;
    pullRequestTemplate: boolean;
  };
  automation: {
    ci: boolean;
    docker: boolean;
    docs: boolean;
    tests: boolean;
    linting: boolean;
    formatting: boolean;
    dependabot: boolean;
    husky: boolean; // git hooks
    release: boolean;
    securityDocs: boolean;
  };
}

export interface GeneratedFile {
  path: string;
  content: string;
  language?: string;
}

export interface ScanIssue {
  file: string;
  line: number;
  excerpt: string;
  label: string;
}

export interface AuditIssue {
  severity: "critical" | "warning" | "info";
  title: string;
  description: string;
  suggestion: string;
  fixFile?: GeneratedFile; // The suggested fix
}

export interface AuditAnalysis {
  score: number;
  summary: string;
  issues: AuditIssue[];
}

export interface SecurityScanResult {
  safe: boolean;
  blocked: ScanIssue[];
  warnings: ScanIssue[];
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface GenerationResponse {
  files: GeneratedFile[];
  validation: ValidationResult;
  security: SecurityScanResult;
}

export interface ExtensionSettings {
  modelProvider: ModelProvider;
  pathAllowlist?: string[];
  extensionAllowlist?: Record<string, string[]>;
}
