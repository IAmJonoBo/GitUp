import React from 'react';
import { useStore } from '../../store';
import { Button, Card } from '../ui/primitives';
import { Rocket } from 'lucide-react';

export const ApplyScreen = () => {
  const { publisherActions, startSimulation, isSimulating } = useStore();

  return (
    <Card className="mt-6 p-4 border-cyan-500/30 bg-cyan-500/5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-cyan-200">Apply Plan</h3>
          <p className="text-xs text-zinc-400">Mapped publisher actions that will be executed against your repository.</p>
        </div>
        <Button variant="cyber" onClick={startSimulation} disabled={isSimulating}>
          <Rocket className="w-4 h-4 mr-2" /> {isSimulating ? 'Applying...' : 'Run Publisher Actions'}
        </Button>
      </div>

      <div className="max-h-56 overflow-y-auto space-y-2 text-xs">
        {publisherActions.map((action) => (
          <div key={action.id} className="flex items-center justify-between rounded border border-white/10 bg-zinc-950/50 px-3 py-2">
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
