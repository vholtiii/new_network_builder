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
    body: 'A stack of mathematical layers that transforms numbers (your features) step-by-step into an output (like a risk score or probability). This tool lets you sketch that stack without training real weights.',
  },
  {
    id: 'layer',
    title: 'Layer',
    body: 'One step in the pipeline. Data enters with a width (dimension), may stay the same width, or change width—shown as arrows like 10→32 on the diagram.',
  },
  {
    id: 'input',
    title: 'Input layer',
    body: 'Declares which patient/table columns feed the model first—typically numeric clinical labs or demographics you marked as scalar inputs.',
  },
  {
    id: 'embedding',
    title: 'Embedding',
    body: 'A learnable way to represent categorical text codes as numeric vectors so math layers can use them. Think “convert categories into a short numeric fingerprint.”',
  },
  {
    id: 'dense',
    title: 'Dense (fully connected)',
    body: 'Mixes all incoming features together with weights to produce new combined features. Often where most parameters live.',
  },
  {
    id: 'dropout',
    title: 'Dropout',
    body: 'Randomly switches off parts of the vector during training to reduce memorization (overfitting). In design-only mode it signals intended regularization.',
  },
  {
    id: 'batch_norm',
    title: 'Batch normalization',
    body: 'Rescales intermediate activations for steadier training. Common in deeper stacks.',
  },
  {
    id: 'activation',
    title: 'Activation',
    body: 'Non-linearity like ReLU/sigmoid that lets the model curve fit beyond straight lines. Output activations must match the prediction task.',
  },
  {
    id: 'output',
    title: 'Output layer',
    body: 'Produces the final prediction head—often one unit for binary risk or many units for multi-class. Must align with your declared task.',
  },
  {
    id: 'parameters',
    title: 'Parameters',
    body: 'Learnable numbers (weights/biases). More parameters need more data; feasibility warns when params ≫ samples.',
  },
  {
    id: 'overfitting',
    title: 'Overfitting',
    body: 'When a model memorizes noise instead of general patterns—especially risky with small cohorts and wide layers.',
  },
  {
    id: 'mock-outcomes',
    title: 'Mock outcomes vs diagram',
    body: 'The moving highlight shows architecture flow; numbers in Mock results come from a separate deterministic simulator for demos—not trained neural weights.',
  },
]
