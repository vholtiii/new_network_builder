import '@xyflow/react/dist/style.css'

import { useCallback, useEffect, useMemo } from 'react'
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from '@xyflow/react'
import type { DatasetSchema } from '../domain/datasetSchema'
import type { Layer } from '../domain/networkGraph'
import { propagateShapes } from '../domain/shape'
import { buildInputLayerTooltip } from './inputTooltip'
import { LayerNode } from './LayerNode'

const nodeTypes = { layer: LayerNode }

type Props = {
  layers: Layer[]
  datasetSchema?: DatasetSchema
  activeStep: number
  selectedLayerId: string | null
  onSelectLayer: (id: string | null) => void
  diagramRef?: React.RefObject<HTMLDivElement | null>
}

function FlowDiagramInner({
  layers,
  datasetSchema,
  activeStep,
  selectedLayerId,
  onSelectLayer,
}: Omit<Props, 'diagramRef'>) {
  const { fitView } = useReactFlow()
  const shape = useMemo(() => propagateShapes(layers, datasetSchema), [layers, datasetSchema])

  const traces = shape.ok ? shape.traces : []

  const initialNodes = useMemo(() => {
    const spacing = 240
    const y = 140
    return layers.map((layer, idx) => ({
      id: layer.id,
      type: 'layer' as const,
      position: { x: idx * spacing, y },
      data: {
        layer,
        trace: traces[idx],
        active: idx === activeStep,
        inputTooltip:
          layer.type === 'input'
            ? buildInputLayerTooltip(datasetSchema, layer.scalarColumnIds)
            : undefined,
      },
      selected: layer.id === selectedLayerId,
      draggable: false,
    }))
  }, [layers, traces, activeStep, selectedLayerId, datasetSchema])

  const initialEdges = useMemo(() => {
    const edges = []
    for (let i = 0; i < layers.length - 1; i++) {
      edges.push({
        id: `${layers[i].id}-${layers[i + 1].id}`,
        source: layers[i].id,
        target: layers[i + 1].id,
        animated: activeStep === i,
        style: { strokeWidth: 2, stroke: '#94a3b8' },
      })
    }
    return edges
  }, [layers, activeStep])

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  useEffect(() => {
    setNodes(initialNodes)
    setEdges(initialEdges)
    requestAnimationFrame(() => fitView({ padding: 0.2 }))
  }, [initialNodes, initialEdges, setEdges, setNodes, fitView])

  const onNodeClick = useCallback(
    (_: unknown, node: { id: string }) => {
      onSelectLayer(node.id)
    },
    [onSelectLayer],
  )

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onNodeClick={onNodeClick}
      fitView
      proOptions={{ hideAttribution: true }}
      panOnDrag
      zoomOnScroll
      minZoom={0.3}
      maxZoom={1.6}
    >
      <MiniMap pannable zoomable />
      <Controls showInteractive={false} />
      <Background gap={18} />
    </ReactFlow>
  )
}

export function NetworkCanvas(props: Props) {
  return (
    <div ref={props.diagramRef} style={{ height: '520px', width: '100%', borderRadius: 12, overflow: 'hidden' }}>
      <ReactFlowProvider>
        <FlowDiagramInner
          layers={props.layers}
          datasetSchema={props.datasetSchema}
          activeStep={props.activeStep}
          selectedLayerId={props.selectedLayerId}
          onSelectLayer={props.onSelectLayer}
        />
      </ReactFlowProvider>
    </div>
  )
}
