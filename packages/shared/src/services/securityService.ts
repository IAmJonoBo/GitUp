import { GeneratedFile, SecurityScanResult, ScanIssue } from "../types";

const BLOCKED_PATH_SEGMENTS = new Set([
  ".git",
  ".svn",
  ".hg",
  ".vscode",
  ".idea",
  "node_modules",
  "dist",
  "build",
  "coverage",
  ".DS_Store",
]);

const ALLOWED_ROOT_FILES = new Set([
  "README.md",
  "LICENSE",
  "SECURITY.md",
  "CHANGELOG.md",
  "CODE_OF_CONDUCT.md",
  "CONTRIBUTING.md",
  "package.json",
  "package-lock.json",
  "pnpm-lock.yaml",
  "yarn.lock",
  "bun.lockb",
  "pnpm-workspace.yaml",
  "tsconfig.json",
  "tsconfig.base.json",
  "vite.config.ts",
  "vitest.config.ts",
  "eslint.config.mjs",
  ".editorconfig",
  ".prettierrc.json",
  ".prettierignore",
  ".gitignore",
  ".gitattributes",
  ".nvmrc",
  ".npmrc",
  "Dockerfile",
  ".dockerignore",
  "docker-compose.yml",
  "docker-compose.yaml",
  "mkdocs.yml",
  "go.mod",
  "go.sum",
  "Cargo.toml",
  "Cargo.lock",
  "pyproject.toml",
  "requirements.txt",
  "Makefile",
]);

const DEFAULT_ALLOWED_TOP_LEVEL_DIRS = new Set([
  ".github",
  ".husky",
  "docs",
  "src",
  "tests",
  "test",
  "scripts",
  "config",
  "configs",
  "public",
  "assets",
  "app",
  "server",
  "client",
  "packages",
  "services",
  "tools",
  "infra",
  "terraform",
  "k8s",
  "helm",
  "examples",
  "samples",
  "bin",
  "lib",
]);

const DEFAULT_BLOCKED_EXTENSIONS = new Set([
  ".exe",
  ".dll",
  ".dylib",
  ".so",
  ".dmg",
  ".pkg",
  ".msi",
  ".apk",
  ".app",
  ".jar",
  ".zip",
  ".tar",
  ".gz",
  ".tgz",
  ".7z",
  ".rar",
  ".bin",
]);

const DEFAULT_ALLOWED_EXTENSIONS_BY_TOP_LEVEL: Record<string, Set<string>> = {
  ".github": new Set([".yml", ".yaml", ".md", ".txt"]),
  ".husky": new Set([".sh"]),
  docs: new Set([".md", ".mdx", ".txt", ".png", ".jpg", ".jpeg", ".svg"]),
  src: new Set([
    ".ts",
    ".tsx",
    ".js",
    ".jsx",
    ".json",
    ".md",
    ".yml",
    ".yaml",
    ".toml",
    ".txt",
    ".css",
    ".scss",
    ".sass",
    ".less",
    ".html",
    ".sql",
    ".py",
    ".go",
    ".rs",
    ".java",
    ".kt",
    ".cs",
    ".swift",
    ".c",
    ".cc",
    ".cpp",
    ".h",
    ".hpp",
  ]),
  tests: new Set([".ts", ".tsx", ".js", ".jsx", ".py", ".go", ".rs", ".md", ".txt"]),
  test: new Set([".ts", ".tsx", ".js", ".jsx", ".py", ".go", ".rs", ".md", ".txt"]),
  scripts: new Set([".sh", ".bash", ".zsh", ".ps1", ".js", ".ts", ".py"]),
  config: new Set([".json", ".yml", ".yaml", ".toml", ".ini", ".txt"]),
  configs: new Set([".json", ".yml", ".yaml", ".toml", ".ini", ".txt"]),
  public: new Set([
    ".html",
    ".css",
    ".js",
    ".json",
    ".txt",
    ".png",
    ".jpg",
    ".jpeg",
    ".svg",
    ".gif",
    ".webp",
    ".ico",
    ".woff",
    ".woff2",
    ".ttf",
    ".otf",
  ]),
  assets: new Set([
    ".png",
    ".jpg",
    ".jpeg",
    ".svg",
    ".gif",
    ".webp",
    ".ico",
    ".woff",
    ".woff2",
    ".ttf",
    ".otf",
    ".css",
    ".js",
  ]),
  app: new Set([".ts", ".tsx", ".js", ".jsx", ".json", ".css", ".scss", ".html", ".md"]),
  server: new Set([".ts", ".js", ".json", ".md", ".yml", ".yaml", ".env"]),
  client: new Set([".ts", ".tsx", ".js", ".jsx", ".json", ".css", ".scss", ".html"]),
  packages: new Set([".ts", ".tsx", ".js", ".jsx", ".json", ".md", ".yml", ".yaml", ".toml"]),
  services: new Set([".ts", ".js", ".json", ".md", ".yml", ".yaml", ".toml"]),
  tools: new Set([".ts", ".js", ".json", ".md", ".yml", ".yaml", ".toml", ".sh"]),
  infra: new Set([".tf", ".tfvars", ".yml", ".yaml", ".json", ".md"]),
  terraform: new Set([".tf", ".tfvars", ".md"]),
  k8s: new Set([".yml", ".yaml", ".json", ".md"]),
  helm: new Set([".yml", ".yaml", ".tpl", ".md"]),
  examples: new Set([".ts", ".js", ".py", ".go", ".rs", ".md", ".txt"]),
  samples: new Set([".ts", ".js", ".py", ".go", ".rs", ".md", ".txt"]),
  bin: new Set([".sh", ".bash", ".zsh", ".ps1", ".js", ".ts"]),
  lib: new Set([".ts", ".js", ".json", ".md"]),
};

