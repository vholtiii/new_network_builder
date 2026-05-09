import { useEffect, useMemo, useState } from 'react'
import {
  FEATURE_GROUP_LABELS,
  FEATURE_GROUP_VALUES,
  type DatasetColumn,
  type DatasetSchema,
  type SyntheticRole,
} from '../domain/datasetSchema'
import { parseCsvPaste, rowsToCsv } from '../domain/csv'
import { generateSyntheticRows } from '../domain/synthetic'
import type { SyntheticRow } from '../domain/synthetic'
import { templates } from '../domain/templates'
import { useProjectStore } from '../store/projectStore'
import { downloadText } from '../utils/download'
import { CohortScenarioPanel } from './CohortScenarioPanel'
import { PresentationCohortBuilder } from './PresentationCohortBuilder'
import styles from './DataWorkspace.module.css'

const rowPresets = [10, 100, 500, 1000, 5000, 10_000]

const SYNTHETIC_ROLE_OPTIONS: { value: '' | SyntheticRole; label: string }[] = [
  { value: '', label: '(none)' },
  { value: 'age', label: 'Age' },
  { value: 'sex', label: 'Sex' },
  { value: 'treatment_phase', label: 'Treatment phase' },
  { value: 'relapse_or_recurrence', label: 'Relapse / recurrence' },
  { value: 'site_or_center', label: 'Site / center' },
]

function coerceImportedRows(schema: DatasetSchema, rows: Record<string, string>[]) {
  return rows.map((row) => {
    const out: Record<string, string | number> = {}
    for (const col of schema.columns) {
      const raw = row[col.id] ?? ''
      if (col.type === 'numeric' || col.type === 'ordinal' || col.type === 'binary') {
        const n = Number(raw)
        out[col.id] = Number.isFinite(n) ? n : 0
      } else {
        out[col.id] = raw
      }
    }
    return out
  })
}

function numericSummaries(schema: DatasetSchema, rows: SyntheticRow[], cap = 5000) {
  const slice = rows.slice(0, cap)
  return schema.columns
    .filter((c) => c.type === 'numeric')
    .map((c) => {
      const vals = slice.map((r) => Number(r[c.id])).filter((n) => Number.isFinite(n))
      if (!vals.length) return { id: c.id, name: c.name, min: NaN, max: NaN, mean: NaN }
      const min = Math.min(...vals)
      const max = Math.max(...vals)
      const mean = vals.reduce((a, b) => a + b, 0) / vals.length
      return { id: c.id, name: c.name, min, max, mean }
    })
}

