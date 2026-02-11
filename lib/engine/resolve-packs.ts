import { DesignSpec, RepoPackResolution } from '../spec';
import { CapabilityConflict, PackConflict, PackDefinition, PackEffects } from '../packs';
import { PACK_REGISTRY, deriveRequirementTags } from '../packs';

const sortRecord = (input: Record<string, string>): Record<string, string> =>
  Object.fromEntries(Object.entries(input).sort(([a], [b]) => a.localeCompare(b)));

const mergeRecords = (...records: Array<Record<string, string> | undefined>): Record<string, string> => {
  const merged: Record<string, string> = {};
  for (const record of records) {
    if (!record) continue;
    Object.assign(merged, record);
  }
  return merged;
};

const impactFromEffects = (effects: PackEffects): string[] => {
  const impact: string[] = [];
  if (effects.scripts && Object.keys(effects.scripts).length > 0) {
    impact.push(`scripts: ${Object.keys(effects.scripts).sort().join(', ')}`);
  }
  if (effects.dependencies && Object.keys(effects.dependencies).length > 0) {
    impact.push(`runtime deps: ${Object.keys(effects.dependencies).sort().join(', ')}`);
  }
  if (effects.devDependencies && Object.keys(effects.devDependencies).length > 0) {
    impact.push(`dev deps: ${Object.keys(effects.devDependencies).sort().join(', ')}`);
  }
  return impact;
};

const resolveEligiblePacks = (designSpec: DesignSpec): PackDefinition[] => {
  const requirementTags = deriveRequirementTags(designSpec);

  return PACK_REGISTRY.filter((pack) => pack.requirements.every((requirement) => requirementTags.has(requirement))).sort(
    (a, b) => b.priority - a.priority || a.id.localeCompare(b.id),
  );
};

type CapabilityCandidate = { pack: PackDefinition; effects: PackEffects; multiOwner: boolean };

const collectCapabilityOwnership = (eligiblePacks: PackDefinition[], designSpec: DesignSpec) => {
  const owners = new Map<string, CapabilityCandidate[]>();

  for (const pack of eligiblePacks) {
    const effects = pack.resolveEffects(designSpec);
    for (const capability of pack.capabilities) {
      const current = owners.get(capability.name) ?? [];
      current.push({ pack, effects, multiOwner: capability.multiOwner === true });
      owners.set(capability.name, current);
    }
  }

  return owners;
};

const addConflictEdge = (graph: Map<string, Set<string>>, a: string, b: string) => {
  if (!graph.has(a)) {
    graph.set(a, new Set());
  }
  graph.get(a)?.add(b);
};

const createConflictGraph = (eligiblePacks: PackDefinition[]): Map<string, Set<string>> => {
  const graph = new Map<string, Set<string>>();
  for (const pack of eligiblePacks) {
    for (const conflict of pack.conflicts) {
      addConflictEdge(graph, pack.id, conflict);
      addConflictEdge(graph, conflict, pack.id);
    }
  }
  return graph;
};

