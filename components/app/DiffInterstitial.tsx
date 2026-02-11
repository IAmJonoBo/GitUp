import React from 'react';
import { useStore } from '../../store';
import { Button, Card } from '../ui/primitives';
import { ArrowRightLeft } from 'lucide-react';

export const DiffInterstitial = () => {
  const pendingDiff = useStore((state) => state.pendingDiff);
  const diffPromptReason = useStore((state) => state.diffPromptReason);
  const confirmDiffInterstitial = useStore((state) => state.confirmDiffInterstitial);
  const setWorkflowPhase = useStore((state) => state.setWorkflowPhase);

  if (!pendingDiff || (!pendingDiff.added.length && !pendingDiff.removed.length)) {
    return null;
  }

  return (
    <div className="mb-6">
      <Card className="border-amber-500/30 bg-amber-500/5 p-4 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-amber-200 font-semibold flex items-center gap-2">
              <ArrowRightLeft className="w-4 h-4" /> Review plan changes before continuing
            </p>
            <p className="text-xs text-zinc-400 mt-1">
              Triggered by {diffPromptReason?.label ?? 'configuration update'}.
            </p>
          </div>
          <div className="flex gap-2 text-xs">
            <span className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">+{pendingDiff.added.length}</span>
            <span className="px-2 py-1 rounded bg-rose-500/10 text-rose-300 border border-rose-500/30">-{pendingDiff.removed.length}</span>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <p className="text-xs uppercase text-emerald-300 mb-2">Added operations</p>
            <ul className="text-xs text-zinc-300 space-y-1">
              {pendingDiff.added.slice(0, 6).map((operation) => (
                <li key={operation.id}>• {operation.message}</li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-xs uppercase text-rose-300 mb-2">Removed operations</p>
            <ul className="text-xs text-zinc-300 space-y-1">
              {pendingDiff.removed.slice(0, 6).map((operation) => (
                <li key={operation.id}>• {operation.message}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setWorkflowPhase('preview')}>
            Stay in preview
          </Button>
          <Button variant="cyber" onClick={confirmDiffInterstitial}>
            Accept diff
          </Button>
        </div>
      </Card>
    </div>
  );
};
