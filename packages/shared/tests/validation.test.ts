import { describe, it, expect } from "vitest";
import { validateScaffold } from "../services/validationService";
import { Language, ProjectType, WizardState } from "../types";

const baseState: WizardState = {
  step: 4,
  projectDetails: {
    name: "test-app",
    description: "desc",
    aiPrompt: "",
    type: ProjectType.WEB_APP,
    license: "MIT",
    visibility: "public",
    defaultBranch: "main",
  },
  techStack: {
    language: Language.TYPESCRIPT,
    packageManager: "npm",
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
    ci: true,
    docker: false,
    docs: false,
    linting: false,
    dependabot: false,
    husky: false,
  },
};

const files = [
  {
    path: "package.json",
    content: JSON.stringify(
      { scripts: { test: "vitest" }, engines: { node: "20" } },
      null,
      2,
    ),
  },
  {
    path: "src/index.ts",
    content: 'console.log("ok")',
  },
  {
    path: "README.md",
    content: "# Test",
  },
  {
    path: ".github/workflows/ci.yml",
    content: `name: CI
on: [push]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm run lint
`,
  },
];

describe("validateScaffold", () => {
  it("flags workflow script mismatch", () => {
    const result = validateScaffold(files, baseState);
    expect(result.valid).toBe(false);
    expect(result.errors.some((err) => err.includes("lint"))).toBe(true);
  });

  it("requires README.md", () => {
    const result = validateScaffold(
      files.filter((f) => f.path !== "README.md"),
      baseState,
    );
    expect(result.errors).toContain("Missing README.md");
  });
});
