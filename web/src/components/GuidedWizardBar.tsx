import {
  validateWizardStep,
  WIZARD_STEP_COUNT,
  WIZARD_STEP_LABELS,
  type WizardStepIndex,
} from '../domain/guidedWizard'
import { useProjectStore } from '../store/projectStore'
import styles from './GuidedWizardBar.module.css'

export function GuidedWizardBar() {
  const guidedWizardEnabled = useProjectStore((s) => s.guidedWizardEnabled)
  const wizardStepIndex = useProjectStore((s) => s.wizardStepIndex)
  const project = useProjectStore((s) => s.project)
  const generatedRows = useProjectStore((s) => s.generatedRows)
  const cohortGenerateAck = useProjectStore((s) => s.cohortGenerateAck)
  const hiddenStackPresetApplied = useProjectStore((s) => s.hiddenStackPresetApplied)
  const feasibilityReviewAck = useProjectStore((s) => s.feasibilityReviewAck)
  const advanceWizardStep = useProjectStore((s) => s.advanceWizardStep)
  const retreatWizardStep = useProjectStore((s) => s.retreatWizardStep)
  const setWizardStepIndex = useProjectStore((s) => s.setWizardStepIndex)
  const setFeasibilityReviewAck = useProjectStore((s) => s.setFeasibilityReviewAck)

  if (!guidedWizardEnabled) return null

  const ctx = {
    generatedRowCount: generatedRows.length,
    cohortGenerateAck,
    hiddenStackPresetApplied,
    feasibilityReviewAck,
  }

  const validation = validateWizardStep(wizardStepIndex as WizardStepIndex, project, ctx)
  const canGoNext = validation.ok && wizardStepIndex < WIZARD_STEP_COUNT - 1
  const canGoBack = wizardStepIndex > 0

  const jumpAllowed = (target: WizardStepIndex) => {
    if (target === wizardStepIndex) return true
    if (target < wizardStepIndex) return true
    for (let s = 0; s < target; s++) {
      const v = validateWizardStep(s as WizardStepIndex, project, ctx)
      if (!v.ok) return false
    }
    return true
  }

  return (
    <div className={styles.wrap} role="region" aria-label="Guided presentation steps">
      <div className={styles.topRow}>
        <p className={styles.title}>Guided steps</p>
        <div className={styles.steps} role="tablist" aria-label="Wizard steps">
          {WIZARD_STEP_LABELS.map((label, idx) => {
            const i = idx as WizardStepIndex
            const current = wizardStepIndex === i
            const allowed = jumpAllowed(i)
            return (
              <button
                key={label}
                type="button"
                role="tab"
                aria-selected={current}
                aria-current={current ? 'step' : undefined}
                disabled={!allowed}
                className={current ? `${styles.stepBtn} ${styles.stepBtnCurrent}` : styles.stepBtn}
                onClick={() => allowed && setWizardStepIndex(i)}
              >
                {idx + 1}. {label}
              </button>
            )
          })}
        </div>
        <div className={styles.navBtns}>
          <button
            type="button"
            className={styles.navBtn}
            disabled={!canGoBack}
            onClick={() => retreatWizardStep()}
          >
            Back
          </button>
          <button
            type="button"
            className={`${styles.navBtn} ${styles.primaryNav}`}
            disabled={!canGoNext}
            onClick={() => advanceWizardStep()}
          >
            Next
          </button>
        </div>
      </div>
      {!validation.ok && validation.messages.length > 0 && (
        <ul className={styles.messages}>
          {validation.messages.map((m) => (
            <li key={m}>{m}</li>
          ))}
        </ul>
      )}
      {wizardStepIndex === 4 && (
        <label className={styles.checkRow}>
          <input
            type="checkbox"
            checked={feasibilityReviewAck}
            onChange={(e) => setFeasibilityReviewAck(e.target.checked)}
          />
          <span>I reviewed feasibility findings (see summary below on this tab, or use Back to open Model builder)</span>
        </label>
      )}
    </div>
  )
}
