import { DesignSpec, RepoPackResolution } from '../spec';

const sortRecord = (input: Record<string, string>): Record<string, string> =>
  Object.fromEntries(Object.entries(input).sort(([a], [b]) => a.localeCompare(b)));

export const resolvePacks = (designSpec: DesignSpec): RepoPackResolution => {
  const isPinned = designSpec.stack.dependencyStrategy === 'pinned';
  const version = isPinned ? '1.0.0' : '^1.0.0';

  const scripts: Record<string, string> = {
    dev: 'vite',
    build: 'vite build',
  };

  if (designSpec.quality.linter === 'ESLint') {
    scripts.lint = 'eslint .';
  }
  if (designSpec.quality.formatter === 'Prettier') {
    scripts.format = 'prettier --write .';
  }
  if (designSpec.quality.testing) {
    scripts.test = designSpec.quality.testFramework === 'Vitest' ? 'vitest' : 'jest';
  }

  const dependencies: Record<string, string> = {};
  if (designSpec.stack.framework) {
    dependencies[designSpec.stack.framework.toLowerCase()] = version;
  }

  const devDependencies: Record<string, string> = {};
  if (designSpec.quality.linter === 'ESLint') {
    devDependencies.eslint = version;
  }
  if (designSpec.quality.formatter === 'Prettier') {
    devDependencies.prettier = version;
  }
  if (designSpec.quality.testing) {
    devDependencies[designSpec.quality.testFramework.toLowerCase()] = version;
  }

  return {
    scripts: sortRecord(scripts),
    dependencies: sortRecord(dependencies),
    devDependencies: sortRecord(devDependencies),
  };
};
