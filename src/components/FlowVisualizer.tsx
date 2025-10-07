import { useCallback, useEffect, useState } from 'react';
import ReactFlow, { applyNodeChanges, Background, Controls, Edge, Node, NodeChange } from 'reactflow';
import { Card, CardContent, IconButton, Typography } from '@mui/material';
import type { FlowGraph } from '../models/FlowGraph';
import RefreshIcon from '@mui/icons-material/Refresh';
import UndoIcon from '@mui/icons-material/Undo';

type FlowVisualizerProps = {
  graph: FlowGraph;
  onReset?: () => void;
  onUndo?: () => void;
  canUndo?: boolean;
};

export default function FlowVisualizer({ graph, onReset, onUndo, canUndo }: FlowVisualizerProps) {
  const buildNodes = useCallback((): Node[] => (
    graph.nodes.map(n => ({
      id: n.id,
      position: n.position,
      data: { label: `${n.data.title}\n[label=${n.data.label.name}]${n.data.violation ? ' ⚠' : ''}` },
      style: {
        border: `2px solid ${n.data.violation ? '#f44336' : '#90caf9'}`,
        whiteSpace: 'pre-line',
        padding: 6
      }
    }))
  ), [graph]);

  const buildEdges = useCallback((): Edge[] => (
    graph.edges.map(e => ({
      id: e.id,
      source: e.from,
      target: e.to,
      label: e.label,
      animated: true,
      style: { stroke: e.violation ? '#f44336' : '#90caf9' }
    }))
  ), [graph]);

  const [nodes, setNodes] = useState<Node[]>(() => buildNodes());
  const [edges, setEdges] = useState<Edge[]>(() => buildEdges());

  useEffect(() => {
    setNodes(prev => {
      const previousPositions = new Map(prev.map(n => [n.id, n.position]));
      const next = buildNodes();
      return next.map(node => {
        const pos = previousPositions.get(node.id);
        return pos ? { ...node, position: pos } : node;
      });
    });
  }, [buildNodes]);

  useEffect(() => {
    setEdges(buildEdges());
  }, [buildEdges]);

  const handleReset = useCallback(() => {
    setNodes([]);
    setEdges([]);
    onReset?.();
  }, [onReset]);

  const handleUndo = useCallback(() => {
    onUndo?.();
  }, [onUndo]);

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
            onClick={handleReset}
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
          <IconButton
            size="small"
            aria-label="undo flow change"
            onClick={handleUndo}
            disabled={!canUndo}
            sx={{
              position: 'absolute',
              top: 12,
              right: 52,
              zIndex: 10,
              bgcolor: 'background.paper',
              boxShadow: 1,
              '&:hover': { bgcolor: 'background.paper' }
            }}
          >
            <UndoIcon fontSize="small" />
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
