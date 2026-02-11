import { ChangePlan, DesignSpec, PublisherAction, RepoSpec } from '../spec';
import { renderPublisherArtifacts } from '../renderer';

export interface PublisherOptions {
  dryRun?: boolean;
  userMode?: 'basic' | 'power';
}

export const publishFromChangePlan = (
  designSpec: DesignSpec,
  repoSpec: RepoSpec,
  changePlan: ChangePlan,
  { dryRun = true, userMode = 'basic' }: PublisherOptions = {},
): PublisherAction[] => {
  const artifacts = renderPublisherArtifacts(designSpec, repoSpec, {
    dryRun,
    enableRustExperimental: userMode === 'power',
  });

  const artifactActions: PublisherAction[] = artifacts.map((artifact, index) => ({
    id: `publisher-render-${index + 1}`,
    action: artifact.kind === 'planned-action' ? 'publish.plan' : 'publish.render',
    target: artifact.path,
    sourceOperationId: changePlan.operations[0]?.id ?? 'init',
  }));

  const operationActions: PublisherAction[] = changePlan.operations.map((operation, index) => ({
    id: `publisher-op-${index + 1}`,
    action:
      operation.type === 'create_file'
        ? 'publish.file'
        : operation.type === 'install'
          ? 'publish.install'
          : operation.type === 'quality'
            ? 'publish.quality-gates'
            : operation.type === 'complete'
              ? 'publish.finalize'
              : 'publish.workflow',
    target: operation.target ?? operation.message,
    sourceOperationId: operation.id,
  }));

  return [...artifactActions, ...operationActions];
};
