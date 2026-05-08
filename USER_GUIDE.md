# How to use the BioBank Neural Network Builder

This guide explains **what the app is for** and **how to run through it** in a few minutes.

## What this application is

The BioBank Neural Network Builder is a **browser-based design tool**. You use it to:

- Sketch a **sequential neural network** for tabular (spreadsheet-style) data: input columns, hidden layers, and an output head.
- See **shape flow** on the diagram (how wide each layer is as data moves forward).
- Run **feasibility screening**—a sanity check that compares architecture size, sample counts, and declared training assumptions (not a guarantee of real-world performance).
- Generate **synthetic demo rows** (fake patients/cohort rows) so you can rehearse workflows **without real patient data**.
- Run a **mock outcome simulator** that produces illustrative scores—**not** predictions from trained neural weights.
- **Export** your project as JSON, and export the diagram as PNG/PDF for slides.

### What it is not

- **Not** FDA-cleared or CE-marked clinical software.
- **Not** a trainer: it does not fit real weights to your data inside this app.
- **Not** for Protected Health Information (PHI). Use synthetic or fully de-identified demo data only.

The red/black banner at the top of the app repeats this in short form.

## Wiring inputs at a glance

1. **Synthetic data tab:** Add columns and assign **types**. Numeric/binary/ordinal columns can be wired as **scalars** on the Model builder. **Categorical** columns (sites, phases, etc.) use **embeddings** instead.
2. **Model builder:** Use **Features that feed the Input node** for scalars (grouped by demographics, labs, treatment phase…). Use **Categorical inputs** to confirm each categorical column has an embedding layer, or add one with a single click.
3. **Diagram:** Hover the **Input** node to see the selected scalar feature names in a tooltip.

---

## Running the app on your computer

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

## Main screen overview

- **Left side:** Forms and panels for the tab you selected (builder, data, results, or presentation tools).
- **Right side:** **Network diagram**—your layers as boxes and connections. Click a layer to select it and edit details where available.
- **Top:** Workspace tabs, optional **Beginner explanations** and **Presentation layout**, **Open glossary**, and **Export / Import JSON**.

### Skip link (accessibility)

Use **Skip to main content** (visible when you press Tab from the top of the page) to jump straight to the main workspace.

---

## Workspace tabs (what to do in each)

### 1. Model builder

- **Architecture title:** Rename your design (helpful when exporting).
- **Layer palette (`+ Dense`, `+ Dropout`, etc.):** Adds layers **above** the fixed output layer. Hover buttons for short hints.
- **Features that feed the Input node:** Check which **numeric**, **binary**, and **ordinal** columns from your dataset plug into the **Input** layer on the diagram. Fields are **grouped by category** (demographics, labs, treatment phase, etc.) so it is clear what kind of signal each checkbox represents. Turn on **Beginner explanations** in the header for extra context.
- **Categorical inputs:** Lists each **categorical** schema column (e.g. site, phase). Each one needs an **Embedding** layer in the stack—the UI shows **In network** when one exists, or a one-click **Add embedding** button when it does not.
- **Synthetic data tab:** Use the button link inside the scalar checklist to jump there when you need to **add/rename columns** or change **feature groups**.
- **Visual forward-pass scrubber:** Moves the highlight along the diagram to show forward flow (visual aid only).
- **Feasibility screening:** Score and warnings. With **Beginner explanations** on, you get plain-language intro text and can expand **Technical summary** for the same numbers as before.

### 2. Synthetic data

- Define **columns** (id, display name, **type**, and **group** such as demographics or treatment phase). The group labels help organize the Model builder pickers.
- Configure how synthetic rows are generated (seed, counts, column roles).
- Optional **AI assist** can suggest text templates if you run the separate AI proxy (see `README.md`). The app still works if the proxy is off.

### 3. Mock outcomes

- Read the disclaimer the first time you run the simulator.
- **Run mock outcome simulator** fills the table with **demo** probabilities/scores from a deterministic toy simulator—not your diagram’s trained network.
- With **Beginner explanations** on, a short note at the top reminds you of this distinction.

### 4. Presentation

- Download **PNG** or **PDF** snapshots of the diagram.
- Download a **Markdown summary** for documentation or slides.
- Adjust **theme colors** (they apply across the whole app shell).

---

## Helpful header controls

| Control | Purpose |
|--------|---------|
| **Beginner explanations** | Extra plain-language text in panels; feasibility summary can hide inside an expandable “Technical summary”. Preference is saved in this browser (`localStorage`). |
| **Presentation layout** | Slightly larger spacing and type tweaks for demos on a screen or projector. |
| **Open glossary** | Short definitions of terms (layers, embeddings, mock outcomes, etc.). Press Escape or **Close** to dismiss. |

---

## Saving and sharing your work

- **Export JSON project:** Downloads everything needed to reopen the same architecture and settings later.
- **Import JSON project:** Loads a previously exported file (replaces the current in-browser project).

Keep exported JSON files secure if they describe real study designs; treat them like any project artifact.

---

## Optional: demo AI helper

See the root **README.md** for `npm run ai-proxy` and environment variables. This is optional and local-only in the reference setup.

---

## If something does not load

- **Blank page or connection error:** Make sure `npm run dev` is still running and you are using the correct URL and port from the terminal.
- **Tests / production build:** From `web/`, run `npm run test` or `npm run build` as described in **README.md** and **DEVELOPER.md**.

---

## Questions this tool answers well

- “Does this **shape** of network **make sense** for my declared cohort size and task?”
- “How would I **explain** this stack on a slide?”
- “Can I generate **synthetic rows** and **mock outputs** for a **methods rehearsal**?”

## Questions it does not answer

- “How accurate will this model be on real patients?” (requires real training, validation, and governance outside this app.)

If you extend the codebase, use **DEVELOPER.md** for architecture and file pointers.
