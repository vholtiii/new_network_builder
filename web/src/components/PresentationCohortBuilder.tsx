import { useEffect, useState } from 'react'
import { mergeScenarioWithTheme } from '../domain/clinicalThemes'
import type { DatasetColumn, DatasetSchema } from '../domain/datasetSchema'
import type { Layer } from '../domain/networkGraph'
import { useProjectStore } from '../store/projectStore'
import styles from './PresentationCohortBuilder.module.css'

const PID = {
  age: 'age',
  sex: 'sex',
  site: 'cohort_site',
  phase: 'tx_phase',
  relapse: 'relapse_flag',
} as const

function rekeyPhaseWeights(
  prev: Record<string, number> | undefined,
  cats: string[],
): Record<string, number> {
  const out: Record<string, number> = {}
  for (const c of cats) out[c] = prev?.[c] ?? 1
  return out
}

function removeColumnAndRefs(schema: DatasetSchema, layers: Layer[], columnId: string) {
  const columns = schema.columns.filter((c) => c.id !== columnId)
  let nextLayers = layers.filter((l) => !(l.type === 'embedding' && l.schemaColumnId === columnId))
  nextLayers = nextLayers.map((l) => {
    if (l.type !== 'input') return l
    const scalarColumnIds = l.scalarColumnIds.filter((id) => id !== columnId)
    const eligible = scalarColumnIds.filter((id) =>
      columns.some(
        (c) => c.id === id && (c.type === 'numeric' || c.type === 'binary' || c.type === 'ordinal'),
      ),
    )
    return { ...l, scalarColumnIds: eligible.length > 0 ? eligible : l.scalarColumnIds }
  })
  return { schema: { ...schema, columns }, layers: nextLayers }
}

function canDropScalarColumn(schema: DatasetSchema, layers: Layer[], columnId: string): boolean {
  const columnsAfter = schema.columns.filter((c) => c.id !== columnId)
  const inp = layers.find((l): l is Extract<Layer, { type: 'input' }> => l.type === 'input')
  if (!inp) return true
  const remaining = inp.scalarColumnIds
    .filter((id) => id !== columnId)
    .filter((id) =>
      columnsAfter.some(
        (c) => c.id === id && (c.type === 'numeric' || c.type === 'binary' || c.type === 'ordinal'),
      ),
    )
  return remaining.length > 0
}

