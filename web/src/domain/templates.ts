import type { DatasetSchema } from './datasetSchema'

export const templates: { id: string; name: string; schema: DatasetSchema }[] = [
  {
    id: 'demographics-labs',
    name: 'Demographics + labs core',
    schema: {
      description: 'Starter cohort sheet with vitals-style labs',
      columns: [
        { id: 'age', name: 'Age (years)', type: 'numeric', group: 'demographics' },
        { id: 'sex', name: 'Sex (coded)', type: 'binary', group: 'demographics' },
        { id: 'alt', name: 'ALT (U/L)', type: 'numeric', unit: 'U/L', group: 'labs' },
        { id: 'creatinine', name: 'Creatinine', type: 'numeric', unit: 'mg/dL', group: 'labs' },
        { id: 'crp', name: 'CRP', type: 'numeric', unit: 'mg/L', group: 'labs' },
        {
          id: 'visit_bucket',
          name: 'Visit window',
          type: 'categorical',
          categories: ['screening', 'followup', 'maintenance'],
          group: 'clinical_history',
        },
      ],
    },
  },
  {
    id: 'pgx-panel',
    name: 'PGx + methylation lite',
    schema: {
      description: 'Illustrative pharmacogenetic + epigenetic placeholders',
      columns: [
        { id: 'cyp2d6', name: 'CYP2D6 activity score', type: 'ordinal', group: 'pgx' },
        { id: 'oprm1', name: 'OPRM1 variant carrier', type: 'binary', group: 'pgx' },
        {
          id: 'methylation_pc1',
          name: 'Methylation PC1',
          type: 'numeric',
          codingHint: 'Summarized probe-set component',
          group: 'methylation',
        },
        { id: 'weeks_abstinent', name: 'Weeks abstinent', type: 'numeric', group: 'treatment_phase' },
        {
          id: 'relapse_flag',
          name: 'Relapse (historical)',
          type: 'binary',
          group: 'outcomes',
        },
      ],
    },
  },
  {
    id: 'substance-care',
    name: 'Medication + toxicity panel',
    schema: {
      description: 'Medication exposure with toxicity proxies',
      columns: [
        {
          id: 'primary_agent',
          name: 'Primary pharmacologic class',
          type: 'categorical',
          categories: ['opioid_agonist', 'opioid_antagonist', 'adjunct'],
          group: 'medication',
        },
        { id: 'dose_index', name: 'Relative dose index', type: 'numeric', group: 'medication' },
        { id: 'qt_proxy', name: 'QT proxy marker', type: 'numeric', group: 'labs' },
        {
          id: 'trauma_score',
          name: 'Trauma burden score',
          type: 'ordinal',
          group: 'trauma',
        },
        {
          id: 'readmit',
          name: 'Readmission flag',
          type: 'binary',
          group: 'outcomes',
        },
      ],
    },
  },
]
