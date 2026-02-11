import { DesignSpec, RepoSpec } from '../spec';
import { normalizeDesignSpec } from './normalize';
import { resolvePacks } from './resolve-packs';

const toPythonModuleName = (projectName: string): string => {
  const moduleName = projectName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  return moduleName || 'app';
};

const resolveSharedFiles = (designSpec: DesignSpec): string[] => {
  const files = ['.github/settings.yml', '.gitignore'];

  if (designSpec.docs.readme) files.push('README.md');
  if (designSpec.docs.contributing) files.push('CONTRIBUTING.md');
  if (designSpec.ci.runTests || designSpec.ci.buildArtifacts) files.push('.github/workflows/ci.yml');
  if (designSpec.security.manageEnv) files.push('.env.example');

  return files;
};

const resolveTypeScriptFiles = (designSpec: DesignSpec): string[] => {
  const files = ['package.json', 'tsconfig.json', 'src/index.ts'];

  if (designSpec.quality.linter === 'ESLint') files.push('.eslintrc.json');
  if (designSpec.quality.formatter === 'Prettier') files.push('.prettierrc.json');

  if (designSpec.quality.testing) {
    if (designSpec.quality.testFramework === 'Vitest') {
      files.push('vitest.config.ts', 'src/index.test.ts');
    }

    if (designSpec.quality.testFramework === 'Jest') {
      files.push('jest.config.ts', 'src/index.test.ts');
    }
  }

  if (designSpec.architecture === 'Hexagonal') {
    files.push('src/adapters/http/handler.ts', 'src/domain/entity.ts', 'src/ports/repository.ts');
  }

  return files;
};

const resolvePythonFiles = (designSpec: DesignSpec): string[] => {
  const moduleName = toPythonModuleName(designSpec.projectName);
  const files = ['pyproject.toml', `src/${moduleName}/__init__.py`, `tests/test_${moduleName}.py`, 'tests/conftest.py'];

  if (designSpec.architecture === 'Hexagonal') {
    files.push(`src/${moduleName}/adapters/http.py`, `src/${moduleName}/domain/entities.py`, `src/${moduleName}/ports/repository.py`);
  }

  return files;
};

const resolveRustFiles = (designSpec: DesignSpec): string[] => {
  if (designSpec.structure === 'Monorepo') {
    return ['Cargo.toml', 'crates/app/Cargo.toml', 'crates/app/src/main.rs'];
  }

  return ['Cargo.toml', designSpec.type === 'Library' ? 'src/lib.rs' : 'src/main.rs'];
};

const resolveLanguageFiles = (designSpec: DesignSpec): string[] => {
  switch (designSpec.stack.language) {
    case 'TypeScript':
      return resolveTypeScriptFiles(designSpec);
    case 'Python':
      return resolvePythonFiles(designSpec);
    case 'Rust':
      return resolveRustFiles(designSpec);
    default:
      return ['package.json'];
  }
};

const resolveFiles = (designSpec: DesignSpec): string[] => {
  const sharedFiles = resolveSharedFiles(designSpec);
  const languageFiles = resolveLanguageFiles(designSpec);

  return [...sharedFiles, ...languageFiles].sort();
};

const resolveNoiseLevel = (noiseBudget: DesignSpec['noiseBudget']): number => {
  if (typeof noiseBudget === 'number' && Number.isFinite(noiseBudget)) {
    return Math.max(0, Math.min(100, noiseBudget));
  }

  switch (noiseBudget) {
    case 'low':
      return 20;
    case 'high':
      return 80;
    case 'medium':
    default:
      return 50;
  }
};

const compileAutomation = (designSpec: DesignSpec): RepoSpec['automation'] => {
  const noiseLevel = resolveNoiseLevel(designSpec.noiseBudget);

  if (noiseLevel <= 33) {
    return {
      dependabot: {
        schedule: 'monthly',
        grouping: 'broad',
        estimatedMonthlyPrs: 2,
      },
      ci: {
        matrixBreadth: 'minimal',
        dimensions: ['node-lts'],
      },
    };
  }

  if (noiseLevel >= 67) {
    return {
      dependabot: {
        schedule: 'daily',
        grouping: 'none',
        estimatedMonthlyPrs: 24,
      },
      ci: {
        matrixBreadth: 'broad',
        dimensions: ['node-lts', 'node-current', 'ubuntu', 'windows'],
      },
    };
  }

  return {
    dependabot: {
      schedule: 'weekly',
      grouping: 'language',
      estimatedMonthlyPrs: 6,
    },
    ci: {
      matrixBreadth: 'standard',
      dimensions: ['node-lts', 'ubuntu'],
    },
  };
};

const compileGovernance = (designSpec: DesignSpec, automation: RepoSpec['automation']): RepoSpec['governance'] => {
  const frequency = automation.dependabot.schedule;

  if (designSpec.governancePosture === 'Relaxed') {
    return {
      posture: 'Relaxed',
      ruleset: 'lenient',
      branch: {
        requirePr: false,
        requiredReviewers: 0,
        requireStatusChecks: false,
        requireLinearHistory: false,
        requireCodeOwners: false,
        requireSignedCommits: false,
      },
      statusChecks: [],
      securityDefaults: {
        codeScanning: false,
        secretScanning: false,
        dependencyUpdates: true,
        dependencyUpdateFrequency: frequency,
      },
    };
  }

  if (designSpec.governancePosture === 'Strict') {
    return {
      posture: 'Strict',
      ruleset: 'strict',
      branch: {
        requirePr: true,
        requiredReviewers: 2,
        requireStatusChecks: true,
        requireLinearHistory: true,
        requireCodeOwners: true,
        requireSignedCommits: true,
      },
      statusChecks: ['lint', 'test', 'build', 'codeql'],
      securityDefaults: {
        codeScanning: true,
        secretScanning: true,
        dependencyUpdates: true,
        dependencyUpdateFrequency: frequency,
      },
    };
  }

  return {
    posture: 'Team Standard',
    ruleset: 'standard',
    branch: {
      requirePr: true,
      requiredReviewers: 1,
      requireStatusChecks: true,
      requireLinearHistory: true,
      requireCodeOwners: false,
      requireSignedCommits: false,
    },
    statusChecks: ['lint', 'test', 'build'],
    securityDefaults: {
      codeScanning: true,
      secretScanning: true,
      dependencyUpdates: true,
      dependencyUpdateFrequency: frequency,
    },
  };
};

export const compileRepoSpec = (designSpec: DesignSpec, options?: { capabilityOwnerOverrides?: Record<string, string> }): RepoSpec => {
  const normalized = normalizeDesignSpec(designSpec);
  const automation = compileAutomation(normalized);
  const governance = compileGovernance(normalized, automation);

  return {
    name: normalized.projectName,
    packageManager: normalized.stack.packageManager,
    architecture: normalized.architecture,
    automation,
    governance,
    files: resolveFiles(normalized),
    packs: resolvePacks(normalized, options),
  };
};
