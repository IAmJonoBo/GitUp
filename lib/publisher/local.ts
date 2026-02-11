import { ChangePlan, PublisherAction } from "../spec";

const mapOperationToLocalAction = (
  operationType: ChangePlan["operations"][number]["type"],
) =>
  operationType === "create_file"
    ? "local.write-file"
    : operationType === "install"
      ? "local.install-dependencies"
      : operationType === "quality"
        ? "local.run-quality-gates"
        : operationType === "complete"
          ? "local.complete"
          : "local.workflow";

export const buildLocalOperationActions = (
  changePlan: ChangePlan,
): PublisherAction[] =>
  changePlan.operations.map((operation, index) => ({
    id: `local-op-${index + 1}`,
    action: mapOperationToLocalAction(operation.type),
    target: operation.target ?? operation.message,
    sourceOperationId: operation.id,
  }));
