import { describe, expect, it } from 'vitest';
import { createDefaultPlanConfig } from '../plan-config';
import { compileRepoSpec } from './compile-repospec';
import { materializeChangePlan } from './materialize-changeplan';

describe('spec compiler determinism', () => {
  it('generates deterministic RepoSpec and ChangePlan from equivalent DesignSpec values', () => {
    const designSpecA = createDefaultPlanConfig();
    designSpecA.github.topics = ['zeta', 'alpha'];
    designSpecA.github.secrets = ['B_TOKEN', 'A_TOKEN'];
    designSpecA.github.environments = ['staging', 'production'];

    const designSpecB = createDefaultPlanConfig();
    designSpecB.github.topics = ['alpha', 'zeta'];
    designSpecB.github.secrets = ['A_TOKEN', 'B_TOKEN'];
    designSpecB.github.environments = ['production', 'staging'];

    const repoSpecA = compileRepoSpec(designSpecA);
    const repoSpecB = compileRepoSpec(designSpecB);

    expect(repoSpecA).toEqual(repoSpecB);
    expect(materializeChangePlan(repoSpecA)).toEqual(materializeChangePlan(repoSpecB));
  });

  it('recompiles idempotently from the same DesignSpec', () => {
    const designSpec = createDefaultPlanConfig();
    designSpec.architecture = 'Hexagonal';
    designSpec.docs.readme = true;

    const firstRepoSpec = compileRepoSpec(designSpec);
    const secondRepoSpec = compileRepoSpec(designSpec);

    const firstPlan = materializeChangePlan(firstRepoSpec);
    const secondPlan = materializeChangePlan(secondRepoSpec);

    expect(firstRepoSpec).toEqual(secondRepoSpec);
    expect(firstPlan).toEqual(secondPlan);
  });
});
