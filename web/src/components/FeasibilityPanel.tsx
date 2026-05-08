import { useMemo } from 'react'
import { assessFeasibility } from '../domain/feasibility'
import { propagateShapes } from '../domain/shape'
import { useProjectStore } from '../store/projectStore'
import styles from './Panels.module.css'

export function FeasibilityPanel() {
  const project = useProjectStore((s) => s.project)

  const report = useMemo(() => {
    const shape = propagateShapes(project.network.layers, project.datasetSchema)
    return assessFeasibility({
      layers: project.network.layers,
      shape,
      declarations: project.feasibilityDeclarations,
      dataset: project.datasetSchema,
      training: project.training,
    })
  }, [project])

  return (
    <section className={styles.panel}>
      <header className={styles.header}>
        <h2>Feasibility screening</h2>
        <span className={styles.chip}>
          {report.score}/100 · {report.tier}
        </span>
      </header>
      <pre className={styles.summary}>{report.summary}</pre>
      {report.warnings.length > 0 && (
        <div>
          <h3>Warnings</h3>
          <ul>
            {report.warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </div>
      )}
      <div>
        <h3>Recommended fixes</h3>
        <ul>
          {report.recommendedFixes.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
      </div>
    </section>
  )
}
