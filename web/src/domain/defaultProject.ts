import { PROJECT_FILE_VERSION, type ProjectFile } from './projectFile'

export function createDefaultProject(): ProjectFile {
  return {
    version: PROJECT_FILE_VERSION,
    datasetSchema: {
      description: 'Editable BioBank-style starter schema',
      columns: [
        { id: 'age', name: 'Age (years)', type: 'numeric', group: 'demographics', syntheticRole: 'age' },
        { id: 'lab_alt', name: 'ALT', type: 'numeric', group: 'labs' },
        {
          id: 'cohort_site',
          name: 'Site',
          type: 'categorical',
          categories: ['A', 'B', 'C'],
          group: 'demographics',
          syntheticRole: 'site_or_center',
        },
        {
          id: 'tx_phase',
          name: 'Treatment phase',
          type: 'categorical',
          categories: ['Induction', 'Maintenance', 'Relapse'],
          group: 'treatment_phase',
          syntheticRole: 'treatment_phase',
        },
        {
          id: 'relapse_flag',
          name: 'Relapse',
          type: 'binary',
          group: 'outcomes',
          syntheticRole: 'relapse_or_recurrence',
        },
      ],
    },
    generationSettings: {
      seed: 42,
      rowCount: 100,
      livePreview: false,
      cohortScenario: {
        activeThemeId: 'balanced_general',
        ageRange: { min: 18, max: 80 },
        treatmentPhaseWeights: { Induction: 1, Maintenance: 1, Relapse: 1 },
        relapseProbability: 0.25,
        labsIntensity: 'neutral',
        mixStrictness: 'soft',
      },
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
        { id: 'in', type: 'input', scalarColumnIds: ['age', 'lab_alt', 'relapse_flag'] },
        { id: 'emb_site', type: 'embedding', schemaColumnId: 'cohort_site', embeddingDim: 8 },
        { id: 'emb_phase', type: 'embedding', schemaColumnId: 'tx_phase', embeddingDim: 8 },
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
