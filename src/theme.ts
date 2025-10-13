import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  cssVariables: true,
  colorSchemes: { light: true, dark: true },
  typography: {
    fontFamily: ['Inter', 'system-ui', 'Segoe UI', 'Roboto', 'Arial', 'sans-serif'].join(','),
  },
});

export default createTheme;
