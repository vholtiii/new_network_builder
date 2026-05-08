import { useMemo } from 'react'
import type { DatasetSchema } from '../domain/datasetSchema'
import type { Layer } from '../domain/networkGraph'
import { useProjectStore } from '../store/projectStore'
import styles from './ScalarInputs.module.css'

export function ScalarInputPicker({ dataset }: { dataset: DatasetSchema }) {
  const layers = useProjectStore((s) => s.project.network.layers)
  const updateLayer = useProjectStore((s) => s.updateLayer)

  const inputLayer = layers.find((l): l is Extract<Layer, { type: 'input' }> => l.type === 'input')

  const eligible = useMemo(
    () => dataset.columns.filter((c) => c.type === 'numeric' || c.type === 'binary' || c.type === 'ordinal'),
    [dataset.columns],
  )

  if (!inputLayer) return null

  const toggle = (id: string) => {
    const has = inputLayer.scalarColumnIds.includes(id)
    const scalarColumnIds = has
      ? inputLayer.scalarColumnIds.filter((c) => c !== id)
      : [...inputLayer.scalarColumnIds, id]
    if (scalarColumnIds.length === 0) return
    updateLayer(inputLayer.id, { ...inputLayer, scalarColumnIds })
  }

  return (
    <div className={styles.wrap}>
      <h4>Scalar input channels</h4>
      <p className={styles.help}>Toggle numeric/binary/ordinal columns wired into the Input layer.</p>
      <div className={styles.grid}>
        {eligible.map((col) => (
          <label key={col.id} className={styles.checkbox}>
            <input
              type="checkbox"
              checked={inputLayer.scalarColumnIds.includes(col.id)}
              onChange={() => toggle(col.id)}
            />
            <span>
              {col.name} <small>({col.id})</small>
            </span>
          </label>
        ))}
      </div>
    </div>
  )
}
