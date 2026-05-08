# Developer guide — BioBank Neural Network Builder

Use this document as a **template playbook** when extending or forking the project for similar “typed domain core + React visualization” tools.

## 1. Product boundaries

- **Synthetic-only**: mock outcomes are produced by `simulateOutcomes` (`src/domain/simulator.ts`), **not** learned neural weights.
- **PHI-free**: no persistence layer ships in v1; exports are local downloads only.
- **Optional AI proxy**: `scripts/ai-proxy.mjs` plus `src/api/aiApi.ts`. The UI must remain usable when the proxy is offline (`AiAssistPanel` falls back to canned templates/text).

## 2. Architecture map

```
domain contracts ──► shape propagation ──► feasibility scoring
       │                     │
       └─► synthetic rows ──► mock simulator ──► results UI
React Flow canvas reads the same Zustand store for visualization + scrubber state.
```

Key folders:

- `src/domain/*` — deterministic logic covered by Vitest.
- `src/store/projectStore.ts` — single source of UI truth (`ProjectFile` envelope).
- `src/components/*` — presentation + forms.
- `src/__fixtures__/*.json` — golden JSON used in tests.

## 3. Phase roadmap → code anchors

| Phase theme | Primary files |
|-------------|---------------|
| Contracts | `domain/projectFile.ts`, `domain/networkGraph.ts`, `domain/datasetSchema.ts` |
| Shape engine | `domain/shape.ts` |
| Feasibility | `domain/feasibility.ts` |
| Synthetic data | `domain/synthetic.ts`, `domain/templates.ts`, `domain/csv.ts` |
| Mock outcomes | `domain/simulator.ts` |
| Summary export | `domain/summary.ts`, `PresentationToolbar.tsx` |
| Optional AI | `api/aiApi.ts`, `components/AiAssistPanel.tsx`, `scripts/ai-proxy.mjs` |

## 4. Getting started

Requirements: Node 20+ recommended.

```bash
cd web
npm install
npm run dev        # Vite dev server
npm run test       # Vitest + RTL + MSW suites
npm run build      # typecheck + production bundle
npm run ai-proxy   # optional localhost helper (port 8787)
```

Windows paths with spaces work fine when quoted in PowerShell (`cd "...\web"`).

## 5. Verification checklist (run before merging)

1. `npm run test`
2. `npm run build`
3. Spot-check UI flows:
   - Builder tab edits propagate through feasibility panel.
   - Synthetic data regeneration preserves deterministic seeds.
   - Results tab shows acknowledgment gate before first simulation batch.
   - Presentation exports emit non-empty PNG/PDF blobs locally.

## 6. Fixtures & simulations

- Add frozen JSON under `src/__fixtures__/`.
- Prefer **deterministic seeds** for any randomness (`generationSettings.seed`, simulator XOR constants).
- When altering `ProjectFile.version`, write migration notes inside `projectFile.ts`.

## 7. Extension cookbook

### Add a layer type

1. Extend `layerSchema` discriminated union in `networkGraph.ts`.
2. Teach `propagateShapes` how dimensions evolve.
3. Update `estimateParameterCount`.
4. Add feasibility hints if the layer impacts capacity.
5. Render summaries in `LayerNode.tsx`, inspector controls in `LayerInspector.tsx`, palette shortcut in `LayerPalette.tsx`.

### Add feasibility signal

Edit `assessFeasibility` (`domain/feasibility.ts`): accumulate structured warnings, adjust penalties, and append actionable fixes (they dedupe automatically).

### Add dataset column typing rules

1. Extend `columnTypeSchema` / UI selects inside `DataWorkspace.tsx`.
2. Update `generateSyntheticRows` and CSV coercion helpers.

### Planning DAG support later

Keep sequential assumptions centralized in `shape.ts` + inspector reorder constraints so you can swap in adjacency-list semantics without rewriting feasibility formulas.

## 8. JSON contracts

`parseProjectFile` (`domain/projectFile.ts`) is the import gate. Always bump `PROJECT_FILE_VERSION` when breaking envelopes and snapshot-test migrations.

## 9. Optional AI proxy security expectations

- Run locally or behind authenticated gateways—never expose wide-open proxies on public networks.
- Do **not** forward patient payloads; the reference proxy ignores persistence intentionally.
- Surface disclosure when responses originate from LLMs vs templates (`AiAssistPanel` status string).

## 10. Governance for contributors

- Never paste real patient rows into issues or fixtures.
- Redact institutional branding screenshots unless cleared.

---

Need automation? See [`.github/workflows/ci.yml`](.github/workflows/ci.yml) for the reference CI pipeline.
