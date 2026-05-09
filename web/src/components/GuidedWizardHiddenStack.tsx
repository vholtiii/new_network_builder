import { useState } from 'react'
import type { HiddenStackPresetId } from '../domain/guidedWizard'
import { useProjectStore } from '../store/projectStore'
import styles from './GuidedWizardHiddenStack.module.css'

const PRESETS: { id: HiddenStackPresetId; label: string }[] = [
  { id: 'tiny', label: 'Tiny — single 16-unit hidden block' },
  { id: 'small', label: 'Small — 32 → 16 (with batch norm / dropout)' },
  { id: 'medium', label: 'Medium — 64 → 32 → 16' },
]

export function GuidedWizardHiddenStack() {
  const guidedWizardEnabled = useProjectStore((s) => s.guidedWizardEnabled)
  const wizardStepIndex = useProjectStore((s) => s.wizardStepIndex)
  const applyWizardHiddenPreset = useProjectStore((s) => s.applyWizardHiddenPreset)
  const [preset, setPreset] = useState<HiddenStackPresetId>('small')

  if (!guidedWizardEnabled || wizardStepIndex !== 3) return null

  return (
    <section className={styles.panel}>
      <h4 className={styles.title}>Step 4 — Hidden layer preset</h4>
      <p className={styles.help}>
        Replaces layers between your embeddings and the output head. Input, embeddings, and output stay intact.
      </p>
      <div className={styles.options} role="radiogroup" aria-label="Hidden stack size">
        {PRESETS.map((p) => (
          <label key={p.id}>
            <input type="radio" name="hidden-preset" checked={preset === p.id} onChange={() => setPreset(p.id)} />{' '}
            {p.label}
          </label>
        ))}
      </div>
      <button type="button" className={styles.apply} onClick={() => applyWizardHiddenPreset(preset)}>
        Apply hidden stack
      </button>
    </section>
  )
}
