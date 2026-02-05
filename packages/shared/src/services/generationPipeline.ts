import {
  WizardState,
  GeneratedFile,
  ValidationResult,
  SecurityScanResult,
  GenerationResponse,
} from "../types";
import { validateScaffold } from "./validationService";
import { scanForDangerousContent } from "./securityService";

export interface PipelineResult {
  files: GeneratedFile[];
  validation: ValidationResult;
  security: SecurityScanResult;
  attempts: number;
}

export interface PipelineDeps {
  requestGenerate: (state: WizardState) => Promise<GenerationResponse>;
  requestRepair: (
    state: WizardState,
    files: GeneratedFile[],
    errors: string[],
  ) => Promise<GenerationResponse>;
}

export const runGenerationPipeline = async (
  state: WizardState,
  deps: PipelineDeps,
  maxAttempts = 2,
  onPhase?: (message: string) => void,
): Promise<PipelineResult> => {
  let attempt = 0;
  onPhase?.("Constructing architecture...");
  let response = await deps.requestGenerate(state);
  let files = response.files;

  let validation = validateScaffold(files, state);
  let security = scanForDangerousContent(files);
  if (!security.safe) {
    const details = security.blocked
      .map((b) => `${b.label} in ${b.file}:${b.line} → ${b.excerpt}`)
      .join("\n");
    throw new Error(
      `Security Policy Violation: Blocked dangerous content.\n${details}`,
    );
  }

  while (!validation.valid && attempt < maxAttempts) {
    attempt += 1;
    onPhase?.(`Repairing scaffold (attempt ${attempt}/${maxAttempts})...`);
    response = await deps.requestRepair(state, files, validation.errors);
    files = response.files;
    validation = validateScaffold(files, state);
    security = scanForDangerousContent(files);
    if (!security.safe) {
      const details = security.blocked
        .map((b) => `${b.label} in ${b.file}:${b.line} → ${b.excerpt}`)
        .join("\n");
      throw new Error(
        `Security Policy Violation: Blocked dangerous content.\n${details}`,
      );
    }
  }

  return { files, validation, security, attempts: attempt };
};
