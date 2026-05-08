import type { ActivationFn, Layer } from '../domain/networkGraph'
import { useProjectStore } from '../store/projectStore'
import styles from './Inspector.module.css'

const activations: ActivationFn[] = ['relu', 'sigmoid', 'tanh', 'softmax']

export function LayerInspector() {
  const selectedLayerId = useProjectStore((s) => s.selectedLayerId)
  const layers = useProjectStore((s) => s.project.network.layers)
  const updateLayer = useProjectStore((s) => s.updateLayer)

  const layer = layers.find((l) => l.id === selectedLayerId)
  if (!layer) {
    return (
      <aside className={styles.inspector}>
        <p>Select a layer on the canvas to edit hyperparameters.</p>
      </aside>
    )
  }

  const patch = (next: Layer) => updateLayer(layer.id, next)

  return (
    <aside className={styles.inspector}>
      <header>
        <h3>Inspector</h3>
        <span className={styles.badge}>{layer.type}</span>
      </header>

      {layer.type === 'dense' && (
        <label className={styles.field}>
          Units
          <input
            type="number"
            min={1}
            value={layer.units}
            onChange={(e) => patch({ ...layer, units: Number(e.target.value) })}
          />
        </label>
      )}

      {layer.type === 'dropout' && (
        <label className={styles.field}>
          Rate
          <input
            type="number"
            min={0}
            max={1}
            step={0.05}
            value={layer.rate}
            onChange={(e) => patch({ ...layer, rate: Number(e.target.value) })}
          />
        </label>
      )}

      {layer.type === 'activation' && (
        <label className={styles.field}>
          Function
          <select
            value={layer.fn}
            onChange={(e) => patch({ ...layer, fn: e.target.value as ActivationFn })}
          >
            {activations.map((fn) => (
              <option key={fn} value={fn}>
                {fn}
              </option>
            ))}
          </select>
        </label>
      )}

      {layer.type === 'embedding' && (
        <>
          <label className={styles.field}>
            Schema column id
            <input
              type="text"
              value={layer.schemaColumnId}
              onChange={(e) => patch({ ...layer, schemaColumnId: e.target.value })}
            />
          </label>
          <label className={styles.field}>
            Embedding dimension
            <input
              type="number"
              min={2}
              value={layer.embeddingDim}
              onChange={(e) => patch({ ...layer, embeddingDim: Number(e.target.value) })}
            />
          </label>
        </>
      )}

      {layer.type === 'output' && (
        <>
          <label className={styles.field}>
            Units
            <input
              type="number"
              min={1}
              value={layer.units}
              onChange={(e) => patch({ ...layer, units: Number(e.target.value) })}
            />
          </label>
          <label className={styles.field}>
            Activation (optional)
            <select
              value={layer.activationFn ?? ''}
              onChange={(e) =>
                patch({
                  ...layer,
                  activationFn: e.target.value ? (e.target.value as ActivationFn) : undefined,
                })
              }
            >
              <option value="">none</option>
              {activations.map((fn) => (
                <option key={fn} value={fn}>
                  {fn}
                </option>
              ))}
            </select>
          </label>
        </>
      )}

      {layer.type === 'input' && (
        <p className={styles.note}>Scalar inputs managed from the dataset workspace column checklist.</p>
      )}
    </aside>
  )
}
