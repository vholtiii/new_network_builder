export type GlossaryEntry = {
  id: string
  title: string
  body: string
}

/** Plain-language reference copy for novices (not clinical guidance). */
export const glossaryTerms: GlossaryEntry[] = [
  {
    id: 'neural-network',
    title: 'Neural network (very short)',
    body:
      'Plain English: a recipe made of stacked math blocks that turns rows from your table into one outcome column (risk score, probability, or similar).\n\n' +
      'Technical: a sequential composition of layers that maps numeric features through transformations toward an output. This tool sketches that architecture without training real weights.',
  },
  {
    id: 'scalar-vs-categorical',
    title: 'Scalar inputs vs categorical',
    body:
      'Plain English: numbers you type as digits (age, lab values, yes/no) plug straight into the first math matrix inside “Features that feed the Input node.” Pick-list columns such as site or phase need a separate bridge (embedding) so the stack sees numbers instead of labels.\n\n' +
      'Technical: numeric/binary/ordinal columns map to scalar input dimensions; categorical codes route through embedding layers before merging into downstream dense layers.',
  },
  {
    id: 'diagram-arrows-width',
    title: 'Diagram arrows (e.g. 10→32)',
    body:
      'Plain English: the arrow reads “we went from this many parallel measurements down/up to that many slots.” More slots usually mean more room for the stack to combine signals—but also more learnable knobs.\n\n' +
      'Technical: tensor width / channel dimension between consecutive layers as rendered on the graph.',
  },
  {
    id: 'layer',
    title: 'Layer',
    body:
      'Plain English: one processing station along an assembly line. Each station expects an incoming bundle of numbers and hands off another bundle of possibly different size.\n\n' +
      'Technical: one step in the pipeline. Width changes appear as arrows like 10→32 on the diagram.',
  },
  {
    id: 'input',
    title: 'Input layer',
    body:
      'Plain English: the checklist under “Features that feed the Input node”—these spreadsheet columns enter the diagram first.\n\n' +
      'Technical: declares scalar-connected dataset columns feeding the initial weighted computation.',
  },
  {
    id: 'embedding',
    title: 'Embedding',
    body:
      'Plain English: “translation booth” that converts category labels into short numeric fingerprints the math layers can multiply.\n\n' +
      'Technical: learnable lookup from categorical indices into vectors consumed by downstream dense layers.',
  },
  {
    id: 'dense',
    title: 'Dense (fully connected)',
    body:
      'Plain English: every incoming measurement participates in mixing weights—think blending everything together before producing new blended readings.\n\n' +
      'Technical: affine transformation mixing all input dimensions into each output unit—typically hosts many trainable parameters.',
  },
  {
    id: 'dropout',
    title: 'Dropout',
    body:
      'Plain English: during training, temporarily mute random knobs so the model cannot memorize quirks—similar to studying flashcards while randomly hiding sentences.\n\n' +
      'Technical: stochastic masking of activations during optimization to reduce overfitting; in design-only mode it communicates intent.',
  },
  {
    id: 'batch_norm',
    title: 'Batch normalization',
    body:
      'Plain English: steady-the-numbers housekeeping halfway down deep stacks so training behaves instead of zig-zagging.\n\n' +
      'Technical: normalizes intermediate activation statistics per mini-batch (during training) to stabilize gradients.',
  },
  {
    id: 'activation',
    title: 'Activation',
    body:
      'Plain English: a curved knob instead of a straight ruler—lets combinations bend instead of staying purely additive.\n\n' +
      'Technical: element-wise non-linearity (e.g. ReLU, sigmoid) enabling approximation beyond affine maps; output activation choice depends on task.',
  },
  {
    id: 'output',
    title: 'Output layer',
    body:
      'Plain English: the final gauge panel showing whatever headline prediction task you declared.\n\n' +
      'Technical: prediction head whose dimension matches classification cardinality or regression targets.',
  },
  {
    id: 'parameters',
    title: 'Parameters',
    body:
      'Plain English: all adjustable knobs learned during training. Huge knobs plus tiny cohorts usually spells trouble.\n\n' +
      'Technical: weights and biases counted toward feasibility screening totals.',
  },
  {
    id: 'overfitting',
    title: 'Overfitting',
    body:
      'Plain English: memorizing noise instead of learning repeatable signals.\n\n' +
      'Technical: low bias/high variance regime especially risky when parameter counts dwarf informative samples.',
  },
  {
    id: 'feasibility-screening',
    title: 'Feasibility screening',
    body:
      'Plain English: a traffic-light style sanity report comparing declared cohort size, model breadth, and task assumptions—not fortune telling.\n\n' +
      'Technical: heuristic score contrasting architectural capacity versus declared samples/training posture.',
  },
  {
    id: 'synthetic-cohort-seed',
    title: 'Synthetic cohort / seed',
    body:
      'Plain English: fake spreadsheet rows you manufacture offline so demos skip PHI; changing the seed is picking a different repeatable lottery outcome.\n\n' +
      'Technical: deterministic pseudo-random generation from scenario plus RNG seed—never substitutes trained inference.',
  },
  {
    id: 'mix-strictness',
    title: 'Phase mix mode (soft vs stratified)',
    body:
      'Plain English: draw phase buckets loosely proportionally (**soft**) or force cohort-wide percentages to match weights (**stratified**).\n\n' +
      'Technical: independent categorical draws versus proportional stratification across pseudo patient cohort.',
  },
  {
    id: 'cohort-role',
    title: 'Cohort role column',
    body:
      'Plain English: tag telling the synthetic generator “this column is age,” “this is relapse flag,” etc. Helpful wiring—not magic training juice.\n\n' +
      'Technical: optional syntheticRole metadata guiding thematic cohort synthesis defaults.',
  },
  {
    id: 'mock-outcomes',
    title: 'Mock outcomes vs diagram',
    body:
      'Plain English: the animated glow traces architectural plumbing; numbers inside Mock outcomes arrive from a separate toy simulator.\n\n' +
      'Technical: deterministic illustrative simulator disconnected from fitted neural weights.',
  },
]
