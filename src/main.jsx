import { StrictMode, useMemo, useState, useEffect, createContext } from 'react';
import { createRoot } from 'react-dom/client';
import { createTheme, ThemeProvider, CssBaseline, GlobalStyles } from '@mui/material';
import App from './App.jsx';

const MODE_KEY = 'quran_theme_mode';

export const ColorModeContext = createContext({ mode: 'light', toggle: () => {} });

function buildTheme(mode) {
  const dark = mode === 'dark';
  return createTheme({
    direction: 'rtl',
    palette: {
      mode,
      primary: dark
        ? { main: '#4db6ac', dark: '#26a69a', light: '#80cbc4', contrastText: '#001f1a' }
        : { main: '#00695c', dark: '#004d40', light: '#4db6ac', contrastText: '#ffffff' },
      secondary: {
        main: dark ? '#ffb74d' : '#f57f17',
      },
      background: dark
        ? { default: '#0f1715', paper: '#1a2522' }
        : { default: '#f5f5f0', paper: '#ffffff' },
      text: dark
        ? { primary: '#e8f1ee', secondary: '#9fb3ad' }
        : { primary: '#1a1a1a', secondary: '#555555' },
      divider: dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.12)',
    },
    typography: {
      fontFamily: '"Noto Naskh Arabic", "Segoe UI", "Arial", sans-serif',
      fontSize: 16,
      h5: { fontWeight: 700 },
      h6: { fontWeight: 600 },
    },
    shape: { borderRadius: 12 },
    components: {
      MuiButton: {
        styleOverrides: {
          root: { borderRadius: 12, textTransform: 'none', fontWeight: 600 },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            backgroundImage: 'none',
          },
          elevation1: {
            boxShadow: dark
              ? '0 1px 2px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.04)'
              : '0 1px 2px rgba(16,24,22,0.06), 0 0 0 1px rgba(16,24,22,0.04)',
          },
          elevation2: {
            boxShadow: dark
              ? '0 4px 16px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)'
              : '0 2px 8px rgba(16,24,22,0.06), 0 1px 2px rgba(16,24,22,0.04)',
          },
        },
      },
      MuiSelect: {
        styleOverrides: { root: { borderRadius: 10 } },
      },
      MuiSlider: {
        styleOverrides: {
          root: {
            color: dark ? '#4db6ac' : '#00695c',
          },
          thumb: {
            width: 16, height: 16,
            boxShadow: 'none',
            '&::before': { boxShadow: 'none' },
            // MUI RTL applies right:X% but keeps LTR translate(-50%,-50%); flip X.
            '[dir="rtl"] &': {
              transform: 'translate(50%, -50%)',
            },
            '&:hover, &.Mui-focusVisible': {
              boxShadow: dark
                ? '0 0 0 8px rgba(77,182,172,0.18)'
                : '0 0 0 8px rgba(0,105,92,0.14)',
            },
            '&.Mui-active': {
              boxShadow: dark
                ? '0 0 0 12px rgba(77,182,172,0.22)'
                : '0 0 0 12px rgba(0,105,92,0.18)',
            },
          },
          rail: {
            opacity: dark ? 0.22 : 0.26,
            backgroundColor: dark ? '#4db6ac' : '#00695c',
            height: 4,
          },
          track: { border: 'none', height: 4 },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            backgroundColor: dark ? '#0a1412' : '#00695c',
            borderRadius: '0 0 16px 16px',
            boxShadow: dark
              ? '0 1px 0 rgba(255,255,255,0.06)'
              : '0 1px 2px rgba(0,0,0,0.08)',
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: { fontWeight: 500 },
        },
      },
      MuiAccordion: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            '&:before': { display: 'none' },
          },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: { fontWeight: 600 },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            fontSize: '0.78rem',
            fontFamily: 'inherit',
            backgroundColor: dark ? '#1a2522' : 'rgba(26,34,32,0.95)',
            borderRadius: 8,
            padding: '8px 12px',
          },
          arrow: { color: dark ? '#1a2522' : 'rgba(26,34,32,0.95)' },
        },
      },
    },
  });
}

