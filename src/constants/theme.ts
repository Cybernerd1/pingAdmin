// src/constants/theme.ts
export const theme = {
  colors: {
    primary: '#E8447A', // Magenta
    secondary: '#F2865F', // Coral
    accent: '#F4A47C', // Peach
    dark: '#2B1620', // Plum
    background: '#FBEEE6', // Cream
    surface: '#FBDCE6', // Blush
    text: '#2B1620', // Plum
    textSecondary: '#7C3AED', // Purple for emphasis
    border: '#FBDCE6', // Light surface
    error: '#DC2626', // Red
    warning: '#F59E0B', // Amber
    success: '#10B981', // Green
    info: '#3B82F6', // Blue
  },
  borderRadius: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '999px', // pill
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    xxl: '48px',
  },
  typography: {
    fontFamily: {
      heading: 'Fredoka, sans-serif',
      body: 'Inter, sans-serif',
    },
    fontSize: {
      xs: '13px',
      sm: '14px',
      md: '16px',
      lg: '20px',
      xl: '24px',
      xxl: '32px',
    },
    fontWeight: {
      normal: '400',
      medium: '600',
      bold: '700',
    },
  },
};

export const shadows = {
  xs: '0 1px 2px rgba(0, 0, 0, 0.05)',
  sm: '0 2px 4px rgba(0, 0, 0, 0.1)',
  md: '0 4px 6px rgba(0, 0, 0, 0.1)',
  lg: '0 8px 12px rgba(0, 0, 0, 0.15)',
  xl: '0 16px 24px rgba(0, 0, 0, 0.2)',
};