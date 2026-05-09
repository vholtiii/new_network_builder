import { create } from 'zustand'
import { createDefaultProject } from '../domain/defaultProject'
import type { DatasetSchema } from '../domain/datasetSchema'
import {
  applyHiddenStackPreset as replaceHiddenStackFromPreset,
  type HiddenStackPresetId,
  wizardStepTab,
  WIZARD_STEP_COUNT,
  type WizardStepIndex,
} from '../domain/guidedWizard'
import type { Layer } from '../domain/networkGraph'
import { parseProjectFile, type CohortScenario, type ProjectFile } from '../domain/projectFile'
import type { SyntheticRow } from '../domain/synthetic'
import type { OutcomeRow } from '../domain/simulator'

const BEGINNER_MODE_STORAGE_KEY = 'bb-beginner-mode'
const GUIDED_WIZARD_STORAGE_KEY = 'bb-guided-wizard'

function readGuidedWizardEnabledFromStorage(): boolean {
  try {
    return localStorage.getItem(GUIDED_WIZARD_STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

function readBeginnerModeFromStorage(): boolean {
  try {
    const v = localStorage.getItem(BEGINNER_MODE_STORAGE_KEY)
    if (v === 'true') return true
    if (v === 'false') return false
  } catch {
    /* ignore */
  }
  return false
}

export type WorkspaceTab = 'builder' | 'data' | 'results' | 'present'

export type { WizardStepIndex } from '../domain/guidedWizard'

type ProjectState = {
  project: ProjectFile
  tab: WorkspaceTab
  selectedLayerId: string | null
  generatedRows: SyntheticRow[]
  outcomes: OutcomeRow[]
  activeFlowStep: number
  presentationMode: boolean
  beginnerMode: boolean
  predictionsAcknowledged: boolean
  guidedWizardEnabled: boolean
  wizardStepIndex: WizardStepIndex
  cohortGenerateAck: boolean
  hiddenStackPresetApplied: boolean
  feasibilityReviewAck: boolean
  setTab: (tab: WorkspaceTab) => void
  setProject: (project: ProjectFile) => void
  importFromJsonText: (json: string) => void
  exportProjectJson: () => string
  updateDatasetSchema: (schema: DatasetSchema) => void
  updateDeclarations: (partial: Partial<ProjectFile['feasibilityDeclarations']>) => void
  updateGeneration: (partial: Partial<ProjectFile['generationSettings']>) => void
  updateCohortScenario: (partial: Partial<CohortScenario>) => void
  replaceTreatmentPhaseWeights: (weights: Record<string, number>) => void
  suggestPresentationModelWiring: () => void
  updateTheme: (partial: Partial<ProjectFile['themeTokens']>) => void
  updateTraining: (partial: NonNullable<ProjectFile['training']>) => void
  toggleAiAssist: (enabled: boolean) => void
  updateNetworkMeta: (partial: Partial<NonNullable<ProjectFile['network']['metadata']>>) => void
  setLayers: (layers: Layer[]) => void
  updateLayer: (id: string, layer: Layer) => void
  addLayer: (layer: Layer) => void
  removeLayer: (id: string) => void
  moveLayer: (id: string, direction: -1 | 1) => void
  selectLayer: (id: string | null) => void
  setGeneratedRows: (rows: SyntheticRow[]) => void
  setOutcomes: (rows: OutcomeRow[]) => void
  setActiveFlowStep: (idx: number) => void
  setPresentationMode: (v: boolean) => void
  setBeginnerMode: (v: boolean) => void
  acknowledgePredictions: () => void
  setGuidedWizardEnabled: (enabled: boolean) => void
  setWizardStepIndex: (idx: WizardStepIndex) => void
  advanceWizardStep: () => void
  retreatWizardStep: () => void
  acknowledgeCohortGeneration: () => void
  setFeasibilityReviewAck: (v: boolean) => void
  applyWizardHiddenPreset: (presetId: HiddenStackPresetId) => void
}

function insertBeforeOutput(layers: Layer[], layer: Layer): Layer[] {
  const outIdx = layers.findIndex((l) => l.type === 'output')
  if (outIdx === -1) return [...layers.slice(0, -0), layer]
  const next = [...layers]
  next.splice(outIdx, 0, layer)
  return next
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  project: createDefaultProject(),
  tab: readGuidedWizardEnabledFromStorage() ? wizardStepTab(0) : 'builder',
  selectedLayerId: null,
  generatedRows: [],
  outcomes: [],
  activeFlowStep: 0,
  presentationMode: false,
  beginnerMode: readBeginnerModeFromStorage(),
  predictionsAcknowledged: false,
  guidedWizardEnabled: readGuidedWizardEnabledFromStorage(),
  wizardStepIndex: 0,
  cohortGenerateAck: false,
  hiddenStackPresetApplied: false,
  feasibilityReviewAck: false,

  setTab: (tab) => set({ tab }),

  setProject: (project) => set({ project }),

  importFromJsonText: (json) => {
    const parsed = parseProjectFile(JSON.parse(json))
    set((state) => ({
      project: parsed,
      generatedRows: [],
      outcomes: [],
      cohortGenerateAck: false,
      hiddenStackPresetApplied: false,
      feasibilityReviewAck: false,
      tab: state.guidedWizardEnabled ? wizardStepTab(state.wizardStepIndex) : state.tab,
    }))
  },

  exportProjectJson: () => JSON.stringify(get().project, null, 2),

  updateDatasetSchema: (datasetSchema) =>
    set((state) => ({ project: { ...state.project, datasetSchema } })),

  updateDeclarations: (partial) =>
    set((state) => ({
      project: {
        ...state.project,
        feasibilityDeclarations: { ...state.project.feasibilityDeclarations, ...partial },
      },
    })),

  updateGeneration: (partial) =>
    set((state) => {
      const prevGs = state.project.generationSettings
      const { cohortScenario: partialCs, ...rest } = partial

      let cohortScenario = prevGs.cohortScenario
      if (partialCs !== undefined) {
        cohortScenario = {
          ...(cohortScenario ?? {}),
          ...partialCs,
          ...(partialCs.treatmentPhaseWeights !== undefined
            ? {
                treatmentPhaseWeights: {
                  ...(cohortScenario?.treatmentPhaseWeights ?? {}),
                  ...partialCs.treatmentPhaseWeights,
                },
              }
            : {}),
        }
      }

      const nextGs: ProjectFile['generationSettings'] = {
        ...prevGs,
        ...rest,
        ...(partialCs !== undefined ? { cohortScenario } : {}),
      }

      return {
        project: {
          ...state.project,
          generationSettings: nextGs,
        },
      }
    }),

  updateCohortScenario: (partial) =>
    set((state) => {
      const prev = state.project.generationSettings.cohortScenario ?? {}
      const merged: CohortScenario = {
        ...prev,
        ...partial,
        ...(partial.treatmentPhaseWeights !== undefined
          ? {
              treatmentPhaseWeights: {
                ...(prev.treatmentPhaseWeights ?? {}),
                ...partial.treatmentPhaseWeights,
              },
            }
          : {}),
      }
      return {
        project: {
          ...state.project,
          generationSettings: {
            ...state.project.generationSettings,
            cohortScenario: merged,
          },
        },
      }
    }),

  replaceTreatmentPhaseWeights: (treatmentPhaseWeights) =>
    set((state) => ({
      project: {
        ...state.project,
        generationSettings: {
          ...state.project.generationSettings,
          cohortScenario: {
            ...(state.project.generationSettings.cohortScenario ?? {}),
            treatmentPhaseWeights: { ...treatmentPhaseWeights },
          },
        },
      },
    })),

  suggestPresentationModelWiring: () =>
    set((state) => {
      const schema = state.project.datasetSchema
      let layers = [...state.project.network.layers]
      const inIdx = layers.findIndex((l) => l.type === 'input')
      if (inIdx === -1) return state
      const inp = layers[inIdx] as Extract<Layer, { type: 'input' }>
      const presentationScalars = ['age', 'sex', 'relapse_flag'].filter((id) =>
        schema.columns.some(
          (c) =>
            c.id === id &&
            (c.type === 'numeric' || c.type === 'binary' || c.type === 'ordinal'),
        ),
      )
      const scalarColumnIds = [...new Set([...inp.scalarColumnIds, ...presentationScalars])].filter((id) =>
        schema.columns.some(
          (c) =>
            c.id === id &&
            (c.type === 'numeric' || c.type === 'binary' || c.type === 'ordinal'),
        ),
      )
      if (scalarColumnIds.length === 0) return state
      layers[inIdx] = { ...inp, scalarColumnIds }

      for (const colId of ['cohort_site', 'tx_phase'] as const) {
        const col = schema.columns.find((c) => c.id === colId && c.type === 'categorical')
        if (!col) continue
        const hasEmb = layers.some((l) => l.type === 'embedding' && l.schemaColumnId === colId)
        if (!hasEmb) {
          layers = insertBeforeOutput(layers, {
            id: crypto.randomUUID(),
            type: 'embedding',
            schemaColumnId: colId,
            embeddingDim: 8,
          })
        }
      }
      return {
        project: {
          ...state.project,
          network: { ...state.project.network, layers },
        },
      }
    }),

  updateTheme: (partial) =>
    set((state) => ({
      project: {
        ...state.project,
        themeTokens: { ...state.project.themeTokens, ...partial },
      },
    })),

  updateTraining: (partial) =>
    set((state) => ({
      project: {
        ...state.project,
        training: { ...(state.project.training ?? {}), ...partial },
      },
    })),

  toggleAiAssist: (enabled) =>
    set((state) => ({
      project: {
        ...state.project,
        features: { ...(state.project.features ?? {}), aiAssistEnabled: enabled },
      },
    })),

  updateNetworkMeta: (partial) =>
    set((state) => ({
      project: {
        ...state.project,
        network: {
          ...state.project.network,
          metadata: { ...(state.project.network.metadata ?? {}), ...partial },
        },
      },
    })),

  setLayers: (layers) =>
    set((state) => ({
      project: {
        ...state.project,
        network: { ...state.project.network, layers },
      },
    })),

  updateLayer: (id, layer) =>
    set((state) => ({
      project: {
        ...state.project,
        network: {
          ...state.project.network,
          layers: state.project.network.layers.map((l) => (l.id === id ? layer : l)),
        },
      },
    })),

  addLayer: (layer) =>
    set((state) => {
      const layers = insertBeforeOutput(state.project.network.layers, layer)
      return {
        project: {
          ...state.project,
          network: { ...state.project.network, layers },
        },
      }
    }),

  removeLayer: (id) =>
    set((state) => ({
      project: {
        ...state.project,
        network: {
          ...state.project.network,
          layers: state.project.network.layers.filter((l) => l.id !== id),
        },
      },
      selectedLayerId: state.selectedLayerId === id ? null : state.selectedLayerId,
    })),

  moveLayer: (id, direction) =>
    set((state) => {
      const layers = [...state.project.network.layers]
      const idx = layers.findIndex((l) => l.id === id)
      if (idx <= 0 || idx >= layers.length - 1) return state
      const target = idx + direction
      if (target <= 0 || target >= layers.length - 1) return state
      if (layers[idx].type === 'input' || layers[idx].type === 'output') return state
      ;[layers[idx], layers[target]] = [layers[target], layers[idx]]
      return {
        project: {
          ...state.project,
          network: { ...state.project.network, layers },
        },
      }
    }),

  selectLayer: (selectedLayerId) => set({ selectedLayerId }),

  setGeneratedRows: (generatedRows) => set({ generatedRows }),

  setOutcomes: (outcomes) => set({ outcomes }),

  setActiveFlowStep: (activeFlowStep) => set({ activeFlowStep }),

  setPresentationMode: (presentationMode) => set({ presentationMode }),

  setBeginnerMode: (beginnerMode) => {
    try {
      localStorage.setItem(BEGINNER_MODE_STORAGE_KEY, String(beginnerMode))
    } catch {
      /* ignore */
    }
    set({ beginnerMode })
  },

  acknowledgePredictions: () => set({ predictionsAcknowledged: true }),

  setGuidedWizardEnabled: (enabled) => {
    try {
      localStorage.setItem(GUIDED_WIZARD_STORAGE_KEY, String(enabled))
    } catch {
      /* ignore */
    }
    if (enabled) {
      set({
        guidedWizardEnabled: true,
        wizardStepIndex: 0,
        tab: wizardStepTab(0),
        cohortGenerateAck: false,
        hiddenStackPresetApplied: false,
        feasibilityReviewAck: false,
      })
    } else {
      set({ guidedWizardEnabled: false })
    }
  },

  setWizardStepIndex: (idx) => {
    const clamped = Math.max(0, Math.min(WIZARD_STEP_COUNT - 1, idx)) as WizardStepIndex
    set({ wizardStepIndex: clamped, tab: wizardStepTab(clamped) })
  },

  advanceWizardStep: () => {
    const s = get()
    if (!s.guidedWizardEnabled) return
    const next = Math.min(WIZARD_STEP_COUNT - 1, s.wizardStepIndex + 1) as WizardStepIndex
    set({ wizardStepIndex: next, tab: wizardStepTab(next) })
  },

  retreatWizardStep: () => {
    const s = get()
    if (!s.guidedWizardEnabled) return
    const prev = Math.max(0, s.wizardStepIndex - 1) as WizardStepIndex
    set({ wizardStepIndex: prev, tab: wizardStepTab(prev) })
  },

  acknowledgeCohortGeneration: () => set({ cohortGenerateAck: true }),

  setFeasibilityReviewAck: (feasibilityReviewAck) => set({ feasibilityReviewAck }),

  applyWizardHiddenPreset: (presetId) =>
    set((state) => ({
      project: {
        ...state.project,
        network: {
          ...state.project.network,
          layers: replaceHiddenStackFromPreset(
            state.project.network.layers,
            presetId,
            () => crypto.randomUUID(),
          ),
        },
      },
      hiddenStackPresetApplied: true,
    })),
}))
