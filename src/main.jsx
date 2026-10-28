import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createTheme, ThemeProvider, CssBaseline } from '@mui/material';
import App from './App.jsx';

const theme = createTheme({
  direction: 'rtl',
  palette: {
    primary: {
      main: '#00695c',      // dark teal — high contrast, calming
      dark: '#004d40',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#f57f17',
    },
    background: {
      default: '#f5f5f0',
      paper: '#ffffff',
    },
    text: {
      primary: '#1a1a1a',
      secondary: '#555555',
    },
  },
  typography: {
    fontFamily: '"Noto Naskh Arabic", "Segoe UI", "Arial", sans-serif',
    fontSize: 16,
    h5: { fontWeight: 700 },
    h6: { fontWeight: 600 },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 12, textTransform: 'none' },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { borderRadius: 16 },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: { borderRadius: 10 },
      },
    },
    MuiSlider: {
      styleOverrides: {
        root: { color: '#00695c' },
      },
    },
  },
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </StrictMode>
);
