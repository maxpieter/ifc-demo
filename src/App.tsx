import { useState } from 'react';
import { Box, Container, Divider, Grid2 as Grid, Paper, Stack, Tab, Tabs, Typography } from '@mui/material';
import { emptyLattice, join as rtJoin, leq as rtLeq } from './models/Lattice';
import { RuntimeLabel } from './models/Label';
import LabelEditor from './components/LabelEditor';
import SourceFetcher from './components/SourceFetcher';
import FlowComposer from './components/FlowComposer';
import FlowVisualizer from './components/FlowVisualizer';
import PresetLatticeLoader from './components/PresetLatticeLoader';
import SinkPanel from './components/SinkPanel';
import ExplanationPanel from './components/ExplanationPanel';
import { emptyGraph, FlowGraph } from './models/FlowGraph';
import { fromIfcLabel, join as ifcJoin, leq as ifcLeq, mkIfcLabel, toIfcLabel } from './ifcClient';
import LatticeGraph from './components/LatticeGraph';
import CustomLatticeLoader from './components/CustomLatticeLoader';
import { Label } from '@mui/icons-material';

type Src = {
  id: string;
  title: string;
  value: string;
  rtLabel: RuntimeLabel;
  ifcLabel: any;
  lio: any;
};

type Sink = { id: string; name: string; label: RuntimeLabel; };

