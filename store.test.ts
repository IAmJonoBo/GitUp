import { afterEach, describe, expect, it } from 'vitest';
import { useStore } from './store';

describe('store capability conflict resolution', () => {
  afterEach(() => {
    useStore.getState().reset();
  });

  it('recomputes repo spec packs and change plan operations using selected capability owner', () => {
    useStore.getState().updateConfig({
      ci: {
        automaticRelease: true,
      },
    });

    const before = useStore.getState();
    expect(before.repoSpec.packs.selectedPacks).toContain('pack.release.semantic');
    expect(before.changePlan.operations.some((operation) => operation.message.includes('pack.release.semantic'))).toBe(true);

    useStore.getState().resolveCapabilityConflict('release:ownership', 'pack.release.gh-release');

    const after = useStore.getState();
    expect(after.capabilityOwnerOverrides['release:ownership']).toBe('pack.release.gh-release');
    expect(after.repoSpec.packs.selectedPacks).toContain('pack.release.gh-release');
    expect(after.repoSpec.packs.selectedPacks).not.toContain('pack.release.semantic');
    expect(after.changePlan.operations.some((operation) => operation.message.includes('pack.release.gh-release'))).toBe(true);
    expect(after.changePlan.operations).not.toEqual(before.changePlan.operations);
  });

  it('recomputes publisher actions when publish target changes', () => {
    const initial = useStore.getState();
    const initialActions = initial.publisherActions;

    useStore.getState().setPublishTarget('pr');

    const prTarget = useStore.getState();
    expect(prTarget.publishTarget).toBe('pr');
    expect(prTarget.publisherActions).not.toEqual(initialActions);
    expect(prTarget.publisherActions.some((action) => action.action.startsWith('pr.'))).toBe(true);

    useStore.getState().setPublishTarget('create-repo');

    const createRepoTarget = useStore.getState();
    expect(createRepoTarget.publishTarget).toBe('create-repo');
    expect(createRepoTarget.publisherActions.some((action) => action.action.startsWith('create-repo.'))).toBe(true);
  });
});
