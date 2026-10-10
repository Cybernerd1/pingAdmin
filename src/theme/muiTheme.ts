/**
 * MUI theme mapped to the Ping design system (ping-design-system.md):
 * magenta primary, coral secondary, cream background, pill buttons,
 * Fredoka headings + Inter body, nothing sharp.
 */
import { createTheme } from '@mui/material/styles';

const palette = {
  primary: '#E8447A', // Magenta
  secondary: '#F2865F', // Coral
  accent: '#F4A47C', // Peach
  dark: '#2B1620', // Plum
  background: '#FBEEE6', // Cream
  surface: '#FBDCE6', // Blush
  error: '#DC2626',
  warning: '#F59E0B',
  success: '#10B981',
  info: '#3B82F6',
};

export const pingColors = palette;

export const muiTheme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: palette.primary, contrastText: '#fff' },
    secondary: { main: palette.secondary, contrastText: '#fff' },
    error: { main: palette.error },
    warning: { main: palette.warning },
    success: { main: palette.success },
    info: { main: palette.info },
    background: { default: palette.background, paper: '#FFFFFF' },
    text: { primary: palette.dark, secondary: '#6B5560' },
    divider: '#F3D9DE',
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: '"Inter", system-ui, sans-serif',
    h1: { fontFamily: '"Fredoka", sans-serif', fontWeight: 700 },
    h2: { fontFamily: '"Fredoka", sans-serif', fontWeight: 700 },
    h3: { fontFamily: '"Fredoka", sans-serif', fontWeight: 600 },
    h4: { fontFamily: '"Fredoka", sans-serif', fontWeight: 600 },
    h5: { fontFamily: '"Fredoka", sans-serif', fontWeight: 600 },
    h6: { fontFamily: '"Fredoka", sans-serif', fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 999, boxShadow: 'none', '&:hover': { boxShadow: '0 2px 8px rgba(232,68,122,.25)' } },
        sizeSmall: { padding: '4px 14px' },
        sizeMedium: { padding: '8px 22px' },
      },
    },
    MuiChip: {
      styleOverrides: { root: { borderRadius: 999, fontWeight: 600 } },
    },
    MuiPaper: {
      styleOverrides: { root: { backgroundImage: 'none' } },
    },
    MuiCard: {
      styleOverrides: { root: { borderRadius: 16 } },
    },
    MuiTextField: { defaultProps: { size: 'small' } },
    MuiTableCell: {
      styleOverrides: { head: { fontWeight: 700, whiteSpace: 'nowrap' } },
    },
    MuiTooltip: { defaultProps: { arrow: true } },
  },
});
