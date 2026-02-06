import { describe, expect, it } from "vitest";
import { buildBaselineScaffold, mergeScaffolds } from "../src/services/scaffoldBuilder";
import { Language, ModelProvider, ProjectType, WizardState } from "../src/types";

const baseState: WizardState = {
  step: 1,
  modelProvider: ModelProvider.VSCODE,
  projectDetails: {
    name: "Example Repo",
    description: "Demo",
    aiPrompt: "",
    type: ProjectType.WEB_APP,
    license: "MIT",
    visibility: "public",
    defaultBranch: "main",
  },
  techStack: {
    language: Language.TYPESCRIPT,
    packageManager: "pnpm",
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
    docs: true,
    tests: true,
    linting: true,
    formatting: true,
    dependabot: false,
    husky: false,
    release: true,
    securityDocs: true,
  },
};

describe("buildBaselineScaffold", () => {
  it("includes baseline docs and workflows", () => {
    const files = buildBaselineScaffold(baseState);
    const paths = files.map((file) => file.path);

    expect(paths).toContain("README.md");
    expect(paths).toContain("LICENSE");
    expect(paths).toContain("SECURITY.md");
    expect(paths).toContain("CHANGELOG.md");
    expect(paths).toContain("docs/README.md");
    expect(paths).toContain("docs/guide.md");
    expect(paths).toContain("docs/architecture.md");
    expect(paths).toContain(".github/workflows/ci.yml");
    expect(paths).toContain(".github/workflows/release.yml");
    expect(paths).toContain(".github/workflows/codeql.yml");
    expect(paths).toContain("mkdocs.yml");
    expect(paths).toContain("pnpm-lock.yaml");
    expect(paths).toContain(".nvmrc");
  });

  it("adds entrypoint and test files", () => {
    const files = buildBaselineScaffold(baseState);
    const paths = files.map((file) => file.path);

    expect(paths).toContain("src/index.ts");
    expect(paths).toContain("tests/basic.test.ts");
  });

  it("builds python scaffolds with CI and tooling", () => {
    const state: WizardState = {
      ...baseState,
      techStack: { ...baseState.techStack, language: Language.PYTHON, packageManager: "" },
      automation: {
        ...baseState.automation,
        tests: true,
        linting: true,
        formatting: true,
      },
    };

    const files = buildBaselineScaffold(state);
    const paths = files.map((file) => file.path);
    const ci = files.find((file) => file.path === ".github/workflows/ci.yml")?.content || "";

    expect(paths).toContain("pyproject.toml");
    expect(paths).toContain("requirements.txt");
    expect(paths).toContain("ruff.toml");
    expect(ci).toContain("setup-python");
    expect(ci).toContain("python -m pytest");
    expect(ci).toContain("python -m ruff check");
  });

  it("builds release workflows with tags", () => {
    const files = buildBaselineScaffold(baseState);
    const release = files.find((file) => file.path === ".github/workflows/release.yml");

    expect(release?.content).toContain("tags:");
    expect(release?.content).toContain("action-gh-release");
    expect(release?.content).toContain("permissions:");
    expect(release?.content).toContain("concurrency:");
  });

  it("builds go scaffolds with CI", () => {
    const state: WizardState = {
      ...baseState,
      techStack: { ...baseState.techStack, language: Language.GO, packageManager: "" },
      automation: {
        ...baseState.automation,
        tests: true,
        linting: true,
        formatting: true,
      },
    };

    const files = buildBaselineScaffold(state);
    const paths = files.map((file) => file.path);
    const ci = files.find((file) => file.path === ".github/workflows/ci.yml")?.content || "";

    expect(paths).toContain("go.mod");
    expect(paths).toContain("go.sum");
    expect(paths).toContain("main.go");
    expect(ci).toContain("setup-go");
    expect(ci).toContain("go test");
    expect(ci).toContain("go vet");
    expect(ci).toContain("permissions:");
  });

  it("builds rust scaffolds with CI", () => {
    const state: WizardState = {
      ...baseState,
      techStack: { ...baseState.techStack, language: Language.RUST, packageManager: "" },
      automation: {
        ...baseState.automation,
        tests: true,
        linting: true,
        formatting: true,
      },
    };

    const files = buildBaselineScaffold(state);
    const paths = files.map((file) => file.path);
    const ci = files.find((file) => file.path === ".github/workflows/ci.yml")?.content || "";

    expect(paths).toContain("Cargo.toml");
    expect(paths).toContain("Cargo.lock");
    expect(paths).toContain("src/main.rs");
    expect(ci).toContain("rust-toolchain");
    expect(ci).toContain("cargo test");
    expect(ci).toContain("cargo clippy");
    expect(ci).toContain("permissions:");
  });

  it("adds husky and docker artifacts when enabled", () => {
    const state: WizardState = {
      ...baseState,
      automation: { ...baseState.automation, husky: true, docker: true },
    };

    const files = buildBaselineScaffold(state);
    const paths = files.map((file) => file.path);

    expect(paths).toContain(".husky/pre-commit");
    expect(paths).toContain(".husky/.gitignore");
    expect(paths).toContain("Dockerfile");
    expect(paths).toContain(".dockerignore");
  });
});

describe("mergeScaffolds", () => {
  it("keeps protected baseline files", () => {
    const baseline = [{ path: "README.md", content: "Baseline" }];
    const generated = [{ path: "README.md", content: "Generated" }];

    const merged = mergeScaffolds(generated, baseline);
    expect(merged.find((file) => file.path === "README.md")?.content).toBe("Baseline");
  });

  it("prefers generated for non-protected files", () => {
    const baseline = [{ path: "src/index.ts", content: "Baseline" }];
    const generated = [{ path: "src/index.ts", content: "Generated" }];

    const merged = mergeScaffolds(generated, baseline);
    expect(merged.find((file) => file.path === "src/index.ts")?.content).toBe("Generated");
  });
});
