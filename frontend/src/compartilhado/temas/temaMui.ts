// EM CONFORMIDADE COM AS REGRAS DE OURO DO E-SIGMA
import { createTheme, alpha } from '@mui/material/styles';

export const obterTemaLojas = (modo: 'dark' | 'light') => {
  const isDark = modo === 'dark';

  return createTheme({
    palette: {
      mode: modo,
      primary: {
        main: '#D4AF37', // Dourado Maçônico Canônico
        light: '#F3E5AB',
        dark: '#AA820A',
        contrastText: '#0F172A',
      },
      secondary: {
        main: '#38BDF8', // Azul Celeste / Prata
        light: '#BAE6FD',
        dark: '#0284C7',
        contrastText: '#FFFFFF',
      },
      background: {
        default: isDark ? '#0B1120' : '#F8FAFC',
        paper: isDark ? '#111827' : '#FFFFFF',
      },
      text: {
        primary: isDark ? '#F1F5F9' : '#0F172A',
        secondary: isDark ? '#94A3B8' : '#64748B',
      },
      divider: isDark ? alpha('#FFFFFF', 0.08) : alpha('#000000', 0.08),
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h5: {
        fontWeight: 700,
        letterSpacing: '-0.02em',
      },
      h6: {
        fontWeight: 600,
        letterSpacing: '-0.01em',
      },
      subtitle1: {
        fontWeight: 500,
      },
      button: {
        textTransform: 'none',
        fontWeight: 600,
      },
    },
    shape: {
      borderRadius: 10,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            boxShadow: 'none',
            '&:hover': {
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            backgroundImage: 'none',
            border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)'}`,
            boxShadow: isDark
              ? '0 4px 20px rgba(0, 0, 0, 0.4)'
              : '0 4px 20px rgba(0, 0, 0, 0.04)',
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            borderBottom: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)'}`,
          },
        },
      },
    },
  });
};
