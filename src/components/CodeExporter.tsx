import { useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Typography,
  Paper,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DownloadIcon from '@mui/icons-material/Download';
import CodeIcon from '@mui/icons-material/Code';
import CloseIcon from '@mui/icons-material/Close';
import { generateIfcSafeCode } from '../services/codeGenerator';
import type { Lattice } from '../models/Lattice';
import type { RuntimeLabel } from '../models/Label';
import type { FlowGraph } from '../models/FlowGraph';

interface Source {
  id: string;
  title: string;
  value: string;
  rtLabel: RuntimeLabel;
  ifcLabel: any;
  lio: any;
}

interface Sink {
  id: string;
  name: string;
  label: RuntimeLabel;
}

interface CodeExporterProps {
  lattice: Lattice;
  sources: Source[];
  sinks: Sink[];
  graph: FlowGraph;
}

export default function CodeExporter({ lattice, sources, sinks, graph }: CodeExporterProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setCopied(false);
  };

  const generatedCode = generateIfcSafeCode({
    lattice,
    sources,
    sinks,
    graph,
  });

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([generatedCode], { type: 'text/typescript' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'ifc-safe-code.ts';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <Button
        variant="contained"
        color="primary"
        size="large"
        startIcon={<CodeIcon />}
        onClick={handleOpen}
        sx={{
          py: 1.5,
          px: 3,
          fontSize: '1rem',
          fontWeight: 600,
        }}
      >
        Transform to IFC Safe Code
      </Button>

      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="lg"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              height: '80vh',
              maxHeight: '800px',
            },
          },
        }}
      >
        <DialogTitle>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Generated IFC-Safe TypeScript Code</Typography>
            <IconButton onClick={handleClose} size="small">
              <CloseIcon />
            </IconButton>
          </Stack>
        </DialogTitle>

        <DialogContent dividers>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              This code shows how your visual flows would be implemented using the{' '}
              <code>ifc-ts</code> library with compile-time information flow control. The type
              system enforces security policies at compile-time, preventing unauthorized data flows.
            </Typography>
          </Box>

          <Paper
            variant="outlined"
            sx={{
              p: 2,
              backgroundColor: '#000000ff',
              fontFamily: 'monospace',
              fontSize: '0.875rem',
              overflow: 'auto',
              maxHeight: 'calc(80vh - 250px)',
            }}
          >
            <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>
              <code>{generatedCode}</code>
            </pre>
          </Paper>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              startIcon={<ContentCopyIcon />}
              onClick={handleCopy}
              color={copied ? 'success' : 'primary'}
            >
              {copied ? 'Copied!' : 'Copy to Clipboard'}
            </Button>
            <Button variant="outlined" startIcon={<DownloadIcon />} onClick={handleDownload}>
              Download as .ts
            </Button>
            <Button variant="contained" onClick={handleClose}>
              Close
            </Button>
          </Stack>
        </DialogActions>
      </Dialog>
    </>
  );
}
