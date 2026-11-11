import { createTheme } from '@mui/material/styles'
import type { ThemeOptions } from '@mui/material/styles'

// ─── Design tokens ────────────────────────────────────────────────────────────
// All colours, radii, spacing, and font decisions live here.
// Never hard-code a colour or font-size string in a component.

const themeOptions: ThemeOptions = {
  // ── Spacing ─────────────────────────────────────────────────────────────────
  // 8 px base; theme.spacing(2) === '16px'
  spacing: 8,

  // ── Shape ───────────────────────────────────────────────────────────────────
  shape: {
    borderRadius: 8,
  },

  // ── Palette ─────────────────────────────────────────────────────────────────

palette: {
  primary: {
    main: '#C4A7D7',       // Pastel mauve
    light: '#E4D6EF',      // Light lavender
    dark: '#86639F',        // Deep mauve
    contrastText: '#30213A',
  },
  secondary: {
    main: '#D8C4E8',       // Soft lilac
    light: '#F0E7F7',      // Pale lilac
    dark: '#9677B2',        // Muted purple
    contrastText: '#352443',
  },
  error: {
    main: '#B85C75',
  },
  warning: {
    main: '#C49A56',
  },
  info: {
    main: '#77749B',
  },
  success: {
    main: '#64836F',
  },
  background: {
    default: '#FCF9FE',    // Almost-white lavender
    paper: '#F6F0FA',      // Soft lavender surface
  },
  text: {
    primary: '#34283D',
    secondary: '#75677E',
  },
  divider: '#E5D8ED',
  action: {
    hover: '#EEE4F5',
  },
},


  // ── Typography ───────────────────────────────────────────────────────────────
  typography: {
    fontFamily: '"Source Sans 3", sans-serif',
    fontWeightRegular: 400,
    fontWeightMedium: 600,
    fontWeightBold: 600,
    h1: {
      fontFamily: '"Playfair Display", serif',
      fontSize: '4rem',
      fontWeight: 600,
      lineHeight: 1.1,
      letterSpacing: 0,
    },
    h2: {
      fontFamily: '"Playfair Display", serif',
      fontSize: '3rem',
      fontWeight: 600,
      lineHeight: 1.15,
      letterSpacing: 0,
    },
    h3: {
      fontFamily: '"Playfair Display", serif',
      fontSize: '1.75rem',
      fontWeight: 600,
      lineHeight: 1.3,
      letterSpacing: 0,
    },
    h4: {
      fontFamily: '"Playfair Display", serif',
      fontSize: '1.75rem',
      fontWeight: 600,
      lineHeight: 1.3,
      letterSpacing: 0,
    },
    h5: {
      fontFamily: '"Playfair Display", serif',
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h6: {
      fontFamily: '"Playfair Display", serif',
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    body1: { lineHeight: 1.6 },
    body2: { lineHeight: 1.5 },
    subtitle1: { fontWeight: 600 },
    button: {
      fontWeight: 600,
      textTransform: 'none',
      fontSize: '1rem',
    },
  },

  // ── Breakpoints ──────────────────────────────────────────────────────────────
  // Using MUI defaults: xs(0) sm(600) md(900) lg(1200) xl(1536)
  // Justification: standard and well-documented; no custom viewport needs yet.

  // ── Component overrides / defaults ───────────────────────────────────────────
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          minHeight: 40,
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 600,
          transition:
            'background-color 150ms ease, box-shadow 150ms ease, color 150ms ease',
          '&.MuiButton-containedPrimary:hover': {
         backgroundColor: '#A98AC0',
boxShadow: '0 4px 12px rgba(100, 36, 147, 0.18)',
          },
        },
      },
      defaultProps: {
        disableElevation: true,
      },
    },

    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
        fullWidth: true,
      },
    },

    MuiCard: {
      styleOverrides: {
        root: {
        backgroundColor: '#F6F0FA',
border: '1px solid #E5D8ED',
          boxShadow: 'none',
          borderRadius: 12,
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
      root: {
  backgroundColor: '#F6F0FA',
  borderRadius: 8,

  '& .MuiOutlinedInput-notchedOutline': {
    borderColor: '#E5D8ED',
  },

  '&:hover .MuiOutlinedInput-notchedOutline': {
    borderColor: '#C4A7D7',
  },

  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
    borderColor: '#86639F',
    borderWidth: 1,
    boxShadow: '0 0 0 3px rgba(196,167,215,0.35)',
  },
},
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 9999 },
      },
    },
    MuiRating: {
      styleOverrides: {
     iconFilled: {
  color: '#A98AC0',
},
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 12,
          boxShadow: '0 24px 48px rgba(28,25,23,0.12)',
        },
      },
    },
    MuiBackdrop: {
      styleOverrides: {
        root: { backdropFilter: 'blur(4px)' },
      },
    },
    MuiContainer: {
      defaultProps: {
        maxWidth: 'lg',
      },
      styleOverrides: {
        root: ({ theme }) => ({
          paddingLeft: theme.spacing(2),
          paddingRight: theme.spacing(2),
          [theme.breakpoints.up('sm')]: {
            paddingLeft: theme.spacing(3),
            paddingRight: theme.spacing(3),
          },
        }),
      },
    },

    MuiCssBaseline: {
      styleOverrides: `
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
            scroll-behavior: auto !important;
          }
        }
      `,
    },
  },
}

export const theme = createTheme(themeOptions)
