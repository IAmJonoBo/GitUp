import { describe, expect, it } from 'vitest';
import { applyPresetConfig, createDefaultPlanConfig, mergePlanConfig } from './plan-config';

describe('plan-config helpers', () => {
  it('creates isolated default config copies', () => {
    const first = createDefaultPlanConfig();
    const second = createDefaultPlanConfig();

    first.projectName = 'mutated-name';
    first.github.features.issues = false;

    expect(second.projectName).toBe('my-awesome-project');
    expect(second.github.features.issues).toBe(true);
  });

  it('deep merges nested github updates without losing sibling values', () => {
    const base = createDefaultPlanConfig();
    const merged = mergePlanConfig(base, {
      github: {
        branches: {
          protection: {
            requiredReviewers: 3,
          },
        },
      },
    });

    expect(merged.github.branches.protection.requiredReviewers).toBe(3);
    expect(merged.github.branches.protection.requirePr).toBe(true);
    expect(merged.github.features.issues).toBe(true);
  });

  it('applies presets on top of defaults', () => {
    const preset = applyPresetConfig({
      projectName: 'api-service',
      security: { dependencyUpdateFrequency: 'daily' },
      docs: { readme: false },
    });

    expect(preset.projectName).toBe('api-service');
    expect(preset.security.dependencyUpdateFrequency).toBe('daily');
    expect(preset.docs.readme).toBe(false);
    expect(preset.github.branches.default).toBe('main');
  });
});
