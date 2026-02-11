import { DesignSpec, RepoPackResolution } from '../spec';
import { CapabilityConflict, PackDefinition, PackEffects } from '../packs';
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

const collectCapabilityOwnership = (eligiblePacks: PackDefinition[], designSpec: DesignSpec) => {
  const owners = new Map<string, Array<{ pack: PackDefinition; effects: PackEffects; multiOwner: boolean }>>();

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

const resolveCapabilityConflicts = (
  owners: Map<string, Array<{ pack: PackDefinition; effects: PackEffects; multiOwner: boolean }>>,
  capabilityOwnerOverrides: Record<string, string> = {},
): {
  selectedEffects: PackEffects[];
  capabilityOwners: Record<string, string[]>;
  capabilityConflicts: CapabilityConflict[];
  selectedPacks: string[];
} => {
  const selectedEffects: PackEffects[] = [];
  const selectedPackIds = new Set<string>();
  const capabilityOwners: Record<string, string[]> = {};
  const capabilityConflicts: CapabilityConflict[] = [];

  for (const [capability, candidates] of owners.entries()) {
    const sorted = [...candidates].sort((a, b) => b.pack.priority - a.pack.priority || a.pack.id.localeCompare(b.pack.id));

    if (sorted.length === 0) continue;

    if (sorted.every((candidate) => candidate.multiOwner)) {
      capabilityOwners[capability] = sorted.map((candidate) => candidate.pack.id);
      for (const candidate of sorted) {
        if (!selectedPackIds.has(candidate.pack.id)) {
          selectedEffects.push(candidate.effects);
          selectedPackIds.add(candidate.pack.id);
        }
      }
      continue;
    }

    const overriddenPackId = capabilityOwnerOverrides[capability];
    const owner = sorted.find((candidate) => candidate.pack.id === overriddenPackId) ?? sorted[0];
    capabilityOwners[capability] = [owner.pack.id];

    if (!selectedPackIds.has(owner.pack.id)) {
      selectedEffects.push(owner.effects);
      selectedPackIds.add(owner.pack.id);
    }

    for (const challenger of sorted.slice(1)) {
      if (challenger.multiOwner) continue;
      const ownerImpact = impactFromEffects(owner.effects);
      const challengerImpact = impactFromEffects(challenger.effects);
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
        downstreamImpact: `Keeping ${owner.pack.id} retains ${ownerImpact.join('; ') || 'no downstream changes'} and drops ${challenger.pack.id} changes (${challengerImpact.join('; ') || 'no downstream changes'}).`,
      });
    }
  }

  return {
    selectedEffects,
    capabilityOwners,
    capabilityConflicts,
    selectedPacks: [...selectedPackIds].sort(),
  };
};

export const resolvePacks = (
  designSpec: DesignSpec,
  options?: { capabilityOwnerOverrides?: Record<string, string> },
): RepoPackResolution => {
  const eligiblePacks = resolveEligiblePacks(designSpec);
  const owners = collectCapabilityOwnership(eligiblePacks, designSpec);
  const resolved = resolveCapabilityConflicts(owners, options?.capabilityOwnerOverrides ?? {});

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
  };
};
