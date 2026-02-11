import { create } from 'zustand';
import { ChangePlan, DesignSpec, PlanConfig, PlanConfigPatch, Preset, RepoSpec, SimulationLogEntry } from './types';
import { FINAL_WIZARD_STEP, applyPresetConfig, createDefaultPlanConfig, mergePlanConfig } from './lib/plan-config';
import { SIMULATION_TICK_MS, compileDesignSpecToChangePlan, renderChangePlanSimulationLog } from './lib/simulation';
import { compileRepoSpec } from './lib/engine/compile-repospec';

export type UserMode = 'basic' | 'power';
export type AppView = 'wizard' | 'presets' | 'settings' | 'help' | 'export';

interface AppState {
  step: number;
  maxStepVisited: number;
  designSpec: DesignSpec;
  repoSpec: RepoSpec;
  changePlan: ChangePlan;
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
  setStep: (step: number) => void;
  setUserMode: (mode: UserMode) => void;
  setCurrentView: (view: AppView) => void;
  toggleMobilePreview: (isOpen: boolean) => void;
  updateConfig: (updates: PlanConfigPatch) => void;
  startSimulation: () => void;
  reset: () => void;
  applyPreset: (config: PlanConfigPatch) => void;
  addCustomPreset: (preset: Preset) => void;
  deleteCustomPreset: (id: string) => void;
  setTheme: (theme: 'dark' | 'light') => void;
  setReducedMotion: (enabled: boolean) => void;
}

let simulationTimer: ReturnType<typeof setInterval> | null = null;

const clearSimulationTimer = () => {
  if (!simulationTimer) return;
  clearInterval(simulationTimer);
  simulationTimer = null;
};

const createCompiledState = (designSpec: DesignSpec) => ({
  designSpec,
  config: designSpec,
  repoSpec: compileRepoSpec(designSpec),
  changePlan: compileDesignSpecToChangePlan(designSpec),
});

const createInitialState = () => createCompiledState(createDefaultPlanConfig());

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

  setStep: (step) =>
    set((state) => ({
      step,
      maxStepVisited: Math.max(state.maxStepVisited, step),
    })),
  setUserMode: (mode) => set({ userMode: mode }),
  setCurrentView: (view) => set({ currentView: view }),
  toggleMobilePreview: (isOpen) => set({ mobilePreviewOpen: isOpen }),

  updateConfig: (updates) =>
    set((state) => createCompiledState(mergePlanConfig(state.designSpec, updates))),

  applyPreset: (presetConfig) =>
    set(() => ({
      ...createCompiledState(applyPresetConfig(presetConfig)),
      currentView: 'wizard',
      step: FINAL_WIZARD_STEP,
      maxStepVisited: FINAL_WIZARD_STEP,
    })),

  startSimulation: () => {
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
      isSimulating: false,
      simulationLog: [],
      currentView: 'wizard',
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
}));
