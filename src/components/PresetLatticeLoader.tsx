import { Button, Card, CardContent, Stack } from '@mui/material';
import { Lattice, addLabel, addLeq, emptyLattice } from '../models/Lattice';
import { makeLabel } from '../models/Label';

export default function PresetLatticeLoader({ onLoad }: { onLoad: (lat: Lattice) => void }) {
  const simple = () => {
    let L = emptyLattice();
    const low = makeLabel('Low');
    const high = makeLabel('High');
    L = addLabel(addLabel(L, low), high);
    L = addLeq(L, low.id, high.id);
    onLoad(L);
  };

  const three = () => {
    let L = emptyLattice();
    const pub = makeLabel('Public');
    const internal = makeLabel('Internal');
    const secret = makeLabel('Secret');
    L = addLabel(addLabel(addLabel(L, pub), internal), secret);
    L = addLeq(L, pub.id, internal.id);
    L = addLeq(L, internal.id, secret.id);
    onLoad(L);
  };

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" onClick={simple}>
            Low ≤ High
          </Button>
          <Button variant="outlined" onClick={three}>
            Public ≤ Internal ≤ Secret
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}
