import { useMemo, useState } from 'react'
import { simulateOutcomes } from '../domain/simulator'
import { useProjectStore } from '../store/projectStore'
import styles from './ResultsPanel.module.css'

export function ResultsPanel() {
  const beginnerMode = useProjectStore((s) => s.beginnerMode)
  const project = useProjectStore((s) => s.project)
  const generatedRows = useProjectStore((s) => s.generatedRows)
  const outcomes = useProjectStore((s) => s.outcomes)
  const setOutcomes = useProjectStore((s) => s.setOutcomes)
  const acknowledged = useProjectStore((s) => s.predictionsAcknowledged)
  const acknowledgePredictions = useProjectStore((s) => s.acknowledgePredictions)

  const [showGate, setShowGate] = useState(false)

  const stats = useMemo(() => {
    if (!outcomes.length) return null
    const probs = outcomes.map((o) => o.probability).filter((p): p is number => typeof p === 'number')
    const meanProb = probs.length ? probs.reduce((a, b) => a + b, 0) / probs.length : null
    return { rows: outcomes.length, meanProb }
  }, [outcomes])

  const runSimulator = () => {
    if (!acknowledged) {
      setShowGate(true)
      return
    }
    const rows = simulateOutcomes({
      rows: generatedRows,
      schema: project.datasetSchema,
      taskType: project.feasibilityDeclarations.taskType,
      seed: project.generationSettings.seed ^ 0x9e3779b9,
      multiclassCount: project.feasibilityDeclarations.multiclassCount,
    })
    setOutcomes(rows)
  }

  return (
    <div className={styles.wrap}>
      {beginnerMode && (
        <p className={styles.intro}>
          This tab runs a <strong>separate toy simulator</strong> on your synthetic rows so you can rehearse talking
          through numbers. It does <strong>not</strong> run the diagram as a trained neural network.
        </p>
      )}
      {showGate && (
        <dialog open className={styles.dialog}>
          <h3>Synthetic prediction acknowledgment</h3>
          <p>
            Outcomes shown here are produced by a <strong>deterministic mock simulator</strong> that is{' '}
            <strong>not</strong> your neural network weights. They exist solely for presentation rehearsals and
            methodology discussions.
          </p>
          <ul>
            <li>No PHI — demo data only.</li>
            <li>Not for clinical decision-making.</li>
            <li>Uncertainty bands are illustrative, not calibrated inference.</li>
          </ul>
          <div className={styles.dialogActions}>
            <button
              type="button"
              onClick={() => {
                acknowledgePredictions()
                setShowGate(false)
              }}
            >
              I understand — continue
            </button>
          </div>
        </dialog>
      )}

      <section className={styles.card}>
        <div className={styles.banner}>
          <strong>Synthetic mock outputs.</strong> Illustrative uncertainty bands; not calibrated predictive inference.
        </div>
        <div className={styles.actions}>
          <button type="button" onClick={() => setShowGate(true)}>
            Review disclaimer
          </button>
          <button type="button" onClick={runSimulator}>
            Run mock outcome simulator
          </button>
        </div>
        {stats && (
          <p className={styles.meta}>
            Rows evaluated: {stats.rows}
            {stats.meanProb !== null && <> · Mean illustrative probability: {stats.meanProb.toFixed(3)}</>}
          </p>
        )}
      </section>

      <section className={styles.card}>
        <h3>Row-level preview</h3>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>#</th>
                <th>Label / class</th>
                <th>Probability / score</th>
                <th>Illustrative lower</th>
                <th>Illustrative upper</th>
              </tr>
            </thead>
            <tbody>
              {outcomes.slice(0, 30).map((o) => (
                <tr key={o.rowIndex}>
                  <td>{o.rowIndex + 1}</td>
                  <td>{o.label ?? '—'}</td>
                  <td>{o.probability?.toFixed(3) ?? o.prediction ?? '—'}</td>
                  <td>{o.lower?.toFixed?.(3) ?? o.lower ?? '—'}</td>
                  <td>{o.upper?.toFixed?.(3) ?? o.upper ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
