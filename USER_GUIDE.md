# How to use the BioBank Neural Network Builder

This guide is written so you can **open the app**, **follow a short path once**, then **dip back into sections** when you need detail.

---

## 1. Run the app on your computer

Do this first.

1. Install [Node.js](https://nodejs.org/) (version 20 or newer is recommended).
2. Open a terminal in the project folder, then:

```bash
cd web
npm install
npm run dev
```

3. Open the URL shown in the terminal (usually **http://127.0.0.1:5173/**) in Chrome, Edge, or Firefox.

To stop the server, press `Ctrl+C` in the terminal.

---

## 2. First-time walkthrough (about five minutes)

Use the workspace tabs at the top in roughly this order:

| Step | Tab | What you do |
|------|-----|----------------|
| A | **Cohort builder** | Use **Presentation cohort** for age, sex, site, phases, and relapse toggles. Define or load columns in **Dataset schema**. Set **Cohort role** if needed; **Cohort scenario** + **Generate X synthetic patients** for fake rows; **seed** and count in **Synthetic cohort generator**. |
| B | **Model builder** | Under **Features that feed the Input node**, check numeric/binary/ordinal columns you want as inputs. Under **Categorical inputs**, add an **Embedding** for each categorical column. Use **+ Dense**, **+ Dropout**, etc., to build layers above the output. |
| C | (same tab) | Click layers on the **diagram** on the right. Hover **Input** to see which scalar features are wired. |
| D | (same tab) | Read **Feasibility screening** (turn on **Beginner explanations** for plain-language notes first). |
| E | **Mock outcomes** or **Presentation** | Optional: run the mock simulator for demo tables, or export PNG/PDF of the diagram. |

**Tip:** In the header, turn on **Beginner explanations** while learning, and open **Open glossary** whenever a word is unclear.

### Guided presentation steps (optional)

Turn on **Guided presentation steps** in the header for a **linear 5-step flow** with **Next / Back**. Workspace tabs are locked while guided mode is on—use the step buttons to move between sections.

| Step | Requirements to continue |
|------|-------------------------|
| 1 | Architecture title, patient count ≥ 1, at least one dataset column |
| 2 | Confirm cohort generation (Generate buttons, CSV paste, append row, or Live preview refresh—the preview table already updates automatically when you change settings) |
| 3 | Input scalars selected; every categorical column has an embedding |
| 4 | Apply a hidden-layer preset **or** keep at least one Dense layer before the output |
| 5 | Review the feasibility snapshot on the Presentation tab and tick the confirmation checkbox |

Turn guided mode **off** anytime to use free tab navigation again.

---

## 3. Plain English cheat sheet

Everyday language mapped to what you click (not clinical guidance):

| Say this | Click this |
|----------|------------|
| Spreadsheet-style numbers as model inputs (“scalars”) | **Model builder → Features that feed the Input node** (numeric, binary, ordinal) |
| Pick-list columns (site, phase, etc.) | **Cohort builder:** type **categorical**. **Model builder → Categorical inputs → Add embedding** |
| “How wide is this layer?” | Numbers on diagram arrows (for example **10→32**) |
| Fake patients without real PHI | **Cohort builder:** Presentation cohort + cohort scenario + generator |
| Same fake data again | Same **seed** |
| Sanity check: model size vs cohort | **Feasibility screening** |
| Demo scores (not a trained model) | **Mock outcomes** |

---

## 4. What this application is

The BioBank Neural Network Builder is a **browser-based design tool**. You use it to:

- Sketch a **sequential neural network** for tabular (spreadsheet-style) data.
- See **shape flow** on the diagram (how wide each layer is as data moves forward).
- Run **feasibility screening**—a sanity check on architecture size, sample counts, and declared training assumptions (not a promise of real-world performance).
- Generate **synthetic demo rows** so you can rehearse workflows **without real patient data**.
- Run a **mock outcome simulator** for illustrative scores (**not** predictions from trained neural weights).
- **Export** your project as JSON, and export the diagram as PNG/PDF for slides.

### What it is not

- **Not** FDA-cleared or CE-marked clinical software.
- **Not** a trainer: it does not fit real weights to your data inside this app.
- **Not** for Protected Health Information (PHI). Use synthetic or fully de-identified demo data only.

The red/black banner at the top of the app repeats this in short form.

---

## 5. Main screen overview

- **Left:** Panels for the tab you chose (builder, data, results, presentation).
- **Right:** **Network diagram**—layers as boxes. Click a layer to select it when editing is available.
- **Top:** Tabs, **Beginner explanations**, **Presentation layout**, **Open glossary**, **Export / Import JSON**.

### Skip link (accessibility)

**Skip to main content** appears when you press Tab from the top; use it to jump into the workspace.

---

## 6. Workspace tabs (reference)

### Model builder

- **Architecture title:** Rename your design (useful when exporting).
- **Layer palette (`+ Dense`, `+ Dropout`, …):** Adds layers **above** the fixed output. Hover each button for a short hint.
- **Features that feed the Input node:** Choose **numeric**, **binary**, and **ordinal** columns that feed the **Input** node. Fields are **grouped** (demographics, labs, treatment phase, …).
- **Categorical inputs:** Each **categorical** column needs an **Embedding** in the stack. The UI shows **In network** or **Add embedding**.
- Link from the scalar checklist jumps to **Cohort builder** when you need new columns or groups.
- **Visual forward-pass scrubber:** Highlights forward flow on the diagram (visual only).
- **Feasibility screening:** Score and warnings. With **Beginner explanations**, you get intro text and an expandable **Technical summary**.

### Cohort builder

- **Presentation cohort:** Toggle slide-friendly fields (age, sex, site / center, treatment phases, relapse). Stable column ids sync with the generator; **Suggest model wiring** adds scalars and embeddings on the diagram when those columns exist.
- **Cohort scenario:** Pick a **clinical theme**, tune age band, **relapse probability**, **sex = 1 probability** (binary sex columns only), **labs intensity**, **treatment phase weights**, and **soft vs stratified** mixing. **Generate X synthetic patients** uses the count **X** from the generator section.
- **Preview refresh:** The cohort **preview table** (and numeric snapshot) **updates automatically** a moment after you change the dataset schema, patient count, seed, cohort scenario, or column profiles—you do **not** need Live preview on for the numbers to stay in sync.
- **Live preview (wizard confirmation):** When **on**, each debounced refresh also satisfies **Guided presentation steps → Generate cohort rows**. Explicit **Generate** buttons, CSV paste, or **Append single synthetic row** always count too.
- **Cohort role:** In the schema table, tag **Age**, **Treatment phase**, **Relapse**, or **Site** so themes line up without renaming column ids.
- **Dataset schema:** Columns have **id** (commit renames when you leave the field—ids stay aligned with the diagram’s Input and Embedding wiring), **name**, **type**, **group**, and for **categorical** columns a **Categories** box (one label per line). Empty column names are rejected.
- **Synthetic cohort generator:** **Seed**, **exact patient count**, presets, and **Declared sample size** for feasibility.
- **AI assist:** Optional templates if you run the AI proxy (see **README.md**). **Row generation does not call an LLM**—mock rows come from your scenario and seed offline.

### Mock outcomes

- Read the disclaimer the first time you run it.
- **Run mock outcome simulator** fills the table with **demo** values from a toy simulator—not trained weights from your diagram.
- **Beginner explanations** adds a reminder at the top.

### Presentation

- Download **PNG** or **PDF** of the diagram.
- Download a **Markdown summary** (includes a **Cohort story** section you can paste into slides).
- Adjust **theme colors** for the whole app shell.

---

## 7. Wiring inputs (one-minute recap)

1. **Cohort builder:** Set column **types**. Numeric/binary/ordinal → wire as scalars on Model builder. **Categorical** → use **embeddings**.
2. **Model builder:** **Features that feed the Input node** for scalars; **Categorical inputs** for embeddings.
3. **Diagram:** Hover **Input** to see scalar feature names.

---

## 8. Helpful header controls

| Control | Purpose |
|---------|---------|
| **Beginner explanations** | Extra plain-language text in panels. Feasibility can tuck detail under **Technical summary**. Saved in this browser (`localStorage`). |
| **Presentation layout** | Larger spacing and type for demos on a screen or projector. |
| **Open glossary** | Short definitions. Press Escape or **Close** to dismiss. |

---

## 9. Saving and sharing

- **Export JSON project:** Everything needed to reopen the same setup later.
- **Import JSON project:** Loads a file (replaces the current in-browser project).

Treat exported JSON like any study artifact if it describes a real design.

---

## 10. Optional: demo AI helper

See **README.md** for `npm run ai-proxy` and environment variables (optional, local-only in the reference setup).

---

## 11. If something does not load

- **Blank page or connection error:** Confirm `npm run dev` is running and you are using the URL and port from the terminal.
- **Tests / production build:** From `web/`, run `npm run test` or `npm run build` (see **README.md** and **DEVELOPER.md**).

---

## 12. What this tool is good for (and not)

**Good for:**

- “Does this **network shape** **make sense** for my declared cohort size and task?”
- “How do I **explain** this stack on a slide?”
- “Can I **rehearse** with **synthetic rows** and **mock outputs**?”

**Not for:**

- “How accurate will this be on real patients?” (needs real training, validation, and governance outside this app.)

For code layout and architecture, see **DEVELOPER.md**.
