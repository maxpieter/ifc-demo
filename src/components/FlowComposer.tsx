import { useMemo, useState } from 'react';
import {
  Box, Button, Card, CardContent, Divider, MenuItem, Stack, TextField, Typography
} from '@mui/material';
import { Lattice, join as rtJoin } from '../models/Lattice';
import { map, bind, join, toIfcLabel, fromIfcLabel } from '../ifcClient';

interface SourceSel { id: string; labelId: string; title: string; ifcLabel: any; value: string; lio: any; }

export default function FlowComposer({
  lattice, sources, onNode
}: {
  lattice: Lattice;
  sources: SourceSel[];
  onNode: (node: {
    id: string;
    title: string;
    labelName: string;
    value: unknown;
    kind: 'map' | 'combine';
    parents: string[];
  }) => void;
}) {
  const [left, setLeft] = useState<string>('');       // source id
  const [right, setRight] = useState<string>('');     // source id
  const [mapSrc, setMapSrc] = useState<string>('');   // source id
  const [mapSuffix, setMapSuffix] = useState('!');

  const mapAction = () => {
    const s = sources.find(x => x.id === mapSrc);
    if (!s) return;
    const mapped = map(s.lio, (v: string) => v + mapSuffix);
    onNode({
      id: crypto.randomUUID(),
      title: `map (${s.title})`,
      labelName: fromIfcLabel(mapped.label) ?? s.labelId,
      value: mapped.value,
      kind: 'map',
      parents: [s.id]
    });
  };

  const combineAction = () => {
    const a = sources.find(x => x.id === left);
    const b = sources.find(x => x.id === right);
    if (!a || !b) return;

    // Use ifc-ts join if available; else runtime
    const jIfc = join(lattice, a.ifcLabel, b.ifcLabel, fromIfcLabel);
    const jName = jIfc ? (fromIfcLabel(jIfc) ?? 'unknown') : (rtJoin(lattice, a.labelId, b.labelId) ?? 'unknown');
    const value = `${a.value} + ${b.value}`;

    onNode({
      id: crypto.randomUUID(),
      title: `combine (${a.title}, ${b.title})`,
      labelName: jName,
      value,
      kind: 'combine',
      parents: [a.id, b.id]
    });
  };

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h6">Flow Composer</Typography>
        <Stack spacing={2}>
          <Box>
            <Typography variant="subtitle2">map</Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <TextField select size="small" label="Source" value={mapSrc} onChange={e => setMapSrc(e.target.value)} sx={{ minWidth: 220 }}>
                {sources.map(s => <MenuItem key={s.id} value={s.id}>{s.title}</MenuItem>)}
              </TextField>
              <TextField size="small" label="Append text" value={mapSuffix} onChange={e => setMapSuffix(e.target.value)} />
              <Button variant="outlined" onClick={mapAction} disabled={!mapSrc}>Add map node</Button>
            </Stack>
          </Box>

          <Divider />

          <Box>
            <Typography variant="subtitle2">combine (join labels)</Typography>
            <Stack direction="row" spacing={1}>
              <TextField select size="small" label="Left source" value={left} onChange={e => setLeft(e.target.value)} sx={{ minWidth: 220 }}>
                {sources.map(s => <MenuItem key={s.id} value={s.id}>{s.title}</MenuItem>)}
              </TextField>
              <TextField select size="small" label="Right source" value={right} onChange={e => setRight(e.target.value)} sx={{ minWidth: 220 }}>
                {sources.map(s => <MenuItem key={s.id} value={s.id}>{s.title}</MenuItem>)}
              </TextField>
              <Button variant="contained" onClick={combineAction} disabled={!left || !right}>Add combine node</Button>
            </Stack>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}