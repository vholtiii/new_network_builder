import type { DatasetSchema } from '../domain/datasetSchema'

export type AiProxyConfig = {
  baseUrl: string
}

async function readJson(res: Response) {
  const text = await res.text()
  try {
    return JSON.parse(text)
  } catch {
    throw new Error('AI proxy returned non-JSON payload.')
  }
}

export async function aiSuggestSchema(cfg: AiProxyConfig, hint: string): Promise<DatasetSchema> {
  const res = await fetch(`${cfg.baseUrl.replace(/\/$/, '')}/api/suggest-schema`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ hint }),
  })
  if (!res.ok) throw new Error(`AI proxy suggest-schema failed (${res.status})`)
  const data = await readJson(res)
  return data.schema as DatasetSchema
}

export async function aiGenerateRows(cfg: AiProxyConfig, payload: { schema: DatasetSchema; rowCount: number; seed: number }) {
  const res = await fetch(`${cfg.baseUrl.replace(/\/$/, '')}/api/generate-rows`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(`AI proxy generate-rows failed (${res.status})`)
  return readJson(res)
}

export async function aiExplain(cfg: AiProxyConfig, topic: string): Promise<string> {
  const res = await fetch(`${cfg.baseUrl.replace(/\/$/, '')}/api/explain`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ topic }),
  })
  if (!res.ok) throw new Error(`AI proxy explain failed (${res.status})`)
  const data = await readJson(res)
  return String(data.text ?? '')
}
