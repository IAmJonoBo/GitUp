import { ChangePlan, DesignSpec, SimulationLogEntry } from '../types';
import { compileRepoSpec } from './engine/compile-repospec';
import { materializeChangePlan } from './engine/materialize-changeplan';

export const SIMULATION_TICK_MS = 400;

export const compileDesignSpecToChangePlan = (designSpec: DesignSpec): ChangePlan =>
  materializeChangePlan(compileRepoSpec(designSpec));

export const renderChangePlanSimulationLog = (changePlan: ChangePlan): SimulationLogEntry[] =>
  changePlan.operations.map((operation) => ({
    id: operation.id,
    type: operation.type === 'create_file' ? 'file' : operation.type === 'complete' ? 'success' : 'info',
    message: operation.message,
    fileName: operation.target,
  }));

export const buildSimulationSteps = (designSpec: DesignSpec): SimulationLogEntry[] =>
  renderChangePlanSimulationLog(compileDesignSpecToChangePlan(designSpec));
