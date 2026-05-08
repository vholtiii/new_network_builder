import { useProjectStore } from '../store/projectStore'
import { LayerInspector } from './LayerInspector'
import { LayerPalette } from './LayerPalette'
import { ScalarInputPicker } from './ScalarInputPicker'
import styles from './NetworkWorkspace.module.css'

export function BuilderSidebar() {
  const project = useProjectStore((s) => s.project)
  const activeFlowStep = useProjectStore((s) => s.activeFlowStep)
  const selectedLayerId = useProjectStore((s) => s.selectedLayerId)
  const setActiveFlowStep = useProjectStore((s) => s.setActiveFlowStep)
  const removeLayer = useProjectStore((s) => s.removeLayer)
  const layers = project.network.layers

  const removable =
    Boolean(selectedLayerId) &&
    layers.find((l) => l.id === selectedLayerId)?.type !== 'input' &&
    layers.find((l) => l.id === selectedLayerId)?.type !== 'output'

  return (
    <section className={styles.workspace}>
      <div className={styles.toolbar}>
        <LayerPalette />
        <button
          type="button"
          disabled={!removable}
          className={styles.danger}
          onClick={() => selectedLayerId && removeLayer(selectedLayerId)}
        >
          Remove selected layer
        </button>
      </div>
      <ScalarInputPicker dataset={project.datasetSchema} />
      <label className={styles.slider}>
        Visual forward-pass scrubber
        <input
          type="range"
          min={0}
          max={Math.max(0, layers.length - 1)}
          value={activeFlowStep}
          onChange={(e) => setActiveFlowStep(Number(e.target.value))}
        />
      </label>
      <LayerInspector />
    </section>
  )
}