function Root() {
  const getInitial = () => {
    const saved = localStorage.getItem(MODE_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };

  const [mode, setMode] = useState(getInitial);

  useEffect(() => {
    localStorage.setItem(MODE_KEY, mode);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', mode === 'dark' ? '#0a1412' : '#00695c');
  }, [mode]);

  const theme = useMemo(() => buildTheme(mode), [mode]);
  const ctx = useMemo(() => ({
    mode,
    toggle: () => setMode((m) => (m === 'dark' ? 'light' : 'dark')),
  }), [mode]);

  const [animating, setAnimating] = useState(false);
  const ctxWithAnim = useMemo(() => ({
    ...ctx,
    toggle: () => {
      setAnimating(true);
      ctx.toggle();
      setTimeout(() => setAnimating(false), 650);
    },
  }), [ctx]);

  return (
    <ColorModeContext.Provider value={ctxWithAnim}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <GlobalStyles styles={{
          'html, body': {
            transition: 'background-color 0.5s cubic-bezier(0.4, 0, 0.2, 1), color 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
          },
          '.MuiPaper-root, .MuiAppBar-root, .MuiDialog-paper, .MuiAccordion-root, .MuiButton-root, .MuiChip-root, .MuiIconButton-root, .MuiListItemButton-root, .MuiOutlinedInput-notchedOutline, .MuiAlert-root, .MuiMenuItem-root': {
            transition: 'background-color 0.5s cubic-bezier(0.4, 0, 0.2, 1), color 0.5s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.5s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.5s cubic-bezier(0.4, 0, 0.2, 1) !important',
          },

          '::selection': {
            backgroundColor: mode === 'dark' ? 'rgba(77,182,172,0.35)' : 'rgba(0,105,92,0.22)',
            color: mode === 'dark' ? '#e8f1ee' : '#1a1a1a',
          },

          '*': {
            scrollbarColor: mode === 'dark' ? '#2a3b37 transparent' : '#c5d3cf transparent',
            scrollbarWidth: 'thin',
          },
          '*::-webkit-scrollbar': { width: 8, height: 8 },
          '*::-webkit-scrollbar-track': { background: 'transparent' },
          '*::-webkit-scrollbar-thumb': {
            background: mode === 'dark' ? '#2a3b37' : '#c5d3cf',
            borderRadius: 4,
            border: 'none',
          },
          '*::-webkit-scrollbar-thumb:hover': {
            background: mode === 'dark' ? '#3a4e49' : '#a8bab5',
          },

          '*:focus-visible': {
            outline: `2px solid ${mode === 'dark' ? '#4db6ac' : '#00695c'}`,
            outlineOffset: 2,
            borderRadius: 4,
          },
          'input, textarea': {
            caretColor: mode === 'dark' ? '#4db6ac' : '#00695c',
          },

          '.MuiBackdrop-root': {
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            backgroundColor: mode === 'dark' ? 'rgba(10,20,18,0.6)' : 'rgba(26,34,32,0.42)',
          },

          '.theme-flash': {
            position: 'fixed',
            inset: 0,
            pointerEvents: 'none',
            zIndex: 9999,
            background: `radial-gradient(circle at 90% 8%, ${mode === 'dark' ? 'rgba(77,182,172,0.18)' : 'rgba(255,255,255,0.35)'} 0%, transparent 55%)`,
            animation: 'themeFlash 650ms cubic-bezier(0.4, 0, 0.2, 1) forwards',
          },
          '@keyframes themeFlash': {
            '0%':   { opacity: 0, transform: 'scale(0.6)' },
            '35%':  { opacity: 1 },
            '100%': { opacity: 0, transform: 'scale(2.2)' },
          },
        }} />
        {animating && <div className="theme-flash" aria-hidden />}
        <App />
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Root />
  </StrictMode>
);
