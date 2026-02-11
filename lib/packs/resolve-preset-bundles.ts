import { PlanConfigPatch } from '../../types';
import { PRESET_BUNDLES, getPresetBundlesByIds } from './preset-bundles';

const mergePatch = (base: PlanConfigPatch, updates: PlanConfigPatch): PlanConfigPatch => ({
  ...base,
  ...updates,
  basics: {
    ...(base.basics ?? {}),
    ...(updates.basics ?? {}),
  },
  github: {
    ...(base.github ?? {}),
    ...(updates.github ?? {}),
    features: {
      ...(base.github?.features ?? {}),
      ...(updates.github?.features ?? {}),
    },
    pr: {
      ...(base.github?.pr ?? {}),
      ...(updates.github?.pr ?? {}),
    },
    branches: {
      ...(base.github?.branches ?? {}),
      ...(updates.github?.branches ?? {}),
      protection: {
        ...(base.github?.branches?.protection ?? {}),
        ...(updates.github?.branches?.protection ?? {}),
      },
    },
    actions: {
      ...(base.github?.actions ?? {}),
      ...(updates.github?.actions ?? {}),
    },
  },
  stack: {
    ...(base.stack ?? {}),
    ...(updates.stack ?? {}),
  },
  quality: {
    ...(base.quality ?? {}),
    ...(updates.quality ?? {}),
  },
  ci: {
    ...(base.ci ?? {}),
    ...(updates.ci ?? {}),
  },
  security: {
    ...(base.security ?? {}),
    ...(updates.security ?? {}),
  },
  docs: {
    ...(base.docs ?? {}),
    ...(updates.docs ?? {}),
  },
});

export const resolvePresetBundlesToPatch = (bundleIds: string[]): PlanConfigPatch => {
  const bundles = getPresetBundlesByIds(bundleIds);
  return bundles.reduce<PlanConfigPatch>((patch, bundle) => mergePatch(patch, bundle.config), {});
};

export const findPresetBundle = (bundleId: string) => PRESET_BUNDLES.find((bundle) => bundle.id === bundleId);
