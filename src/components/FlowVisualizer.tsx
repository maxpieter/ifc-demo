import { useCallback, useEffect, useMemo, useState } from 'react';
import ReactFlow, { applyNodeChanges, Background, Controls, Edge, Node, NodeChange } from 'reactflow';
import { Card, CardContent, IconButton, Typography } from '@mui/material';
import { FlowGraph } from '../models/FlowGraph';
import RefreshIcon from '@mui/icons-material/Refresh';

export default function FlowVisualizer({ graph }: { graph: FlowGraph }) {
  const initialNodes: Node[] = useMemo(
    () => graph.nodes.map(n => ({
      id: n.id,
      position: n.position,
      data: { label: `${n.data.title}\n[label=${n.data.label.name}]${n.data.violation ? ' ⚠' : ''}` },
      style: {
        border: `2px solid ${n.data.violation ? '#f44336' : '#90caf9'}`,
        whiteSpace: 'pre-line',
        padding: 6
      }
    })),
    [graph]
  );
  const initialEdges: Edge[] = useMemo(
    () => graph.edges.map(e => ({
      id: e.id, source: e.from, target: e.to, label: e.label,
      animated: true, style: { stroke: e.violation ? '#f44336' : '#90caf9' }
    })),
    [graph]
  );

  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);

  useEffect(() => {
    setNodes(initialNodes);
  }, [initialNodes]);

  useEffect(() => {
    setEdges(initialEdges);
  }, [initialEdges]);

  const onReset = useCallback(() => {
    setNodes([...initialNodes]);
    setEdges([...initialEdges]);
  }, [initialNodes, initialEdges]);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes(nds => applyNodeChanges(changes, nds)),
    []
  );

  return (
    <Card variant="outlined" sx={{ height: 520, width: '100%' }}>
      <CardContent sx={{ height: 1, p: 0 }}>
        <Typography variant="h6" sx={{ p: 1 }}>Flow Visualizer</Typography>
        <div style={{ height: 460, position: 'relative' }}>
          <IconButton
            size="small"
            aria-label="reset flow layout"
            onClick={onReset}
            sx={{
              position: 'absolute',
              top: 12,
              right: 12,
              zIndex: 10,
              bgcolor: 'background.paper',
              boxShadow: 1,
              '&:hover': { bgcolor: 'background.paper' }
            }}
          >
            <RefreshIcon fontSize="small" />
          </IconButton>
          <ReactFlow nodes={nodes} edges={edges} fitView nodesDraggable onNodesChange={onNodesChange}>
            <Background />
            <Controls />
          </ReactFlow>
        </div>
      </CardContent>
    </Card>
  );
}
