import { useCallback, useEffect, useState } from 'react';
import ReactFlow, {
  applyNodeChanges,
  Background,
  Controls,
  Edge,
  Node,
  NodeChange,
} from 'reactflow';
import type { Node as ReactFlowNode } from 'reactflow';
import { Card, CardContent, IconButton, Typography } from '@mui/material';
import type { FlowGraph } from '../models/FlowGraph';
import type { NodeKind } from '../models/FlowNode';
import RefreshIcon from '@mui/icons-material/Refresh';
import UndoIcon from '@mui/icons-material/Undo';

type FlowVisualizerProps = {
  graph: FlowGraph;
  onReset?: () => void;
  onUndo?: () => void;
  canUndo?: boolean;
  selectedNodeId?: string;
  onSelectNode?: (nodeId?: string) => void;
};

export default function FlowVisualizer({
  graph,
  onReset,
  onUndo,
  canUndo,
  selectedNodeId,
  onSelectNode,
}: FlowVisualizerProps) {
  const kindPalette: Record<NodeKind, { bg: string; border: string }> = {
    source: { bg: '#b3f7b8ff', border: '#2e7d32' },
    map: { bg: '#e3f2fd', border: '#1565c0' },
    combine: { bg: '#dee8ff', border: '#283593' },
    sink: { bg: '#ffecccff', border: '#ed6c02' },
  };

  const buildNodes = useCallback(
    (): Node[] =>
      graph.nodes.map((n) => {
        const palette = kindPalette[n.kind] ?? { bg: '#f5f5f5', border: '#90caf9' };
        const violation = Boolean(n.data.violation);
        const borderColor = violation ? '#f44336' : palette.border;
        const backgroundColor = violation ? '#ffebee' : palette.bg;
        const isSelected = n.id === selectedNodeId;
        return {
          id: n.id,
          position: n.position,
          data: { label: `${n.data.title}\n[label=${n.data.label.name}]${violation ? ' ⚠' : ''}` },
          style: {
            border: `2px solid ${isSelected ? '#673ab7' : borderColor}`,
            boxShadow: isSelected ? '0 0 0 3px rgba(103,58,183,0.3)' : 'none',
            background: backgroundColor,
            whiteSpace: 'pre-line',
            padding: 6,
            cursor: 'pointer',
          },
        };
      }),
    [graph, selectedNodeId]
  );

  const buildEdges = useCallback(
    (): Edge[] =>
      graph.edges.map((e) => ({
        id: e.id,
        source: e.from,
        target: e.to,
        label: e.label,
        animated: true,
        style: { stroke: e.violation ? '#f44336' : '#90caf9' },
      })),
    [graph]
  );

  const [nodes, setNodes] = useState<Node[]>(() => buildNodes());
  const [edges, setEdges] = useState<Edge[]>(() => buildEdges());

  useEffect(() => {
    setNodes((prev) => {
      const previousPositions = new Map(prev.map((n) => [n.id, n.position]));
      const next = buildNodes();
      return next.map((node) => {
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

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: ReactFlowNode) => {
      onSelectNode?.(node.id);
    },
    [onSelectNode]
  );

  const handlePaneClick = useCallback(() => {
    onSelectNode?.(undefined);
  }, [onSelectNode]);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  return (
    <Card
      variant="outlined"
      sx={{
        height: '100%',
        minHeight: 520,
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <CardContent sx={{ flexGrow: 1, p: 0, display: 'flex', flexDirection: 'column' }}>
        <Typography variant="h6" sx={{ p: 1 }}>
          Flow Visualizer
        </Typography>
        <div style={{ flex: 1, minHeight: 460, position: 'relative', width: '100%' }}>
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
              '&:hover': { bgcolor: 'background.paper' },
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
              '&:hover': { bgcolor: 'background.paper' },
            }}
          >
            <UndoIcon fontSize="small" />
          </IconButton>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            fitView
            nodesDraggable
            onNodesChange={onNodesChange}
            onNodeClick={handleNodeClick}
            onPaneClick={handlePaneClick}
          >
            <Background />
            <Controls />
          </ReactFlow>
        </div>
      </CardContent>
    </Card>
  );
}
