import type { DatasetSchema } from './datasetSchema'
import type { Layer } from './networkGraph'

export type ShapeError = {
  layerId: string
  message: string
}

export type LayerShapeTrace = {
  layerId: string
  type: Layer['type']
  inDim: number
  outDim: number
}

export type ShapeResult =
  | { ok: true; traces: LayerShapeTrace[]; outputDim: number }
  | { ok: false; errors: ShapeError[] }

function validateColumnIds(dataset: DatasetSchema | undefined, ids: string[], layerId: string): ShapeError[] {
  if (!dataset) return []
  const known = new Set(dataset.columns.map((c) => c.id))
  const errors: ShapeError[] = []
  for (const id of ids) {
    if (!known.has(id)) errors.push({ layerId, message: `Unknown schema column "${id}".` })
  }
  return errors
}

export function propagateShapes(layers: Layer[], dataset?: DatasetSchema): ShapeResult {
  const errors: ShapeError[] = []

  if (layers.length === 0) {
    return { ok: false, errors: [{ layerId: '_', message: 'Network has no layers.' }] }
  }

  if (layers[0].type !== 'input') {
    errors.push({ layerId: layers[0].id, message: 'First layer must be Input.' })
  }

  const last = layers[layers.length - 1]
  if (last.type !== 'output') {
    errors.push({ layerId: last.id, message: 'Last layer must be Output.' })
  }

  let i = 0
  let dim = 0
  const traces: LayerShapeTrace[] = []

  const pushErr = (layerId: string, message: string) => errors.push({ layerId, message })

  const inputLayer = layers[0]
  if (inputLayer?.type === 'input') {
    errors.push(...validateColumnIds(dataset, inputLayer.scalarColumnIds, inputLayer.id))
    dim = inputLayer.scalarColumnIds.length
    traces.push({ layerId: inputLayer.id, type: 'input', inDim: dim, outDim: dim })
    i = 1

    while (i < layers.length) {
      const layer = layers[i]
      if (layer.type !== 'embedding') break
      const emb = layer
      if (dataset) {
        const col = dataset.columns.find((c) => c.id === emb.schemaColumnId)
        if (!col) pushErr(emb.id, `Embedding references unknown column "${emb.schemaColumnId}".`)
        else if (col.type !== 'categorical')
          pushErr(emb.id, `Embedding column "${emb.schemaColumnId}" must be categorical in schema.`)
      }
      const inDim = dim
      dim += emb.embeddingDim
      traces.push({ layerId: emb.id, type: 'embedding', inDim, outDim: dim })
      i++
    }
  }

  for (; i < layers.length; i++) {
    const layer = layers[i]

    if (layer.type === 'input') {
      pushErr(layer.id, 'Multiple Input layers are not allowed.')
      continue
    }
    if (layer.type === 'embedding') {
      pushErr(layer.id, 'Embedding layers must appear immediately after Input.')
      continue
    }

    if (layer.type === 'dense') {
      const inDim = dim
      dim = layer.units
      traces.push({ layerId: layer.id, type: 'dense', inDim, outDim: dim })
      continue
    }

    if (layer.type === 'dropout' || layer.type === 'batch_norm') {
      traces.push({ layerId: layer.id, type: layer.type, inDim: dim, outDim: dim })
      continue
    }

    if (layer.type === 'activation') {
      traces.push({ layerId: layer.id, type: 'activation', inDim: dim, outDim: dim })
      continue
    }

    if (layer.type === 'output') {
      const inDim = dim
      dim = layer.units
      traces.push({ layerId: layer.id, type: 'output', inDim, outDim: dim })
      continue
    }

    const _exhaustive: never = layer
    pushErr((_exhaustive as Layer).id, 'Unhandled layer type.')
  }

  if (errors.length > 0) return { ok: false, errors }

  return { ok: true, traces, outputDim: dim }
}

export function estimateParameterCount(layers: Layer[], traces: LayerShapeTrace[]): number {
  let params = 0

  for (let idx = 0; idx < layers.length; idx++) {
    const layer = layers[idx]
    const curr = traces[idx]
    const prev = traces[idx - 1]
    if (!curr) continue

    if (layer.type === 'dense') {
      const inDim = prev?.outDim ?? 0
      params += inDim * layer.units + layer.units
    }
    if (layer.type === 'output') {
      const inDim = prev?.outDim ?? 0
      params += inDim * layer.units + layer.units
    }
    if (layer.type === 'embedding') {
      params += layer.embeddingDim * 32
    }
    if (layer.type === 'batch_norm') {
      params += 4 * curr.outDim
    }
  }

  return params
}
