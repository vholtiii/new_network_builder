import { create } from 'zustand'
import { createDefaultProject } from '../domain/defaultProject'
import type { DatasetSchema } from '../domain/datasetSchema'
import type { Layer } from '../domain/networkGraph'
import { parseProjectFile, type ProjectFile } from '../domain/projectFile'
import type { SyntheticRow } from '../domain/synthetic'
import type { OutcomeRow } from '../domain/simulator'

export type WorkspaceTab = 'builder' | 'data' | 'results' | 'present'

type ProjectState = {
  project: ProjectFile
  tab: WorkspaceTab
  selectedLayerId: string | null
  generatedRows: SyntheticRow[]
  outcomes: OutcomeRow[]
  activeFlowStep: number
  presentationMode: boolean
  predictionsAcknowledged: boolean
  setTab: (tab: WorkspaceTab) => void
  setProject: (project: ProjectFile) => void
  importFromJsonText: (json: string) => void
  exportProjectJson: () => string
  updateDatasetSchema: (schema: DatasetSchema) => void
  updateDeclarations: (partial: Partial<ProjectFile['feasibilityDeclarations']>) => void
  updateGeneration: (partial: Partial<ProjectFile['generationSettings']>) => void
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
  acknowledgePredictions: () => void
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
  tab: 'builder',
  selectedLayerId: null,
  generatedRows: [],
  outcomes: [],
  activeFlowStep: 0,
  presentationMode: false,
  predictionsAcknowledged: false,

  setTab: (tab) => set({ tab }),

  setProject: (project) => set({ project }),

  importFromJsonText: (json) => {
    const parsed = parseProjectFile(JSON.parse(json))
    set({ project: parsed, generatedRows: [], outcomes: [] })
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
    set((state) => ({
      project: {
        ...state.project,
        generationSettings: { ...state.project.generationSettings, ...partial },
      },
    })),

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

  acknowledgePredictions: () => set({ predictionsAcknowledged: true }),
}))
