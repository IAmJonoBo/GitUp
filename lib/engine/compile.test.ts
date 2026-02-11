import { describe, expect, it } from "vitest";
import { createDefaultPlanConfig } from "../plan-config";
import { compileRepoSpec } from "./compile-repospec";
import { materializeChangePlan } from "./materialize-changeplan";

describe("spec compiler determinism", () => {
  it("generates deterministic RepoSpec and ChangePlan from equivalent DesignSpec values", () => {
    const designSpecA = createDefaultPlanConfig();
    designSpecA.github.topics = ["zeta", "alpha"];
    designSpecA.github.secrets = ["B_TOKEN", "A_TOKEN"];
    designSpecA.github.environments = ["staging", "production"];

    const designSpecB = createDefaultPlanConfig();
    designSpecB.github.topics = ["alpha", "zeta"];
    designSpecB.github.secrets = ["A_TOKEN", "B_TOKEN"];
    designSpecB.github.environments = ["production", "staging"];

    const repoSpecA = compileRepoSpec(designSpecA);
    const repoSpecB = compileRepoSpec(designSpecB);

    expect(repoSpecA).toEqual(repoSpecB);
    expect(materializeChangePlan(repoSpecA)).toEqual(
      materializeChangePlan(repoSpecB),
    );
  });

  it("maps noise budget to automation strategy outputs", () => {
    const designSpec = createDefaultPlanConfig();
    designSpec.noiseBudget = "low";

    const lowNoiseRepoSpec = compileRepoSpec(designSpec);
    expect(lowNoiseRepoSpec.automation.dependabot.schedule).toBe("monthly");
    expect(lowNoiseRepoSpec.automation.ci.matrixBreadth).toBe("minimal");

    designSpec.noiseBudget = 85;
    const highNoiseRepoSpec = compileRepoSpec(designSpec);
    expect(highNoiseRepoSpec.automation.dependabot.schedule).toBe("daily");
    expect(highNoiseRepoSpec.automation.ci.matrixBreadth).toBe("broad");
  });

  it("maps governance posture transitions to predictable checks and branch policy outputs", () => {
    const designSpec = createDefaultPlanConfig();
    designSpec.noiseBudget = "medium";

    designSpec.governancePosture = "Relaxed";
    const relaxedRepoSpec = compileRepoSpec(designSpec);
    expect(relaxedRepoSpec.governance.ruleset).toBe("lenient");
    expect(relaxedRepoSpec.governance.branch.requirePr).toBe(false);
    expect(relaxedRepoSpec.governance.branch.requiredReviewers).toBe(0);
    expect(relaxedRepoSpec.governance.statusChecks).toEqual([]);
    expect(relaxedRepoSpec.governance.artifactModel.requiredChecks.checks).toEqual(
      [],
    );
    expect(relaxedRepoSpec.governance.securityDefaults.codeScanning).toBe(false);

    designSpec.governancePosture = "Team Standard";
    const standardRepoSpec = compileRepoSpec(designSpec);
    expect(standardRepoSpec.governance.ruleset).toBe("standard");
    expect(standardRepoSpec.governance.branch.requirePr).toBe(true);
    expect(standardRepoSpec.governance.branch.requiredReviewers).toBe(1);
    expect(standardRepoSpec.governance.statusChecks).toEqual([
      "lint",
      "test",
      "build",
    ]);
    expect(
      standardRepoSpec.governance.artifactModel.rulesetProfile.label,
    ).toBe("Team Standard");

    designSpec.governancePosture = "Strict";
    const strictRepoSpec = compileRepoSpec(designSpec);
    expect(strictRepoSpec.governance.ruleset).toBe("strict");
    expect(strictRepoSpec.governance.branch.requireSignedCommits).toBe(true);
    expect(strictRepoSpec.governance.branch.requiredReviewers).toBe(2);
    expect(strictRepoSpec.governance.statusChecks).toEqual([
      "lint",
      "test",
      "build",
      "codeql",
    ]);
    expect(
      strictRepoSpec.governance.securityDefaults.dependencyUpdateFrequency,
    ).toBe("weekly");
  });

  it("recompiles idempotently from the same DesignSpec", () => {
    const designSpec = createDefaultPlanConfig();
    designSpec.architecture = "Hexagonal";
    designSpec.docs.readme = true;

    const firstRepoSpec = compileRepoSpec(designSpec);
    const secondRepoSpec = compileRepoSpec(designSpec);

    const firstPlan = materializeChangePlan(firstRepoSpec);
    const secondPlan = materializeChangePlan(secondRepoSpec);

    expect(firstRepoSpec).toEqual(secondRepoSpec);
    expect(firstPlan).toEqual(secondPlan);
  });
});
