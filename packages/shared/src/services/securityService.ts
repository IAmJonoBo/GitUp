import { GeneratedFile, SecurityScanResult, ScanIssue } from "../types";

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

export const scanForDangerousContent = (
  files: GeneratedFile[],
): SecurityScanResult => {
  const blocked: ScanIssue[] = [];
  const warnings: ScanIssue[] = [];

  files.forEach((file) => {
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
      addIssue(
        warnings,
        file.path,
        1,
        file.path,
        "Environment file included in scaffold",
      );
    }
  });

  return {
    safe: blocked.length === 0,
    blocked,
    warnings,
  };
};

// Heuristic advisory check (Stub for Real OSV)
export const checkPackageHeuristics = (
  manifestContent: string,
  language: string,
): string[] => {
  const findings: string[] = [];

  if (language === "python" || manifestContent.includes("pip")) {
    if (manifestContent.includes("pickle"))
      findings.push("Avoid 'pickle' for untrusted data (RCE risk).");
  }

  // Generic checks
  if (manifestContent.includes("0.0.0"))
    findings.push("Suspicious version '0.0.0' detected.");

  return findings;
};
