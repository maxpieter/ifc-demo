import { useMemo, useState } from 'react';
import { Button, Card, CardContent, MenuItem, Stack, TextField, Typography, Alert } from '@mui/material';
import { Lattice } from '../models/Lattice';
import { RuntimeLabel } from '../models/Label';
import { leq, toIfcLabel, fromIfcLabel } from '../ifcClient';

export interface SinkDef {
  id: string;
  name: string;
  label: RuntimeLabel;
}

export default function SinkPanel({
  lattice,
  sinks,
  onCreate,
  onTryWrite
}: {
  lattice: Lattice;
  sinks: SinkDef[];
  onCreate: (s: SinkDef) => void;
  onTryWrite: (sinkId: string) => void;
}) {
  const labels = useMemo(() => Object.values(lattice.labels), [lattice]);
  const [name, setName] = useState('Console');
  const [labelId, setLabelId] = useState('');

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h6">Sinks</Typography>
        <Stack direction="row" spacing={1}>
          <TextField size="small" label="Sink name" value={name} onChange={e => setName(e.target.value)} />
          <TextField select size="small" label="Label" value={labelId} onChange={e => setLabelId(e.target.value)} sx={{ minWidth: 160 }}>
            {labels.map(l => <MenuItem key={l.id} value={l.id}>{l.name}</MenuItem>)}
          </TextField>
          <Button
            variant="outlined"
            onClick={() => {
              const rt = labels.find(l => l.id === labelId);
              if (!rt) return;
              onCreate({ id: crypto.randomUUID(), name, label: rt });
              setName('Console'); setLabelId('');
            }}
            disabled={!labelId}
          >
            Add Sink
          </Button>
        </Stack>

        <Typography variant="subtitle2" sx={{ mt: 2 }}>Available sinks</Typography>
        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
          {sinks.map(s => (
            <Button key={s.id} variant="contained" onClick={() => onTryWrite(s.id)}>
              Write to {s.name} [{s.label.name}]
            </Button>
          ))}
        </Stack>
      </CardContent>
    </Card>
  );
}