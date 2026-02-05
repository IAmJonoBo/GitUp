import { describe, it, expect } from "vitest";
import JSZip from "jszip";
import { runGenerationPipeline } from "../src/services/generationPipeline";
import { Language, ProjectType, WizardState } from "../src/types";

const baseState: WizardState = {
  step: 4,
  projectDetails: {
    name: "pipeline-test",
    description: "desc",
    aiPrompt: "",
    type: ProjectType.WEB_APP,
    license: "none",
    visibility: "public",
    defaultBranch: "main",
  },
  techStack: {
    language: Language.TYPESCRIPT,
    packageManager: "npm",
    nodeVersion: "20.11.1",
    frameworks: [],
    tools: [],
  },
  governance: {
    codeOfConduct: "none",
    contributionGuide: false,
    issueTemplates: false,
    pullRequestTemplate: false,
  },
  automation: {
    ci: false,
    docker: false,
    docs: false,
    tests: false,
    linting: false,
    formatting: false,
    dependabot: false,
    husky: false,
    release: false,
    securityDocs: false,
  },
};

describe("runGenerationPipeline", () => {
  it("repairs once and exports zip", async () => {
    const requestGenerate = async () => ({
      files: [
        {
          path: "package.json",
          content: JSON.stringify({ name: "x", scripts: {} }, null, 2),
        },
        { path: "src/index.ts", content: 'console.log("x")' },
      ],
      validation: { valid: false, errors: ["Missing README.md"], warnings: [] },
      security: { safe: true, blocked: [], warnings: [] },
    });

    const requestRepair = async () => ({
      files: [
        {
          path: "package.json",
          content: JSON.stringify({ name: "x", scripts: {} }, null, 2),
        },
        { path: "src/index.ts", content: 'console.log("x")' },
        { path: "README.md", content: "# Fixed" },
      ],
      validation: { valid: true, errors: [], warnings: [] },
      security: { safe: true, blocked: [], warnings: [] },
    });

    const result = await runGenerationPipeline(baseState, { requestGenerate, requestRepair }, 2);
    expect(result.validation.valid).toBe(true);
    expect(result.attempts).toBe(1);

    const zip = new JSZip();
    result.files.forEach((file) => zip.file(file.path, file.content));
    const blob = await zip.generateAsync({ type: "blob" });
    expect(blob.size).toBeGreaterThan(0);
  });

  it("throws on blocked security content", async () => {
    const requestGenerate = async () => ({
      files: [
        {
          path: "scripts/install.sh",
          content: "rm -rf /\n",
        },
      ],
      validation: { valid: true, errors: [], warnings: [] },
      security: { safe: false, blocked: [], warnings: [] },
    });

    const requestRepair = async () => ({
      files: [],
      validation: { valid: true, errors: [], warnings: [] },
      security: { safe: true, blocked: [], warnings: [] },
    });

    await expect(
      runGenerationPipeline(baseState, { requestGenerate, requestRepair }, 1),
    ).rejects.toThrow("Security Policy Violation");
  });

  it("throws if repair introduces blocked content", async () => {
    const requestGenerate = async () => ({
      files: [
        {
          path: "package.json",
          content: JSON.stringify({ name: "x", scripts: {} }, null, 2),
        },
      ],
      validation: { valid: false, errors: ["Missing README.md"], warnings: [] },
      security: { safe: true, blocked: [], warnings: [] },
    });

    const requestRepair = async () => ({
      files: [
        {
          path: "scripts/install.sh",
          content: "rm -rf /\n",
        },
      ],
      validation: { valid: true, errors: [], warnings: [] },
      security: { safe: false, blocked: [], warnings: [] },
    });

    await expect(
      runGenerationPipeline(baseState, { requestGenerate, requestRepair }, 2),
    ).rejects.toThrow("Security Policy Violation");
  });
});
