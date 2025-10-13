import { useMemo } from 'react';
import {
  Card, CardContent, Divider, Grid2 as Grid,
  List, ListItem, ListItemText, Stack, Typography
} from '@mui/material';
import { Lattice } from '../models/Lattice';

export interface LatticeInformationProps {
  lattice: Lattice;
  onChange: (lat: Lattice) => void;
}

export default function LatticeInformation({ lattice, onChange }: LatticeInformationProps) {
  const labelsArr = useMemo(() => Object.values(lattice.labels), [lattice]);

  return (
    <Stack spacing={2}>

      <Grid container spacing={2}>
        {/* <Grid size={12}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1">Labels</Typography>
              <Divider sx={{ my: 1 }} />
              <List dense>
                {labelsArr.map(l => (
                  <ListItem key={l.id}>
                    <ListItemText primary={`${l.name}`} secondary={`id=${l.id}`} />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid> */}
        <Grid size={12}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1">Relations (≤)</Typography>
              <Divider sx={{ my: 1 }} />
              <List dense>
                {lattice.edges.map((e, i) => (
                  <ListItem key={i}>
                    <ListItemText primary={`${e.from} ≤ ${e.to}`} />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Stack>
  );
}