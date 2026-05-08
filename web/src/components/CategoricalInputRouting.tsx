import { useMemo } from 'react'
import { featureGroupLabel, type DatasetSchema } from '../domain/datasetSchema'
import { useProjectStore } from '../store/projectStore'
import styles from './CategoricalRouting.module.css'

const DEFAULT_EMBEDDING_DIM = 8

export function CategoricalInputRouting({ dataset }: { dataset: DatasetSchema }) {
  const layers = useProjectStore((s) => s.project.network.layers)
  const addLayer = useProjectStore((s) => s.addLayer)
  const selectLayer = useProjectStore((s) => s.selectLayer)

  const categoricals = useMemo(() => dataset.columns.filter((c) => c.type === 'categorical'), [dataset.columns])

  const embeddingByColumnId = useMemo(() => {
    const map = new Map<string, string>()
    for (const layer of layers) {
      if (layer.type === 'embedding') map.set(layer.schemaColumnId, layer.id)
    }
    return map
  }, [layers])

  if (categoricals.length === 0) {
    return (
      <div className={styles.wrap}>
        <h4 className={styles.title}>Categorical inputs</h4>
        <p className={styles.help}>
          No categorical columns in the schema. Add columns typed as <strong>categorical</strong> under Synthetic data to
          route them through embedding layers.
        </p>
      </div>
    )
  }

  return (
    <div className={styles.wrap}>
      <h4 className={styles.title}>Categorical inputs</h4>
      <p className={styles.help}>
        Each categorical field needs an <strong>Embedding</strong> block so the network learns a vector per category.
        Embeddings sit in the layer stack (usually right after the Input node).
      </p>
      <ul className={styles.list}>
        {categoricals.map((col) => {
          const layerId = embeddingByColumnId.get(col.id)
          const connected = Boolean(layerId)
          return (
            <li key={col.id} className={styles.row}>
              <div className={styles.meta}>
                <span className={styles.badge}>{featureGroupLabel(col.group)}</span>
                <span className={styles.name}>{col.name}</span>
                <small className={styles.id}>({col.id})</small>
              </div>
              <div className={styles.actions}>
                {connected ? (
                  <>
                    <span className={styles.status}>In network</span>
                    <button type="button" className={styles.ghost} onClick={() => selectLayer(layerId!)}>
                      Highlight embedding
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    className={styles.primary}
                    onClick={() =>
                      addLayer({
                        id: crypto.randomUUID(),
                        type: 'embedding',
                        schemaColumnId: col.id,
                        embeddingDim: DEFAULT_EMBEDDING_DIM,
                      })
                    }
                  >
                    Add embedding for {col.name}
                  </button>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
