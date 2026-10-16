import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { THEMES, ThemeId } from '../constants/themes';

export const ThemeSwitcher: React.FC = () => {
  const { activeTheme, setTheme } = useTheme();

  return (
    <div className="flex items-center gap-1.5">
      <label htmlFor="theme-select" className="sr-only">
        Theme
      </label>
      <select
        id="theme-select"
        value={activeTheme}
        onChange={(e) => setTheme(e.target.value as ThemeId)}
        aria-label="Select Theme"
        className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1 text-xs font-medium text-[var(--text)] shadow-xs focus:border-[var(--accent)] focus:outline-hidden focus:ring-1 focus:ring-[var(--accent)] cursor-pointer transition-colors"
      >
        {THEMES.map((theme) => (
          <option key={theme.id} value={theme.id} className="bg-[var(--surface)] text-[var(--text)]">
            {theme.label}
          </option>
        ))}
      </select>
    </div>
  );
};
