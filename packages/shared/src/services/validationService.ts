import {
  GeneratedFile,
  WizardState,
  Language,
  ValidationResult,
} from "../types";
import jsyaml from "js-yaml";

const getFileContent = (files: GeneratedFile[], pathMatch: string) =>
  files.find((f) => f.path === pathMatch)?.content ||
  files.find((f) => f.path.includes(pathMatch))?.content ||
  "";

const inferPackageManager = (files: GeneratedFile[], state: WizardState) => {
  const filePaths = files.map((f) => f.path);
  const pkgJson = getFileContent(files, "package.json");
  let fromPackageManager: string | null = null;
  try {
    if (pkgJson) {
      const pkg = JSON.parse(pkgJson);
      if (typeof pkg.packageManager === "string") {
        fromPackageManager = pkg.packageManager.split("@")[0];
      }
    }
  } catch {
    // ignore
  }

  const lockfileMap: Record<string, string> = {
    "package-lock.json": "npm",
    "pnpm-lock.yaml": "pnpm",
    "yarn.lock": "yarn",
    "bun.lockb": "bun",
  };

  const fromLockfiles = Object.entries(lockfileMap)
    .filter(([file]) => filePaths.includes(file))
    .map(([, pm]) => pm);

  const uniqueLockPms = Array.from(new Set(fromLockfiles));
  const inferred =
    fromPackageManager ||
    uniqueLockPms[0] ||
    state.techStack.packageManager ||
    "";

  return {
    inferred,
    lockfilePms: uniqueLockPms,
  };
};

const extractWorkflowRunCommands = (workflow: any): string[] => {
  const runCommands: string[] = [];
  if (!workflow || typeof workflow !== "object") return runCommands;
  const jobs = (workflow as any).jobs || {};
  Object.values(jobs).forEach((job: any) => {
    const steps = job?.steps || [];
    steps.forEach((step: any) => {
      if (typeof step?.run === "string") {
        runCommands.push(step.run);
      }
    });
  });
  return runCommands;
};

const extractNodeVersions = (workflow: any): string[] => {
  const versions: string[] = [];
  if (!workflow || typeof workflow !== "object") return versions;
  const jobs = (workflow as any).jobs || {};
  Object.values(jobs).forEach((job: any) => {
    const steps = job?.steps || [];
    steps.forEach((step: any) => {
      if (
        typeof step?.uses === "string" &&
        step.uses.includes("actions/setup-node")
      ) {
        const nodeVersion = step?.with?.["node-version"];
        if (typeof nodeVersion === "string") versions.push(nodeVersion);
      }
    });
  });
  return versions;
};

