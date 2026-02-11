import { create } from 'zustand';
import { ChangePlan, ChangePlanDiff, DesignSpec, EngineDecisionPayload, PlanConfig, PlanConfigPatch, Preset, PublisherAction, RepoSpec, SimulationLogEntry } from './types';
import { resolvePresetBundlesToPatch } from './lib/packs';
import { FINAL_WIZARD_STEP, applyPresetConfig, createDefaultPlanConfig, mergePlanConfig } from './lib/plan-config';
import { SIMULATION_TICK_MS, buildChangePlanDiff, compileDesignSpecToChangePlan, createEngineDecisionPayloads, mapChangePlanToPublisherActions, renderChangePlanSimulationLog } from './lib/simulation';
import { compileRepoSpec } from './lib/engine/compile-repospec';

export type UserMode = 'basic' | 'power';
export type AppView = 'wizard' | 'presets' | 'settings' | 'help' | 'export';
export type WorkflowPhase = 'preview' | 'diff' | 'explain' | 'apply';



interface DiffPromptReason {
  key: 'preset' | 'stack' | 'visibility' | 'security';
  label: string;
}

interface AppState {
  step: number;
  maxStepVisited: number;
  designSpec: DesignSpec;
  repoSpec: RepoSpec;
  changePlan: ChangePlan;
  previousChangePlan: ChangePlan;
  pendingDiff: ChangePlanDiff | null;
  diffPromptReason: DiffPromptReason | null;
  workflowPhase: WorkflowPhase;
  engineDecisions: EngineDecisionPayload[];
  publisherActions: PublisherAction[];
  // Backward compatibility for current UI until all consumers migrate.
  config: PlanConfig;
  userMode: UserMode;
  currentView: AppView;
  isSimulating: boolean;
  simulationLog: SimulationLogEntry[];
  mobilePreviewOpen: boolean;
  customPresets: Preset[];
  theme: 'dark' | 'light';
  reducedMotion: boolean;
  capabilityOwnerOverrides: Record<string, string>;
  setStep: (step: number) => void;
  setUserMode: (mode: UserMode) => void;
  setCurrentView: (view: AppView) => void;
  setWorkflowPhase: (phase: WorkflowPhase) => void;
  confirmDiffInterstitial: () => void;
  toggleMobilePreview: (isOpen: boolean) => void;
  updateConfig: (updates: PlanConfigPatch) => void;
  startSimulation: () => void;
  reset: () => void;
  applyPreset: (preset: { config?: PlanConfigPatch; bundleIds?: string[] }) => void;
  addCustomPreset: (preset: Preset) => void;
  deleteCustomPreset: (id: string) => void;
  setTheme: (theme: 'dark' | 'light') => void;
  setReducedMotion: (enabled: boolean) => void;
  resolveCapabilityConflict: (capability: string, ownerPackId: string) => void;
}

let simulationTimer: ReturnType<typeof setInterval> | null = null;

const clearSimulationTimer = () => {
  if (!simulationTimer) return;
  clearInterval(simulationTimer);
  simulationTimer = null;
};

const createCompiledState = (
  designSpec: DesignSpec,
  previousPlan?: ChangePlan,
  userMode: UserMode = 'basic',
  capabilityOwnerOverrides: Record<string, string> = {},
) => {
  const repoSpec = compileRepoSpec(designSpec, { capabilityOwnerOverrides });
  const changePlan = compileDesignSpecToChangePlan(designSpec, { capabilityOwnerOverrides });

  return {
    designSpec,
    config: designSpec,
    repoSpec,
    changePlan,
    previousChangePlan: previousPlan ?? changePlan,
    pendingDiff: previousPlan ? buildChangePlanDiff(previousPlan, changePlan) : null,
    engineDecisions: createEngineDecisionPayloads(designSpec, repoSpec, changePlan),
    publisherActions: mapChangePlanToPublisherActions(designSpec, repoSpec, changePlan, { userMode }),
  };
};

const createInitialState = () => createCompiledState(createDefaultPlanConfig(), undefined, 'basic', {});

