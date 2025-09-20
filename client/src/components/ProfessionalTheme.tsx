import React from 'react';
import { ThemeProvider as NextThemeProvider } from 'next-themes';

interface ProfessionalThemeProviderProps {
  children: React.ReactNode;
  attribute?: string;
  defaultTheme?: string;
  enableSystem?: boolean;
}

export const ProfessionalThemeProvider: React.FC<ProfessionalThemeProviderProps> = ({
  children,
  attribute = "class",
  defaultTheme = "dark",
  enableSystem = true,
}) => {
  return (
    <NextThemeProvider
      attribute={attribute}
      defaultTheme={defaultTheme}
      enableSystem={enableSystem}
      themes={['dark', 'light', 'professional']}
    >
      {children}
    </NextThemeProvider>
  );
};

// Professional color palette for financial apps
export const professionalColors = {
  primary: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9',
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
  },
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
  },
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },
  danger: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
  },
  neutral: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#e5e5e5',
    300: '#d4d4d4',
    400: '#a3a3a3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
  }
};

// Professional gradients for financial elements
export const professionalGradients = {
  primary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  success: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
  warning: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  danger: 'linear-gradient(135deg, #ff416c 0%, #ff4b2b 100%)',
  gold: 'linear-gradient(135deg, #f7971e 0%, #ffd200 100%)',
  silver: 'linear-gradient(135deg, #bdc3c7 0%, #2c3e50 100%)',
  diamond: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  premium: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
};