export default function App() {
  const [lattice, setLattice] = useState(emptyLattice());
  const [sources, setSources] = useState<Src[]>([]);
  const [sinks, setSinks] = useState<Sink[]>([]);
  const [graph, setGraph] = useState<FlowGraph>(emptyGraph());
  const [expl, setExpl] = useState<string[]>([]);

  // helper: push explanation
  const explain = (s: string) => setExpl(prev => [s, ...prev].slice(0, 50));

  // helpter: tabs
  const [value, setValue] = useState(0);
  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };
  function a11yProps(index: number) {
    return {
      id: `simple-tab-${index}`,
      'aria-controls': `simple-tabpanel-${index}`,
    };
  }
  interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
  }

  function CustomTabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;

    return (
      <div
        role="tabpanel"
        hidden={value !== index}
        id={`simple-tabpanel-${index}`}
        aria-labelledby={`simple-tab-${index}`}
        {...other}
      >
        {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
      </div>
    );
  }


  // add a source
  const onCreateSource = (s: { id: string; value: string; rtLabel: RuntimeLabel; ifcLabel: any; lio: any; }) => {
    const title = `source(${s.rtLabel.name})`;
    const nodeId = s.id;
    setSources(prev => [...prev, { id: nodeId, title, value: s.value, rtLabel: s.rtLabel, ifcLabel: s.ifcLabel, lio: s.lio }]);
    setGraph(prev => ({
      nodes: [...prev.nodes, {
        id: nodeId,
        kind: 'source',
        position: { x: 40 + prev.nodes.length * 40, y: 60 },
        data: { title, value: s.value, label: s.rtLabel }
      }],
      edges: [...prev.edges]
    }));
    explain(`Created source with value="${s.value}" and label ${s.rtLabel.name}.`);
  };

  // add map/combine nodes
  const onCompose = (node: {
    id: string; title: string; labelName: string; value: unknown; kind: 'map' | 'combine'; parents: string[];
  }) => {
    const rt = Object.values(lattice.labels).find(l => l.id === node.labelName) ?? { id: node.labelName, name: node.labelName };
    setGraph(prev => ({
      nodes: [...prev.nodes, {
        id: node.id,
        kind: node.kind,
        position: { x: 160 + prev.nodes.length * 40, y: 180 },
        data: { title: node.title, value: node.value, label: rt }
      }],
      edges: [...prev.edges, ...node.parents.map((p, i) => ({ id: `${node.id}-${i}`, from: p, to: node.id, label: node.kind }))]
    }));
    explain(`${node.kind === 'map' ? 'Mapped' : 'Combined'} → new node label approximated as ${rt.name}.`);
  };

  const onCreateSink = (s: Sink) => {
    setSinks(prev => [...prev, s]);
    explain(`Created sink "${s.name}" with label ${s.label.name}.`);
  };

  // attempt to write into a sink: check leq(valueLabel, sinkLabel)
  const onTryWrite = (sinkId: string) => {
    const sink = sinks.find(s => s.id === sinkId);
    if (!sink) return;
    // pick the last node as "current output" for demo; a real app would let user select
    const current = graph.nodes.at(-1);
    if (!current) return;

    const vLblIfc = mkIfcLabel(current.data.label.name);
    const sLblIfc = toIfcLabel(sink.label);
    const ok = ifcLeq(lattice, vLblIfc, sLblIfc, fromIfcLabel);

    // decorate the edge & node
    setGraph(prev => {
      const e = { id: `${current.id}->sink-${sink.id}`, from: current.id, to: `sink-${sink.id}`, label: 'write', violation: !ok };
      const sinkNode = {
        id: `sink-${sink.id}`,
        kind: 'sink' as const,
        position: { x: current.position.x + 240, y: current.position.y },
        data: { title: `sink(${sink.name})`, label: sink.label, violation: !ok }
      };
      // include sink node once
      const nodes = prev.nodes.some(n => n.id === sinkNode.id) ? prev.nodes : [...prev.nodes, sinkNode];
      const edges = [...prev.edges, e];
      return { nodes, edges };
    });

    if (ok) {
      explain(`Allowed: value label = ${current.data.label.name} ≤ sink label = ${sink.label.name}. Flow permitted.`);
    } else {
      explain(`Rejected: join(${current.data.label.name}) ⊑ ${sink.label.name} is false → flow blocked.`);
    }
  };

  return (
    <Container sx={{ py: 3 }}>
      <Typography variant="h4" gutterBottom>ifc-ts Interactive Demo</Typography>
      <Typography variant="body1" sx={{ mb: 2 }}>
        Explore label-based IFC: define a lattice, create labeled sources (LIO), compose flows, and try writes to sinks.
      </Typography>

      <Grid container spacing={2} padding={1}>

        <Grid spacing={2} size={12}>
          <LatticeGraph lattice={lattice} />
        </Grid>

        <Grid spacing={2} size={12}>
          <FlowVisualizer graph={graph} />
        </Grid>

      </Grid>

      <Grid container spacing={2} padding={1}>
        <Grid size={4}>

          <Box sx={{ width: '100%' }}>
            {/* Tabs header */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={value} onChange={handleChange} aria-label="lattice editor tabs" centered>
                <Tab label="Preset Lattice" {...a11yProps(0)} />
                <Tab label="Custom Lattice" {...a11yProps(1)} />
              </Tabs>
            </Box>
            {/* Tab content */}
            <CustomTabPanel value={value} index={0}>
              <PresetLatticeLoader onLoad={setLattice} />
            </CustomTabPanel>

            <CustomTabPanel value={value} index={1}>
              <CustomLatticeLoader lattice={lattice} onChange={setLattice} />
            </CustomTabPanel>
          </Box>
        </Grid>

        <Grid size={8}>
          <LabelEditor lattice={lattice} onChange={setLattice} />
        </Grid>


        <Grid size={12}>
          <SourceFetcher lattice={lattice} onCreate={onCreateSource} />
        </Grid>

        <Grid size={12}>
          <FlowComposer
              lattice={lattice}
              sources={sources.map(s => ({
                id: s.id, title: s.title, labelId: s.rtLabel.id, ifcLabel: s.ifcLabel, value: s.value, lio: s.lio
              }))}
              onNode={onCompose}
              />
        </Grid>

        <Grid size={6}>
          <SinkPanel lattice={lattice} sinks={sinks} onCreate={onCreateSink} onTryWrite={onTryWrite} />
        </Grid>
        
        <Grid size={4}>
          <ExplanationPanel lines={expl} />
        </Grid>

      </Grid>

      <Grid container spacing={2} size={12}>
        <Paper variant="outlined">
          <Typography variant="subtitle2">What’s enforced?</Typography>
          <Typography variant="body2">
            - **Label propagation**: combining sources computes a join label (via <code>ifc-ts</code> when exposed, else runtime lattice).<br/>
            - **Sinks**: writing a value with label ℓ<sub>v</sub> to a sink with label ℓ<sub>s</sub> requires <code>leq(ℓv, ℓs)</code>.<br/>
            - **Violations**: attempted writes where <code>leq</code> fails are marked in red with an explanation.
          </Typography>
        </Paper>
        <Divider sx={{ my: 3 }} />
      </Grid>

    </Container>
  );
}