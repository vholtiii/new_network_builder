import { useMemo } from 'react'
import {
  FEATURE_GROUP_VALUES,
  featureGroupLabel,
  type DatasetSchema,
  type FeatureGroup,
} from '../domain/datasetSchema'
import type { Layer } from '../domain/networkGraph'
import { useProjectStore } from '../store/projectStore'
import styles from './ScalarInputs.module.css'

function scalarSummaryByGroup(
  schema: DatasetSchema,
  selectedIds: string[],
): Partial<Record<FeatureGroup, number>> {
  const counts: Partial<Record<FeatureGroup, number>> = {}
  for (const id of selectedIds) {
    const col = schema.columns.find((c) => c.id === id)
    if (!col) continue
    const g = col.group
    counts[g] = (counts[g] ?? 0) + 1
  }
  return counts
}

export function ScalarInputPicker({ dataset }: { dataset: DatasetSchema }) {
  const layers = useProjectStore((s) => s.project.network.layers)
  const beginnerMode = useProjectStore((s) => s.beginnerMode)
  const setTab = useProjectStore((s) => s.setTab)
  const updateLayer = useProjectStore((s) => s.updateLayer)

  const inputLayer = layers.find((l): l is Extract<Layer, { type: 'input' }> => l.type === 'input')

  const eligible = useMemo(
    () => dataset.columns.filter((c) => c.type === 'numeric' || c.type === 'binary' || c.type === 'ordinal'),
    [dataset.columns],
  )

  const grouped = useMemo(() => {
    const map = new Map<FeatureGroup, typeof eligible>()
    for (const g of FEATURE_GROUP_VALUES) map.set(g, [])
    for (const col of eligible) {
      map.get(col.group)?.push(col)
    }
    return map
  }, [eligible])

  if (!inputLayer) return null

  const toggle = (id: string) => {
    const has = inputLayer.scalarColumnIds.includes(id)
    const scalarColumnIds = has
      ? inputLayer.scalarColumnIds.filter((c) => c !== id)
      : [...inputLayer.scalarColumnIds, id]
    if (scalarColumnIds.length === 0) return
    updateLayer(inputLayer.id, { ...inputLayer, scalarColumnIds })
  }

  const summaryCounts = scalarSummaryByGroup(dataset, inputLayer.scalarColumnIds)
  const summaryParts = FEATURE_GROUP_VALUES.filter((g) => (summaryCounts[g] ?? 0) > 0).map(
    (g) => `${featureGroupLabel(g)}: ${summaryCounts[g]}`,
  )

  return (
    <div className={styles.wrap}>
      <h4 className={styles.title}>Features that feed the Input node</h4>
      <p className={styles.help}>
        Check <strong>numeric</strong>, <strong>binary</strong>, and <strong>ordinal</strong> fields here. Each{' '}
        <strong>categorical</strong> column uses its own <strong>Embedding</strong> block in the stack (see below).
      </p>
      {beginnerMode && (
        <p className={styles.helpBeginner}>
          Think of this list as “what gets multiplied by the first weight matrix.” Demographics like age (numeric) go
          here; labels such as treatment site or phase often stay categorical—add them under{' '}
          <strong>Categorical inputs</strong> with an embedding so the model learns a vector for each category.
        </p>
      )}
      <p className={styles.crossLink}>
        Add columns, rename IDs, or set groups (demographics, treatment phase, labs…) on the{' '}
        <button
          type="button"
          className={styles.linkLike}
          onClick={() => setTab('data')}
          aria-label="Open dataset schema editor tab"
        >
          Synthetic data
        </button>{' '}
        tab.
      </p>
      {eligible.length === 0 ? (
        <p className={styles.empty}>No numeric, binary, or ordinal columns yet—define them under Synthetic data.</p>
      ) : (
        FEATURE_GROUP_VALUES.map((group) => {
          const cols = grouped.get(group) ?? []
          if (!cols.length) return null
          return (
            <div key={group} className={styles.groupBlock}>
              <h5 className={styles.groupHeading}>{featureGroupLabel(group)}</h5>
              <div className={styles.grid}>
                {cols.map((col) => (
                  <label key={col.id} className={styles.checkbox}>
                    <input
                      type="checkbox"
                      checked={inputLayer.scalarColumnIds.includes(col.id)}
                      onChange={() => toggle(col.id)}
                    />
                    <span className={styles.rowMain}>
                      <span className={styles.colName}>{col.name}</span>
                      <small className={styles.colId}>({col.id})</small>
                      <span className={styles.typeChip}>{col.type}</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )
        })
      )}
      <p className={styles.summary}>
        <strong>{inputLayer.scalarColumnIds.length}</strong> scalar feature
        {inputLayer.scalarColumnIds.length === 1 ? '' : 's'} selected
        {summaryParts.length > 0 ? <> · {summaryParts.join(' · ')}</> : null}.
      </p>
    </div>
  )
}
