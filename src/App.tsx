import { useCallback, useState } from 'react';
import { Box, Chip, Container, Divider, Grid2 as Grid, List, ListItem, ListItemText, Paper, Stack, Tab, Tabs, Typography } from '@mui/material';
import { emptyLattice } from './models/Lattice';
import type { Lattice } from './models/Lattice';
import { RuntimeLabel } from './models/Label';
import LabelEditor from './components/LabelEditor';
import SourceFetcher from './components/SourceFetcher';
import FlowComposer from './components/FlowComposer';
import FlowVisualizer from './components/FlowVisualizer';
import PresetLatticeLoader from './components/PresetLatticeLoader';
import SinkPanel from './components/SinkPanel';
import ExplanationPanel from './components/ExplanationPanel';
import { emptyGraph } from './models/FlowGraph';
import type { FlowGraph } from './models/FlowGraph';
import { fromIfcLabel, leq as ifcLeq, mkIfcLabel, toIfcLabel } from './ifcClient';
import LatticeGraph from './components/LatticeGraph';
import CustomLatticeLoader from './components/CustomLatticeLoader';
import Theory from './components/Theory';

type Src = {
  id: string;
  title: string;
  value: string;
  rtLabel: RuntimeLabel;
  ifcLabel: any;
  lio: any;
};

type Sink = { id: string; name: string; label: RuntimeLabel; };

type Snapshot = {
  lattice: Lattice;
  sources: Src[];
  sinks: Sink[];
  graph: FlowGraph;
  expl: string[];
};

