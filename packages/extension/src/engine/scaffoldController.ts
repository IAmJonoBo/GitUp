import { LmClient } from "./lmClient";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import * as vscode from "vscode";
import {
  WizardState,
  GenerationResponse,
  buildBaselineScaffold,
  mergeScaffolds,
  runGenerationPipeline,
  Language,
  NodeVersionInfo,
  RECOMMENDED_NODE_VERSION,
  ModelProvider,
  PathValidationOptions,
} from "@gitup/shared";

const execFileAsync = promisify(execFile);

// Define result types locally if not exported from shared yet, or verify they are exported.
// Assuming GenerationResult is expected structure.

export class ScaffoldController {
  private lm: LmClient;

  constructor() {
    this.lm = new LmClient();
  }

  private normalizeNodeVersion(value?: string | null): string | null {
    if (!value) return null;
    const trimmed = value.trim();
    if (!trimmed) return null;
    const match = trimmed.match(/\d+(?:\.\d+){0,2}/);
    return match ? match[0] : null;
  }

  private getRecommendedNodeVersion(language: Language): string | null {
    return language === Language.TYPESCRIPT || language === Language.JAVASCRIPT
      ? RECOMMENDED_NODE_VERSION
      : null;
  }

  private getConfiguredNodeVersion(): string | null {
    const configured = vscode.workspace.getConfiguration("gitup").get<string>("nodeVersion");
    return this.normalizeNodeVersion(configured || null);
  }

  private async getNvmNodeVersion(): Promise<string | null> {
    const shell = process.env.SHELL || "/bin/zsh";
    try {
      const { stdout } = await execFileAsync(shell, ["-lc", "nvm current"], {
        timeout: 2000,
      });
      const value = stdout.trim();
      if (!value || value === "system") return null;
      return this.normalizeNodeVersion(value);
    } catch {
      return null;
    }
  }

  public async getNodeVersionInfo(language: Language): Promise<NodeVersionInfo> {
    const recommended = this.getRecommendedNodeVersion(language) || undefined;
    const detected = await this.getNvmNodeVersion();
    if (detected) {
      return { detectedVersion: detected, recommendedVersion: recommended, source: "nvm" };
    }

    const configured = this.getConfiguredNodeVersion();
    if (configured) {
      return { detectedVersion: configured, recommendedVersion: recommended, source: "setting" };
    }

    return {
      detectedVersion: undefined,
      recommendedVersion: recommended,
      source: recommended ? "recommended" : "unknown",
    };
  }

  private async ensureNodeVersion(state: WizardState): Promise<WizardState> {
    if (
      state.techStack.language !== Language.TYPESCRIPT &&
      state.techStack.language !== Language.JAVASCRIPT
    ) {
      return state;
    }

    const provided = this.normalizeNodeVersion(state.techStack.nodeVersion || null);
    if (provided) {
      return {
        ...state,
        techStack: { ...state.techStack, nodeVersion: provided },
      };
    }

    const info = await this.getNodeVersionInfo(state.techStack.language);
    const fallback = info.detectedVersion || info.recommendedVersion || RECOMMENDED_NODE_VERSION;
    return {
      ...state,
      techStack: { ...state.techStack, nodeVersion: fallback },
    };
  }

  private resolveProvider(state: WizardState): ModelProvider {
    return state.modelProvider || ModelProvider.VSCODE;
  }

  private getPathValidationOptions(): PathValidationOptions {
    const settings = vscode.workspace.getConfiguration("gitup");
    return {
      allowedTopLevelDirs: settings.get<string[]>("pathAllowlist") || [],
      extensionAllowlist:
        (settings.get<Record<string, string[]>>("extensionAllowlist") as
          | Record<string, string[]>
          | undefined) || undefined,
    };
  }

  public async suggestStack(state: WizardState): Promise<string> {
    this.lm.setProvider(this.resolveProvider(state));
    const prompt = `Analyze this project request:
Description: ${state.projectDetails.description}
Project Type: ${state.projectDetails.type}
Language: ${state.techStack.language}

Recommend a "best fit" tech stack (frameworks, databases, tools) and specific libraries.
Return a short paragraph (plain text) describing the recommendation.`;

    // For plain text, we bypass generateJson or use a text method.
    // But LmClient only has generateJson right now. Let's add generateText or just usage generateJson with valid keys.
    // Or just simple usage:

    // Quick hack for text:
    const schema = `JSON with a single key "suggestion" containing the text string.`;
    const res = await this.lm.generateJson<{ suggestion: string }>(prompt, schema);
    return res.suggestion;
  }

  public async generateScaffold(state: WizardState): Promise<GenerationResponse> {
    this.lm.setProvider(this.resolveProvider(state));
    const resolvedState = await this.ensureNodeVersion(state);
    // 1. Construct detailed prompt from state
    const prompt = `Generate a project scaffold for:
Name: ${resolvedState.projectDetails.name}
Type: ${resolvedState.projectDetails.type}
Language: ${resolvedState.techStack.language}
Description: ${resolvedState.projectDetails.description}
Frameworks: ${resolvedState.techStack.frameworks.join(", ")}
Features: ${JSON.stringify(resolvedState.automation)}

  Do NOT generate standard repo files that are managed separately:
  - README.md, LICENSE, SECURITY.md, CHANGELOG.md
  - .github/workflows/*, .github/dependabot.yml, .github/ISSUE_TEMPLATE/*
  - CONTRIBUTING.md, CODE_OF_CONDUCT.md, .editorconfig, .prettierrc.json

  Focus on application code, config, and framework-specific files only.

Return a list of files with paths and content.
`;

    const schema = `
{
  "files": [
    { "path": "string (relative)", "content": "string" }
  ]
}
`;

    const baselineFiles = buildBaselineScaffold(resolvedState);

    const requestGenerate = async () => {
      const result = await this.lm.generateJson<{
        files: { path: string; content: string }[];
      }>(prompt, schema);
      const files = mergeScaffolds(result.files, baselineFiles);
      return {
        files,
        validation: { valid: true, errors: [], warnings: [] },
        security: { safe: true, blocked: [], warnings: [] },
      };
    };

    const requestRepair = async (_state: WizardState, _files: unknown, errors: string[]) => {
      const repairPrompt = `The generated scaffold has issues:
Errors: ${JSON.stringify(errors)}

Please regenerate the problematic files to fix these issues. Return ALL files including unchanged ones (concise).`;

      const result = await this.lm.generateJson<{
        files: { path: string; content: string }[];
      }>(repairPrompt, schema);
      const files = mergeScaffolds(result.files, baselineFiles);
      return {
        files,
        validation: { valid: true, errors: [], warnings: [] },
        security: { safe: true, blocked: [], warnings: [] },
      };
    };

    const pipeline = await runGenerationPipeline(resolvedState, {
      requestGenerate,
      requestRepair,
      securityOptions: this.getPathValidationOptions(),
    });

    return {
      files: pipeline.files,
      validation: pipeline.validation,
      security: pipeline.security,
    };
  }
}