export function PresentationCohortBuilder() {
  const beginnerMode = useProjectStore((s) => s.beginnerMode)
  const schema = useProjectStore((s) => s.project.datasetSchema)
  const layers = useProjectStore((s) => s.project.network.layers)
  const gen = useProjectStore((s) => s.project.generationSettings)
  const updateDatasetSchema = useProjectStore((s) => s.updateDatasetSchema)
  const updateCohortScenario = useProjectStore((s) => s.updateCohortScenario)
  const replaceTreatmentPhaseWeights = useProjectStore((s) => s.replaceTreatmentPhaseWeights)
  const suggestPresentationModelWiring = useProjectStore((s) => s.suggestPresentationModelWiring)

  const themeId = gen.cohortScenario?.activeThemeId ?? 'balanced_general'
  const resolved = mergeScenarioWithTheme(themeId, gen.cohortScenario)

  const col = (id: string) => schema.columns.find((c) => c.id === id)

  const hasAge = Boolean(col(PID.age))
  const hasSex = Boolean(col(PID.sex))
  const hasSite = Boolean(col(PID.site))
  const hasPhase = Boolean(col(PID.phase))
  const hasRelapse = Boolean(col(PID.relapse))

  const sexColumn = col(PID.sex)
  const [sexCoding, setSexCoding] = useState<'binary' | 'categorical'>('binary')
  useEffect(() => {
    if (sexColumn?.type === 'categorical') setSexCoding('categorical')
    else if (sexColumn?.type === 'binary') setSexCoding('binary')
  }, [sexColumn?.type])

  const phaseCol = col(PID.phase)
  const [phaseDraft, setPhaseDraft] = useState('Induction\nMaintenance\nRelapse')
  useEffect(() => {
    if (phaseCol?.categories?.length) setPhaseDraft(phaseCol.categories.join('\n'))
  }, [phaseCol?.categories])

  const siteCol = col(PID.site)
  const [siteDraft, setSiteDraft] = useState('A\nB\nC')
  useEffect(() => {
    if (siteCol?.categories?.length) setSiteDraft(siteCol.categories.join('\n'))
  }, [siteCol?.categories])

  const applyRemoval = (columnId: string) => {
    if (
      (columnId === PID.age || columnId === PID.sex || columnId === PID.relapse) &&
      !canDropScalarColumn(schema, layers, columnId)
    ) {
      window.alert(
        'Cannot remove this field: the model input would have no scalar features. Add another numeric/binary column first.',
      )
      return
    }
    const { schema: nextSchema, layers: nextLayers } = removeColumnAndRefs(schema, layers, columnId)
    useProjectStore.getState().updateDatasetSchema(nextSchema)
    useProjectStore.getState().setLayers(nextLayers)
  }

  const upsertColumns = (nextCols: DatasetColumn[]) => {
    updateDatasetSchema({ ...schema, columns: nextCols })
  }

  const toggleAge = (on: boolean) => {
    if (!on) {
      applyRemoval(PID.age)
      return
    }
    const ageCol: DatasetColumn = {
      id: PID.age,
      name: 'Age (years)',
      type: 'numeric',
      group: 'demographics',
      syntheticRole: 'age',
    }
    const rest = schema.columns.filter((c) => c.id !== PID.age)
    upsertColumns([ageCol, ...rest])
  }

  const toggleSex = (on: boolean) => {
    if (!on) {
      applyRemoval(PID.sex)
      return
    }
    const binaryCol: DatasetColumn = {
      id: PID.sex,
      name: 'Sex (coded)',
      type: 'binary',
      group: 'demographics',
      syntheticRole: 'sex',
    }
    const catCol: DatasetColumn = {
      id: PID.sex,
      name: 'Sex',
      type: 'categorical',
      categories: ['Female', 'Male', 'Other'],
      group: 'demographics',
      syntheticRole: 'sex',
    }
    const rest = schema.columns.filter((c) => c.id !== PID.sex)
    upsertColumns(sexCoding === 'binary' ? [binaryCol, ...rest] : [catCol, ...rest])
  }

  const setSexCodingAndApply = (mode: 'binary' | 'categorical') => {
    setSexCoding(mode)
    if (!hasSex) return
    const rest = schema.columns.filter((c) => c.id !== PID.sex)
    if (mode === 'binary') {
      upsertColumns([
        { id: PID.sex, name: 'Sex (coded)', type: 'binary', group: 'demographics', syntheticRole: 'sex' },
        ...rest,
      ])
    } else {
      upsertColumns([
        {
          id: PID.sex,
          name: 'Sex',
          type: 'categorical',
          categories: ['Female', 'Male', 'Other'],
          group: 'demographics',
          syntheticRole: 'sex',
        },
        ...rest,
      ])
    }
  }

  const toggleSite = (on: boolean) => {
    if (!on) {
      applyRemoval(PID.site)
      return
    }
    const cats = siteDraft
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)
    const categories = cats.length ? cats : ['A', 'B', 'C']
    const siteColumn: DatasetColumn = {
      id: PID.site,
      name: 'Site',
      type: 'categorical',
      categories,
      group: 'demographics',
      syntheticRole: 'site_or_center',
    }
    const rest = schema.columns.filter((c) => c.id !== PID.site)
    upsertColumns([siteColumn, ...rest])
  }

  const commitSiteCategories = () => {
    if (!hasSite) return
    const cats = siteDraft
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)
    const categories = cats.length ? cats : ['A', 'B', 'C']
    upsertColumns(
      schema.columns.map((c) =>
        c.id === PID.site ? { ...c, categories, type: 'categorical' as const } : c,
      ),
    )
  }

  const togglePhase = (on: boolean) => {
    if (!on) {
      applyRemoval(PID.phase)
      return
    }
    const cats = phaseDraft
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)
    const categories = cats.length ? cats : ['Induction', 'Maintenance', 'Relapse']
    const pc: DatasetColumn = {
      id: PID.phase,
      name: 'Treatment phase',
      type: 'categorical',
      categories,
      group: 'treatment_phase',
      syntheticRole: 'treatment_phase',
    }
    const rest = schema.columns.filter((c) => c.id !== PID.phase)
    upsertColumns([pc, ...rest])
    const prevW = mergeScenarioWithTheme(themeId, gen.cohortScenario).treatmentPhaseWeights
    replaceTreatmentPhaseWeights(rekeyPhaseWeights(prevW, categories))
  }

  const commitPhaseCategories = () => {
    if (!hasPhase) return
    const cats = phaseDraft
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)
    const categories = cats.length ? cats : ['Induction', 'Maintenance', 'Relapse']
    upsertColumns(
      schema.columns.map((c) =>
        c.id === PID.phase
          ? {
              ...c,
              categories,
              type: 'categorical' as const,
              group: 'treatment_phase' as const,
              syntheticRole: 'treatment_phase' as const,
            }
          : c,
      ),
    )
    const prevW = mergeScenarioWithTheme(themeId, gen.cohortScenario).treatmentPhaseWeights
    replaceTreatmentPhaseWeights(rekeyPhaseWeights(prevW, categories))
  }

  const toggleRelapse = (on: boolean) => {
    if (!on) {
      applyRemoval(PID.relapse)
      return
    }
    const rc: DatasetColumn = {
      id: PID.relapse,
      name: 'Relapse',
      type: 'binary',
      group: 'outcomes',
      syntheticRole: 'relapse_or_recurrence',
    }
    const rest = schema.columns.filter((c) => c.id !== PID.relapse)
    upsertColumns([rc, ...rest])
  }

  return (
    <section className={styles.card}>
      <h3>Presentation cohort</h3>
      <p className={styles.lead}>
        Turn on the fields you want on slides—age, sex, site, treatment phases, relapse. Each maps to a stable column
        the generator and model builder understand. Fine-tune themes and weights in <strong>Cohort scenario</strong>{' '}
        below.
      </p>
      {beginnerMode && (
        <p className={styles.helpBeginner}>
          This panel is the fast path for presenter-friendly cohorts. The detailed grid under Dataset schema still lets
          you edit ids and add labs. Use <strong>Suggest model wiring</strong> to connect these fields to the diagram’s
          Input node and embeddings.
        </p>
      )}

      <div className={styles.slotGrid}>
        <div className={styles.slot}>
          <input
            id="pc-age"
            type="checkbox"
            checked={hasAge}
            disabled={hasAge && !canDropScalarColumn(schema, layers, PID.age)}
            onChange={(e) => toggleAge(e.target.checked)}
          />
          <label htmlFor="pc-age">
            Age
            <span className={styles.detail}>Numeric years; uses cohort age band.</span>
          </label>
        </div>
        <div className={styles.slot}>
          <input id="pc-sex" type="checkbox" checked={hasSex} onChange={(e) => toggleSex(e.target.checked)} />
          <label htmlFor="pc-sex">
            Sex
            <span className={styles.detail}>Binary code or categorical labels.</span>
          </label>
        </div>
        <div className={styles.slot}>
          <input id="pc-site" type="checkbox" checked={hasSite} onChange={(e) => toggleSite(e.target.checked)} />
          <label htmlFor="pc-site">
            Site / center
            <span className={styles.detail}>Categorical sites (embedding on model).</span>
          </label>
        </div>
        <div className={styles.slot}>
          <input id="pc-phase" type="checkbox" checked={hasPhase} onChange={(e) => togglePhase(e.target.checked)} />
          <label htmlFor="pc-phase">
            Treatment phases
            <span className={styles.detail}>Phase labels drive scenario weights.</span>
          </label>
        </div>
        <div className={styles.slot}>
          <input
            id="pc-relapse"
            type="checkbox"
            checked={hasRelapse}
            disabled={hasRelapse && !canDropScalarColumn(schema, layers, PID.relapse)}
            onChange={(e) => toggleRelapse(e.target.checked)}
          />
          <label htmlFor="pc-relapse">
            Relapse flag
            <span className={styles.detail}>Binary outcome-related signal.</span>
          </label>
        </div>
      </div>

      {hasAge && (
        <div className={styles.ageRow}>
          <label className={styles.field}>
            Age min
            <input
              type="number"
              value={resolved.ageRange.min}
              onChange={(e) =>
                updateCohortScenario({
                  ageRange: { min: Number(e.target.value), max: resolved.ageRange.max },
                })
              }
            />
          </label>
          <label className={styles.field}>
            Age max
            <input
              type="number"
              value={resolved.ageRange.max}
              onChange={(e) =>
                updateCohortScenario({
                  ageRange: { min: resolved.ageRange.min, max: Number(e.target.value) },
                })
              }
            />
          </label>
        </div>
      )}

      {hasSex && (
        <>
          <div className={styles.sexCoding}>
            <span>Sex coding:</span>
            <label>
              <input
                type="radio"
                name="sex-mode"
                checked={sexCoding === 'binary'}
                onChange={() => setSexCodingAndApply('binary')}
              />{' '}
              Binary (0/1)
            </label>
            <label>
              <input
                type="radio"
                name="sex-mode"
                checked={sexCoding === 'categorical'}
                onChange={() => setSexCodingAndApply('categorical')}
              />{' '}
              Labels (Female / Male / …)
            </label>
          </div>
          <p className={styles.hint}>Binary draws use “Sex = 1 probability” in Cohort scenario.</p>
        </>
      )}

      {hasSite && (
        <label className={styles.field}>
          Site codes (one per line)
          <textarea value={siteDraft} onChange={(e) => setSiteDraft(e.target.value)} onBlur={commitSiteCategories} />
        </label>
      )}

      {hasPhase && (
        <label className={styles.field}>
          Treatment phase labels (one per line)
          <textarea value={phaseDraft} onChange={(e) => setPhaseDraft(e.target.value)} onBlur={commitPhaseCategories} />
          <p className={styles.hint}>Updating labels re-keys phase weights (defaults to 1 for new labels).</p>
        </label>
      )}

      <div className={styles.actions}>
        <button type="button" className={styles.primary} onClick={() => suggestPresentationModelWiring()}>
          Suggest model wiring
        </button>
      </div>
    </section>
  )
}
