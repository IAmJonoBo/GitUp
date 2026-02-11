import { ChangePlan, DesignSpec, PublisherAction, RepoSpec } from '../spec';
import { renderPublisherArtifacts } from '../renderer';
import { buildCreateRepoBootstrapActions } from './create-repo';
import { buildLocalOperationActions } from './local';
import { buildPrOperationActions } from './pr';

export type PublishTarget = 'local' | 'pr' | 'create-repo';

export interface PublisherOptions {
  dryRun?: boolean;
  userMode?: 'basic' | 'power';
  target?: PublishTarget;
}

const mapArtifactActionPrefix = (target: PublishTarget) =>
  target === 'pr' ? 'pr' : target === 'create-repo' ? 'create-repo' : 'local';

const buildTargetOperationActions = (
  target: PublishTarget,
  designSpec: DesignSpec,
  changePlan: ChangePlan,
): PublisherAction[] =>
  target === 'pr'
    ? buildPrOperationActions(designSpec, changePlan)
    : target === 'create-repo'
      ? buildCreateRepoBootstrapActions(designSpec, changePlan)
      : buildLocalOperationActions(changePlan);

export const publishFromChangePlan = (
  designSpec: DesignSpec,
  repoSpec: RepoSpec,
  changePlan: ChangePlan,
  { dryRun = true, userMode = 'basic', target = 'local' }: PublisherOptions = {},
): PublisherAction[] => {
  const artifacts = renderPublisherArtifacts(designSpec, repoSpec, {
    dryRun,
    enableRustExperimental: userMode === 'power',
  });

  const actionPrefix = mapArtifactActionPrefix(target);

  const artifactActions: PublisherAction[] = artifacts.map((artifact, index) => ({
    id: `${actionPrefix}-artifact-${index + 1}`,
    action: artifact.kind === 'planned-action' ? `${actionPrefix}.plan` : `${actionPrefix}.render`,
    target: artifact.path,
    sourceOperationId: changePlan.operations[0]?.id ?? 'init',
  }));

  const operationActions = buildTargetOperationActions(target, designSpec, changePlan);

  return [...artifactActions, ...operationActions];
};
