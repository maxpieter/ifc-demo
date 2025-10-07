import { Card, CardContent, Typography, List, ListItem, ListItemText } from '@mui/material';

export default function ExplanationPanel({ lines }: { lines: string[] }) {
  return (
    <Card variant="outlined" sx={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', p: 2 }}>
        <Typography variant="h6">How the flow was evaluated</Typography>
        <List dense sx={{ flexGrow: 1, overflowY: 'auto' }}>
          {lines.map((l, i) => (
            <ListItem key={i}><ListItemText primary={l} /></ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  );
}
