'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: ThemeMode;
  effectiveTheme: 'light' | 'dark';
  setTheme: (theme: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  effectiveTheme: 'light',
  setTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export function ThemeProvider({ children, storedTheme }: { children: React.ReactNode; storedTheme?: ThemeMode }) {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    if (storedTheme) return storedTheme;
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('optimizer_theme') as ThemeMode) || 'light';
    }
    return 'light';
  });
  const [effectiveTheme, setEffectiveTheme] = useState<'light' | 'dark'>('light');

  const applyTheme = useCallback((t: 'light' | 'dark') => {
    setEffectiveTheme(t);
    document.documentElement.setAttribute('data-theme', t);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');

    if (theme === 'system') {
      applyTheme(mq.matches ? 'dark' : 'light');
      const handler = (e: MediaQueryListEvent) => applyTheme(e.matches ? 'dark' : 'light');
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    }
    applyTheme(theme);
  }, [theme, applyTheme]);

  const setTheme = (t: ThemeMode) => {
    setThemeState(t);
    localStorage.setItem('optimizer_theme', t);
  };

  return (
    <ThemeContext.Provider value={{ theme, effectiveTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
