import type { RefObject } from 'react'
import { useMemo, useState } from 'react'
import { assessFeasibility } from '../domain/feasibility'
import { buildImplementationSummary } from '../domain/summary'
import { propagateShapes } from '../domain/shape'
import { useProjectStore } from '../store/projectStore'
import { downloadBlob, downloadText } from '../utils/download'
import { exportDiagramPdf, exportDiagramPng } from '../utils/exportDiagram'
import styles from './PresentationToolbar.module.css'

export function PresentationToolbar({ diagramRef }: { diagramRef: RefObject<HTMLDivElement | null> }) {
  const beginnerMode = useProjectStore((s) => s.beginnerMode)
  const project = useProjectStore((s) => s.project)
  const updateTheme = useProjectStore((s) => s.updateTheme)
  const [busy, setBusy] = useState(false)

  const feasibility = useMemo(() => {
    const shape = propagateShapes(project.network.layers, project.datasetSchema)
    return assessFeasibility({
      layers: project.network.layers,
      shape,
      declarations: project.feasibilityDeclarations,
      dataset: project.datasetSchema,
      training: project.training,
    })
  }, [project])

  const exportPng = async () => {
    const el = diagramRef.current
    if (!el) return
    setBusy(true)
    try {
      const blob = await exportDiagramPng(el)
      downloadBlob('biobank-nn-diagram.png', blob)
    } finally {
      setBusy(false)
    }
  }

  const exportPdf = async () => {
    setBusy(true)
    try {
      const blob = await exportDiagramPdf(diagramRef, {
        title: project.network.metadata?.name ?? 'BioBank NN Builder diagram',
      })
      downloadBlob('biobank-nn-diagram.pdf', blob)
    } finally {
      setBusy(false)
    }
  }

  const exportSummary = () => {
    const md = buildImplementationSummary(project, feasibility)
    downloadText('implementation-summary.md', md, 'text/markdown')
  }

  return (
    <section className={styles.wrap}>
      <h3>Presentation export</h3>
      {beginnerMode && (
        <p className={styles.helper}>
          Use this tab when you want slides-ready assets: freeze the diagram as PNG/PDF and download a short Markdown
          brief. Theme colors apply to the whole app shell.
        </p>
      )}
      <p className={styles.note}>Exports capture the live diagram on the right (hide minimap automatically filtered).</p>
      <div className={styles.actions}>
        <button type="button" disabled={busy} onClick={exportPng}>
          Download PNG
        </button>
        <button type="button" disabled={busy} onClick={exportPdf}>
          Download PDF
        </button>
        <button type="button" onClick={exportSummary}>
          Download summary (Markdown)
        </button>
      </div>
      <div className={styles.themeGrid}>
        <label>
          Primary
          <input type="color" value={project.themeTokens.primary} onChange={(e) => updateTheme({ primary: e.target.value })} />
        </label>
        <label>
          Accent
          <input type="color" value={project.themeTokens.accent} onChange={(e) => updateTheme({ accent: e.target.value })} />
        </label>
        <label>
          Background
          <input
            type="color"
            value={project.themeTokens.background}
            onChange={(e) => updateTheme({ background: e.target.value })}
          />
        </label>
        <label>
          Foreground
          <input
            type="color"
            value={project.themeTokens.foreground}
            onChange={(e) => updateTheme({ foreground: e.target.value })}
          />
        </label>
      </div>
    </section>
  )
}
