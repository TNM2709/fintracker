import React, { useState, useEffect, useMemo } from 'react';
import { type Theme, ThemeContext } from './useTheme';

export type { Theme, ThemeContextType } from './useTheme';

const THEME_STORAGE_KEY = 'fintracker_theme';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'dark';
    const saved = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
    if (saved === 'light' || saved === 'dark') {
      return saved;
    }
    // Check system preference fallback
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      return 'light';
    }
    return 'dark';
  });

  const setTheme = React.useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
      document.documentElement.setAttribute('data-theme', newTheme);
    } catch (e) {
      console.warn('Could not persist theme to localStorage:', e);
    }
  }, []);

  const toggleTheme = React.useCallback(() => {
    setThemeState((prev) => {
      const next: Theme = prev === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem(THEME_STORAGE_KEY, next);
        document.documentElement.setAttribute('data-theme', next);
      } catch (e) {
        console.warn('Could not persist theme to localStorage:', e);
      }
      return next;
    });
  }, []);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme);
    }
  }, [theme]);

  const value = useMemo(() => ({
    theme,
    setTheme,
    toggleTheme,
    isDark: theme === 'dark',
  }), [theme, setTheme, toggleTheme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
