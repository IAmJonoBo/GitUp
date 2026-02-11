import { describe, expect, it } from 'vitest';
import { createDefaultPlanConfig } from '../plan-config';
import { ProjectType, RepoStructure } from '../spec';
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

  it('maps noise budget to automation strategy outputs', () => {
    const designSpec = createDefaultPlanConfig();
    designSpec.noiseBudget = 'low';

    const lowNoiseRepoSpec = compileRepoSpec(designSpec);
    expect(lowNoiseRepoSpec.automation.dependabot.schedule).toBe('monthly');
    expect(lowNoiseRepoSpec.automation.ci.matrixBreadth).toBe('minimal');

    designSpec.noiseBudget = 85;
    const highNoiseRepoSpec = compileRepoSpec(designSpec);
    expect(highNoiseRepoSpec.automation.dependabot.schedule).toBe('daily');
    expect(highNoiseRepoSpec.automation.ci.matrixBreadth).toBe('broad');
  });

  it('maps governance posture to ruleset and security defaults', () => {
    const designSpec = createDefaultPlanConfig();
    designSpec.governancePosture = 'Strict';
    designSpec.noiseBudget = 'medium';

    const strictRepoSpec = compileRepoSpec(designSpec);
    expect(strictRepoSpec.governance.ruleset).toBe('strict');
    expect(strictRepoSpec.governance.branch.requireSignedCommits).toBe(true);
    expect(strictRepoSpec.governance.statusChecks).toContain('codeql');
    expect(strictRepoSpec.governance.securityDefaults.dependencyUpdateFrequency).toBe('weekly');

    designSpec.governancePosture = 'Relaxed';
    const relaxedRepoSpec = compileRepoSpec(designSpec);
    expect(relaxedRepoSpec.governance.ruleset).toBe('lenient');
    expect(relaxedRepoSpec.governance.branch.requirePr).toBe(false);
    expect(relaxedRepoSpec.governance.securityDefaults.codeScanning).toBe(false);
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


describe('language-aware file planning', () => {
  it('emits expected TypeScript files with optional tooling', () => {
    const designSpec = createDefaultPlanConfig();
    designSpec.stack.language = 'TypeScript';
    designSpec.quality.testFramework = 'Vitest';

    const repoSpec = compileRepoSpec(designSpec);

    expect(repoSpec.files).toContain('package.json');
    expect(repoSpec.files).toContain('tsconfig.json');
    expect(repoSpec.files).toContain('src/index.ts');
    expect(repoSpec.files).toContain('.eslintrc.json');
    expect(repoSpec.files).toContain('.prettierrc.json');
    expect(repoSpec.files).toContain('vitest.config.ts');
    expect(repoSpec.files).toContain('src/index.test.ts');
  });

  it('emits expected Python package and test skeleton files', () => {
    const designSpec = createDefaultPlanConfig();
    designSpec.projectName = 'Acme Service';
    designSpec.stack.language = 'Python';
    designSpec.stack.packageManager = 'poetry';

    const repoSpec = compileRepoSpec(designSpec);

    expect(repoSpec.files).toContain('pyproject.toml');
    expect(repoSpec.files).toContain('src/acme_service/__init__.py');
    expect(repoSpec.files).toContain('tests/test_acme_service.py');
    expect(repoSpec.files).toContain('tests/conftest.py');
    expect(repoSpec.files).not.toContain('package.json');
  });

  it('emits expected Rust manifest and source entrypoints', () => {
    const designSpec = createDefaultPlanConfig();
    designSpec.stack.language = 'Rust';
    designSpec.stack.packageManager = 'cargo';

    const binaryRepoSpec = compileRepoSpec(designSpec);
    expect(binaryRepoSpec.files).toContain('Cargo.toml');
    expect(binaryRepoSpec.files).toContain('src/main.rs');
    expect(binaryRepoSpec.files).not.toContain('src/lib.rs');

    designSpec.type = ProjectType.LIBRARY;
    const libraryRepoSpec = compileRepoSpec(designSpec);
    expect(libraryRepoSpec.files).toContain('Cargo.toml');
    expect(libraryRepoSpec.files).toContain('src/lib.rs');
    expect(libraryRepoSpec.files).not.toContain('src/main.rs');

    designSpec.structure = RepoStructure.MONO;
    const workspaceRepoSpec = compileRepoSpec(designSpec);
    expect(workspaceRepoSpec.files).toContain('Cargo.toml');
    expect(workspaceRepoSpec.files).toContain('crates/app/Cargo.toml');
    expect(workspaceRepoSpec.files).toContain('crates/app/src/main.rs');
  });
});
