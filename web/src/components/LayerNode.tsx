import { Handle, Position, type Node, type NodeProps } from '@xyflow/react'
import type { Layer } from '../domain/networkGraph'
import type { LayerShapeTrace } from '../domain/shape'
import styles from './LayerNode.module.css'

export type LayerNodeData = {
  layer: Layer
  trace?: LayerShapeTrace
  active?: boolean
}

export type LayerNodeType = Node<LayerNodeData, 'layer'>

export function LayerNode({ data, selected }: NodeProps<LayerNodeType>) {
  const title = summarizeLayer(data.layer)
  const dims =
    data.trace !== undefined ? `${data.trace.inDim}→${data.trace.outDim}` : 'pending'

  const cls = [styles.card, data.active ? styles.active : '', selected ? styles.selected : '']
    .filter(Boolean)
    .join(' ')

  return (
    <div className={cls}>
      <Handle type="target" position={Position.Left} />
      <div className={styles.title}>{title}</div>
      <div className={styles.meta}>{dims}</div>
      <Handle type="source" position={Position.Right} />
    </div>
  )
}

function summarizeLayer(layer: Layer): string {
  switch (layer.type) {
    case 'input':
      return `Input (${layer.scalarColumnIds.length} scalar)`
    case 'embedding':
      return `Embedding · ${layer.schemaColumnId}`
    case 'dense':
      return `Dense · ${layer.units} units`
    case 'dropout':
      return `Dropout · ${layer.rate}`
    case 'batch_norm':
      return 'Batch norm'
    case 'activation':
      return `Activation · ${layer.fn}`
    case 'output':
      return `Output · ${layer.units}`
    default:
      return 'Layer'
  }
}
