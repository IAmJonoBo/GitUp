import React from "react";
import { useStore } from "../../store";
import { Button, Card } from "../ui/primitives";
import { Rocket } from "lucide-react";
import { PublishTarget } from "../../lib/publisher";

const TARGET_LABELS: Record<PublishTarget, string> = {
  local: "Local export",
  pr: "Pull request",
  "create-repo": "Create repository",
};

export const ApplyScreen = () => {
  const publisherActions = useStore((state) => state.publisherActions);
  const publishTarget = useStore((state) => state.publishTarget);
  const setPublishTarget = useStore((state) => state.setPublishTarget);
  const startSimulation = useStore((state) => state.startSimulation);
  const isSimulating = useStore((state) => state.isSimulating);

  return (
    <Card className="mt-6 p-4 border-cyan-500/30 bg-cyan-500/5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-cyan-200">Apply Plan</h3>
          <p className="text-xs text-zinc-400">
            Mapped publisher actions that will be executed against your
            repository.
          </p>
        </div>
        <Button
          variant="cyber"
          onClick={startSimulation}
          disabled={isSimulating}
        >
          <Rocket className="mr-2 h-4 w-4" />{" "}
          {isSimulating ? "Applying..." : "Run Publisher Actions"}
        </Button>
      </div>

      <div className="mb-3 flex items-center gap-2 text-xs">
        <label htmlFor="apply-target" className="text-zinc-300">
          Target
        </label>
        <select
          id="apply-target"
          className="rounded-md border border-white/20 bg-zinc-950/70 px-2 py-1 text-zinc-100"
          value={publishTarget}
          onChange={(event) =>
            setPublishTarget(event.target.value as PublishTarget)
          }
        >
          {(Object.keys(TARGET_LABELS) as PublishTarget[]).map((target) => (
            <option key={target} value={target}>
              {TARGET_LABELS[target]}
            </option>
          ))}
        </select>
      </div>

      <div className="max-h-56 space-y-2 overflow-y-auto text-xs">
        {publisherActions.map((action) => (
          <div
            key={action.id}
            className="flex items-center justify-between rounded border border-white/10 bg-zinc-950/50 px-3 py-2"
          >
            <div>
              <p className="text-zinc-100">{action.action}</p>
              <p className="text-zinc-500">{action.target}</p>
            </div>
            <span className="text-zinc-500">{action.sourceOperationId}</span>
          </div>
        ))}
      </div>
    </Card>
  );
};