export const useStore = create<AppState>((set, get) => ({
  ...createInitialState(),
  step: 0,
  maxStepVisited: 0,
  userMode: 'basic',
  currentView: 'wizard',
  isSimulating: false,
  simulationLog: [],
  mobilePreviewOpen: false,
  customPresets: [],
  theme: 'dark',
  reducedMotion: false,
  capabilityOwnerOverrides: {},
  workflowPhase: 'preview',

  setStep: (step) =>
    set((state) => ({
      step,
      maxStepVisited: Math.max(state.maxStepVisited, step),
    })),
  setUserMode: (mode) =>
    set((state) => ({
      userMode: mode,
      publisherActions: mapChangePlanToPublisherActions(state.designSpec, state.repoSpec, state.changePlan, { userMode: mode }),
    })),
  setCurrentView: (view) => set({ currentView: view }),
  setWorkflowPhase: (phase) => set({ workflowPhase: phase }),
  confirmDiffInterstitial: () => set({ workflowPhase: 'explain', pendingDiff: null, diffPromptReason: null }),
  toggleMobilePreview: (isOpen) => set({ mobilePreviewOpen: isOpen }),

  updateConfig: (updates) =>
    set((state) => {
      const nextSpec = mergePlanConfig(state.designSpec, updates);
      const compiled = createCompiledState(nextSpec, state.changePlan, state.userMode, state.capabilityOwnerOverrides);
      const reason =
        updates.visibility !== undefined
          ? { key: 'visibility' as const, label: 'repository visibility' }
          : updates.security !== undefined
            ? { key: 'security' as const, label: 'security posture' }
            : updates.stack !== undefined
              ? { key: 'stack' as const, label: 'language/stack' }
              : null;

      return {
        ...compiled,
        workflowPhase: reason && (compiled.pendingDiff?.added.length || compiled.pendingDiff?.removed.length) ? 'diff' : state.workflowPhase,
        diffPromptReason: reason && (compiled.pendingDiff?.added.length || compiled.pendingDiff?.removed.length) ? reason : state.diffPromptReason,
      };
    }),

  applyPreset: (preset) =>
    set((state) => {
      const bundlePatch = resolvePresetBundlesToPatch(preset.bundleIds ?? []);
      const presetPatch = { ...bundlePatch, ...(preset.config ?? {}) };
      const compiled = createCompiledState(applyPresetConfig(presetPatch), state.changePlan, state.userMode, state.capabilityOwnerOverrides);
      const hasDiff = Boolean(compiled.pendingDiff?.added.length || compiled.pendingDiff?.removed.length);

      return {
        ...compiled,
        currentView: 'wizard',
        step: FINAL_WIZARD_STEP,
        maxStepVisited: FINAL_WIZARD_STEP,
        workflowPhase: hasDiff ? 'diff' : state.workflowPhase,
        diffPromptReason: hasDiff ? { key: 'preset', label: 'preset selection' } : state.diffPromptReason,
      };
    }),

  startSimulation: () => {
    set({ workflowPhase: 'apply' });
    clearSimulationTimer();
    const steps = renderChangePlanSimulationLog(get().changePlan);
    set({ isSimulating: true, simulationLog: [] });

    let index = 0;
    simulationTimer = setInterval(() => {
      set((state) => {
        if (index >= steps.length) {
          clearSimulationTimer();
          return state.isSimulating ? { isSimulating: false } : {};
        }

        const nextLog = steps[index];
        index += 1;
        return { simulationLog: [...state.simulationLog, nextLog] };
      });
    }, SIMULATION_TICK_MS);
  },

  reset: () => {
    clearSimulationTimer();
    set({
      step: 0,
      maxStepVisited: 0,
      ...createInitialState(),
      workflowPhase: 'preview',
      pendingDiff: null,
      diffPromptReason: null,
      isSimulating: false,
      simulationLog: [],
      currentView: 'wizard',
      capabilityOwnerOverrides: {},
    });
  },

  addCustomPreset: (preset) =>
    set((state) => ({
      customPresets: [...state.customPresets, preset],
    })),
  deleteCustomPreset: (id) =>
    set((state) => ({
      customPresets: state.customPresets.filter((preset) => preset.id !== id),
    })),

  setTheme: (theme) => set({ theme }),
  setReducedMotion: (enabled) => set({ reducedMotion: enabled }),

  resolveCapabilityConflict: (capability, ownerPackId) =>
    set((state) => {
      const capabilityOwnerOverrides = {
        ...state.capabilityOwnerOverrides,
        [capability]: ownerPackId,
      };
      const compiled = createCompiledState(state.designSpec, state.changePlan, state.userMode, capabilityOwnerOverrides);

      return {
        ...compiled,
        capabilityOwnerOverrides,
      };
    }),


}));
