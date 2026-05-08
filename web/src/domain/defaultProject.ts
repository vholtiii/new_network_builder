import { PROJECT_FILE_VERSION, type ProjectFile } from './projectFile'

export function createDefaultProject(): ProjectFile {
  return {
    version: PROJECT_FILE_VERSION,
    datasetSchema: {
      description: 'Editable BioBank-style starter schema',
      columns: [
        { id: 'age', name: 'Age (years)', type: 'numeric', group: 'demographics' },
        { id: 'lab_alt', name: 'ALT', type: 'numeric', group: 'labs' },
        {
          id: 'cohort_site',
          name: 'Site',
          type: 'categorical',
          categories: ['A', 'B', 'C'],
          group: 'demographics',
        },
      ],
    },
    generationSettings: {
      seed: 42,
      rowCount: 100,
    },
    feasibilityDeclarations: {
      sampleSize: 120,
      taskType: 'binary_classification',
      interpretabilityPriority: 'medium',
      externalValidationPlanned: false,
    },
    themeTokens: {
      primary: '#2563eb',
      secondary: '#0f172a',
      accent: '#38bdf8',
      background: '#f8fafc',
      foreground: '#0f172a',
    },
    training: {
      weightDecay: 1e-4,
      learningRate: 0.001,
    },
    features: {
      aiAssistEnabled: false,
    },
    network: {
      metadata: { name: 'Starter tabular MLP' },
      layers: [
        { id: 'in', type: 'input', scalarColumnIds: ['age', 'lab_alt'] },
        { id: 'emb_site', type: 'embedding', schemaColumnId: 'cohort_site', embeddingDim: 8 },
        { id: 'd1', type: 'dense', units: 32 },
        { id: 'bn1', type: 'batch_norm' },
        { id: 'a1', type: 'activation', fn: 'relu' },
        { id: 'do1', type: 'dropout', rate: 0.2 },
        { id: 'd2', type: 'dense', units: 16 },
        { id: 'a2', type: 'activation', fn: 'relu' },
        {
          id: 'out',
          type: 'output',
          units: 1,
          activationFn: 'sigmoid',
        },
      ],
    },
  }
}
