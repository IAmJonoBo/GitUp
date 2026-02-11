import React from 'react';
import { ArrowLeftRight, AlertTriangle } from 'lucide-react';
import { Badge, Button, Card } from '../ui/primitives';
import { useStore } from '../../store';

const renderEffectDiff = (label: string, left?: Record<string, string>, right?: Record<string, string>) => {
  const leftEntries = Object.entries(left ?? {});
  const rightEntries = Object.entries(right ?? {});

  if (leftEntries.length === 0 && rightEntries.length === 0) {
    return null;
  }

  return (
    <div>
      <h5 className="text-xs uppercase tracking-wide text-zinc-500 mb-2">{label}</h5>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-900/10 p-2">
          {leftEntries.length === 0 ? (
            <p className="text-xs text-zinc-500">No changes</p>
          ) : (
            leftEntries.sort(([a], [b]) => a.localeCompare(b)).map(([key, value]) => (
              <div key={key} className="text-xs text-zinc-200 flex justify-between gap-2">
                <code>{key}</code>
                <span className="text-zinc-400">{value}</span>
              </div>
            ))
          )}
        </div>
        <div className="rounded-lg border border-rose-500/20 bg-rose-900/10 p-2">
          {rightEntries.length === 0 ? (
            <p className="text-xs text-zinc-500">No changes</p>
          ) : (
            rightEntries.sort(([a], [b]) => a.localeCompare(b)).map(([key, value]) => (
              <div key={key} className="text-xs text-zinc-200 flex justify-between gap-2">
                <code>{key}</code>
                <span className="text-zinc-400">{value}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export const ConflictResolutionPanel = () => {
  const repoSpec = useStore((state) => state.repoSpec);
  const resolveCapabilityConflict = useStore((state) => state.resolveCapabilityConflict);
  const capabilityOwnerOverrides = useStore((state) => state.capabilityOwnerOverrides);
  const conflicts = repoSpec.packs.capabilityConflicts;

  if (conflicts.length === 0) {
    return null;
  }

  return (
    <Card className="bg-zinc-950 border border-amber-500/20 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          <h4 className="font-semibold text-sm text-zinc-100">Pack conflict resolution</h4>
        </div>
        <Badge variant="outline" className="border-amber-500/30 text-amber-300">{conflicts.length} collision{conflicts.length === 1 ? '' : 's'}</Badge>
      </div>

      {conflicts.map((conflict) => {
        const overridden = capabilityOwnerOverrides[conflict.capability];
        const ownerIsOverridden = overridden === conflict.challenger.packId;
        const activeOwner = ownerIsOverridden ? conflict.challenger : conflict.owner;
        const inactive = ownerIsOverridden ? conflict.owner : conflict.challenger;

        return (
          <div key={`${conflict.capability}-${conflict.challenger.packId}`} className="border border-white/10 rounded-lg p-3 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-100">{conflict.capability}</p>
                <p className="text-xs text-zinc-500">Single-owner capability; pick one pack to keep ownership.</p>
              </div>
              <div className="flex gap-2">
                <Badge variant="outline" className="border-emerald-500/20 text-emerald-300">Owner: {activeOwner.packId}</Badge>
                <Badge variant="outline" className="border-zinc-700 text-zinc-300">Priority {activeOwner.priority}</Badge>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="rounded-lg border border-emerald-500/20 bg-emerald-900/5 p-3">
                <p className="text-xs uppercase tracking-wide text-emerald-300 mb-2">Active ({activeOwner.packId})</p>
                <Button
                  size="sm"
                  variant="ghost"
                  className="w-full border border-emerald-500/20 mb-2"
                  onClick={() => resolveCapabilityConflict(conflict.capability, activeOwner.packId)}
                >
                  Keep active owner
                </Button>
              </div>
              <div className="rounded-lg border border-zinc-700 bg-zinc-900/60 p-3">
                <p className="text-xs uppercase tracking-wide text-zinc-300 mb-2">Alternative ({inactive.packId})</p>
                <Button
                  size="sm"
                  variant="ghost"
                  className="w-full border border-zinc-700 mb-2"
                  onClick={() => resolveCapabilityConflict(conflict.capability, inactive.packId)}
                >
                  <ArrowLeftRight className="w-3 h-3 mr-2" />
                  Release ownership to {inactive.packId}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              {renderEffectDiff('Scripts', activeOwner.effects.scripts, inactive.effects.scripts)}
              {renderEffectDiff('Dependencies', activeOwner.effects.dependencies, inactive.effects.dependencies)}
              {renderEffectDiff('Dev dependencies', activeOwner.effects.devDependencies, inactive.effects.devDependencies)}
            </div>

            <p className="text-xs text-zinc-400">{conflict.downstreamImpact}</p>
          </div>
        );
      })}
    </Card>
  );
};
