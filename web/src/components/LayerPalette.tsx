import { useProjectStore } from '../store/projectStore'
import styles from './Palette.module.css'

export function LayerPalette() {
  const addLayer = useProjectStore((s) => s.addLayer)
  const beginnerMode = useProjectStore((s) => s.beginnerMode)

  return (
    <div>
      {beginnerMode && (
        <p className={styles.hint}>
          Add blocks from bottom to top before the output. Hover each shortcut for a one-line description.
        </p>
      )}
      <div className={styles.palette}>
        <button
          type="button"
          title="Fully connected layer: mixes all features; sets width to chosen units."
          onClick={() => addLayer({ id: crypto.randomUUID(), type: 'dense', units: 32 })}
        >
          + Dense
        </button>
        <button
          type="button"
          title="Randomly drops activations during training to reduce overfitting."
          onClick={() => addLayer({ id: crypto.randomUUID(), type: 'dropout', rate: 0.25 })}
        >
          + Dropout
        </button>
        <button
          type="button"
          title="Normalizes activations for more stable training in deep stacks."
          onClick={() => addLayer({ id: crypto.randomUUID(), type: 'batch_norm' })}
        >
          + Batch norm
        </button>
        <button
          type="button"
          title="Non-linearity so the stack can learn curved boundaries."
          onClick={() => addLayer({ id: crypto.randomUUID(), type: 'activation', fn: 'relu' })}
        >
          + ReLU
        </button>
        <button
          type="button"
          title="Maps a categorical column to a short numeric vector (needs matching column id)."
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
    </div>
  )
}
