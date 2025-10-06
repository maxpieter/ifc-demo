import { Card, CardContent, Typography, List, ListItem, ListItemText } from '@mui/material';

export default function ExplanationPanel({ lines }: { lines: string[] }) {
  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h6">How the flow was evaluated</Typography>
        <List dense>
          {lines.map((l, i) => (
            <ListItem key={i}><ListItemText primary={l} /></ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  );
}