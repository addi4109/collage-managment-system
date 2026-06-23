import { createTheme } from '@mui/material/styles';

// Premium Indigo & Cyber Cyan dynamic theme factory
export const getAppTheme = (mode: 'light' | 'dark') => {
  const isDark = mode === 'dark';
  return createTheme({
    palette: {
      mode,
      primary: {
        main: '#6366f1', // Indigo
        light: '#818cf8',
        dark: '#4f46e5',
        contrastText: '#ffffff',
      },
      secondary: {
        main: '#06b6d4', // Cyber Cyan
        light: '#22d3ee',
        dark: '#0891b2',
        contrastText: '#ffffff',
      },
      background: {
        default: isDark ? '#0b0f19' : '#f8fafc', // Navy vs slate-grey fallback
        paper: isDark ? '#111827' : '#ffffff',   // Surface colors
      },
      text: {
        primary: isDark ? '#f3f4f6' : '#0f172a',
        secondary: isDark ? '#9ca3af' : '#475569',
      },
      divider: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
    },
    typography: {
      fontFamily: "'Inter', sans-serif",
      h1: {
        fontFamily: "'Outfit', sans-serif",
        fontWeight: 800,
      },
      h2: {
        fontFamily: "'Outfit', sans-serif",
        fontWeight: 700,
      },
      h3: {
        fontFamily: "'Outfit', sans-serif",
        fontWeight: 700,
      },
      h4: {
        fontFamily: "'Outfit', sans-serif",
        fontWeight: 600,
      },
      h5: {
        fontFamily: "'Outfit', sans-serif",
        fontWeight: 600,
      },
      h6: {
        fontFamily: "'Outfit', sans-serif",
        fontWeight: 600,
      },
      button: {
        textTransform: 'none',
        fontWeight: 600,
        fontFamily: "'Outfit', sans-serif",
      },
    },
    shape: {
      borderRadius: 12,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            padding: '8px 20px',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              transform: 'translateY(-1px)',
              boxShadow: isDark ? '0 4px 12px rgba(99, 102, 241, 0.3)' : '0 4px 12px rgba(99, 102, 241, 0.12)',
            },
          },
          containedSecondary: {
            '&:hover': {
              boxShadow: isDark ? '0 4px 12px rgba(6, 182, 212, 0.3)' : '0 4px 12px rgba(6, 182, 212, 0.12)',
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            backgroundColor: isDark ? '#111827' : '#ffffff',
            border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.08)',
            boxShadow: isDark ? '0 8px 32px 0 rgba(0, 0, 0, 0.37)' : '0 4px 20px 0 rgba(0, 0, 0, 0.05)',
            backdropFilter: 'blur(4px)',
            borderRadius: 16,
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              '& fieldset': {
                borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.15)',
              },
              '&:hover fieldset': {
                borderColor: '#6366f1',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#6366f1',
              },
            },
          },
        },
      },
    },
  });
};
