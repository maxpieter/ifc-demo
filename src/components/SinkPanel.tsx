import { useMemo, useState } from 'react';
import { Button, Card, CardContent, MenuItem, Stack, TextField, Typography, IconButton } from '@mui/material';
import { Lattice } from '../models/Lattice';
import { RuntimeLabel } from '../models/Label';
import DeleteIcon from '@mui/icons-material/Delete';

export interface SinkDef {
  id: string;
  name: string;
  label: RuntimeLabel;
}

export default function SinkPanel({
  lattice,
  sinks,
  onCreate,
  onTryWrite,
  onRemove
}: {
  lattice: Lattice;
  sinks: SinkDef[];
  onCreate: (s: SinkDef) => void;
  onTryWrite: (sinkId: string) => void;
  onRemove: (sinkId: string) => void;
}) {
  const labels = useMemo(() => Object.values(lattice.labels), [lattice]);
  const [name, setName] = useState('Console');
  const [labelId, setLabelId] = useState('');

  return (
    <Card variant="outlined" sx={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Typography variant="h6" padding={2}>Sinks</Typography>
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

        <Typography variant="subtitle2">Available sinks</Typography>
        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
          {sinks.map(s => (
            <Stack key={s.id} direction="row" spacing={0.5} alignItems="center">
              <Button variant="contained" onClick={() => onTryWrite(s.id)}>
                Write to {s.name} [{s.label.name}]
              </Button>
              <IconButton size="small" aria-label={`remove sink ${s.name}`} onClick={() => onRemove(s.id)}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Stack>
          ))}
        </Stack>
      </CardContent>
    </Card>
  );
}