export default function App() {
  const [lattice, setLatticeState] = useState(emptyLattice());
  const [sources, setSourcesState] = useState<Src[]>([]);
  const [sinks, setSinksState] = useState<Sink[]>([]);
  const [graph, setGraphState] = useState<FlowGraph>(emptyGraph());
  const [expl, setExplState] = useState<string[]>([]);
  const [history, setHistory] = useState<Snapshot[]>([]);

  const runAction = useCallback((action: () => void) => {
    setHistory(prev => [...prev, {
      lattice,
      sources,
      sinks,
      graph,
      expl
    }]);
    action();
  }, [lattice, sources, sinks, graph, expl]);

  const pushExplanation = useCallback((s: string) => {
    setExplState(prev => [s, ...prev].slice(0, 50));
  }, []);

  const undo = useCallback(() => {
    setHistory(prev => {
      if (!prev.length) return prev;
      const snapshot = prev[prev.length - 1];
      setLatticeState(snapshot.lattice);
      setSourcesState(snapshot.sources);
      setSinksState(snapshot.sinks);
      setGraphState(snapshot.graph);
      setExplState(snapshot.expl);
      return prev.slice(0, -1);
    });
  }, []);

  const canUndo = history.length > 0;

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
    runAction(() => {
      const title = `source(${s.rtLabel.name})`;
      const nodeId = s.id;
      setSourcesState(prev => [...prev, { id: nodeId, title, value: s.value, rtLabel: s.rtLabel, ifcLabel: s.ifcLabel, lio: s.lio }]);
      setGraphState(prev => ({
        nodes: [...prev.nodes, {
          id: nodeId,
          kind: 'source',
          position: { x: 40 + prev.nodes.length * 40, y: 60 },
          data: { title, value: s.value, label: s.rtLabel }
        }],
        edges: [...prev.edges]
      }));
      pushExplanation(`Created source with value="${s.value}" and label ${s.rtLabel.name}.`);
    });
  };

  // add map/combine nodes
  const onCompose = (node: {
    id: string; title: string; labelName: string; value: unknown; kind: 'map' | 'combine'; parents: string[];
  }) => {
    const rt = Object.values(lattice.labels).find(l => l.id === node.labelName) 
        ?? { 
             id: node.labelName.toLowerCase().replace(/\s+/g, '-'), 
             name: node.labelName 
           };
    runAction(() => {
      setGraphState(prev => ({
        nodes: [...prev.nodes, {
          id: node.id,
          kind: node.kind,
          position: { x: 160 + prev.nodes.length * 40, y: 180 },
          data: { title: node.title, value: node.value, label: rt }
        }],
        edges: [...prev.edges, ...node.parents.map((p, i) => ({ id: `${node.id}-${i}`, from: p, to: node.id, label: node.kind }))]
      }));
      pushExplanation(`${node.kind === 'map' ? 'Mapped' : 'Combined'} → new node label approximated as ${rt.name}.`);
    });
  };

  const onCreateSink = (s: Sink) => {
    runAction(() => {
      setSinksState(prev => [...prev, s]);
      pushExplanation(`Created sink "${s.name}" with label ${s.label.name}.`);
    });
  };

  const onRemoveSink = (sinkId: string) => {
    const sink = sinks.find(s => s.id === sinkId);
    if (!sink) return;
    runAction(() => {
      setSinksState(prev => prev.filter(s => s.id !== sinkId));
      setGraphState(prev => {
        const targetId = `sink-${sinkId}`;
        const nodes = prev.nodes.filter(n => n.id !== targetId);
        const edges = prev.edges.filter(e => e.from !== targetId && e.to !== targetId);
        return { nodes, edges };
      });
      pushExplanation(`Removed sink "${sink.name}".`);
    });
  };

  // attempt to write into a sink: check leq(valueLabel, sinkLabel)
  const onTryWrite = (sinkId: string) => {
    const sink = sinks.find(s => s.id === sinkId);
    if (!sink) return;
    // pick the last node as "current output" for demo; a real app would let user select
    const current = graph.nodes.at(-1);
    if (!current) return;

    const vLblIfc = toIfcLabel(current.data.label);
    const sLblIfc = toIfcLabel(sink.label);
    const ok = ifcLeq(lattice, vLblIfc, sLblIfc, fromIfcLabel);
    console.log("Checking leq:",
      fromIfcLabel(vLblIfc),
      "≤",
      fromIfcLabel(sLblIfc)
    );

    runAction(() => {
      setGraphState(prev => {
        const e = { id: `${current.id}->sink-${sink.id}`, from: current.id, to: `sink-${sink.id}`, label: 'write', violation: !ok };
        const sinkNode = {
          id: `sink-${sink.id}`,
          kind: 'sink' as const,
          position: { x: current.position.x + 240, y: current.position.y },
          data: { title: `sink(${sink.name})`, label: sink.label, violation: !ok }
        };
        const nodes = prev.nodes.some(n => n.id === sinkNode.id) ? prev.nodes : [...prev.nodes, sinkNode];
        const edges = [...prev.edges, e];
        return { nodes, edges };
      });

      if (ok) {
        pushExplanation(`Allowed: value label = ${current.data.label.name} ≤ sink label = ${sink.label.name}. Flow permitted.`);
      } else {
        pushExplanation(`Rejected: join(${current.data.label.name}) ⊑ ${sink.label.name} is false → flow blocked.`);
      }
    });
  };

  const handleLatticeChange = useCallback((lat: Lattice) => {
    runAction(() => {
      setLatticeState(lat);
    });
  }, [runAction]);

  const clearLattice = useCallback(() => {
    runAction(() => {
      setLatticeState(emptyLattice());
      setSourcesState([]);
      setSinksState([]);
      setGraphState(emptyGraph());
      setExplState([]);
    });
  }, [runAction]);

  const clearFlow = useCallback(() => {
    runAction(() => {
      setGraphState(emptyGraph());
    });
  }, [runAction]);

  return (
    <Container sx={{ py: 3 }}>
      <Typography variant="h4" gutterBottom>ifc-ts Interactive Demo</Typography>
      <Typography variant="body1" sx={{ mb: 2 }}>
        Explore label-based IFC: define a lattice, create Labeled IO, compose flows, and try writes to sinks.
      </Typography>
      <Grid container padding={1}>
        <Theory />
      </Grid>
        <Divider sx={{ my: 3 }} />

      <Grid container spacing={2} padding={1} sx={{ alignItems: 'stretch' }}>
        <Grid size={4}>
          {/* Tabs header */}
          <Tabs
            value={value}
            onChange={handleChange}
            aria-label="lattice editor tabs"
            centered
          >
            <Tab label="Preset Lattice" {...a11yProps(0)} />
            <Tab label="Custom Lattice" {...a11yProps(1)} />
          </Tabs>

          {/* Tab content */}
          <CustomTabPanel value={value} index={0}>
            <PresetLatticeLoader onLoad={handleLatticeChange} />
          </CustomTabPanel>

          <CustomTabPanel value={value} index={1}>
            <CustomLatticeLoader lattice={lattice} onChange={handleLatticeChange} />
          </CustomTabPanel>
        </Grid>

        <Grid size={8}>
          <LatticeGraph lattice={lattice} onReset={clearLattice} onUndo={undo} canUndo={canUndo} />
        </Grid>

        <Grid size={8}>
          <LabelEditor lattice={lattice} onChange={handleLatticeChange} />
        </Grid>

        <Grid size={12}>
          <SourceFetcher lattice={lattice} onCreate={onCreateSource} />
        </Grid>

        <Grid size={8} sx={{ display: 'flex' }}>
          <FlowComposer
              lattice={lattice}
              sources={sources.map(s => ({
                id: s.id, title: s.title, labelId: s.rtLabel.id, ifcLabel: s.ifcLabel, value: s.value, lio: s.lio
              }))}
              onNode={onCompose}
              />
        </Grid>

        <Grid size={4} sx={{ display: 'flex' }}>
          <SinkPanel
            lattice={lattice}
            sinks={sinks}
            onCreate={onCreateSink}
            onTryWrite={onTryWrite}
            onRemove={onRemoveSink}
          />
        </Grid>


        <Grid size={8} sx={{ display: 'flex' }}>
          <FlowVisualizer graph={graph} onReset={clearFlow} onUndo={undo} canUndo={canUndo} />
        </Grid>

        <Grid size={4} sx={{ display: 'flex' }}>
          <ExplanationPanel lines={expl} />
        </Grid>
      </Grid>
    </Container>
  );
}
