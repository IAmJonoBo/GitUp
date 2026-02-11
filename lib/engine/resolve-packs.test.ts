import { describe, expect, it } from 'vitest';
import { createDefaultPlanConfig } from '../plan-config';
import { resolvePacks } from './resolve-packs';

describe('pack resolver capability ownership', () => {
  it('assigns single-owner capabilities by priority and reports collisions', () => {
    const designSpec = createDefaultPlanConfig();
    designSpec.ci.automaticRelease = true;

    const resolution = resolvePacks(designSpec);

    expect(resolution.capabilityOwners['release:ownership']).toEqual(['pack.release.semantic']);
    expect(resolution.capabilityConflicts.some((entry) => entry.capability === 'release:ownership')).toBe(true);
    expect(resolution.selectedPacks).toContain('pack.release.semantic');
    expect(resolution.selectedPacks).not.toContain('pack.release.gh-release');
  });

  it('supports manual capability owner override', () => {
    const designSpec = createDefaultPlanConfig();
    designSpec.ci.automaticRelease = true;

    const resolution = resolvePacks(designSpec, {
      capabilityOwnerOverrides: {
        'release:ownership': 'pack.release.gh-release',
      },
    });

    expect(resolution.capabilityOwners['release:ownership']).toEqual(['pack.release.gh-release']);
    expect(resolution.selectedPacks).toContain('pack.release.gh-release');
  });
});
