# BioBank Neural Network Builder

Offline-first React application for **designing sequential tabular neural architectures**, running **feasibility screening**, generating **synthetic BioBank-style cohorts**, producing **mock (non-clinical) outcomes**, and exporting **presentation-ready diagrams**.

> **Not medical device software.** Do not enter PHI. Outputs are demonstrative only.

## Quick start

```bash
cd web
npm install
npm run dev
```

Quality gates:

```bash
npm run test
npm run build
```

Optional demo AI proxy (template responses only):

```bash
npm run ai-proxy
```

Then enable **AI assist** in the Synthetic data tab and (optionally) add `VITE_AI_PROXY_URL=http://localhost:8787` to `web/.env.local`.

## Documentation

| File | Audience |
|------|----------|
| [USER_GUIDE.md](USER_GUIDE.md) | End users and presenters (walkthrough, cohort builder behavior, guided wizard) |
| [DEVELOPER.md](DEVELOPER.md) | Contributors and forks (architecture, cohort sync, tests) |

## Repository layout

| Path | Purpose |
|------|---------|
| [`web/`](web/) | Vite + React + TypeScript client |
| [`web/src/domain`](web/src/domain) | Pure TypeScript contracts, feasibility engine, generators |
| [`web/scripts/ai-proxy.mjs`](web/scripts/ai-proxy.mjs) | Zero-dependency demo backend for optional AI helpers |

## Ethics & data handling

- Synthetic cohort generation stays in-browser unless you intentionally enable the optional proxy.
- Strong disclaimers are shown in-product; keep screenshots redacted.

## License

Private research prototype — add a license before public distribution.