export const validateScaffold = (
  files: GeneratedFile[],
  state: WizardState,
): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  const filePaths = files.map((f) => f.path);

  // 1. Integrity & Parsing Checks (JSON/YAML)
  files.forEach((file) => {
    if (file.path.endsWith(".json")) {
      try {
        JSON.parse(file.content);
      } catch {
        errors.push(`Invalid JSON syntax in ${file.path}`);
      }
    }
    if (file.path.endsWith(".yml") || file.path.endsWith(".yaml")) {
      try {
        jsyaml.load(file.content);
      } catch (e) {
        errors.push(
          `Invalid YAML syntax in ${file.path}: ${(e as Error).message}`,
        );
      }
    }
  });

  // 2. Repo Structure Checks
  if (!filePaths.some((p) => p.toLowerCase() === "readme.md")) {
    errors.push("Missing README.md");
  }

  if (
    state.projectDetails.license !== "none" &&
    !filePaths.some((p) => p.toLowerCase() === "license")
  ) {
    errors.push("License selected but LICENSE file is missing.");
  }

  if (
    state.techStack.language === Language.TYPESCRIPT ||
    state.techStack.language === Language.JAVASCRIPT
  ) {
    if (!filePaths.some((p) => p === "package.json")) {
      errors.push("Missing package.json for JS/TS project.");
    }
    const hasEntrypoint = filePaths.some((p) =>
      [
        "src/index.ts",
        "src/index.js",
        "index.ts",
        "index.js",
        "src/main.ts",
        "src/main.js",
        "main.ts",
        "main.js",
      ].includes(p),
    );
    if (!hasEntrypoint) {
      errors.push("Missing JS/TS entrypoint (e.g., src/index.ts or index.js).");
    }
  }

  if (state.techStack.language === Language.PYTHON) {
    const hasEntrypoint = filePaths.some((p) =>
      ["main.py", "app.py", "src/main.py"].includes(p),
    );
    if (!hasEntrypoint) {
      errors.push("Missing Python entrypoint (e.g., main.py).");
    }
  }

  if (state.techStack.language === Language.GO) {
    if (!filePaths.includes("main.go")) {
      errors.push("Missing Go entrypoint main.go.");
    }
  }

  if (state.techStack.language === Language.RUST) {
    if (!filePaths.includes("src/main.rs")) {
      errors.push("Missing Rust entrypoint src/main.rs.");
    }
  }

  // 3. Toggle → Artifact Checks
  if (
    state.automation.ci &&
    !filePaths.some((p) => p.startsWith(".github/workflows/"))
  ) {
    errors.push(
      "CI is enabled but no workflow file in .github/workflows/ was generated.",
    );
  }

  if (state.automation.docker) {
    if (!filePaths.some((p) => p === "Dockerfile"))
      errors.push("Docker is enabled but no Dockerfile was generated.");
    if (!filePaths.some((p) => p === ".dockerignore"))
      errors.push("Docker is enabled but .dockerignore is missing.");
  }

  if (state.automation.docs) {
    const hasDocs =
      filePaths.some((p) => p.startsWith("docs/")) ||
      filePaths.some((p) =>
        ["mkdocs.yml", "docusaurus.config.js", "docusaurus.config.ts"].includes(
          p,
        ),
      );
    if (!hasDocs)
      errors.push(
        "Docs are enabled but no docs/ or documentation config was generated.",
      );
  }

  if (state.automation.dependabot) {
    const hasDependabot = filePaths.some(
      (p) => p === ".github/dependabot.yml" || p === ".github/dependabot.yaml",
    );
    if (!hasDependabot)
      errors.push(
        "Dependabot is enabled but .github/dependabot.yml was not generated.",
      );
  }

  if (state.automation.husky) {
    const hasHusky = filePaths.some((p) => p.startsWith(".husky/"));
    if (!hasHusky)
      errors.push("Husky is enabled but .husky/ hooks were not generated.");
  }

  if (state.automation.linting) {
    const hasLintConfig = filePaths.some((p) =>
      [
        ".eslintrc",
        ".eslintrc.js",
        ".eslintrc.cjs",
        ".eslintrc.json",
        "eslint.config.js",
        "eslint.config.mjs",
        "eslint.config.cjs",
        "ruff.toml",
        ".ruff.toml",
        "pyproject.toml",
      ].includes(p),
    );
    if (!hasLintConfig)
      errors.push(
        "Linting is enabled but no lint configuration file was generated.",
      );
  }

  if (
    state.governance.codeOfConduct !== "none" &&
    !filePaths.some((p) => p.toUpperCase().includes("CODE_OF_CONDUCT"))
  ) {
    errors.push("Code of Conduct selected but missing CODE_OF_CONDUCT.md");
  }

  if (
    state.governance.contributionGuide &&
    !filePaths.some((p) => p.toUpperCase().includes("CONTRIBUTING"))
  ) {
    errors.push("Contribution guide enabled but missing CONTRIBUTING.md");
  }

  if (
    state.governance.issueTemplates &&
    !filePaths.some((p) => p.includes("ISSUE_TEMPLATE"))
  ) {
    errors.push("Issue templates enabled but missing .github/ISSUE_TEMPLATE/");
  }

  if (
    state.governance.pullRequestTemplate &&
    !filePaths.some((p) => p.toUpperCase().includes("PULL_REQUEST_TEMPLATE"))
  ) {
    errors.push(
      "PR template enabled but missing .github/PULL_REQUEST_TEMPLATE.md",
    );
  }

  // 4. Workflow ↔ Scripts Parity + Package Manager Consistency
  const workflowFiles = files.filter(
    (f) =>
      f.path.startsWith(".github/workflows/") &&
      (f.path.endsWith(".yml") || f.path.endsWith(".yaml")),
  );
  const packageJsonStr = getFileContent(files, "package.json");
  let scripts: Record<string, string> = {};
  let enginesNode: string | null = null;
  try {
    if (packageJsonStr) {
      const pkg = JSON.parse(packageJsonStr);
      scripts = pkg.scripts || {};
      enginesNode = pkg.engines?.node || null;
    }
  } catch {
    // Already captured in parsing errors
  }

  const { inferred, lockfilePms } = inferPackageManager(files, state);
  if (lockfilePms.length > 1) {
    errors.push(
      `Multiple lockfiles detected (${lockfilePms.join(", ")}). Use one package manager.`,
    );
  }
  if (
    state.techStack.packageManager &&
    inferred &&
    state.techStack.packageManager !== inferred
  ) {
    errors.push(
      `Selected package manager (${state.techStack.packageManager}) does not match inferred (${inferred}).`,
    );
  }

  workflowFiles.forEach((wf) => {
    let parsed: any = null;
    try {
      parsed = jsyaml.load(wf.content);
    } catch {
      // YAML parsing errors already collected
      return;
    }

    const runCommands = extractWorkflowRunCommands(parsed);

    const extractScripts = (cmd: string) => {
      const matches: string[] = [];
      const runMatch = cmd.match(/\b(?:npm|pnpm|yarn|bun)\s+run\s+([\w:-]+)/i);
      if (runMatch) matches.push(runMatch[1]);
      const directMatch = cmd.match(/\b(?:npm|pnpm|yarn|bun)\s+([\w:-]+)\b/i);
      if (directMatch && !["install", "ci"].includes(directMatch[1])) {
        matches.push(directMatch[1]);
      }
      return Array.from(new Set(matches));
    };

    runCommands.forEach((cmd) => {
      extractScripts(cmd).forEach((scriptName) => {
        if (!scripts[scriptName]) {
          errors.push(
            `Workflow ${wf.path} runs '${scriptName}' but script is missing in package.json`,
          );
        }
      });

      if (inferred) {
        const usesOtherPm =
          (cmd.includes("npm ") && inferred !== "npm") ||
          (cmd.includes("pnpm ") && inferred !== "pnpm") ||
          (cmd.includes("yarn ") && inferred !== "yarn") ||
          (cmd.includes("bun ") && inferred !== "bun");
        if (usesOtherPm) {
          errors.push(
            `Workflow ${wf.path} uses a different package manager than inferred (${inferred}).`,
          );
        }
      }
    });

    const workflowNodeVersions = extractNodeVersions(parsed);
    const nvmrc = getFileContent(files, ".nvmrc").trim();
    const targetNode = nvmrc || enginesNode;
    if (targetNode && workflowNodeVersions.length > 0) {
      workflowNodeVersions.forEach((version) => {
        if (version !== targetNode) {
          errors.push(
            `Workflow ${wf.path} uses Node ${version} but project expects ${targetNode}.`,
          );
        }
      });
    }
  });

  if (workflowFiles.length === 0 && state.automation.ci) {
    errors.push(
      "CI is enabled but no workflow file in .github/workflows/ was generated.",
    );
  }

  // 5. Runtime consistency warnings
  const hasNvmrc = filePaths.includes(".nvmrc");
  if (
    !hasNvmrc &&
    !enginesNode &&
    (state.techStack.language === Language.TYPESCRIPT ||
      state.techStack.language === Language.JAVASCRIPT)
  ) {
    warnings.push(
      "No Node runtime version specified (consider .nvmrc or package.json engines).",
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
};
