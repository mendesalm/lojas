// EM CONFORMIDADE COM AS REGRAS DE OURO DO E-SIGMA
import { createTheme, alpha } from '@mui/material/styles';

export const obterTemaLojas = (modo: 'dark' | 'light') => {
  const isDark = modo === 'dark';

  return createTheme({
    palette: {
      mode: modo,
      primary: {
        main: isDark ? '#38bdf8' : '#0284c7', // Ciano neon / Dark sky blue
        light: isDark ? '#7dd3fc' : '#38bdf8',
        dark: isDark ? '#0284c7' : '#075985',
        contrastText: isDark ? '#082f49' : '#ffffff',
      },
      secondary: {
        main: isDark ? '#94a3b8' : '#475569',
        light: '#cbd5e1',
        dark: '#334155',
        contrastText: '#ffffff',
      },
      warning: {
        main: '#C49A45', // Dourado Maçônico Canônico
        light: '#F3E5AB',
        dark: '#B8860B',
      },
      background: {
        default: isDark ? '#0b111b' : '#f8fafc', // Deep Navy Maçônico
        paper: isDark ? '#131b29' : '#ffffff', // Lighter Navy para cards
      },
      text: {
        primary: isDark ? '#f1f5f9' : '#0f172a',
        secondary: isDark ? '#94a3b8' : '#64748B',
      },
      divider: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h4: { fontWeight: 700, color: isDark ? '#f1f5f9' : '#0f172a' },
      h5: { fontWeight: 700, letterSpacing: '-0.02em', color: isDark ? '#f1f5f9' : '#0f172a' },
      h6: { fontWeight: 600, letterSpacing: '-0.01em', color: isDark ? '#f1f5f9' : '#0f172a' },
      subtitle1: { fontWeight: 500 },
      body1: { color: isDark ? '#f1f5f9' : '#1e293b' },
      body2: { color: isDark ? '#94a3b8' : '#64748b' },
      button: {
        textTransform: 'none',
        fontWeight: 600,
      },
    },
    shape: {
      borderRadius: 8,
    },
    components: {
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: isDark ? '#0b111b' : '#ffffff',
            borderBottom: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'}`,
            boxShadow: 'none',
            borderRadius: 0,
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundColor: isDark ? '#0b111b' : '#ffffff',
            borderRight: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'}`,
            borderRadius: 0,
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            textTransform: 'none',
            fontWeight: 600,
            boxShadow: 'none',
          },
          contained: {
            background: isDark
              ? 'linear-gradient(135deg, rgba(8, 47, 73, 0.8) 0%, rgba(3, 105, 161, 0.4) 100%)'
              : 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
            color: isDark ? '#e0f2fe' : '#ffffff',
            border: isDark ? '1px solid rgba(56, 189, 248, 0.5)' : 'none',
            boxShadow: isDark ? '0 0 10px rgba(56, 189, 248, 0.2)' : '0 2px 8px rgba(2, 132, 199, 0.3)',
            '&:hover': {
              background: isDark
                ? 'linear-gradient(135deg, rgba(8, 47, 73, 1) 0%, rgba(3, 105, 161, 0.6) 100%)'
                : 'linear-gradient(135deg, #0369a1 0%, #075985 100%)',
              borderColor: '#38bdf8',
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            backgroundImage: 'none',
            backgroundColor: isDark ? '#131b29' : '#ffffff',
            border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'}`,
            boxShadow: isDark ? '0 4px 20px rgba(0, 0, 0, 0.2)' : '0 4px 20px rgba(0, 0, 0, 0.04)',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            backgroundImage: 'none',
            backgroundColor: isDark ? '#131b29' : '#ffffff',
            border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'}`,
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          head: {
            fontWeight: 600,
            color: isDark ? '#38bdf8' : '#0369a1',
            backgroundColor: isDark ? '#131b29' : '#f8fafc',
            borderBottom: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'}`,
          },
          body: {
            color: isDark ? '#f1f5f9' : '#0f172a',
            borderBottom: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'}`,
          },
        },
      },
      MuiTextField: {
        defaultProps: {
          size: 'small',
          variant: 'outlined',
          fullWidth: true,
        },
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              backgroundColor: isDark ? '#0b111b' : '#ffffff',
              borderRadius: 8,
            },
          },
        },
      },
    },
  });
};
