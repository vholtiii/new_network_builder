import { z } from 'zod'

export const activationFnSchema = z.enum(['relu', 'sigmoid', 'tanh', 'softmax'])

/** Tabular features listed as scalar (numeric/binary/ordinal width 1 each). Categoricals use embedding layers immediately after input. */
export const layerSchema = z.discriminatedUnion('type', [
  z.object({
    id: z.string().min(1),
    type: z.literal('input'),
    scalarColumnIds: z.array(z.string()).min(1),
  }),
  z.object({
    id: z.string().min(1),
    type: z.literal('dense'),
    units: z.number().int().positive(),
  }),
  z.object({
    id: z.string().min(1),
    type: z.literal('dropout'),
    rate: z.number().min(0).max(1),
  }),
  z.object({
    id: z.string().min(1),
    type: z.literal('batch_norm'),
  }),
  z.object({
    id: z.string().min(1),
    type: z.literal('activation'),
    fn: activationFnSchema,
  }),
  z.object({
    id: z.string().min(1),
    type: z.literal('embedding'),
    schemaColumnId: z.string().min(1),
    embeddingDim: z.number().int().positive(),
  }),
  z.object({
    id: z.string().min(1),
    type: z.literal('output'),
    units: z.number().int().positive(),
    activationFn: activationFnSchema.optional(),
  }),
])

export const networkGraphSchema = z.object({
  layers: z.array(layerSchema),
  metadata: z
    .object({
      name: z.string().optional(),
      notes: z.string().optional(),
    })
    .optional(),
})

export type ActivationFn = z.infer<typeof activationFnSchema>
export type Layer = z.infer<typeof layerSchema>
export type NetworkGraph = z.infer<typeof networkGraphSchema>
