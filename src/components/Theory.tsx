import { Paper, Typography, Box, Divider } from '@mui/material';

export default function Theory() {
  return (
    <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
      <Typography variant="body1" sx={{ mb: 2 }}>
        A <strong>lattice</strong> is a super special type of a <strong>POSET</strong> in which
        every pair of elements has both a least upper bound (<strong>lub</strong>) and a greatest
        lower bound (<strong>glb</strong>). The lattice organises security levels and describes how
        information may or may not flow between them (e.g., <em>Low ≤ High</em>). A{' '}
        <strong>level</strong> refers to a specific security classification or label in the lattice.
        Levels are the elements (nodes) of the lattice, ordered according to the confidentiality
        hierarchy.
      </Typography>

      <Typography variant="body1" sx={{ mb: 2 }}>
        The <strong>least upper bound (lub)</strong> of two elements in a lattice is the{' '}
        <em>smallest element that is greater than or equal to both</em>. In IFC, when combining two
        pieces of data, the resulting label is the lub of their labels (the more restrictive of the
        two). The <strong>greatest lower bound (glb)</strong> of two elements in a lattice is the{' '}
        <em>largest element that is less than or equal to both</em>. This represents the most
        permissive level that is still no more sensitive than either element.
      </Typography>

      <Typography variant="body1">
        Tying this together with IO, IFC refers to input as a <strong>source</strong> and output a{' '}
        <strong>sink</strong>. A source is an origin point of information (input). In IFC terms, it
        is data or a process at some security level producing values that may flow to other parts of
        the system. A sink is a destination (output) for information, such as a file, console, or
        communication channel. Security enforcement ensures that a sink labeled with a low level
        cannot receive information from a higher-level source unless explicitly allowed.
      </Typography>

      <Divider sx={{ my: 1.5 }} />

      {/* How to use the app */}
      <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
        How to use this app
      </Typography>
      <Box component="ol" sx={{ pl: 3, m: 0, '& li': { mb: 0.5 } }}>
        <li>
          <Typography variant="body2">
            <strong>Choose a lattice:</strong> Choose a Preset Lattice or build your own by adding
            labels and ≤ relations
          </Typography>
        </li>
        <li>
          <Typography variant="body2">
            <strong>Create source labeled data:</strong> enter a value and assign a level label
          </Typography>
        </li>
        <li>
          <Typography variant="body2">
            <strong>Model flows:</strong> then, you can map (monad transformation) or combine two
            values—label to find their <strong>join (lub)</strong>.
          </Typography>
        </li>
        <li>
          <Typography variant="body2">
            <strong>Try outputs:</strong> Create sinks with target labels and click write. A write
            is permitted iff <code>leq(ℓv, ℓs)</code> holds.
          </Typography>
        </li>
        <li>
          <Typography variant="body2">
            <strong>Understand enforcement:</strong> The <em>Flow Visualizer</em> shows allowed
            flows in blue and blocked flows in red. The <em>How the flow was evaluated</em> panel
            explains each decision (e.g., “join(Low, High) = High; High ≤ Low is false → rejected”).
          </Typography>
        </li>
      </Box>
    </Paper>
  );
}
