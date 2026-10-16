import React from 'react';
import { Sparkles } from 'lucide-react';
import { ThemeSwitcher } from './ThemeSwitcher';

interface NavbarProps {
  currentView: 'generator' | 'faq';
  onNavigate: (view: 'generator' | 'faq') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, onNavigate }) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-[var(--border)] bg-[var(--surface)] backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Zone: links to generator top */}
        <button
          type="button"
          onClick={() => {
            onNavigate('generator');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="cursor-pointer flex items-center gap-2.5 text-lg font-bold tracking-tight text-[var(--text)] hover:opacity-90 transition-opacity"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm shadow-indigo-500/20">
            <Sparkles className="h-4.5 w-4.5" />
          </div>
          <span>StockMeta AI</span>
        </button>

        {/* Nav Links + Theme Switcher */}
        <nav className="flex items-center gap-4 sm:gap-6 text-sm font-medium">
          <button
            type="button"
            onClick={() => {
              onNavigate('generator');
              if (currentView === 'generator') {
                const el = document.getElementById('uploaded-files-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }
            }}
            className={`cursor-pointer transition-colors ${
              currentView === 'generator'
                ? 'text-[var(--text)] font-semibold'
                : 'text-[var(--muted)] hover:text-[var(--text)]'
            }`}
          >
            Generator
          </button>
          <button
            type="button"
            onClick={() => {
              onNavigate('faq');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`cursor-pointer transition-colors ${
              currentView === 'faq'
                ? 'text-[var(--text)] font-semibold'
                : 'text-[var(--muted)] hover:text-[var(--text)]'
            }`}
          >
            FAQ
          </button>

          {/* Theme Switcher */}
          <div className="pl-1 border-l border-[var(--border)]">
            <ThemeSwitcher />
          </div>
        </nav>
      </div>
    </header>
  );
};
