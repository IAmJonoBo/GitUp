import { describe, expect, it } from "vitest";
import { createDefaultPlanConfig } from "../plan-config";
import { compileRepoSpec } from "../engine/compile-repospec";
import { renderPublisherArtifacts } from "./index";

describe("renderer rust mode", () => {
  it("emits distinct artifacts for template vs projen-experimental modes", () => {
    const base = createDefaultPlanConfig();
    base.stack.language = "Rust";
    base.stack.framework = "Axum";
    base.stack.packageManager = "cargo";

    const templateSpec = { ...base, stack: { ...base.stack, rustMode: "template" as const } };
    const templateArtifacts = renderPublisherArtifacts(
      templateSpec,
      compileRepoSpec(templateSpec),
      { dryRun: true, enableRustExperimental: false },
    );

    expect(
      templateArtifacts.some(
        (artifact) => artifact.path === "templates/rust/template-manifest.md",
      ),
    ).toBe(true);
    expect(
      templateArtifacts.some(
        (artifact) => artifact.path === ".projen/rust-experimental-summary.json",
      ),
    ).toBe(false);

    const experimentalSpec = {
      ...base,
      stack: { ...base.stack, rustMode: "projen-experimental" as const },
    };

    const experimentalArtifacts = renderPublisherArtifacts(
      experimentalSpec,
      compileRepoSpec(experimentalSpec),
      { dryRun: true, enableRustExperimental: true },
    );

    expect(
      experimentalArtifacts.some((artifact) => artifact.path === ".projenrc.ts"),
    ).toBe(true);
    expect(
      experimentalArtifacts.some(
        (artifact) => artifact.path === ".projen/rust-experimental-summary.json",
      ),
    ).toBe(true);
    expect(experimentalArtifacts).not.toEqual(templateArtifacts);
  });
});
