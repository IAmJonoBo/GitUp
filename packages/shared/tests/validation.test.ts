import { describe, it, expect } from "vitest";
import { validateScaffold } from "../src/services/validationService";
import { Language, ProjectType, WizardState } from "../src/types";

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
    ci: true,
    docker: false,
    docs: false,
    tests: true,
    linting: false,
    formatting: false,
    dependabot: false,
    husky: false,
    release: false,
    securityDocs: false,
  },
};

const files = [
  {
    path: "package.json",
    content: JSON.stringify({ scripts: { test: "vitest" }, engines: { node: "20" } }, null, 2),
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

  it("requires CI workflows to run required scripts", () => {
    const result = validateScaffold(files, baseState);
    expect(result.errors.some((err) => err.includes("do not run 'test'"))).toBe(true);
  });

  it("warns when workflows miss permissions or concurrency", () => {
    const result = validateScaffold(files, baseState);
    expect(result.warnings.some((warn) => warn.includes("permissions"))).toBe(true);
    expect(result.warnings.some((warn) => warn.includes("concurrency"))).toBe(true);
  });

  it("requires README.md", () => {
    const result = validateScaffold(
      files.filter((f) => f.path !== "README.md"),
      baseState,
    );
    expect(result.errors).toContain("Missing README.md");
  });

  it("flags lockfile conflicts and node version mismatches", () => {
    const state = {
      ...baseState,
      techStack: { ...baseState.techStack, packageManager: "pnpm" },
    };

    const result = validateScaffold(
      [
        {
          path: "package.json",
          content: JSON.stringify(
            {
              scripts: { lint: "eslint" },
              packageManager: "npm@10.0.0",
              engines: { node: "18" },
            },
            null,
            2,
          ),
        },
        { path: "package-lock.json", content: "{}" },
        { path: "pnpm-lock.yaml", content: "lockfileVersion: 9" },
        { path: "src/index.ts", content: "export {}" },
        { path: "README.md", content: "# Readme" },
        {
          path: ".github/workflows/ci.yml",
          content: `name: CI
on:
  push:
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20.x"
      - run: npm run lint
`,
        },
      ],
      state,
    );

    expect(result.errors.some((err) => err.includes("Multiple lockfiles detected"))).toBe(true);
    expect(result.errors.some((err) => err.includes("does not match inferred"))).toBe(true);
    expect(result.errors.some((err) => err.includes("uses Node") && err.includes("expects"))).toBe(
      true,
    );
  });

  it("flags workflows that use a different package manager", () => {
    const state = {
      ...baseState,
      techStack: { ...baseState.techStack, packageManager: "pnpm" },
    };

    const result = validateScaffold(
      [
        {
          path: "package.json",
          content: JSON.stringify(
            { scripts: { lint: "eslint" }, packageManager: "pnpm@10.0.0" },
            null,
            2,
          ),
        },
        { path: "pnpm-lock.yaml", content: "lockfileVersion: 9" },
        { path: "src/index.ts", content: "export {}" },
        { path: "README.md", content: "# Readme" },
        {
          path: ".github/workflows/ci.yml",
          content: `name: CI
on:
  push:
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm run lint
`,
        },
      ],
      state,
    );

    expect(result.errors.some((err) => err.includes("uses a different package manager"))).toBe(
      true,
    );
  });

  it("warns when no node runtime version is specified", () => {
    const state = {
      ...baseState,
      automation: { ...baseState.automation, ci: false },
    };

    const result = validateScaffold(
      [
        {
          path: "package.json",
          content: JSON.stringify({ scripts: { test: "vitest" } }, null, 2),
        },
        { path: "src/index.ts", content: "export {}" },
        { path: "README.md", content: "# Readme" },
      ],
      state,
    );

    expect(result.warnings.some((warn) => warn.includes("No Node runtime version"))).toBe(true);
  });

  it("flags missing automation artifacts when enabled", () => {
    const state = {
      ...baseState,
      automation: {
        ...baseState.automation,
        ci: false,
        docker: true,
        docs: true,
        tests: true,
        linting: true,
        formatting: true,
        dependabot: true,
        husky: true,
        release: true,
        securityDocs: true,
      },
    };

    const result = validateScaffold(
      [
        {
          path: "package.json",
          content: JSON.stringify({ scripts: { lint: "eslint" } }, null, 2),
        },
        { path: "src/index.ts", content: "export {}" },
        { path: "README.md", content: "# Readme" },
      ],
      state,
    );

    expect(result.errors.some((err) => err.includes("Docker is enabled"))).toBe(true);
    expect(result.errors.some((err) => err.includes("Docs are enabled"))).toBe(true);
    expect(result.errors.some((err) => err.includes("Tests are enabled"))).toBe(true);
    expect(result.errors.some((err) => err.includes("Dependabot is enabled"))).toBe(true);
    expect(result.errors.some((err) => err.includes("Husky is enabled"))).toBe(true);
    expect(result.errors.some((err) => err.includes("Linting is enabled"))).toBe(true);
    expect(result.errors.some((err) => err.includes("Formatting is enabled"))).toBe(true);
    expect(result.errors.some((err) => err.includes("Release is enabled"))).toBe(true);
    expect(result.errors.some((err) => err.includes("Security docs are enabled"))).toBe(true);
  });

  it("requires language-specific entrypoints", () => {
    const pythonState = {
      ...baseState,
      automation: { ...baseState.automation, ci: false },
      techStack: { ...baseState.techStack, language: Language.PYTHON },
    };

    const goState = {
      ...baseState,
      automation: { ...baseState.automation, ci: false },
      techStack: { ...baseState.techStack, language: Language.GO },
    };

    const rustState = {
      ...baseState,
      automation: { ...baseState.automation, ci: false },
      techStack: { ...baseState.techStack, language: Language.RUST },
    };

    const baseFiles = [
      {
        path: "package.json",
        content: JSON.stringify({ scripts: { test: "vitest" } }, null, 2),
      },
      { path: "README.md", content: "# Readme" },
    ];

    const pythonResult = validateScaffold(baseFiles, pythonState);
    const goResult = validateScaffold(baseFiles, goState);
    const rustResult = validateScaffold(baseFiles, rustState);

    expect(pythonResult.errors.some((err) => err.includes("Missing Python entrypoint"))).toBe(true);
    expect(goResult.errors.some((err) => err.includes("Missing Go entrypoint"))).toBe(true);
    expect(rustResult.errors.some((err) => err.includes("Missing Rust entrypoint"))).toBe(true);
  });
});
