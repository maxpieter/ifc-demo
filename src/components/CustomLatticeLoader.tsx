import { useMemo, useState } from 'react';
import {
  Button, Card, CardContent, Grid2 as Grid, MenuItem, Select, Stack, TextField, Typography
} from '@mui/material';
import { addLabel, addLeq, emptyLattice, Lattice } from '../models/Lattice';
import { makeLabel, RuntimeLabel } from '../models/Label';

 export interface LabelEditorProps {
  lattice: Lattice;
  onChange: (lat: Lattice) => void;
}
 
export default function CustomLatticeLoader({ lattice, onChange }: LabelEditorProps) {
  const [name, setName] = useState('');
  const [low, setLow] = useState('');
  const [high, setHigh] = useState('');
  const addNew = () => {
    if (!name.trim()) return;
    const l: RuntimeLabel = makeLabel(name.trim());
    onChange(addLabel(lattice, l));
    setName('');
  };

  const labelsArr = useMemo(() => Object.values(lattice.labels), [lattice]);

  const addEdge = () => {
    if (!low || !high) return;
    onChange(addLeq(lattice, low, high));
    setLow(''); setHigh('');
  };
return (
  <Grid container spacing={2}>
  <Card variant="outlined">
        <CardContent>
          <Stack direction="row" spacing={1}>
            <TextField label="New label (e.g. High)" value={name}
              onChange={e => setName(e.target.value)} size="small" />
            <Button variant="contained" onClick={addNew}>Add</Button>
            <Button variant="text" color="warning" onClick={() => onChange(emptyLattice())}>Reset</Button>
          </Stack>
        </CardContent>
      </Card>

      <Card variant="outlined">
        <CardContent>
          <Typography variant="body2" paddingBottom={2}>
            Tip: ids are auto-generated from names (e.g., <code>Secret</code> → <code>secret</code>).
          </Typography>
          <Stack direction="row" spacing={1}>
            <Select
              size="small"
              value={low}
              displayEmpty
              onChange={e => setLow(e.target.value)}
              renderValue={(selected) => {
                if (selected === '') {
                  return <em>Select Low</em>;
                }
                return labelsArr.find(l => l.id === selected)?.name || selected;
              }}
              sx={{ minWidth: 140 }}
            >
              <MenuItem disabled value="">
                <em>Select Low</em>
              </MenuItem>
              {labelsArr.map(l => (
                <MenuItem key={l.id} value={l.id}>
                  {l.name}
                </MenuItem>
              ))}
            </Select>

            <Select
              size="small"
              value={high}
              displayEmpty
              onChange={e => setHigh(e.target.value)}
              renderValue={(selected) => {
                if (selected === '') {
                  return <em>Select High</em>;
                }
                return labelsArr.find(l => l.id === selected)?.name || selected;
              }}
              sx={{ minWidth: 140, fontSize: '0.8rem' }}
              MenuProps={{
                PaperProps: {
                  sx: {
                    width: 50,       // set dropdown width
                    maxHeight: 100,   // control dropdown height
                  },
                },
              }}
            >
              <MenuItem disabled value="" sx={{ fontSize: '0.8rem', py: 0.5 }}>
                <em>Select High</em>
              </MenuItem>
              {labelsArr.map(l => (
                <MenuItem key={l.id} value={l.id} sx={{ fontSize: '0.8rem', py: 0.5 }}>
                  {l.name}
                </MenuItem>
              ))}
            </Select>
            <Button variant="outlined" onClick={addEdge}>Add ≤ relation</Button>
          </Stack>
        </CardContent>
      </Card>
      </Grid>
);
}