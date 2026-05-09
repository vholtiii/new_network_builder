import type { Layer } from './networkGraph'
import type { ProjectFile } from './projectFile'

export type RenameDatasetColumnReason = 'empty' | 'duplicate' | 'missing_old'

export type RenameDatasetColumnResult =
  | { ok: true; project: ProjectFile }
  | { ok: false; reason: RenameDatasetColumnReason }

function remapLayers(layers: Layer[], oldId: string, newId: string): Layer[] {
  return layers.map((l) => {
    if (l.type === 'input') {
      return {
        ...l,
        scalarColumnIds: l.scalarColumnIds.map((id) => (id === oldId ? newId : id)),
      }
    }
    if (l.type === 'embedding' && l.schemaColumnId === oldId) {
      return { ...l, schemaColumnId: newId }
    }
    return l
  })
}

/** Rename a dataset column id and remap network wiring + optional generation columnProfiles keys. */
export function renameDatasetColumnInProject(
  project: ProjectFile,
  oldId: string,
  newId: string,
): RenameDatasetColumnResult {
  const trimmed = newId.trim()
  if (!trimmed) return { ok: false, reason: 'empty' }
  if (trimmed === oldId) return { ok: true, project }

  const cols = project.datasetSchema.columns
  if (!cols.some((c) => c.id === oldId)) return { ok: false, reason: 'missing_old' }
  if (cols.some((c) => c.id === trimmed)) return { ok: false, reason: 'duplicate' }

  const nextColumns = cols.map((c) => (c.id === oldId ? { ...c, id: trimmed } : c))
  const gs = project.generationSettings
  let generationSettings = gs
  const prof = gs.columnProfiles
  if (prof?.[oldId]) {
    const { [oldId]: removed, ...rest } = prof
    generationSettings = {
      ...gs,
      columnProfiles: { ...rest, [trimmed]: removed },
    }
  }

  return {
    ok: true,
    project: {
      ...project,
      datasetSchema: { ...project.datasetSchema, columns: nextColumns },
      network: {
        ...project.network,
        layers: remapLayers(project.network.layers, oldId, trimmed),
      },
      generationSettings,
    },
  }
}
