import { useProjectStore } from '../store/projectStore'
import styles from './Palette.module.css'

export function LayerPalette() {
  const addLayer = useProjectStore((s) => s.addLayer)

  return (
    <div className={styles.palette}>
      <button type="button" onClick={() => addLayer({ id: crypto.randomUUID(), type: 'dense', units: 32 })}>
        + Dense
      </button>
      <button type="button" onClick={() => addLayer({ id: crypto.randomUUID(), type: 'dropout', rate: 0.25 })}>
        + Dropout
      </button>
      <button type="button" onClick={() => addLayer({ id: crypto.randomUUID(), type: 'batch_norm' })}>
        + Batch norm
      </button>
      <button
        type="button"
        onClick={() => addLayer({ id: crypto.randomUUID(), type: 'activation', fn: 'relu' })}
      >
        + ReLU
      </button>
      <button
        type="button"
        onClick={() =>
          addLayer({
            id: crypto.randomUUID(),
            type: 'embedding',
            schemaColumnId: 'cohort_site',
            embeddingDim: 8,
          })
        }
      >
        + Embedding
      </button>
    </div>
  )
}
