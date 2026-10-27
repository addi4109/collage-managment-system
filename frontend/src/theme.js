import { createTheme } from '@mui/material/styles';

const getDesignTokens = (mode) => ({
  palette: {
    mode,
    ...(mode === 'light'
      ? {
          // Premium Light Mode Color Palette
          primary: {
            main: '#4F46E5', // Indigo-600
            light: '#818CF8',
            dark: '#3730A3',
          },
          secondary: {
            main: '#06B6D4', // Cyan-500
            light: '#67E8F9',
            dark: '#0891B2',
          },
          success: {
            main: '#10B981',
            light: '#34D399',
            dark: '#059669',
          },
          warning: {
            main: '#F59E0B',
            light: '#FBBF24',
            dark: '#D97706',
          },
          error: {
            main: '#EF4444',
            light: '#F87171',
            dark: '#DC2626',
          },
          background: {
            default: '#F8FAFC', // Slate-50
            paper: '#FFFFFF',
          },
          text: {
            primary: '#0F172A', // Slate-900
            secondary: '#475569', // Slate-600
          },
          divider: '#E2E8F0', // Slate-200
        }
      : {
          // Deep Navy Dark Mode - matching user's screenshot
          primary: {
            main: '#818CF8', // Indigo-400
            light: '#A5B4FC',
            dark: '#4F46E5',
          },
          secondary: {
            main: '#22D3EE', // Cyan-400
            light: '#67E8F9',
            dark: '#06B6D4',
          },
          success: {
            main: '#34D399',
            light: '#6EE7B7',
            dark: '#10B981',
          },
          warning: {
            main: '#FBBF24',
            light: '#FDE68A',
            dark: '#F59E0B',
          },
          error: {
            main: '#F87171',
            light: '#FCA5A5',
            dark: '#EF4444',
          },
          background: {
            default: '#0B0F19', // Deep Navy
            paper: '#111827',  // Dark Slate
          },
          text: {
            primary: '#F1F5F9',
            secondary: '#94A3B8', // Slate-400
          },
          divider: '#1E293B',
        }),
  },
  typography: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif",
    h1: { fontWeight: 700 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 600 },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    body1: { lineHeight: 1.6 },
    body2: {},
    button: { fontWeight: 500, textTransform: 'none' },
  },
  shape: {
    borderRadius: 16, // Curved premium borders
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: (themeParam) => ({
        body: {
          backgroundColor: themeParam.palette.background.default,
          color: themeParam.palette.text.primary,
        },
      }),
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          padding: '8px 16px',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          boxShadow: mode === 'dark'
            ? '0 1px 3px rgba(0, 0, 0, 0.3)'
            : '0 1px 3px rgba(0, 0, 0, 0.05)',
          border: '1px solid',
          borderColor: mode === 'light' ? '#e5e7eb' : '#334155',
          backgroundImage: 'none',
          backgroundColor: mode === 'dark' ? '#1e293b' : '#FFFFFF',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: mode === 'dark' ? '#1E293B' : '#E2E8F0',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: mode === 'dark' ? '#334155' : '#CBD5E1',
          },
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: mode === 'dark' ? '#0F1320' : '#FFFFFF',
          backgroundImage: 'none',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderColor: mode === 'dark' ? '#1E293B' : '#E2E8F0',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundImage: 'none',
          backgroundColor: mode === 'dark' ? '#111827' : '#FFFFFF',
          border: mode === 'dark' ? '1px solid #1E293B' : 'none',
        },
      },
    },
    MuiPopover: {
      styleOverrides: {
        paper: {
          backgroundImage: 'none',
          backgroundColor: mode === 'dark' ? '#111827' : '#FFFFFF',
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          backgroundImage: 'none',
          backgroundColor: mode === 'dark' ? '#111827' : '#FFFFFF',
        },
      },
    },
  },
});

export const createAppTheme = (mode) => createTheme(getDesignTokens(mode));
export default createAppTheme;
