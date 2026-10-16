import React from 'react';

export const Hero: React.FC = () => {
  return (
    <div className="w-full">
      {/* Header Row: Left-aligned H1 with 'Metadata' accent pill, Right-aligned V 1.0 pill badge */}
      <div className="flex items-center justify-between gap-4 mb-2">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-[var(--text)] flex flex-wrap items-center gap-2">
          <span>Generate</span>
          <span className="relative overflow-hidden bg-[var(--accent)]/15 animate-pill-shimmer text-[var(--accent)] border border-[var(--accent)]/40 px-2.5 py-0.5 rounded-lg inline-block shadow-xs shadow-[var(--card-glow)]">
            <span className="relative z-10 font-bold text-[var(--accent)]">
              Metadata
            </span>
            <span
              className="pointer-events-none absolute inset-0 -translate-x-full animate-pill-sheen bg-gradient-to-r from-transparent via-white/25 to-transparent"
              aria-hidden="true"
            />
          </span>
          <span>Like A Pro</span>
        </h1>

        <div className="inline-flex items-center rounded-full border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-3 py-1 text-xs font-semibold text-[var(--accent)] tracking-wide shrink-0">
          V 1.0
        </div>
      </div>

      {/* Subtitle paragraph under the heading */}
      <p className="text-sm sm:text-base text-[var(--muted)]">
        Fast, agency-ready titles, descriptions, and high-ranking commercial keywords powered directly by Gemini in your browser.
      </p>
    </div>
  );
};

