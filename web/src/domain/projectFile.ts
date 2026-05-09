import { z } from 'zod'
import { datasetSchemaSchema } from './datasetSchema'
import { networkGraphSchema } from './networkGraph'

export const PROJECT_FILE_VERSION = 1 as const

export const taskTypeSchema = z.enum([
  'binary_classification',
  'multiclass_classification',
  'regression',
  'risk_score',
])

export const cohortScenarioSchema = z.object({
  activeThemeId: z.string().optional(),
  ageRange: z.object({ min: z.number(), max: z.number() }).optional(),
  treatmentPhaseWeights: z.record(z.string(), z.number()).optional(),
  relapseProbability: z.number().min(0).max(1).optional(),
  /** Probability coded value is 1 for binary sex columns (presentation default 0.5). */
  sexPositiveProbability: z.number().min(0).max(1).optional(),
  labsIntensity: z.enum(['low', 'neutral', 'high']).optional(),
  mixStrictness: z.enum(['soft', 'stratified']).optional(),
})

export type CohortScenario = z.infer<typeof cohortScenarioSchema>

export const columnGenProfileSchema = z.object({
  numericMin: z.number().optional(),
  numericMax: z.number().optional(),
  numericMode: z.enum(['uniform', 'normal']).optional(),
})

export type ColumnGenProfile = z.infer<typeof columnGenProfileSchema>

export const generationSettingsSchema = z.object({
  seed: z.number().int(),
  rowCount: z.number().int().min(1).max(100_000),
  cohortScenario: cohortScenarioSchema.optional(),
  livePreview: z.boolean().optional(),
  columnProfiles: z.record(z.string(), columnGenProfileSchema).optional(),
})

export const feasibilityDeclarationsSchema = z.object({
  sampleSize: z.number().int().min(1),
  taskType: taskTypeSchema,
  /** Explicit feature count for feasibility when schema incomplete */
  featureCount: z.number().int().min(1).optional(),
  multiclassCount: z.number().int().min(2).optional(),
  interpretabilityPriority: z.enum(['low', 'medium', 'high']).optional(),
  externalValidationPlanned: z.boolean().optional(),
})

export const themeTokensSchema = z.object({
  primary: z.string(),
  secondary: z.string(),
  accent: z.string(),
  background: z.string(),
  foreground: z.string(),
})

export const trainingStubSchema = z.object({
  weightDecay: z.number().min(0).optional(),
  learningRate: z.number().positive().optional(),
})

export const projectFeaturesSchema = z.object({
  aiAssistEnabled: z.boolean().optional(),
})

export const projectFileSchema = z.object({
  version: z.literal(PROJECT_FILE_VERSION),
  network: networkGraphSchema,
  datasetSchema: datasetSchemaSchema,
  generationSettings: generationSettingsSchema,
  feasibilityDeclarations: feasibilityDeclarationsSchema,
  themeTokens: themeTokensSchema,
  training: trainingStubSchema.optional(),
  features: projectFeaturesSchema.optional(),
})

export type TaskType = z.infer<typeof taskTypeSchema>
export type GenerationSettings = z.infer<typeof generationSettingsSchema>
export type FeasibilityDeclarations = z.infer<typeof feasibilityDeclarationsSchema>
export type ThemeTokens = z.infer<typeof themeTokensSchema>
export type ProjectFile = z.infer<typeof projectFileSchema>

export function parseProjectFile(raw: unknown): ProjectFile {
  return projectFileSchema.parse(raw)
}

export function safeParseProjectFile(raw: unknown) {
  return projectFileSchema.safeParse(raw)
}
