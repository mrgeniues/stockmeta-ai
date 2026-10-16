import React, { createContext, useContext, useEffect, useState } from 'react';
import { ThemeId, ThemeDefinition, THEMES } from '../constants/themes';

interface ThemeContextType {
  activeTheme: ThemeId;
  themeConfig: ThemeDefinition;
  setTheme: (theme: ThemeId) => void;
}

const THEME_STORAGE_KEY = 'stockmeta-theme';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTheme, setActiveThemeState] = useState<ThemeId>(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY) as ThemeId | null;
      if (saved && THEMES.some((t) => t.id === saved)) {
        return saved;
      }
    } catch {
      // Fallback if localStorage is inaccessible
    }
    return 'midnight';
  });

  const setTheme = (theme: ThemeId) => {
    setActiveThemeState(theme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Ignore localStorage write error
    }
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', activeTheme);
  }, [activeTheme]);

  const themeConfig = THEMES.find((t) => t.id === activeTheme) || THEMES[0];

  return (
    <ThemeContext.Provider value={{ activeTheme, themeConfig, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
