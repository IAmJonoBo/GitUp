import { ChangeOperation, ChangePlan, RepoSpec } from '../spec';

const buildPackSelectionSummary = (repoSpec: RepoSpec): string => {
  const selectedPacks = repoSpec.packs.selectedPacks;

  if (!selectedPacks.length) return 'none';
  return selectedPacks.join(', ');
};

export const materializeChangePlan = (repoSpec: RepoSpec): ChangePlan => {
  const operations: ChangeOperation[] = [
    { id: 'init', type: 'init', message: 'Initializing git repository...' },
    { id: 'check', type: 'check', message: 'Checking system requirements...' },
    { id: 'check-compat', type: 'check', message: 'Validating dependency compatibility matrix...' },
    {
      id: 'resolve-packs',
      type: 'check',
      message: `Resolved repository packs: ${buildPackSelectionSummary(repoSpec)}.`,
    },
    ...repoSpec.files.map((path, index) => ({
      id: `create-${index + 1}`,
      type: 'create_file' as const,
      message: `Created ${path}`,
      target: path,
    })),
    {
      id: 'install',
      type: 'install',
      message: `Installing dependencies via ${repoSpec.packageManager}...`,
    },
    { id: 'quality', type: 'quality', message: 'Running initial lint & format...' },
    { id: 'complete', type: 'complete', message: 'Bootstrap complete. Ready to code.' },
  ];

  return {
    version: 1,
    operations,
  };
};
