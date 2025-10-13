import { useMemo, useState } from 'react';
import {
  Button,
  Card,
  CardContent,
  Grid2 as Grid,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { addLabel, addLeq, Lattice } from '../models/Lattice';
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
    setLow('');
    setHigh('');
  };
  return (
    <Grid container spacing={2}>
      <Card variant="outlined">
        <CardContent>
          <Stack direction="row" spacing={3}>
            <TextField
              label="New label (e.g. High)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              size="small"
            />
            <Button variant="contained" onClick={addNew}>
              Add
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <Card variant="outlined">
        <CardContent>
          <Typography variant="body2" paddingBottom={2}>
            Define ≤ relations between existing labels:
          </Typography>
          <Stack direction="row" spacing={0.5}>
            <Select
              size="small"
              value={low}
              displayEmpty
              onChange={(e) => setLow(e.target.value)}
              renderValue={(selected) => {
                if (selected === '') {
                  return <em>Low</em>;
                }
                return labelsArr.find((l) => l.id === selected)?.name || selected;
              }}
              sx={{
                minWidth: 100,
              }}
            >
              <MenuItem disabled value="" sx={{ fontSize: '0.8rem', py: 0.5 }}>
                <em>Low</em>
              </MenuItem>
              {labelsArr.map((l) => (
                <MenuItem key={l.id} value={l.id} sx={{ fontSize: '0.8rem', py: 0.5 }}>
                  {l.name}
                </MenuItem>
              ))}
            </Select>
            <Select
              size="small"
              value={high}
              displayEmpty
              onChange={(e) => setHigh(e.target.value)}
              sx={{
                minWidth: 100,
              }}
              renderValue={(selected) => {
                if (selected === '') {
                  return <em>High</em>;
                }
                return labelsArr.find((l) => l.id === selected)?.name || selected;
              }}
            >
              <MenuItem disabled value="" sx={{ fontSize: '0.8rem', py: 0.5 }}>
                <em>High</em>
              </MenuItem>
              {labelsArr.map((l) => (
                <MenuItem key={l.id} value={l.id} sx={{ fontSize: '0.8rem', py: 0.5 }}>
                  {l.name}
                </MenuItem>
              ))}
            </Select>
            <Button variant="outlined" onClick={addEdge} size="small">
              Add ≤ relation
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Grid>
  );
}