const DEFAULT_ALLOWED_NO_EXT_DIRS = new Set([".husky", "bin", "scripts"]);

const MAX_FILE_BYTES = 500_000;
const LARGE_BASE64_REGEX = /[A-Za-z0-9+/=]{2000,}/;

const BLOCKLIST_PATTERNS = [
  { pattern: /rm\s+-rf\s+\//i, label: "Destructive deletion (root)" },
  { pattern: /rm\s+-rf\s+[^\n]+/i, label: "Destructive deletion" },
  { pattern: /:(){\s*:;\s*}\s*;:/, label: "Fork bomb" },
  { pattern: /curl[^\n]*\|\s*(bash|sh)/i, label: "Unsafe pipe to shell" },
  { pattern: /wget[^\n]*\|\s*(bash|sh)/i, label: "Unsafe pipe to shell" },
  { pattern: /base64[^\n]*\|\s*(bash|sh)/i, label: "Base64 decode to shell" },
  {
    pattern:
      /powershell[^\n]*(Invoke-WebRequest|iwr|wget)[^\n]*(IEX|Invoke-Expression|Start-Process)/i,
    label: "Suspicious PowerShell download/exec",
  },
  {
    pattern: /python\s+-c\s+['"][^'"]*base64[^'"]*['"][^\n]*\|\s*(bash|sh)/i,
    label: "Base64 decode via python to shell",
  },
  { pattern: /mkfs\./i, label: "Filesystem formatting" },
  { pattern: /dd\s+if=/i, label: "Low-level disk write" },
  { pattern: />\s*\/dev\/sd[a-z]/i, label: "Direct device write" },
  {
    pattern:
      /(curl|wget)[^\n]*(http|https)[^\n]*(AWS_SECRET_ACCESS_KEY|GITHUB_TOKEN|ghp_|NPM_TOKEN)/i,
    label: "Credential exfiltration",
  },
  { pattern: /cat\s+~\/\.ssh\/id_rsa/i, label: "SSH key exfiltration" },
  {
    pattern: /(xmrig|coinhive|minerd|ethminer|nicehash)/i,
    label: "Crypto-mining related",
  },
];

const SECRET_WARNING_PATTERNS = [
  { pattern: /ghp_[a-zA-Z0-9]{36}/, label: "Potential GitHub token" },
  { pattern: /github_pat_[a-zA-Z0-9_\-]{20,}/, label: "Potential GitHub PAT" },
  { pattern: /npm_[a-zA-Z0-9]{36,}/, label: "Potential npm token" },
  { pattern: /AKIA[0-9A-Z]{16}/, label: "Potential AWS access key" },
  {
    pattern: /AWS_SECRET_ACCESS_KEY\s*=\s*['"][a-zA-Z0-9\/+]{40}['"]/,
    label: "Potential AWS secret key",
  },
  {
    pattern: /-----BEGIN (RSA|OPENSSH|EC) PRIVATE KEY-----/,
    label: "Private key material",
  },
];

const addIssue = (
  issues: ScanIssue[],
  file: string,
  line: number,
  excerpt: string,
  label: string,
) => {
  issues.push({ file, line, excerpt: excerpt.trim().slice(0, 180), label });
};

const isMostlyBinary = (content: string) => {
  if (!content) return false;
  let nonPrintable = 0;
  const length = content.length;
  for (let i = 0; i < length; i += 1) {
    const code = content.charCodeAt(i);
    const isControl = code < 32 && code !== 9 && code !== 10 && code !== 13;
    const isHigh = code === 65533;
    if (isControl || isHigh) nonPrintable += 1;
  }
  return length > 100 && nonPrintable / length > 0.3;
};

const normalizePath = (path: string) => path.replace(/\\/g, "/").replace(/^\.\/+/, "");
const getExtension = (value: string) => {
  const base = value.split("/").pop() || "";
  const idx = base.lastIndexOf(".");
  return idx > 0 ? base.slice(idx).toLowerCase() : "";
};

const toSet = (values?: string[]) => new Set((values || []).map((value) => value.trim()));
const normalizeTopLevel = (value: string) => value.replace(/\\/g, "/").split("/")[0];

const buildAllowlistConfig = (options?: PathValidationOptions) => {
  const extraDirs = options?.allowedTopLevelDirs || [];
  const allowedTopLevelDirs = new Set([
    ...Array.from(DEFAULT_ALLOWED_TOP_LEVEL_DIRS),
    ...extraDirs.map(normalizeTopLevel),
  ]);

  const blockedExtensions = new Set([
    ...Array.from(DEFAULT_BLOCKED_EXTENSIONS),
    ...(options?.blockedExtensions || []).map((ext) => ext.toLowerCase()),
  ]);

  const allowedNoExtDirs = new Set([
    ...Array.from(DEFAULT_ALLOWED_NO_EXT_DIRS),
    ...(options?.allowedNoExtensionDirs || []).map(normalizeTopLevel),
  ]);

  const extensionAllowlist: Record<string, Set<string>> = {};
  Object.entries(DEFAULT_ALLOWED_EXTENSIONS_BY_TOP_LEVEL).forEach(([key, value]) => {
    extensionAllowlist[key] = new Set(value);
  });
  if (options?.extensionAllowlist) {
    Object.entries(options.extensionAllowlist).forEach(([key, values]) => {
      extensionAllowlist[normalizeTopLevel(key)] = new Set(values.map((ext) => ext.toLowerCase()));
    });
  }

  return {
    allowedTopLevelDirs,
    blockedExtensions,
    allowedNoExtDirs,
    extensionAllowlist,
  };
};

export interface PathValidationOptions {
  allowedTopLevelDirs?: string[];
  blockedExtensions?: string[];
  allowedNoExtensionDirs?: string[];
  extensionAllowlist?: Record<string, string[]>;
}

export const validateFilePaths = (
  files: GeneratedFile[],
  options?: PathValidationOptions,
): ScanIssue[] => {
  const blocked: ScanIssue[] = [];
  const allowlistConfig = buildAllowlistConfig(options);

  files.forEach((file) => {
    const normalized = normalizePath(file.path.trim());
    if (!normalized) {
      addIssue(blocked, file.path, 1, file.path, "Empty file path");
      return;
    }

    if (normalized.startsWith("/") || /^[a-zA-Z]:/.test(normalized)) {
      addIssue(blocked, file.path, 1, normalized, "Absolute paths are not allowed");
      return;
    }

    const segments = normalized.split("/").filter((segment) => segment.length > 0);
    if (segments.length === 0) {
      addIssue(blocked, file.path, 1, normalized, "Empty file path");
      return;
    }

    if (segments.some((segment) => segment === "..")) {
      addIssue(blocked, file.path, 1, normalized, "Path traversal is not allowed");
      return;
    }

    if (segments.some((segment) => BLOCKED_PATH_SEGMENTS.has(segment))) {
      addIssue(blocked, file.path, 1, normalized, "Path targets a protected directory");
      return;
    }

    if (segments.length === 1) {
      if (!ALLOWED_ROOT_FILES.has(normalized)) {
        addIssue(blocked, file.path, 1, normalized, "Root file not in allowlist");
      }
      return;
    }

    const topLevel = segments[0];
    if (!allowlistConfig.allowedTopLevelDirs.has(topLevel)) {
      addIssue(blocked, file.path, 1, normalized, "Top-level path not in allowlist");
      return;
    }

    const extension = getExtension(normalized);
    if (extension && allowlistConfig.blockedExtensions.has(extension)) {
      addIssue(blocked, file.path, 1, normalized, "File extension is blocked");
      return;
    }

    if (!extension) {
      if (!allowlistConfig.allowedNoExtDirs.has(topLevel)) {
        addIssue(blocked, file.path, 1, normalized, "Missing file extension");
      }
      return;
    }

    const allowedExts = allowlistConfig.extensionAllowlist[topLevel];
    if (allowedExts && !allowedExts.has(extension)) {
      addIssue(blocked, file.path, 1, normalized, "File extension not allowed for directory");
    }
  });

  return blocked;
};

export const scanForDangerousContent = (
  files: GeneratedFile[],
  options?: PathValidationOptions,
): SecurityScanResult => {
  const blocked: ScanIssue[] = [];
  const warnings: ScanIssue[] = [];

  blocked.push(...validateFilePaths(files, options));

  files.forEach((file) => {
    if (file.content.length > MAX_FILE_BYTES) {
      addIssue(blocked, file.path, 1, file.path, "File exceeds size limit");
      return;
    }

    if (isMostlyBinary(file.content)) {
      addIssue(blocked, file.path, 1, file.path, "Binary content detected");
      return;
    }

    if (LARGE_BASE64_REGEX.test(file.content)) {
      addIssue(warnings, file.path, 1, file.path, "Large base64-like blob detected");
    }

    const lines = file.content.split(/\r?\n/);

    lines.forEach((lineText, idx) => {
      BLOCKLIST_PATTERNS.forEach((check) => {
        if (check.pattern.test(lineText)) {
          addIssue(blocked, file.path, idx + 1, lineText, check.label);
        }
      });

      SECRET_WARNING_PATTERNS.forEach((check) => {
        if (check.pattern.test(lineText)) {
          addIssue(warnings, file.path, idx + 1, lineText, check.label);
        }
      });
    });

    if (file.path.includes(".github/workflows")) {
      if (
        file.content.includes("permissions:") &&
        file.content.includes("contents: write") &&
        file.content.includes("pull-requests: write")
      ) {
        addIssue(
          warnings,
          file.path,
          1,
          "permissions: contents: write, pull-requests: write",
          "High privilege workflow permissions",
        );
      }
    }

    if (file.path.includes(".env")) {
      addIssue(warnings, file.path, 1, file.path, "Environment file included in scaffold");
    }
  });

  return {
    safe: blocked.length === 0,
    blocked,
    warnings,
  };
};

// Heuristic advisory check (Stub for Real OSV)
export const checkPackageHeuristics = (manifestContent: string, language: string): string[] => {
  const findings: string[] = [];

  if (language === "python" || manifestContent.includes("pip")) {
    if (manifestContent.includes("pickle"))
      findings.push("Avoid 'pickle' for untrusted data (RCE risk).");
  }

  // Generic checks
  if (manifestContent.includes("0.0.0")) findings.push("Suspicious version '0.0.0' detected.");

  return findings;
};
