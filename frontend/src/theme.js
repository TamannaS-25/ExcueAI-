import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#6366f1', // Indigo
      light: '#818cf8',
      dark: '#4f46e5',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#14b8a6', // Teal
      light: '#2dd4bf',
      dark: '#0f766e',
      contrastText: '#ffffff',
    },
    background: {
      default: '#0b0f19', // Deep dark blue-gray
      paper: '#111827',   // Dark gray
    },
    text: {
      primary: '#f9fafb',
      secondary: '#9ca3af',
      disabled: '#6b7280',
    },
    error: {
      main: '#f43f5e', // Deep coral/rose
    },
    warning: {
      main: '#f59e0b', // Amber
    },
    info: {
      main: '#3b82f6', // Bright Blue
    },
    success: {
      main: '#10b981', // Emerald Green
    },
    divider: 'rgba(255, 255, 255, 0.08)',
  },
  typography: {
    fontFamily: [
      'Outfit',
      'Inter',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
    h1: {
      fontWeight: 800,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontWeight: 700,
      letterSpacing: '-0.01em',
    },
    h3: {
      fontWeight: 700,
    },
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollbarColor: '#374151 #111827',
          '&::-webkit-scrollbar': {
            width: '8px',
            height: '8px',
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: '#0b0f19',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: '#374151',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            backgroundColor: '#4b5563',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          padding: '8px 16px',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-1px)',
            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.25)',
          },
        },
        containedPrimary: {
          background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #818cf8 0%, #6366f1 100%)',
          },
        },
        containedSecondary: {
          background: 'linear-gradient(135deg, #14b8a6 0%, #0f766e 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #2dd4bf 0%, #14b8a6 100%)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          background: 'rgba(17, 24, 39, 0.7)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-2px)',
            border: '1px solid rgba(99, 102, 241, 0.2)',
            boxShadow: '0 12px 40px 0 rgba(99, 102, 241, 0.1)',
          },
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
  },
});

export default theme;
