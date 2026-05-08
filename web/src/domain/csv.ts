import type { DatasetSchema } from './datasetSchema'

export function rowsToCsv(rows: Record<string, string | number>[], schema: DatasetSchema): string {
  const cols = schema.columns.map((c) => c.id)
  const header = cols.join(',')
  const lines = rows.map((row) =>
    cols
      .map((id) => {
        const v = row[id]
        if (typeof v === 'string' && /[",\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`
        return String(v ?? '')
      })
      .join(','),
  )
  return [header, ...lines].join('\n')
}

export function parseCsvPaste(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = text.trim().split(/\r?\n/).filter(Boolean)
  if (lines.length === 0) return { headers: [], rows: [] }
  const headers = splitCsvLine(lines[0])
  const rows: Record<string, string>[] = []
  for (let i = 1; i < lines.length; i++) {
    const cells = splitCsvLine(lines[i])
    const row: Record<string, string> = {}
    headers.forEach((h, idx) => {
      row[h] = cells[idx] ?? ''
    })
    rows.push(row)
  }
  return { headers, rows }
}

function splitCsvLine(line: string): string[] {
  const result: string[] = []
  let cur = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"' && line[i + 1] === '"') {
      cur += '"'
      i++
      continue
    }
    if (ch === '"') {
      inQuotes = !inQuotes
      continue
    }
    if (ch === ',' && !inQuotes) {
      result.push(cur)
      cur = ''
      continue
    }
    cur += ch
  }
  result.push(cur)
  return result.map((s) => s.trim())
}
