import { afterEach, describe, expect, it } from "vitest";
import { PACK_REGISTRY, PackDefinition } from "../packs";
import { createDefaultPlanConfig } from "../plan-config";
import { resolvePacks } from "./resolve-packs";

describe("pack resolver capability ownership", () => {
  it("assigns single-owner capabilities by priority and reports collisions", () => {
    const designSpec = createDefaultPlanConfig();
    designSpec.ci.automaticRelease = true;

    const resolution = resolvePacks(designSpec);

    expect(resolution.capabilityOwners["release:ownership"]).toEqual([
      "pack.release.semantic",
    ]);
    expect(
      resolution.capabilityConflicts.some(
        (entry) => entry.capability === "release:ownership",
      ),
    ).toBe(true);
    expect(resolution.selectedPacks).toContain("pack.release.semantic");
    expect(resolution.selectedPacks).not.toContain("pack.release.gh-release");
  });

  it("supports manual capability owner override", () => {
    const designSpec = createDefaultPlanConfig();
    designSpec.ci.automaticRelease = true;

    const resolution = resolvePacks(designSpec, {
      capabilityOwnerOverrides: {
        "release:ownership": "pack.release.gh-release",
      },
    });

    expect(resolution.capabilityOwners["release:ownership"]).toEqual([
      "pack.release.gh-release",
    ]);
    expect(resolution.selectedPacks).toContain("pack.release.gh-release");
    expect(resolution.packConflicts).toContainEqual(
      expect.objectContaining({
        winnerPackId: "pack.release.gh-release",
        droppedPackId: "pack.release.semantic",
      }),
    );
  });
});

describe("declared pack conflicts", () => {
  const extraPacks: PackDefinition[] = [
    {
      id: "pack.test.alpha",
      title: "Alpha test pack",
      requirements: ["docs:readme:on"],
      conflicts: ["pack.test.bravo"],
      capabilities: [{ name: "test:alpha" }],
      priority: 50,
      resolveEffects: () => ({ scripts: { alpha: "alpha" } }),
    },
    {
      id: "pack.test.bravo",
      title: "Bravo test pack",
      requirements: ["docs:readme:on"],
      conflicts: [],
      capabilities: [{ name: "test:bravo" }],
      priority: 45,
      resolveEffects: () => ({ scripts: { bravo: "bravo" } }),
    },
  ];

  afterEach(() => {
    for (let index = PACK_REGISTRY.length - 1; index >= 0; index -= 1) {
      if (PACK_REGISTRY[index].id.startsWith("pack.test.")) {
        PACK_REGISTRY.splice(index, 1);
      }
    }
  });

  it("treats conflicts as bidirectional and drops lower priority pack", () => {
    PACK_REGISTRY.push(...extraPacks);
    const designSpec = createDefaultPlanConfig();

    const resolution = resolvePacks(designSpec);

    expect(resolution.selectedPacks).toContain("pack.test.alpha");
    expect(resolution.selectedPacks).not.toContain("pack.test.bravo");
    expect(resolution.packConflicts).toContainEqual(
      expect.objectContaining({
        winnerPackId: "pack.test.alpha",
        droppedPackId: "pack.test.bravo",
      }),
    );
  });

  it("uses stable id sort as deterministic tie-breaker", () => {
    PACK_REGISTRY.push(
      {
        ...extraPacks[0],
        priority: 40,
        id: "pack.test.same-b",
        conflicts: ["pack.test.same-a"],
        capabilities: [{ name: "test:same-b" }],
      },
      {
        ...extraPacks[1],
        priority: 40,
        id: "pack.test.same-a",
        conflicts: ["pack.test.same-b"],
        capabilities: [{ name: "test:same-a" }],
      },
    );

    const designSpec = createDefaultPlanConfig();
    const resolution = resolvePacks(designSpec);

    expect(resolution.selectedPacks).toContain("pack.test.same-a");
    expect(resolution.selectedPacks).not.toContain("pack.test.same-b");
  });
});
