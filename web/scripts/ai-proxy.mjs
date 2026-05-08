import http from 'node:http'

const PORT = Number(process.env.PORT || 8787)

const starterSchema = {
  columns: [
    { id: 'demo_age', name: 'Age (years)', type: 'numeric', group: 'demographics' },
    { id: 'demo_alt', name: 'ALT', type: 'numeric', group: 'labs' },
    {
      id: 'demo_site',
      name: 'Site code',
      type: 'categorical',
      categories: ['north', 'south'],
      group: 'demographics',
    },
  ],
}

function json(res, status, body) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  })
  res.end(JSON.stringify(body))
}

async function readBody(req) {
  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  const raw = Buffer.concat(chunks).toString('utf8')
  try {
    return JSON.parse(raw || '{}')
  } catch {
    return {}
  }
}

function synthRows(schemaColumns, rowCount, seed) {
  let state = seed >>> 0
  const rand = () => {
    state = (1664525 * state + 1013904223) >>> 0
    return state / 4294967296
  }

  const rows = []
  for (let r = 0; r < rowCount; r++) {
    const row = {}
    for (const col of schemaColumns) {
      if (col.type === 'numeric' || col.type === 'ordinal' || col.type === 'binary') {
        row[col.id] = Number((rand() * 100).toFixed(2))
      } else if (col.type === 'categorical') {
        const cats = col.categories ?? ['A', 'B']
        row[col.id] = cats[Math.floor(rand() * cats.length)] ?? cats[0]
      }
    }
    rows.push(row)
  }
  return rows
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    })
    res.end()
    return
  }

  if (!req.url) {
    json(res, 404, { error: 'not found' })
    return
  }

  if (req.method === 'POST' && req.url.startsWith('/api/suggest-schema')) {
    await readBody(req)
    json(res, 200, { schema: starterSchema })
    return
  }

  if (req.method === 'POST' && req.url.startsWith('/api/generate-rows')) {
    const payload = await readBody(req)
    const schema = payload.schema ?? starterSchema
    const rowCount = Math.min(10_000, Math.max(1, Number(payload.rowCount ?? 10)))
    const seed = Number(payload.seed ?? 1)
    const rows = synthRows(schema.columns ?? [], rowCount, seed)
    json(res, 200, { rows })
    return
  }

  if (req.method === 'POST' && req.url.startsWith('/api/explain')) {
    await readBody(req)
    json(res, 200, {
      text: 'Illustrative narrative: mock outcomes stay independent from random NN weights so demos remain reproducible and PHI-free.',
    })
    return
  }

  json(res, 404, { error: 'not found' })
})

server.listen(PORT, () => {
  console.log(`BioBank AI proxy (demo) listening on http://localhost:${PORT}`)
})
