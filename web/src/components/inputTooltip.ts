import type { DatasetSchema } from '../domain/datasetSchema'

/** Comma-separated display names for scalar inputs; truncates with "(+N more)" when long. */
export function buildInputLayerTooltip(schema: DatasetSchema | undefined, scalarColumnIds: string[]): string | undefined {
  if (!schema || scalarColumnIds.length === 0) return undefined
  const names = scalarColumnIds.map((id) => schema.columns.find((c) => c.id === id)?.name ?? id)
  const maxLen = 80
  const joined = names.join(', ')
  if (joined.length <= maxLen) return joined

  for (let take = names.length - 1; take >= 1; take--) {
    const shown = names.slice(0, take).join(', ')
    const hidden = names.length - take
    const candidate = hidden === 0 ? shown : `${shown} (+${hidden} more)`
    if (candidate.length <= maxLen) return candidate
  }

  const first = names[0]
  return `${first.slice(0, Math.max(20, maxLen - 24))}… (+${names.length - 1} more)`
}
