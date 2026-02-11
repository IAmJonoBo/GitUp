import { DesignSpec } from '../../types';
import { PackDefinition } from './types';

const versionFor = (designSpec: DesignSpec): string =>
  designSpec.stack.dependencyStrategy === 'pinned' ? '1.0.0' : '^1.0.0';

const frameworkDependencyName = (framework: string): string => framework.toLowerCase();

export const PACK_REGISTRY: PackDefinition[] = [
  {
    id: 'pack.runtime.framework',
    title: 'Runtime framework dependency',
    requirements: ['stack:framework:present'],
    conflicts: [],
    capabilities: [{ name: 'runtime:framework' }],
    priority: 100,
    resolveEffects: (designSpec) => ({
      dependencies: designSpec.stack.framework
        ? { [frameworkDependencyName(designSpec.stack.framework)]: versionFor(designSpec) }
        : {},
    }),
  },
  {
    id: 'pack.build.vite',
    title: 'Vite build scripts',
    requirements: ['builder:vite'],
    conflicts: [],
    capabilities: [{ name: 'build:scripts' }],
    priority: 80,
    resolveEffects: () => ({
      scripts: {
        dev: 'vite',
        build: 'vite build',
      },
      presetPatch: {
        stack: {
          builder: 'Vite',
        },
      },
    }),
  },
  {
    id: 'pack.quality.lint-eslint',
    title: 'ESLint quality gate',
    requirements: ['quality:linter:eslint'],
    conflicts: ['pack.quality.lint-biome'],
    capabilities: [{ name: 'quality:linter' }],
    priority: 90,
    resolveEffects: (designSpec) => ({
      scripts: { lint: 'eslint .' },
      devDependencies: { eslint: versionFor(designSpec) },
      presetPatch: {
        quality: { linter: 'ESLint' },
      },
    }),
  },
  {
    id: 'pack.quality.lint-biome',
    title: 'Biome quality gate',
    requirements: ['quality:linter:biome'],
    conflicts: ['pack.quality.lint-eslint'],
    capabilities: [{ name: 'quality:linter' }],
    priority: 85,
    resolveEffects: () => ({
      presetPatch: {
        quality: { linter: 'Biome' },
      },
    }),
  },
  {
    id: 'pack.quality.format-prettier',
    title: 'Prettier formatter',
    requirements: ['quality:formatter:prettier'],
    conflicts: ['pack.quality.format-biome'],
    capabilities: [{ name: 'quality:formatter' }],
    priority: 80,
    resolveEffects: (designSpec) => ({
      scripts: { format: 'prettier --write .' },
      devDependencies: { prettier: versionFor(designSpec) },
      presetPatch: {
        quality: { formatter: 'Prettier' },
      },
    }),
  },
  {
    id: 'pack.quality.format-biome',
    title: 'Biome formatter',
    requirements: ['quality:formatter:biome'],
    conflicts: ['pack.quality.format-prettier'],
    capabilities: [{ name: 'quality:formatter' }],
    priority: 75,
    resolveEffects: () => ({
      presetPatch: {
        quality: { formatter: 'Biome' },
      },
    }),
  },
  {
    id: 'pack.quality.test-vitest',
    title: 'Vitest unit testing',
    requirements: ['quality:testing:on', 'quality:test:vitest'],
    conflicts: ['pack.quality.test-jest'],
    capabilities: [{ name: 'quality:test-runner' }],
    priority: 82,
    resolveEffects: (designSpec) => ({
      scripts: { test: 'vitest' },
      devDependencies: { vitest: versionFor(designSpec) },
    }),
  },
  {
    id: 'pack.quality.test-jest',
    title: 'Jest unit testing',
    requirements: ['quality:testing:on', 'quality:test:jest'],
    conflicts: ['pack.quality.test-vitest'],
    capabilities: [{ name: 'quality:test-runner' }],
    priority: 80,
    resolveEffects: (designSpec) => ({
      scripts: { test: 'jest' },
      devDependencies: { jest: versionFor(designSpec) },
    }),
  },
  {
    id: 'pack.release.semantic',
    title: 'Semantic release owner',
    requirements: ['ci:auto-release:on'],
    conflicts: ['pack.release.gh-release'],
    capabilities: [{ name: 'release:ownership' }],
    priority: 75,
    resolveEffects: () => ({
      presetPatch: {
        ci: { automaticRelease: true },
      },
    }),
  },
  {
    id: 'pack.release.gh-release',
    title: 'GitHub release owner',
    requirements: ['ci:auto-release:on'],
    conflicts: ['pack.release.semantic'],
    capabilities: [{ name: 'release:ownership' }],
    priority: 70,
    resolveEffects: () => ({
      presetPatch: {
        ci: { automaticRelease: true },
      },
    }),
  },
  {
    id: 'pack.docs.templates',
    title: 'Docs template scaffolding',
    requirements: ['docs:readme:on'],
    conflicts: [],
    capabilities: [{ name: 'docs:content', multiOwner: true }],
    priority: 40,
    resolveEffects: () => ({
      presetPatch: {
        docs: { readme: true },
      },
    }),
  },
];

export const deriveRequirementTags = (designSpec: DesignSpec): Set<string> => {
  const tags = new Set<string>();

  if (designSpec.stack.framework) {
    tags.add('stack:framework:present');
    tags.add(`stack:framework:${designSpec.stack.framework.toLowerCase()}`);
  }

  tags.add(`builder:${designSpec.stack.builder.toLowerCase()}`);
  tags.add(`quality:linter:${designSpec.quality.linter.toLowerCase()}`);
  tags.add(`quality:formatter:${designSpec.quality.formatter.toLowerCase()}`);

  if (designSpec.quality.testing) {
    tags.add('quality:testing:on');
    tags.add(`quality:test:${designSpec.quality.testFramework.toLowerCase()}`);
  }

  if (designSpec.ci.automaticRelease) {
    tags.add('ci:auto-release:on');
  }

  if (designSpec.docs.readme) {
    tags.add('docs:readme:on');
  }

  return tags;
};
