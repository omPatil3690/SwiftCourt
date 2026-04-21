import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    const root = window.document.documentElement;
    // Enforce light mode only
    root.classList.remove('dark');
    if (!root.classList.contains('light')) root.classList.add('light');
  }, [theme]);

  const value = {
    theme,
    // No-op setter that enforces light
    setTheme: (_theme: Theme) => {
      try { localStorage.setItem('theme', 'light'); } catch {}
      setTheme('light');
    },
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}
