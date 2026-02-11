import { describe, expect, it } from "vitest";
import { createDefaultPlanConfig } from "../plan-config";
import { compileRepoSpec } from "./compile-repospec";
import { recommendAutomationCandidates } from "./recommend";

describe("recommendation engine", () => {
  it("returns exactly 3 ranked candidates with deterministic ordering", () => {
    const config = createDefaultPlanConfig();
    config.noiseBudget = "medium";
    const repoSpec = compileRepoSpec(config);

    const first = recommendAutomationCandidates(config, repoSpec);
    const second = recommendAutomationCandidates(config, repoSpec);

    expect(first).toHaveLength(3);
    expect(first).toEqual(second);
    expect(first[0].score).toBeGreaterThanOrEqual(first[1].score);
    expect(first[1].score).toBeGreaterThanOrEqual(first[2].score);
  });

  it("changes recommendation when noise budget sensitivity changes", () => {
    const lowNoise = createDefaultPlanConfig();
    lowNoise.noiseBudget = "low";
    const lowRepoSpec = compileRepoSpec(lowNoise);
    const lowCandidates = recommendAutomationCandidates(lowNoise, lowRepoSpec);

    const highNoise = createDefaultPlanConfig();
    highNoise.noiseBudget = "high";
    const highRepoSpec = compileRepoSpec(highNoise);
    const highCandidates = recommendAutomationCandidates(highNoise, highRepoSpec);

    expect(lowCandidates[0].label).toBe("Quiet Guardrails");
    expect(highCandidates[0].label).toBe("Aggressive Freshness");
    expect(lowCandidates[0].botPrsPerMonth).toBeLessThan(
      highCandidates[0].botPrsPerMonth,
    );
    expect(lowCandidates[0].ciMinutesProxy).toBeLessThan(
      highCandidates[0].ciMinutesProxy,
    );
  });
});
