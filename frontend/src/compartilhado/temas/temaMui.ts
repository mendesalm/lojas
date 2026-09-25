// EM CONFORMIDADE COM AS REGRAS DE OURO DO E-SIGMA
import { createTheme, alpha } from '@mui/material/styles';

export const obterTemaLojas = (modo: 'dark' | 'light') => {
  const isDark = modo === 'dark';

  return createTheme({
    palette: {
      mode: modo,
      primary: {
        main: isDark ? '#DDB96B' : '#0284c7', // Ouro Maçônico Canônico
        light: isDark ? '#FDE68A' : '#38bdf8',
        dark: isDark ? '#B8862D' : '#075985',
        contrastText: isDark ? '#070B12' : '#ffffff',
      },
      secondary: {
        main: isDark ? '#FDE68A' : '#475569',
        light: '#FFF3C4',
        dark: '#B8862D',
        contrastText: '#070B12',
      },
      warning: {
        main: '#DDB96B', // Dourado Maçônico Canônico
        light: '#FDE68A',
        dark: '#B8862D',
      },
      background: {
        default: isDark ? '#050508' : '#f8fafc', // Fundo Preto Abissal
        paper: isDark ? '#0d1b35' : '#ffffff', // Deep Blue
      },
      text: {
        primary: isDark ? '#ffffff' : '#0f172a',
        secondary: isDark ? '#CBD5E1' : '#64748B',
      },
      divider: isDark ? 'rgba(221, 185, 107, 0.2)' : 'rgba(0, 0, 0, 0.08)',
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h4: { fontWeight: 700, color: isDark ? '#FDE68A' : '#0f172a' },
      h5: { fontWeight: 700, letterSpacing: '-0.02em', color: isDark ? '#ffffff' : '#0f172a' },
      h6: { fontWeight: 600, letterSpacing: '-0.01em', color: isDark ? '#DDB96B' : '#0f172a' },
      subtitle1: { fontWeight: 500, color: isDark ? '#ffffff' : '#1e293b' },
      body1: { color: isDark ? '#ffffff' : '#1e293b' },
      body2: { color: isDark ? '#CBD5E1' : '#64748b' },
      button: {
        textTransform: 'none',
        fontWeight: 600,
      },
    },
    shape: {
      borderRadius: 12,
    },
    components: {
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: isDark ? '#070e1c' : '#ffffff',
            borderBottom: `1px solid ${isDark ? 'rgba(221, 185, 107, 0.2)' : 'rgba(0, 0, 0, 0.08)'}`,
            boxShadow: isDark ? '0 4px 20px rgba(0, 0, 0, 0.8)' : 'none',
            borderRadius: 0,
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundColor: isDark ? '#070e1c' : '#ffffff',
            borderRight: `1px solid ${isDark ? 'rgba(221, 185, 107, 0.2)' : 'rgba(0, 0, 0, 0.08)'}`,
            borderRadius: 0,
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 9999, // Formato Pill idêntico ao anexo
            textTransform: 'none',
            fontWeight: 600,
            letterSpacing: '0.03em',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          },
          contained: {
            backgroundImage: isDark
              ? 'linear-gradient(180deg, #163663 0%, #091a33 100%), linear-gradient(180deg, #FDE68A 0%, #DDB96B 50%, #785012 100%)'
              : 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
            backgroundClip: 'padding-box, border-box',
            backgroundOrigin: 'padding-box, border-box',
            border: isDark ? '2px solid transparent' : 'none',
            color: '#ffffff',
            boxShadow: isDark 
              ? '0 8px 20px -4px rgba(0, 0, 0, 0.8), 0 0 15px rgba(221, 185, 107, 0.25), inset 0 1px 1px rgba(255, 255, 255, 0.4)' 
              : '0 2px 8px rgba(2, 132, 199, 0.3)',
            '&:hover': {
              backgroundImage: isDark
                ? 'linear-gradient(180deg, #1e457d 0%, #0d2345 100%), linear-gradient(180deg, #FFF3C4 0%, #FDE68A 50%, #936214 100%)'
                : 'linear-gradient(135deg, #0369a1 0%, #075985 100%)',
              boxShadow: isDark ? '0 12px 24px -4px rgba(0, 0, 0, 0.9), 0 0 25px rgba(221, 185, 107, 0.45)' : 'none',
              transform: 'translateY(-1.5px)',
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            backgroundImage: 'none',
            backgroundColor: isDark ? 'rgba(14, 28, 54, 0.75)' : '#ffffff',
            backdropFilter: isDark ? 'blur(20px) saturate(180%)' : 'none',
            border: `1px solid ${isDark ? 'rgba(221, 185, 107, 0.22)' : 'rgba(0, 0, 0, 0.08)'}`,
            borderTop: `1px solid ${isDark ? 'rgba(253, 230, 138, 0.4)' : 'rgba(0, 0, 0, 0.08)'}`,
            boxShadow: isDark 
              ? '0 16px 40px -10px rgba(0, 0, 0, 0.85), 0 0 25px -5px rgba(14, 28, 54, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.08)' 
              : '0 4px 20px rgba(0, 0, 0, 0.04)',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            backgroundColor: isDark ? 'rgba(14, 28, 54, 0.75)' : '#ffffff',
            backdropFilter: isDark ? 'blur(20px) saturate(180%)' : 'none',
            borderRadius: 16,
            border: `1px solid ${isDark ? 'rgba(221, 185, 107, 0.22)' : 'rgba(0, 0, 0, 0.08)'}`,
            boxShadow: isDark ? '0 16px 40px -10px rgba(0, 0, 0, 0.85), 0 0 25px -5px rgba(14, 28, 54, 0.45)' : '0 4px 20px rgba(0, 0, 0, 0.04)',
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          head: {
            fontWeight: 700,
            color: isDark ? '#FDE68A' : '#0369a1',
            backgroundColor: isDark ? 'rgba(7, 15, 30, 0.95)' : '#f8fafc',
            borderBottom: `1px solid ${isDark ? 'rgba(221, 185, 107, 0.2)' : 'rgba(0, 0, 0, 0.08)'}`,
          },
          body: {
            color: isDark ? '#ffffff' : '#0f172a',
            borderBottom: `1px solid ${isDark ? 'rgba(221, 185, 107, 0.1)' : 'rgba(0, 0, 0, 0.08)'}`,
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
