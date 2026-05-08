import { useState } from 'react'
import { templates } from '../domain/templates'
import { aiExplain, aiSuggestSchema } from '../api/aiApi'
import { useProjectStore } from '../store/projectStore'

function proxyBaseUrl(): string {
  return import.meta.env.VITE_AI_PROXY_URL ?? 'http://localhost:8787'
}

export function AiAssistPanel() {
  const enabled = useProjectStore((s) => s.project.features?.aiAssistEnabled ?? false)
  const toggleAiAssist = useProjectStore((s) => s.toggleAiAssist)
  const updateDatasetSchema = useProjectStore((s) => s.updateDatasetSchema)

  const [hint, setHint] = useState('Demographics + labs + PGx placeholders')
  const [explainTopic, setExplainTopic] = useState('Why separate mock outcomes from NN visualization?')
  const [explainOut, setExplainOut] = useState('')
  const [status, setStatus] = useState<string | null>(null)

  const runSuggest = async () => {
    setStatus(null)
    try {
      const schema = await aiSuggestSchema({ baseUrl: proxyBaseUrl() }, hint)
      updateDatasetSchema(schema)
      setStatus('Loaded schema suggestion from AI proxy (still verify manually).')
    } catch (err) {
      const fallback = structuredClone(templates[0].schema)
      updateDatasetSchema(fallback)
      setStatus(`Proxy unreachable — loaded offline template instead (${String((err as Error).message)}).`)
    }
  }

  const runExplain = async () => {
    setStatus(null)
    try {
      const text = await aiExplain({ baseUrl: proxyBaseUrl() }, explainTopic)
      setExplainOut(text)
      setStatus('LLM explanation retrieved (synthetic helper text).')
    } catch (err) {
      setExplainOut(
        'Offline fallback: mock outcomes are intentionally decoupled from random neural weights so demonstrations remain reproducible and ethically bounded.',
      )
      setStatus(`Proxy unreachable — showing canned explanation (${String((err as Error).message)}).`)
    }
  }

  return (
    <section style={{ border: '1px solid #e2e8f0', borderRadius: 12, padding: '1rem' }}>
      <label style={{ display: 'flex', gap: '0.65rem', alignItems: 'center', fontWeight: 700 }}>
        <input type="checkbox" checked={enabled} onChange={(e) => toggleAiAssist(e.target.checked)} />
        Enable optional AI proxy features (requires running scripts/ai-proxy.mjs)
      </label>
      <p style={{ color: '#475569', fontSize: '0.9rem' }}>
        AI outputs are assistive only. The core app remains offline-capable without any API calls.
      </p>
      <div style={{ marginTop: '0.75rem', display: 'grid', gap: '0.65rem' }}>
        <textarea value={hint} onChange={(e) => setHint(e.target.value)} rows={3} style={{ width: '100%' }} />
        <button type="button" disabled={!enabled} onClick={runSuggest}>
          Request schema suggestion
        </button>
      </div>
      <div style={{ marginTop: '1rem', display: 'grid', gap: '0.65rem' }}>
        <textarea value={explainTopic} onChange={(e) => setExplainTopic(e.target.value)} rows={2} style={{ width: '100%' }} />
        <button type="button" disabled={!enabled} onClick={runExplain}>
          Request narrative explanation
        </button>
        {explainOut && (
          <pre style={{ whiteSpace: 'pre-wrap', background: '#f8fafc', padding: '0.75rem', borderRadius: 8 }}>{explainOut}</pre>
        )}
      </div>
      {status && <p style={{ marginTop: '0.75rem', fontWeight: 600 }}>{status}</p>}
    </section>
  )
}
