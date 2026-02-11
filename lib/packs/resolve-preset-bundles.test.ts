import { describe, expect, it } from "vitest";
import { resolvePresetBundlesToPatch } from "./resolve-preset-bundles";

describe("preset bundle resolver", () => {
  it("merges bundle config into a single preset patch", () => {
    const patch = resolvePresetBundlesToPatch([
      "bundle.governance.team-standard",
      "bundle.stack.next-full",
    ]);

    expect(patch.visibility).toBe("private");
    expect(patch.stack?.framework).toBe("Next.js");
    expect(patch.quality?.testing).toBe(true);
    expect(patch.ci?.runTests).toBe(true);
  });
});
