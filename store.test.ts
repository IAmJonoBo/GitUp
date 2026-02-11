import { afterEach, describe, expect, it } from "vitest";
import { useStore } from "./store";

describe("store capability conflict resolution", () => {
  afterEach(() => {
    useStore.getState().reset();
  });

  it("recomputes repo spec packs and change plan operations using selected capability owner", () => {
    useStore.getState().updateConfig({
      ci: {
        automaticRelease: true,
      },
    });

    const before = useStore.getState();
    expect(before.repoSpec.packs.selectedPacks).toContain(
      "pack.release.semantic",
    );
    expect(
      before.changePlan.operations.some((operation) =>
        operation.message.includes("pack.release.semantic"),
      ),
    ).toBe(true);

    useStore
      .getState()
      .resolveCapabilityConflict(
        "release:ownership",
        "pack.release.gh-release",
      );

    const after = useStore.getState();
    expect(after.capabilityOwnerOverrides["release:ownership"]).toBe(
      "pack.release.gh-release",
    );
    expect(after.repoSpec.packs.selectedPacks).toContain(
      "pack.release.gh-release",
    );
    expect(after.repoSpec.packs.selectedPacks).not.toContain(
      "pack.release.semantic",
    );
    expect(
      after.changePlan.operations.some((operation) =>
        operation.message.includes("pack.release.gh-release"),
      ),
    ).toBe(true);
    expect(after.changePlan.operations).not.toEqual(
      before.changePlan.operations,
    );
  });

  it("recomputes publisher actions when publish target changes", () => {
    const initial = useStore.getState();
    const initialActions = initial.publisherActions;

    useStore.getState().setPublishTarget("pr");

    const prTarget = useStore.getState();
    expect(prTarget.publishTarget).toBe("pr");
    expect(prTarget.publisherActions).not.toEqual(initialActions);
    expect(
      prTarget.publisherActions.some((action) =>
        action.action.startsWith("pr."),
      ),
    ).toBe(true);

    useStore.getState().setPublishTarget("create-repo");

    const createRepoTarget = useStore.getState();
    expect(createRepoTarget.publishTarget).toBe("create-repo");
    expect(
      createRepoTarget.publisherActions.some((action) =>
        action.action.startsWith("create-repo."),
      ),
    ).toBe(true);
  });
});

describe("store diff interstitial triggers", () => {
  afterEach(() => {
    useStore.getState().reset();
  });

  it("routes to diff phase for stack updates when diff exists", () => {
    useStore.getState().updateConfig({
      stack: {
        packageManager: "npm",
      },
    });

    const state = useStore.getState();
    expect(state.workflowPhase).toBe("diff");
    expect(state.diffPromptReason).toEqual({
      key: "stack",
      label: "language/stack",
    });
    expect(
      Boolean(
        state.pendingDiff &&
          (state.pendingDiff.added.length || state.pendingDiff.removed.length),
      ),
    ).toBe(true);
  });

  it("routes to diff phase for visibility updates when diff exists", () => {
    useStore.getState().updateConfig({
      visibility: "private",
      quality: {
        testing: false,
      },
    });

    const state = useStore.getState();
    expect(state.workflowPhase).toBe("diff");
    expect(state.diffPromptReason).toEqual({
      key: "visibility",
      label: "repository visibility",
    });
  });

  it("routes to diff phase for security updates when diff exists", () => {
    useStore.getState().updateConfig({
      security: {
        codeScanning: false,
      },
      quality: {
        testing: false,
      },
    });

    const state = useStore.getState();
    expect(state.workflowPhase).toBe("diff");
    expect(state.diffPromptReason).toEqual({
      key: "security",
      label: "security posture",
    });
  });

  it("routes to diff phase for preset updates when diff exists", () => {
    useStore.getState().applyPreset({
      config: {
        stack: {
          packageManager: "npm",
        },
      },
    });

    const state = useStore.getState();
    expect(state.workflowPhase).toBe("diff");
    expect(state.diffPromptReason).toEqual({
      key: "preset",
      label: "preset selection",
    });
  });

  it("clears stale diff prompt reason when no diff is generated", () => {
    useStore.getState().updateConfig({
      visibility: "private",
      quality: {
        testing: false,
      },
    });
    expect(useStore.getState().diffPromptReason?.key).toBe("visibility");

    useStore.getState().updateConfig({ visibility: "private" });

    const state = useStore.getState();
    expect(state.workflowPhase).toBe("diff");
    expect(state.pendingDiff?.added).toHaveLength(0);
    expect(state.pendingDiff?.removed).toHaveLength(0);
    expect(state.diffPromptReason).toBeNull();
  });

  it("keeps phase unchanged for no-op updates that are not trigger keys", () => {
    useStore.getState().setWorkflowPhase("preview");
    useStore.getState().updateConfig({ projectName: "my-awesome-project" });

    const state = useStore.getState();
    expect(state.workflowPhase).toBe("preview");
    expect(state.pendingDiff?.added).toHaveLength(0);
    expect(state.pendingDiff?.removed).toHaveLength(0);
    expect(state.diffPromptReason).toBeNull();
  });

  it("uses consistent phase transitions for stay and accept actions", () => {
    useStore.getState().updateConfig({
      visibility: "private",
      quality: {
        testing: false,
      },
    });

    useStore.getState().stayInPreview();

    let state = useStore.getState();
    expect(state.workflowPhase).toBe("preview");
    expect(state.pendingDiff).toBeNull();
    expect(state.diffPromptReason).toBeNull();

    useStore.getState().updateConfig({
      security: { codeScanning: false },
      quality: {
        testing: false,
      },
    });
    useStore.getState().confirmDiffInterstitial();

    state = useStore.getState();
    expect(state.workflowPhase).toBe("explain");
    expect(state.pendingDiff).toBeNull();
    expect(state.diffPromptReason).toBeNull();
  });
});
