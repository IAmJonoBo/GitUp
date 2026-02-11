import { DesignSpec, RepoSpec } from '../spec';
import { normalizeDesignSpec } from './normalize';
import { resolvePacks } from './resolve-packs';

const resolveFiles = (designSpec: DesignSpec): string[] => {
  const files = ['.github/settings.yml', '.gitignore', 'package.json'];

  if (designSpec.docs.readme) files.push('README.md');
  if (designSpec.docs.contributing) files.push('CONTRIBUTING.md');
  if (designSpec.stack.language === 'TypeScript') files.push('tsconfig.json');
  if (designSpec.quality.linter === 'ESLint') files.push('.eslintrc.json');
  if (designSpec.ci.runTests || designSpec.ci.buildArtifacts) files.push('.github/workflows/ci.yml');
  if (designSpec.security.manageEnv) files.push('.env.example');

  if (designSpec.architecture === 'Hexagonal') {
    files.push('src/adapters/http/handler.ts', 'src/domain/entity.ts', 'src/ports/repository.ts');
  } else {
    files.push('src/index.ts', 'src/utils.ts');
  }

  return [...files].sort();
};

export const compileRepoSpec = (designSpec: DesignSpec): RepoSpec => {
  const normalized = normalizeDesignSpec(designSpec);

  return {
    name: normalized.projectName,
    packageManager: normalized.stack.packageManager,
    architecture: normalized.architecture,
    files: resolveFiles(normalized),
    packs: resolvePacks(normalized),
  };
};
