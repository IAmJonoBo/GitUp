import { DesignSpec, PlanConfigPatch } from '../../types';

export interface PackCapability {
  name: string;
  multiOwner?: boolean;
}

export interface PackEffects {
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  presetPatch?: PlanConfigPatch;
}

export interface PackDefinition {
  id: string;
  title: string;
  requirements: string[];
  conflicts: string[];
  capabilities: PackCapability[];
  priority: number;
  resolveEffects: (designSpec: DesignSpec) => PackEffects;
}

export interface CapabilityConflictCandidate {
  packId: string;
  priority: number;
  effects: PackEffects;
}

export interface CapabilityConflict {
  capability: string;
  owner: CapabilityConflictCandidate;
  challenger: CapabilityConflictCandidate;
  downstreamImpact: string;
}

export interface PackConflict {
  winnerPackId: string;
  droppedPackId: string;
  reason: string;
}