export function DataWorkspace() {
  const project = useProjectStore((s) => s.project)
  const beginnerMode = useProjectStore((s) => s.beginnerMode)
  const updateDatasetSchema = useProjectStore((s) => s.updateDatasetSchema)
  const updateGeneration = useProjectStore((s) => s.updateGeneration)
  const updateDeclarations = useProjectStore((s) => s.updateDeclarations)
  const setGeneratedRows = useProjectStore((s) => s.setGeneratedRows)
  const acknowledgeCohortGeneration = useProjectStore((s) => s.acknowledgeCohortGeneration)
  const generatedRows = useProjectStore((s) => s.generatedRows)

  const schema = project.datasetSchema
  const gen = project.generationSettings
  const decl = project.feasibilityDeclarations

  const genSig = useMemo(
    () =>
      JSON.stringify({
        rowCount: gen.rowCount,
        seed: gen.seed,
        livePreview: gen.livePreview,
        cohortScenario: gen.cohortScenario,
        columnProfiles: gen.columnProfiles,
      }),
    [gen.rowCount, gen.seed, gen.livePreview, gen.cohortScenario, gen.columnProfiles],
  )

  const schemaSig = useMemo(() => JSON.stringify(schema.columns), [schema.columns])

  const regenerate = (acknowledge = false) => {
    const rows = generateSyntheticRows(schema, gen)
    setGeneratedRows(rows)
    if (acknowledge) acknowledgeCohortGeneration()
  }

  useEffect(() => {
    regenerate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!gen.livePreview) return
    const t = window.setTimeout(() => {
      setGeneratedRows(generateSyntheticRows(schema, gen))
      acknowledgeCohortGeneration()
    }, 350)
    return () => window.clearTimeout(t)
  }, [gen.livePreview, genSig, schemaSig, schema, gen, setGeneratedRows, acknowledgeCohortGeneration])

  const addColumn = () => {
    const id = `col_${crypto.randomUUID().slice(0, 8)}`
    const column: DatasetColumn = {
      id,
      name: 'New column',
      type: 'numeric',
      group: 'other',
    }
    updateDatasetSchema({ ...schema, columns: [...schema.columns, column] })
  }

  const updateColumn = (id: string, partial: Partial<DatasetColumn>) => {
    updateDatasetSchema({
      ...schema,
      columns: schema.columns.map((c) => (c.id === id ? { ...c, ...partial } : c)),
    })
  }

  const removeColumn = (id: string) => {
    updateDatasetSchema({
      ...schema,
      columns: schema.columns.filter((c) => c.id !== id),
    })
  }

  const applyTemplate = (templateId: string) => {
    const tpl = templates.find((t) => t.id === templateId)
    if (!tpl) return
    updateDatasetSchema(structuredClone(tpl.schema))
  }

  const handleCsvPaste = (text: string) => {
    const parsed = parseCsvPaste(text)
    const rows = coerceImportedRows(schema, parsed.rows)
    setGeneratedRows(rows)
    updateGeneration({ rowCount: rows.length })
    acknowledgeCohortGeneration()
  }

  const previewRows = generatedRows.slice(0, 25)
  const summaries = numericSummaries(schema, generatedRows)
  const [singleDraft, setSingleDraft] = useState<Record<string, string>>({})

  useEffect(() => {
    setSingleDraft((prev) => {
      const next: Record<string, string> = {}
      for (const col of schema.columns) {
        next[col.id] = prev[col.id] ?? ''
      }
      return next
    })
  }, [schema.columns])

  return (
    <div className={styles.wrap}>
      <PresentationCohortBuilder />
      <CohortScenarioPanel />

      <section className={styles.card}>
        <h3>Dataset schema</h3>
        {beginnerMode && (
          <p className={styles.helpBeginner}>
            <strong>Cohort role</strong> tells the synthetic generator which column stands for age, relapse, treatment
            phase, or site—it shapes mock patients only. It does not train the neural network; wiring real inputs still
            happens under Model builder (scalar checkboxes and categorical embeddings).
          </p>
        )}
        <label className={styles.field}>
          Template
          <select defaultValue="" onChange={(e) => e.target.value && applyTemplate(e.target.value)}>
            <option value="">Load starter template…</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Type</th>
                <th>Group</th>
                <th>Cohort role</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {schema.columns.map((col) => (
                <tr key={col.id}>
                  <td>
                    <input value={col.id} onChange={(e) => updateColumn(col.id, { id: e.target.value })} />
                  </td>
                  <td>
                    <input value={col.name} onChange={(e) => updateColumn(col.id, { name: e.target.value })} />
                  </td>
                  <td>
                    <select
                      value={col.type}
                      onChange={(e) =>
                        updateColumn(col.id, { type: e.target.value as DatasetColumn['type'] })
                      }
                    >
                      <option value="numeric">numeric</option>
                      <option value="binary">binary</option>
                      <option value="ordinal">ordinal</option>
                      <option value="categorical">categorical</option>
                    </select>
                  </td>
                  <td>
                    <select
                      value={col.group}
                      onChange={(e) =>
                        updateColumn(col.id, { group: e.target.value as DatasetColumn['group'] })
                      }
                    >
                      {FEATURE_GROUP_VALUES.map((g) => (
                        <option key={g} value={g}>
                          {FEATURE_GROUP_LABELS[g]}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <select
                      value={col.syntheticRole ?? ''}
                      onChange={(e) =>
                        updateColumn(col.id, {
                          syntheticRole:
                            e.target.value === '' ? undefined : (e.target.value as SyntheticRole),
                        })
                      }
                    >
                      {SYNTHETIC_ROLE_OPTIONS.map((o) => (
                        <option key={o.value || '_none'} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <button type="button" onClick={() => removeColumn(col.id)}>
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button type="button" onClick={addColumn}>
          Add column
        </button>
      </section>

      <section className={styles.card}>
        <h3>Synthetic cohort generator</h3>
        <p className={styles.help}>
          Set target cohort size here (X patients). Use <strong>Cohort scenario</strong> above for clinical themes and
          mixes, then click <strong>Generate X synthetic patients</strong> or enable live preview.
        </p>
        <div className={styles.row}>
          <label className={styles.field}>
            Seed
            <input
              type="number"
              value={gen.seed}
              onChange={(e) => updateGeneration({ seed: Number(e.target.value) })}
            />
          </label>
          <label className={styles.field}>
            Declared sample size (feasibility)
            <input
              type="number"
              min={1}
              value={decl.sampleSize}
              onChange={(e) => updateDeclarations({ sampleSize: Number(e.target.value) })}
            />
          </label>
          <label className={styles.field}>
            Task type
            <select
              value={decl.taskType}
              onChange={(e) =>
                updateDeclarations({
                  taskType: e.target.value as typeof decl.taskType,
                })
              }
            >
              <option value="binary_classification">binary_classification</option>
              <option value="multiclass_classification">multiclass_classification</option>
              <option value="regression">regression</option>
              <option value="risk_score">risk_score</option>
            </select>
          </label>
          <label className={styles.field}>
            Multiclass K
            <input
              type="number"
              min={2}
              value={decl.multiclassCount ?? 3}
              onChange={(e) => updateDeclarations({ multiclassCount: Number(e.target.value) })}
            />
          </label>
        </div>
        <div className={styles.presets}>
          {rowPresets.map((n) => (
            <button key={n} type="button" onClick={() => updateGeneration({ rowCount: n })}>
              {n} patients
            </button>
          ))}
        </div>
        <label className={styles.field}>
          Exact patient count (X = {gen.rowCount})
          <input
            type="range"
            min={1}
            max={10000}
            step={1}
            value={Math.min(gen.rowCount, 10000)}
            onChange={(e) => updateGeneration({ rowCount: Number(e.target.value) })}
          />
        </label>
        <div className={styles.actions}>
          <button type="button" onClick={() => regenerate(true)}>
            Generate / refresh synthetic rows
          </button>
          <button
            type="button"
            onClick={() => downloadText('synthetic-cohort.csv', rowsToCsv(generatedRows, schema), 'text/csv')}
          >
            Download CSV
          </button>
        </div>
      </section>

      <section className={styles.card}>
        <h3>CSV paste fallback</h3>
        <textarea
          className={styles.textarea}
          placeholder="Paste CSV with header row matching schema column ids"
          onBlur={(e) => e.target.value.trim() && handleCsvPaste(e.target.value)}
        />
      </section>

      <section className={styles.card}>
        <h3>Single-row illustrative capture</h3>
        <p className={styles.help}>Useful for podium demos — appends one coerced row to the in-memory cohort.</p>
        <div className={styles.row}>
          {schema.columns.map((col) => (
            <label key={col.id} className={styles.field}>
              {col.name}
              <input
                type="text"
                value={singleDraft[col.id] ?? ''}
                onChange={(e) => setSingleDraft((draft) => ({ ...draft, [col.id]: e.target.value }))}
              />
            </label>
          ))}
        </div>
        <div className={styles.actions}>
          <button
            type="button"
            onClick={() => {
              const pseudoCsvRow = Object.fromEntries(schema.columns.map((c) => [c.id, singleDraft[c.id] ?? '']))
              const appended = coerceImportedRows(schema, [pseudoCsvRow])[0]
              const next = [...generatedRows, appended]
              setGeneratedRows(next)
              updateGeneration({ rowCount: next.length })
              acknowledgeCohortGeneration()
            }}
          >
            Append single synthetic row
          </button>
        </div>
      </section>

      <section className={styles.card}>
        <h3>Preview ({previewRows.length} of {generatedRows.length})</h3>
        {summaries.length > 0 && (
          <div className={styles.summaryStrip}>
            <strong>Numeric snapshot</strong> (up to 5k rows):{' '}
            {summaries.map((s) => (
              <span key={s.id} className={styles.summaryChip}>
                {s.name}: min {Number.isFinite(s.min) ? s.min.toFixed(1) : '—'}, max{' '}
                {Number.isFinite(s.max) ? s.max.toFixed(1) : '—'}, mean{' '}
                {Number.isFinite(s.mean) ? s.mean.toFixed(2) : '—'}
              </span>
            ))}
          </div>
        )}
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                {schema.columns.map((c) => (
                  <th key={c.id}>{c.id}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {previewRows.map((row, idx) => (
                <tr key={idx}>
                  {schema.columns.map((c) => (
                    <td key={c.id}>{String(row[c.id] ?? '')}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
