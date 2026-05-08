import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { aiExplain, aiSuggestSchema } from './aiApi'

const demoSchema = {
  columns: [{ id: 'age', name: 'Age', type: 'numeric', group: 'demographics' }],
}

const server = setupServer(
  http.post('http://localhost:8787/api/suggest-schema', async () =>
    HttpResponse.json({ schema: demoSchema }),
  ),
  http.post('http://localhost:8787/api/explain', async () =>
    HttpResponse.json({ text: 'hello from msw' }),
  ),
)

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('aiApi + MSW', () => {
  it('loads schema suggestions from optional proxy', async () => {
    const schema = await aiSuggestSchema({ baseUrl: 'http://localhost:8787' }, 'hint')
    expect(schema.columns[0]?.id).toBe('age')
  })

  it('returns explanatory copy', async () => {
    const txt = await aiExplain({ baseUrl: 'http://localhost:8787' }, 'topic')
    expect(txt).toContain('msw')
  })
})
