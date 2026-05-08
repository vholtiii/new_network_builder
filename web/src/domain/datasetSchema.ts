import { z } from 'zod'

export const featureGroupSchema = z.enum([
  'demographics',
  'diagnosis',
  'clinical_history',
  'medication',
  'labs',
  'pgx',
  'methylation',
  'trauma',
  'outcomes',
  'treatment_phase',
  'other',
])

export const columnTypeSchema = z.enum(['numeric', 'categorical', 'binary', 'ordinal'])

export const datasetColumnSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  type: columnTypeSchema,
  categories: z.array(z.string()).optional(),
  unit: z.string().optional(),
  codingHint: z.string().optional(),
  group: featureGroupSchema.default('other'),
})

export const datasetSchemaSchema = z.object({
  columns: z.array(datasetColumnSchema),
  description: z.string().optional(),
})

export type FeatureGroup = z.infer<typeof featureGroupSchema>
export type DatasetColumn = z.infer<typeof datasetColumnSchema>
export type DatasetSchema = z.infer<typeof datasetSchemaSchema>

export const FEATURE_GROUP_VALUES: FeatureGroup[] = [
  'demographics',
  'diagnosis',
  'clinical_history',
  'medication',
  'labs',
  'pgx',
  'methylation',
  'trauma',
  'outcomes',
  'treatment_phase',
  'other',
]

/** Short labels for schema UI (dataset editor + builder). */
export const FEATURE_GROUP_LABELS: Record<FeatureGroup, string> = {
  demographics: 'Demographics',
  diagnosis: 'Diagnosis',
  clinical_history: 'Clinical history',
  medication: 'Medication',
  labs: 'Labs',
  pgx: 'Pharmacogenomics',
  methylation: 'Methylation',
  trauma: 'Trauma',
  outcomes: 'Outcomes',
  treatment_phase: 'Treatment phase',
  other: 'Other',
}

export function featureGroupLabel(group: FeatureGroup): string {
  return FEATURE_GROUP_LABELS[group]
}
