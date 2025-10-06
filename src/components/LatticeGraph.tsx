import React, { useCallback, useEffect, useMemo, useState } from 'react';
import ReactFlow, { Background, Controls, Node, Edge, applyNodeChanges, NodeChange } from 'reactflow';
import { Card, CardContent, IconButton, Typography } from '@mui/material';
import { Lattice } from '../models/Lattice';
import RefreshIcon from '@mui/icons-material/Refresh';

export default function LatticeGraph({ lattice }: { lattice: Lattice }) {
  const initialNodes: Node[] = useMemo(
    () =>
      Object.values(lattice.labels).map((l, idx) => ({
        id: l.id,
        data: { label: l.name },
        position: { x: (idx % 5) * 160, y: Math.floor(idx / 5) * 100 }
      })),
    [lattice]
  );
  const initialEdges: Edge[] = useMemo(
    () => lattice.edges.map((e, i) => ({ id: String(i), source: e.from, target: e.to, animated: true })),
    [lattice]
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
    <Card variant="outlined" sx={{ height: 360, width: '100%' }}>
      <CardContent sx={{ height: 1, p: 0 }}>
        <Typography variant="subtitle1" sx={{ p: 1 }}>Lattice Graph</Typography>
        <div style={{ height: 300, position: 'relative' }}>
          <IconButton
            size="small"
            aria-label="reset lattice layout"
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
