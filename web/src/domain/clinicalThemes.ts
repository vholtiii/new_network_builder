import type { CohortScenario } from './projectFile'

/** Maps theme → default cohort scenario knobs (merged with user `cohortScenario` in settings). */
export type ScenarioDefaults = {
  ageRange: { min: number; max: number }
  treatmentPhaseWeights?: Record<string, number>
  relapseProbability?: number
  sexPositiveProbability?: number
  labsIntensity: 'low' | 'neutral' | 'high'
  mixStrictness: 'soft' | 'stratified'
}

export type ClinicalTheme = {
  id: string
  label: string
  description: string
  defaults: ScenarioDefaults
}

/** Standard category ids used when demo schema includes Induction / Maintenance / Relapse. */
const PHASE_KEYS = ['Induction', 'Maintenance', 'Relapse'] as const

export const clinicalThemes: ClinicalTheme[] = [
  {
    id: 'balanced_general',
    label: 'Balanced general',
    description: 'Broad ages, balanced treatment phases, neutral labs.',
    defaults: {
      ageRange: { min: 18, max: 80 },
      treatmentPhaseWeights: Object.fromEntries(PHASE_KEYS.map((k) => [k, 1])),
      relapseProbability: 0.25,
      labsIntensity: 'neutral',
      mixStrictness: 'soft',
    },
  },
  {
    id: 'relapse_enriched',
    label: 'Relapse-enriched',
    description: 'Skews toward relapse phase and positive relapse flag.',
    defaults: {
      ageRange: { min: 22, max: 72 },
      treatmentPhaseWeights: { Induction: 0.6, Maintenance: 0.8, Relapse: 2.2 },
      relapseProbability: 0.58,
      labsIntensity: 'high',
      mixStrictness: 'soft',
    },
  },
  {
    id: 'maintenance_heavy',
    label: 'Maintenance-heavy',
    description: 'Mostly maintenance / post-induction stability.',
    defaults: {
      ageRange: { min: 28, max: 78 },
      treatmentPhaseWeights: { Induction: 0.5, Maintenance: 2.5, Relapse: 0.4 },
      relapseProbability: 0.12,
      labsIntensity: 'neutral',
      mixStrictness: 'stratified',
    },
  },
  {
    id: 'older_adults',
    label: 'Older adults',
    description: 'Upper age band with mildly elevated lab variability.',
    defaults: {
      ageRange: { min: 55, max: 88 },
      treatmentPhaseWeights: Object.fromEntries(PHASE_KEYS.map((k) => [k, 1])),
      relapseProbability: 0.3,
      labsIntensity: 'high',
      mixStrictness: 'soft',
    },
  },
  {
    id: 'young_adult',
    label: 'Young adult',
    description: 'Younger cohort with neutral labs.',
    defaults: {
      ageRange: { min: 18, max: 40 },
      treatmentPhaseWeights: Object.fromEntries(PHASE_KEYS.map((k) => [k, 1])),
      relapseProbability: 0.22,
      labsIntensity: 'low',
      mixStrictness: 'soft',
    },
  },
]

export function getClinicalTheme(id: string): ClinicalTheme | undefined {
  return clinicalThemes.find((t) => t.id === id)
}

/** Merge theme defaults with saved scenario (saved values win when defined). */
export function mergeScenarioWithTheme(
  themeId: string | undefined,
  saved: CohortScenario | undefined,
): Required<Pick<ScenarioDefaults, 'ageRange' | 'labsIntensity' | 'mixStrictness'>> & {
  treatmentPhaseWeights: Record<string, number>
  relapseProbability: number
  sexPositiveProbability: number
} {
  const theme = (themeId ? getClinicalTheme(themeId) : undefined) ?? getClinicalTheme('balanced_general')!
  const d = theme.defaults
  const mergedWeights = {
    ...(d.treatmentPhaseWeights ?? {}),
    ...(saved?.treatmentPhaseWeights ?? {}),
  }
  const fallbackWeights = Object.fromEntries(PHASE_KEYS.map((k) => [k, 1]))
  return {
    ageRange: saved?.ageRange ?? d.ageRange,
    treatmentPhaseWeights:
      Object.keys(mergedWeights).length > 0
        ? mergedWeights
        : fallbackWeights,
    relapseProbability: saved?.relapseProbability ?? d.relapseProbability ?? 0.25,
    sexPositiveProbability: saved?.sexPositiveProbability ?? d.sexPositiveProbability ?? 0.5,
    labsIntensity: saved?.labsIntensity ?? d.labsIntensity,
    mixStrictness: saved?.mixStrictness ?? d.mixStrictness,
  }
}
