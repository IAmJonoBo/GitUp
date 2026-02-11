import { describe, expect, it } from 'vitest';
import { createDefaultPlanConfig } from './plan-config';
import { buildSimulationSteps } from './simulation';

describe('simulation builder', () => {
  it('includes critical files from configuration', () => {
    const config = createDefaultPlanConfig();
    config.docs.readme = true;
    config.architecture = 'Hexagonal';

    const steps = buildSimulationSteps(config);
    const messages = steps.map((step) => step.message);

    expect(messages).toContain('Created README.md');
    expect(messages).toContain('Created src/domain/entity.ts');
    expect(messages.at(-1)).toBe('Bootstrap complete. Ready to code.');
  });

  it('skips optional files when features are disabled', () => {
    const config = createDefaultPlanConfig();
    config.docs.readme = false;
    config.docs.contributing = false;
    config.security.manageEnv = false;

    const messages = buildSimulationSteps(config).map((step) => step.message);

    expect(messages).not.toContain('Created README.md');
    expect(messages).not.toContain('Created CONTRIBUTING.md');
    expect(messages).not.toContain('Created .env.example');
  });
});
