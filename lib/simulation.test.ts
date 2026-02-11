import { describe, expect, it } from "vitest";
import { createDefaultPlanConfig } from "./plan-config";
import {
  buildChangePlanDiff,
  buildSimulationSteps,
  compileDesignSpecToChangePlan,
  createEngineDecisionPayloads,
  mapChangePlanToPublisherActions,
} from "./simulation";
import { compileRepoSpec } from "./engine/compile-repospec";

describe("simulation builder", () => {
  it("includes critical files from configuration", () => {
    const config = createDefaultPlanConfig();
    config.docs.readme = true;
    config.architecture = "Hexagonal";

    const steps = buildSimulationSteps(config);
    const messages = steps.map((step) => step.message);

    expect(messages).toContain("Created README.md");
    expect(messages).toContain("Created src/domain/entity.ts");
    expect(messages.at(-1)).toBe("Bootstrap complete. Ready to code.");
  });

  it("skips optional files when features are disabled", () => {
    const config = createDefaultPlanConfig();
    config.docs.readme = false;
    config.docs.contributing = false;
    config.security.manageEnv = false;

    const messages = buildSimulationSteps(config).map((step) => step.message);

    expect(messages).not.toContain("Created README.md");
    expect(messages).not.toContain("Created CONTRIBUTING.md");
    expect(messages).not.toContain("Created .env.example");
  });

  it("builds plan diffs and publisher actions from change plans", () => {
    const previous = createDefaultPlanConfig();
    previous.docs.readme = false;

    const next = createDefaultPlanConfig();
    next.docs.readme = true;

    const previousPlan = compileDesignSpecToChangePlan(previous);
    const nextPlan = compileDesignSpecToChangePlan(next);
    const diff = buildChangePlanDiff(previousPlan, nextPlan);

    expect(
      diff.added.some((operation) => operation.target === "README.md"),
    ).toBe(true);
    expect(
      diff.removed.every((operation) => operation.id === "resolve-packs"),
    ).toBe(true);

    const nextRepoSpec = compileRepoSpec(next);
    const actions = mapChangePlanToPublisherActions(
      next,
      nextRepoSpec,
      nextPlan,
    );
    expect(actions.length).toBeGreaterThan(nextPlan.operations.length);
    expect(
      actions.some(
        (action) =>
          action.action.endsWith(".render") || action.action.endsWith(".plan"),
      ),
    ).toBe(true);
    expect(
      actions.some((action) => action.target === ".github/governance-hints.json"),
    ).toBe(true);
    expect(
      actions.some((action) => action.target === ".github/rulesets/preview.json"),
    ).toBe(true);
  });

  it("applies capability owner overrides to both repo spec and change plan compilation", () => {
    const config = createDefaultPlanConfig();
    config.ci.automaticRelease = true;

    const defaultRepoSpec = compileRepoSpec(config);
    const overriddenRepoSpec = compileRepoSpec(config, {
      capabilityOwnerOverrides: {
        "release:ownership": "pack.release.gh-release",
      },
    });

    const defaultPlan = compileDesignSpecToChangePlan(config);
    const overriddenPlan = compileDesignSpecToChangePlan(config, {
      capabilityOwnerOverrides: {
        "release:ownership": "pack.release.gh-release",
      },
    });

    expect(defaultRepoSpec.packs.selectedPacks).toContain(
      "pack.release.semantic",
    );
    expect(overriddenRepoSpec.packs.selectedPacks).toContain(
      "pack.release.gh-release",
    );

    expect(
      defaultPlan.operations.some((operation) =>
        operation.message.includes("pack.release.semantic"),
      ),
    ).toBe(true);
    expect(
      overriddenPlan.operations.some((operation) =>
        operation.message.includes("pack.release.gh-release"),
      ),
    ).toBe(true);
    expect(defaultPlan.operations).not.toEqual(overriddenPlan.operations);
  });

  it("produces deterministic publisher actions per target", () => {
    const config = createDefaultPlanConfig();
    const repoSpec = compileRepoSpec(config);
    const changePlan = compileDesignSpecToChangePlan(config);

    const localActions = mapChangePlanToPublisherActions(
      config,
      repoSpec,
      changePlan,
      { target: "local" },
    );
    const prActions = mapChangePlanToPublisherActions(
      config,
      repoSpec,
      changePlan,
      { target: "pr" },
    );
    const createRepoActions = mapChangePlanToPublisherActions(
      config,
      repoSpec,
      changePlan,
      { target: "create-repo" },
    );

    expect(localActions).toEqual(
      mapChangePlanToPublisherActions(config, repoSpec, changePlan, {
        target: "local",
      }),
    );
    expect(prActions).toEqual(
      mapChangePlanToPublisherActions(config, repoSpec, changePlan, {
        target: "pr",
      }),
    );
    expect(createRepoActions).toEqual(
      mapChangePlanToPublisherActions(config, repoSpec, changePlan, {
        target: "create-repo",
      }),
    );

    expect(
      localActions.some((action) => action.action.startsWith("local.")),
    ).toBe(true);
    expect(prActions.some((action) => action.action.startsWith("pr."))).toBe(
      true,
    );
    expect(
      createRepoActions.some((action) =>
        action.action.startsWith("create-repo."),
      ),
    ).toBe(true);

    expect(localActions).not.toEqual(prActions);
    expect(prActions).not.toEqual(createRepoActions);
    expect(localActions).not.toEqual(createRepoActions);
  });


  it("switches Rust mode artifacts and action mappings deterministically", () => {
    const config = createDefaultPlanConfig();
    config.stack.language = "Rust";
    config.stack.framework = "Axum";
    config.stack.packageManager = "cargo";

    const templateRepoSpec = compileRepoSpec(config);
    const templatePlan = compileDesignSpecToChangePlan(config);
    const templateActionsBasic = mapChangePlanToPublisherActions(
      config,
      templateRepoSpec,
      templatePlan,
      { userMode: "basic", target: "local" },
    );

    expect(
      templateActionsBasic.some(
        (action) => action.target === "templates/rust/template-manifest.md",
      ),
    ).toBe(true);
    expect(
      templateActionsBasic.some(
        (action) => action.target === ".projen/rust-experimental-summary.json",
      ),
    ).toBe(false);

    config.stack.rustMode = "projen-experimental";

    const experimentalRepoSpec = compileRepoSpec(config);
    const experimentalPlan = compileDesignSpecToChangePlan(config);
    const experimentalActionsBasic = mapChangePlanToPublisherActions(
      config,
      experimentalRepoSpec,
      experimentalPlan,
      { userMode: "basic", target: "local" },
    );
    const experimentalActionsPower = mapChangePlanToPublisherActions(
      config,
      experimentalRepoSpec,
      experimentalPlan,
      { userMode: "power", target: "local" },
    );

    expect(experimentalActionsBasic).toEqual(templateActionsBasic);
    expect(
      experimentalActionsPower.some(
        (action) => action.target === ".projen/rust-experimental-summary.json",
      ),
    ).toBe(true);
    expect(
      experimentalActionsPower.some((action) => action.target === ".projenrc.ts"),
    ).toBe(true);
    expect(experimentalActionsPower).not.toEqual(templateActionsBasic);
  });

  it("emits decision payloads across compiler stages", () => {
    const config = createDefaultPlanConfig();
    config.stack.language = "Rust";
    config.stack.packageManager = "cargo";
    config.stack.framework = "Axum";
    config.stack.rustMode = "template";
    const repoSpec = compileRepoSpec(config);
    const plan = compileDesignSpecToChangePlan(config);

    const decisions = createEngineDecisionPayloads(config, repoSpec, plan);

    expect(decisions.map((decision) => decision.stage)).toEqual([
      "normalize",
      "repo-spec",
      "repo-spec",
      "change-plan",
    ]);
    expect(decisions.every((decision) => decision.why.length > 0)).toBe(true);

    const stackDecision = decisions.find(
      (decision) => decision.key === "stack-resolution",
    );
    expect(stackDecision?.why).toContain("posture enforces");

    const rustDecision = decisions.find((decision) => decision.key === "rust-mode");
    expect(rustDecision?.recommendation).toContain("Template renderer");

    const publishingDecision = decisions.find(
      (decision) => decision.key === "change-plan-publishing",
    );
    expect(publishingDecision?.why).toContain("posture enforces");
    expect(publishingDecision?.rankedCandidates).toHaveLength(3);
    expect(publishingDecision?.alternatives).toHaveLength(2);
  });
});
