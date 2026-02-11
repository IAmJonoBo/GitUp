import { ChangePlan, DesignSpec, PublisherAction } from '../spec';

const mapOperationToCreateRepoAction = (operationType: ChangePlan['operations'][number]['type']) =>
  operationType === 'create_file'
    ? 'create-repo.seed-file'
    : operationType === 'install'
      ? 'create-repo.install-dependencies'
      : operationType === 'quality'
        ? 'create-repo.configure-protection'
        : operationType === 'complete'
          ? 'create-repo.initialize'
          : 'create-repo.bootstrap';

export const buildCreateRepoBootstrapActions = (
  designSpec: DesignSpec,
  changePlan: ChangePlan,
): PublisherAction[] => {
  const repoTarget = `${designSpec.visibility}:${designSpec.projectName}`;

  return changePlan.operations.map((operation, index) => ({
    id: `create-repo-op-${index + 1}`,
    action: mapOperationToCreateRepoAction(operation.type),
    target: `${repoTarget}/${operation.target ?? operation.message}`,
    sourceOperationId: operation.id,
  }));
};
