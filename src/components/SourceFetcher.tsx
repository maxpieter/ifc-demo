import { useMemo, useState } from 'react';
import { Box, Button, Card, CardContent, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { Lattice } from '../models/Lattice';
import { RuntimeLabel } from '../models/Label';
import { pure, toIfcLabel } from '../ifcClient';

export interface SourceCard {
  id: string;
  value: string;
  rtLabel: RuntimeLabel;
  ifcLabel: any;
  lio: { __ifc: true; label: any; value: string };
}

export default function SourceFetcher({
  lattice, onCreate
}: { lattice: Lattice; onCreate: (s: SourceCard) => void; }) {
  const labels = useMemo(() => Object.values(lattice.labels), [lattice]);
  const [value, setValue] = useState('dummy data');
  const [labelId, setLabelId] = useState<string>('');

  const create = () => {
    const rtLabel = labels.find(l => l.id === labelId);
    if (!rtLabel) return;
    const ifcLabel = toIfcLabel(rtLabel);
    const lio = pure(ifcLabel, value); // actively uses ifc-ts wrapper
    onCreate({ id: crypto.randomUUID(), value, rtLabel, ifcLabel, lio });
  };

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h6">Create a source</Typography>
        <Typography variant="body2" sx={{ mb: 1 }}>
          Creates a labeled source using <code>LIO</code>.
        </Typography>
        <Stack direction="row" spacing={1}>
          <TextField label="Value" size="small" fullWidth value={value} onChange={e => setValue(e.target.value)} />
          <TextField select label="Label" size="small" sx={{ minWidth: 160 }} value={labelId} onChange={e => setLabelId(e.target.value)}>
            {labels.map(l => <MenuItem key={l.id} value={l.id}>{l.name}</MenuItem>)}
          </TextField>
          <Button variant="contained" onClick={create} disabled={!labelId}>Create</Button>
        </Stack>
      </CardContent>
    </Card>
  );
}