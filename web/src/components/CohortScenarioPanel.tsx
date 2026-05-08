import { clinicalThemes, mergeScenarioWithTheme } from '../domain/clinicalThemes'
import type { DatasetSchema } from '../domain/datasetSchema'
import { generateSyntheticRows } from '../domain/synthetic'
import { useProjectStore } from '../store/projectStore'
import styles from './CohortScenarioPanel.module.css'

function findPhaseCategories(schema: DatasetSchema): string[] {
  const col = schema.columns.find(
    (c) => c.syntheticRole === 'treatment_phase' || (c.group === 'treatment_phase' && c.type === 'categorical'),
  )
  return col?.categories ?? []
}

function hasAgeColumn(schema: DatasetSchema): boolean {
  return schema.columns.some(
    (c) =>
      c.syntheticRole === 'age' ||
      (c.type === 'numeric' && c.group === 'demographics' && `${c.name} ${c.id}`.toLowerCase().includes('age')),
  )
}

function hasRelapseColumn(schema: DatasetSchema): boolean {
  return schema.columns.some(
    (c) =>
      c.syntheticRole === 'relapse_or_recurrence' ||
      (c.type === 'binary' && `${c.name} ${c.id}`.toLowerCase().includes('relapse')),
  )
}

export function CohortScenarioPanel() {
  const schema = useProjectStore((s) => s.project.datasetSchema)
  const gen = useProjectStore((s) => s.project.generationSettings)
  const beginnerMode = useProjectStore((s) => s.beginnerMode)
  const updateCohortScenario = useProjectStore((s) => s.updateCohortScenario)
  const updateGeneration = useProjectStore((s) => s.updateGeneration)

  const cs = gen.cohortScenario
  const themeId = cs?.activeThemeId ?? 'balanced_general'
  const resolved = mergeScenarioWithTheme(themeId, cs)
  const phaseCats = findPhaseCategories(schema)

  const applyTheme = (id: string) => {
    const t = clinicalThemes.find((x) => x.id === id)
    if (!t) return
    updateCohortScenario({
      activeThemeId: id,
      ageRange: { ...t.defaults.ageRange },
      treatmentPhaseWeights: t.defaults.treatmentPhaseWeights ? { ...t.defaults.treatmentPhaseWeights } : undefined,
      relapseProbability: t.defaults.relapseProbability,
      labsIntensity: t.defaults.labsIntensity,
      mixStrictness: t.defaults.mixStrictness,
    })
  }

  const runGenerate = () => {
    const settings = useProjectStore.getState().project.generationSettings
    const ds = useProjectStore.getState().project.datasetSchema
    useProjectStore.getState().setGeneratedRows(generateSyntheticRows(ds, settings))
  }

  return (
    <section className={styles.card}>
      <h3>Cohort scenario</h3>
      <p className={styles.lead}>
        Pick a clinical theme, tune ranges and mixes, then generate <strong>{gen.rowCount}</strong> synthetic patients.
        All draws are seeded for reproducibility (change seed for a new draw).
      </p>
      {beginnerMode && (
        <p className={styles.helpBeginner}>
          Themes bundle sensible defaults—like preset sliders—for fake patient mixes (age spread, relapse chance, lab
          volatility). The <strong>seed</strong> is the dice-roll recipe: same seed → same fake rows; shuffle or edit it
          for a fresh cohort. <strong>Labs intensity</strong> controls how jumpy numeric lab-like columns look.{' '}
          <strong>Phase mix mode</strong>: soft draws phases loosely from weights; stratified forces cohort-wide
          proportions to match those weights more tightly.
        </p>
      )}

      <fieldset className={styles.themes}>
        <legend className={styles.legend}>Theme</legend>
        <div className={styles.themeGrid} role="radiogroup" aria-label="Clinical cohort theme">
          {clinicalThemes.map((t) => (
            <div
              key={t.id}
              className={themeId === t.id ? `${styles.themeCard} ${styles.themeCardActive}` : styles.themeCard}
            >
              <label className={styles.themePick}>
                <input type="radio" name="clinical-theme" checked={themeId === t.id} onChange={() => applyTheme(t.id)} />
                <span className={styles.themeTitle}>{t.label}</span>
              </label>
              <p className={styles.themeDesc}>{t.description}</p>
            </div>
          ))}
        </div>
      </fieldset>

      <div className={styles.grid}>
        <label className={styles.field}>
          Age min
          <input
            type="number"
            disabled={!hasAgeColumn(schema)}
            value={resolved.ageRange.min}
            onChange={(e) =>
              updateCohortScenario({
                ageRange: { min: Number(e.target.value), max: resolved.ageRange.max },
              })
            }
          />
          {!hasAgeColumn(schema) && (
            <span className={styles.hint}>Assign Cohort role “Age” or add a demographics numeric age column.</span>
          )}
        </label>
        <label className={styles.field}>
          Age max
          <input
            type="number"
            disabled={!hasAgeColumn(schema)}
            value={resolved.ageRange.max}
            onChange={(e) =>
              updateCohortScenario({
                ageRange: { min: resolved.ageRange.min, max: Number(e.target.value) },
              })
            }
          />
        </label>

        <label className={styles.field}>
          Relapse probability (0–1)
          <input
            type="number"
            disabled={!hasRelapseColumn(schema)}
            step={0.05}
            min={0}
            max={1}
            value={resolved.relapseProbability}
            onChange={(e) => updateCohortScenario({ relapseProbability: Number(e.target.value) })}
          />
          {!hasRelapseColumn(schema) && (
            <span className={styles.hint}>Add a binary column with Cohort role “Relapse” or “relapse” in the name.</span>
          )}
        </label>

        <label className={styles.field}>
          Labs intensity
          <select
            value={resolved.labsIntensity}
            onChange={(e) =>
              updateCohortScenario({ labsIntensity: e.target.value as 'low' | 'neutral' | 'high' })
            }
          >
            <option value="low">Low</option>
            <option value="neutral">Neutral</option>
            <option value="high">High</option>
          </select>
        </label>

        <label className={styles.field}>
          Phase mix mode
          <select
            value={resolved.mixStrictness}
            onChange={(e) => updateCohortScenario({ mixStrictness: e.target.value as 'soft' | 'stratified' })}
          >
            <option value="soft">Soft (weighted independent draws)</option>
            <option value="stratified">Stratified (match cohort-wide proportions)</option>
          </select>
        </label>

        <label className={styles.field}>
          Live preview
          <select
            value={gen.livePreview ? 'on' : 'off'}
            onChange={(e) => updateGeneration({ livePreview: e.target.value === 'on' })}
          >
            <option value="off">Off</option>
            <option value="on">On (debounced)</option>
          </select>
        </label>
      </div>

      {phaseCats.length > 0 && (
        <div className={styles.phaseBlock}>
          <h4>Treatment phase weights</h4>
          <p className={styles.hint}>
            Relative weights (need not sum to 100). Applies to the categorical column bound as treatment phase.
          </p>
          <div className={styles.phaseGrid}>
            {phaseCats.map((cat) => (
              <label key={cat} className={styles.field}>
                {cat}
                <input
                  type="number"
                  min={0}
                  step={0.1}
                  value={resolved.treatmentPhaseWeights[cat] ?? 1}
                  onChange={(e) =>
                    updateCohortScenario({
                      treatmentPhaseWeights: {
                        ...resolved.treatmentPhaseWeights,
                        [cat]: Number(e.target.value),
                      },
                    })
                  }
                />
              </label>
            ))}
          </div>
        </div>
      )}

      <div className={styles.actions}>
        <button type="button" className={styles.primary} onClick={runGenerate}>
          Generate {gen.rowCount} synthetic patients
        </button>
        <button
          type="button"
          className={styles.secondary}
          onClick={() => updateGeneration({ seed: (Math.imul(gen.seed, 1664525) + 1013904223) | 0 })}
        >
          Shuffle seed
        </button>
      </div>
    </section>
  )
}
