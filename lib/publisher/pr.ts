import { ChangePlan, DesignSpec, PublisherAction } from '../spec';

const branchNameForOperation = (designSpec: DesignSpec, index: number) =>
  `codex/${designSpec.projectName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}/apply-${index + 1}`;

const mapOperationToPrAction = (operationType: ChangePlan['operations'][number]['type']) =>
  operationType === 'create_file'
    ? 'pr.stage-file'
    : operationType === 'install'
      ? 'pr.update-lockfiles'
      : operationType === 'quality'
        ? 'pr.verify-checks'
        : operationType === 'complete'
          ? 'pr.open'
          : 'pr.prepare';

export const buildPrOperationActions = (designSpec: DesignSpec, changePlan: ChangePlan): PublisherAction[] =>
  changePlan.operations.map((operation, index) => {
    const branchName = branchNameForOperation(designSpec, index);

    return {
      id: `pr-op-${index + 1}`,
      action: mapOperationToPrAction(operation.type),
      target: `${branchName}:${operation.target ?? operation.message}`,
      sourceOperationId: operation.id,
    };
  });