const resolveCapabilityConflicts = (
  owners: Map<string, CapabilityCandidate[]>,
  capabilityOwnerOverrides: Record<string, string> = {},
  conflictGraph: Map<string, Set<string>>,
): {
  selectedEffects: PackEffects[];
  capabilityOwners: Record<string, string[]>;
  capabilityConflicts: CapabilityConflict[];
  packConflicts: PackConflict[];
  selectedPacks: string[];
} => {
  const selectedPackIds = new Set<string>();
  const selectedPackEffects = new Map<string, PackEffects>();
  const selectedPackPriority = new Map<string, number>();
  const capabilityOwners: Record<string, string[]> = {};
  const capabilityConflicts: CapabilityConflict[] = [];
  const packConflicts: PackConflict[] = [];

  const capabilityOrder = [...owners.keys()].sort((a, b) => a.localeCompare(b));

  for (const capability of capabilityOrder) {
    const candidates = owners.get(capability) ?? [];
    if (candidates.length === 0) continue;

    const overriddenPackId = capabilityOwnerOverrides[capability];
    const sorted = [...candidates].sort((a, b) => {
      const aIsOverridden = a.pack.id === overriddenPackId;
      const bIsOverridden = b.pack.id === overriddenPackId;
      if (aIsOverridden !== bIsOverridden) return aIsOverridden ? -1 : 1;
      return b.pack.priority - a.pack.priority || a.pack.id.localeCompare(b.pack.id);
    });

    if (sorted.every((candidate) => candidate.multiOwner)) {
      const ownersForCapability: string[] = [];
      for (const candidate of sorted) {
        const conflictWithSelected = [...selectedPackIds].find((selectedPackId) =>
          conflictGraph.get(candidate.pack.id)?.has(selectedPackId),
        );
        if (conflictWithSelected) {
          const selectedEffects = selectedPackEffects.get(conflictWithSelected)!;
          const challengerEffects = candidate.effects;
          capabilityConflicts.push({
            capability,
            owner: {
              packId: conflictWithSelected,
              priority: selectedPackPriority.get(conflictWithSelected) ?? 0,
              effects: {
                scripts: selectedEffects.scripts,
                dependencies: selectedEffects.dependencies,
                devDependencies: selectedEffects.devDependencies,
              },
            },
            challenger: {
              packId: candidate.pack.id,
              priority: candidate.pack.priority,
              effects: {
                scripts: challengerEffects.scripts,
                dependencies: challengerEffects.dependencies,
                devDependencies: challengerEffects.devDependencies,
              },
            },
            downstreamImpact: `Keeping ${conflictWithSelected} retains compatibility and drops ${candidate.pack.id} due to declared pack conflicts.`,
          });
          packConflicts.push({
            winnerPackId: conflictWithSelected,
            droppedPackId: candidate.pack.id,
            reason: `${candidate.pack.id} conflicts with selected ${conflictWithSelected}.`,
          });
          continue;
        }

        ownersForCapability.push(candidate.pack.id);
        if (!selectedPackIds.has(candidate.pack.id)) {
          selectedPackIds.add(candidate.pack.id);
          selectedPackEffects.set(candidate.pack.id, candidate.effects);
          selectedPackPriority.set(candidate.pack.id, candidate.pack.priority);
        }
      }
      capabilityOwners[capability] = ownersForCapability;
      continue;
    }

    const owner = sorted.find(
      (candidate) => ![...selectedPackIds].some((selectedPackId) => conflictGraph.get(candidate.pack.id)?.has(selectedPackId)),
    );

    if (!owner) {
      capabilityOwners[capability] = [];
      for (const challenger of sorted) {
        const conflictingOwnerId = [...selectedPackIds].find((selectedPackId) =>
          conflictGraph.get(challenger.pack.id)?.has(selectedPackId),
        );
        if (!conflictingOwnerId) continue;
        const ownerEffects = selectedPackEffects.get(conflictingOwnerId)!;
        capabilityConflicts.push({
          capability,
          owner: {
            packId: conflictingOwnerId,
            priority: selectedPackPriority.get(conflictingOwnerId) ?? 0,
            effects: {
              scripts: ownerEffects.scripts,
              dependencies: ownerEffects.dependencies,
              devDependencies: ownerEffects.devDependencies,
            },
          },
          challenger: {
            packId: challenger.pack.id,
            priority: challenger.pack.priority,
            effects: {
              scripts: challenger.effects.scripts,
              dependencies: challenger.effects.dependencies,
              devDependencies: challenger.effects.devDependencies,
            },
          },
          downstreamImpact: `${challenger.pack.id} was dropped because it conflicts with already selected ${conflictingOwnerId}.`,
        });
        packConflicts.push({
          winnerPackId: conflictingOwnerId,
          droppedPackId: challenger.pack.id,
          reason: `${challenger.pack.id} conflicts with selected ${conflictingOwnerId}.`,
        });
      }
      continue;
    }

    capabilityOwners[capability] = [owner.pack.id];

    if (!selectedPackIds.has(owner.pack.id)) {
      selectedPackIds.add(owner.pack.id);
      selectedPackEffects.set(owner.pack.id, owner.effects);
      selectedPackPriority.set(owner.pack.id, owner.pack.priority);
    }

    for (const challenger of sorted) {
      if (challenger.pack.id === owner.pack.id || challenger.multiOwner) continue;
      const blockedByConflict = conflictGraph.get(challenger.pack.id)?.has(owner.pack.id) ?? false;
      const ownerImpact = impactFromEffects(owner.effects);
      const challengerImpact = impactFromEffects(challenger.effects);
      const reason = blockedByConflict
        ? `${challenger.pack.id} conflicts with selected owner ${owner.pack.id}.`
        : `Keeping ${owner.pack.id} retains ${ownerImpact.join('; ') || 'no downstream changes'} and drops ${challenger.pack.id} changes (${challengerImpact.join('; ') || 'no downstream changes'}).`;
      capabilityConflicts.push({
        capability,
        owner: {
          packId: owner.pack.id,
          priority: owner.pack.priority,
          effects: {
            scripts: owner.effects.scripts,
            dependencies: owner.effects.dependencies,
            devDependencies: owner.effects.devDependencies,
          },
        },
        challenger: {
          packId: challenger.pack.id,
          priority: challenger.pack.priority,
          effects: {
            scripts: challenger.effects.scripts,
            dependencies: challenger.effects.dependencies,
            devDependencies: challenger.effects.devDependencies,
          },
        },
        downstreamImpact: reason,
      });

      if (blockedByConflict) {
        packConflicts.push({
          winnerPackId: owner.pack.id,
          droppedPackId: challenger.pack.id,
          reason,
        });
      }
    }
  }

  return {
    selectedEffects: [...selectedPackIds].map((packId) => selectedPackEffects.get(packId)!).filter(Boolean),
    capabilityOwners,
    capabilityConflicts,
    packConflicts,
    selectedPacks: [...selectedPackIds].sort(),
  };
};

export const resolvePacks = (
  designSpec: DesignSpec,
  options?: { capabilityOwnerOverrides?: Record<string, string> },
): RepoPackResolution => {
  const eligiblePacks = resolveEligiblePacks(designSpec);
  const owners = collectCapabilityOwnership(eligiblePacks, designSpec);
  const conflictGraph = createConflictGraph(eligiblePacks);
  const resolved = resolveCapabilityConflicts(owners, options?.capabilityOwnerOverrides ?? {}, conflictGraph);

  const scripts = sortRecord(mergeRecords(...resolved.selectedEffects.map((effects) => effects.scripts)));
  const dependencies = sortRecord(mergeRecords(...resolved.selectedEffects.map((effects) => effects.dependencies)));
  const devDependencies = sortRecord(mergeRecords(...resolved.selectedEffects.map((effects) => effects.devDependencies)));

  return {
    scripts,
    dependencies,
    devDependencies,
    selectedPacks: resolved.selectedPacks,
    capabilityOwners: Object.fromEntries(Object.entries(resolved.capabilityOwners).sort(([a], [b]) => a.localeCompare(b))),
    capabilityConflicts: resolved.capabilityConflicts,
    packConflicts: resolved.packConflicts,
  };
};
