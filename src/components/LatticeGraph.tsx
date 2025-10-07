import React, { useCallback, useEffect, useState } from 'react';
import ReactFlow, { Background, Controls, Node, Edge, applyNodeChanges, NodeChange } from 'reactflow';
import { Card, CardContent, IconButton, Typography } from '@mui/material';
import type { Lattice } from '../models/Lattice';
import RefreshIcon from '@mui/icons-material/Refresh';
import UndoIcon from '@mui/icons-material/Undo';

type LatticeGraphProps = {
  lattice: Lattice;
  onReset?: () => void;
  onUndo?: () => void;
  canUndo?: boolean;
};

export default function LatticeGraph({ lattice, onReset, onUndo, canUndo }: LatticeGraphProps) {
  const buildNodes = useCallback((): Node[] => (
    Object.values(lattice.labels).map((l, idx) => ({
      id: l.id,
      data: { label: l.name },
      position: { x: (idx % 5) * 160, y: Math.floor(idx / 5) * 100 }
    }))
  ), [lattice]);

  const buildEdges = useCallback((): Edge[] => (
    lattice.edges.map((e, i) => ({ id: String(i), source: e.from, target: e.to, animated: true }))
  ), [lattice]);

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
    <Card variant="outlined" sx={{ height: 360, width: '100%' }}>
      <CardContent sx={{ height: 1, p: 0 }}>
        <Typography variant="subtitle1" sx={{ p: 1 }}>Lattice Graph</Typography>
        <div style={{ height: 300, position: 'relative' }}>
          <IconButton
            size="small"
            aria-label="reset lattice layout"
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
            aria-label="undo lattice change"
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
