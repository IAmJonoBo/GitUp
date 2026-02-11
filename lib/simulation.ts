import { PlanConfig, SimulationLogEntry } from '../types';

export const SIMULATION_TICK_MS = 400;

const buildFileList = (config: PlanConfig): string[] => {
  const files = ['package.json', '.gitignore'];

  if (config.docs.readme) files.push('README.md');
  if (config.docs.contributing) files.push('CONTRIBUTING.md');
  if (config.stack.language === 'TypeScript') files.push('tsconfig.json');
  if (config.quality.linter === 'ESLint') files.push('.eslintrc.json');
  if (config.ci.runTests || config.ci.buildArtifacts) files.push('.github/workflows/ci.yml');
  if (config.security.manageEnv) files.push('.env.example');
  files.push('.github/settings.yml');

  if (config.architecture === 'Hexagonal') {
    files.push('src/domain/entity.ts', 'src/ports/repository.ts', 'src/adapters/http/handler.ts');
  } else {
    files.push('src/index.ts', 'src/utils.ts');
  }

  return files;
};

export const buildSimulationSteps = (config: PlanConfig): SimulationLogEntry[] => {
  const steps: SimulationLogEntry[] = [
    { id: '1', type: 'info', message: 'Initializing git repository...' },
    { id: '2', type: 'info', message: 'Checking system requirements...' },
    { id: '3', type: 'info', message: 'Validating dependency compatibility matrix...' },
  ];

  buildFileList(config).forEach((fileName, idx) => {
    steps.push({
      id: `file-${idx}`,
      type: 'file',
      message: `Created ${fileName}`,
      fileName,
    });
  });

  steps.push({ id: 'install', type: 'info', message: `Installing dependencies via ${config.stack.packageManager}...` });
  steps.push({ id: 'lint', type: 'info', message: 'Running initial lint & format...' });
  steps.push({ id: 'finish', type: 'success', message: 'Bootstrap complete. Ready to code.' });

  return steps;
};
