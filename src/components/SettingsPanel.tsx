import React, { useState } from 'react';
import { AppSettings, KeywordFormat, PngBackground } from '../types';
import { Settings, Sliders, Plus, X } from 'lucide-react';

interface SettingsPanelProps {
  settings: AppSettings;
  onChange: (updated: Partial<AppSettings>) => void;
  onToast: (type: 'success' | 'error' | 'info', message: string) => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  settings,
  onChange,
  onToast,
}) => {
  const [includeInput, setIncludeInput] = useState('');
  const [excludeInput, setExcludeInput] = useState('');
  const [isAdditionalOpen, setIsAdditionalOpen] = useState(false);

  const handleAddInclude = () => {
    const trimmed = includeInput.trim().toLowerCase();
    if (!trimmed) return;
    if (settings.includeKeywords.includes(trimmed)) {
      onToast('info', 'Keyword already in Include list');
      return;
    }
    onChange({ includeKeywords: [...settings.includeKeywords, trimmed] });
    setIncludeInput('');
  };

  const handleRemoveInclude = (kw: string) => {
    onChange({
      includeKeywords: settings.includeKeywords.filter((k) => k !== kw),
    });
  };

  const handleAddExclude = () => {
    const trimmed = excludeInput.trim().toLowerCase();
    if (!trimmed) return;
    if (settings.excludeKeywords.includes(trimmed)) {
      onToast('info', 'Keyword already in Exclude list');
      return;
    }
    onChange({ excludeKeywords: [...settings.excludeKeywords, trimmed] });
    setExcludeInput('');
  };

  const handleRemoveExclude = (kw: string) => {
    onChange({
      excludeKeywords: settings.excludeKeywords.filter((k) => k !== kw),
    });
  };

  return (
    <div className="w-full">
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6 shadow-xl backdrop-blur-sm">
        {/* Header with Subtitle & Gear icon at TOP-RIGHT */}
        <div className="flex items-center justify-between pb-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent)]/10 text-[var(--accent)]">
              <Sliders className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[var(--text)]">Essential Settings</h2>
              <p className="text-xs text-[var(--muted)]">Core metadata generation parameters</p>
            </div>
          </div>

          {/* Gear icon button at TOP-RIGHT */}
          <button
            type="button"
            onClick={() => setIsAdditionalOpen(!isAdditionalOpen)}
            className={`cursor-pointer flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
              isAdditionalOpen
                ? 'border-[var(--accent)] bg-[var(--surface)] text-[var(--text)]'
                : 'border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--text)] hover:border-[var(--accent)]'
            }`}
            title="Toggle Additional Settings"
            aria-expanded={isAdditionalOpen}
          >
            <Settings className={`h-4 w-4 transition-transform ${isAdditionalOpen ? 'rotate-90 text-[var(--accent)]' : ''}`} />
            <span>Additional Settings</span>
          </button>
        </div>

        {/* Additional Settings Expandable Panel */}
        {isAdditionalOpen && (
          <div className="mt-4 mb-6 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 space-y-4 animate-in fade-in duration-200">
            <div className="text-xs font-semibold text-[var(--accent)] border-b border-[var(--border)] pb-2">
              Additional Parameters &amp; Overrides
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={settings.filenameAsTitle}
                    onChange={(e) => onChange({ filenameAsTitle: e.target.checked })}
                    className="mt-0.5 h-4 w-4 rounded border-slate-700 bg-slate-950 text-[var(--accent)] focus:ring-[var(--accent)] accent-[var(--accent)]"
                  />
                  <div>
                    <span className="text-xs sm:text-sm font-medium text-[var(--text)]">
                      Filename as Title
                    </span>
                    <p className="text-[11px] text-[var(--muted)]">
                      Title = filename without extension, '-'/'_' replaced by spaces, whitespace collapsed, trimmed.
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={settings.silhouetteMode}
                    onChange={(e) => onChange({ silhouetteMode: e.target.checked })}
                    className="mt-0.5 h-4 w-4 rounded border-slate-700 bg-slate-950 text-[var(--accent)] focus:ring-[var(--accent)] accent-[var(--accent)]"
                  />
                  <div>
                    <span className="text-xs sm:text-sm font-medium text-[var(--text)]">
                      Silhouette Mode
                    </span>
                    <p className="text-[11px] text-[var(--muted)]">
                      For SVG/transparent PNG: convert artwork to a black silhouette on white before analysis; tell model to focus on form/shape.
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={settings.filenameOnlyMode}
                    onChange={(e) => onChange({ filenameOnlyMode: e.target.checked })}
                    className="mt-0.5 h-4 w-4 rounded border-slate-700 bg-slate-950 text-[var(--accent)] focus:ring-[var(--accent)] accent-[var(--accent)]"
                  />
                  <div>
                    <span className="text-xs sm:text-sm font-medium text-[var(--text)]">
                      Filename-Only Mode
                    </span>
                    <p className="text-[11px] text-[var(--muted)]">
                      Send NO image; prompt the model with the filename text only.
                    </p>
                  </div>
                </label>
              </div>

              {/* PNG Background Dropdown */}
              <div className="space-y-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3.5 flex flex-col justify-center">
                <label className="block text-xs font-semibold text-[var(--text)]">
                  PNG Background
                </label>
                <p className="text-[11px] text-[var(--muted)]">
                  Background composited behind transparent PNGs before sending:
                </p>
                <select
                  value={settings.pngBackground}
                  onChange={(e) => onChange({ pngBackground: e.target.value as PngBackground })}
                  className="cursor-pointer rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs sm:text-sm text-[var(--text)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                >
                  <option value="Transparent (Original)">Transparent (Original)</option>
                  <option value="White Background">White Background</option>
                  <option value="Black Background">Black Background</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Vertical Order: 1. Title Length, 2. Keywords Count, 3. Description Length, 4. Format, 5. Include, 6. Exclude */}
        <div className="mt-5 space-y-6">
          {/* 1. Title Length Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="font-medium text-[var(--text)]">Title Length</span>
              <span className="font-mono text-indigo-400 font-semibold tabular-nums">
                {settings.titleLength} chars
              </span>
            </div>
            <input
              type="range"
              min={30}
              max={300}
              step={5}
              value={settings.titleLength}
              onChange={(e) => onChange({ titleLength: Number(e.target.value) })}
              className="w-full accent-indigo-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-[var(--muted)] font-mono">
              <span>30</span>
              <span>150</span>
              <span>300</span>
            </div>
          </div>

          {/* 2. Keywords Count Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="font-medium text-[var(--text)]">Keywords Count</span>
              <span className="font-mono text-indigo-400 font-semibold tabular-nums">
                {settings.keywordsCount} keywords
              </span>
            </div>
            <input
              type="range"
              min={5}
              max={50}
              step={1}
              value={settings.keywordsCount}
              onChange={(e) => onChange({ keywordsCount: Number(e.target.value) })}
              className="w-full accent-indigo-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-[var(--muted)] font-mono">
              <span>5</span>
              <span>25</span>
              <span>50</span>
            </div>
          </div>

          {/* 3. Description Length Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="font-medium text-[var(--text)]">Description Length</span>
              <span className="font-mono text-indigo-400 font-semibold tabular-nums">
                {settings.descriptionLength} chars
              </span>
            </div>
            <input
              type="range"
              min={30}
              max={300}
              step={5}
              value={settings.descriptionLength}
              onChange={(e) => onChange({ descriptionLength: Number(e.target.value) })}
              className="w-full accent-indigo-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-[var(--muted)] font-mono">
              <span>30</span>
              <span>150</span>
              <span>300</span>
            </div>
          </div>

          {/* 4. Keyword Format Buttons */}
          <div className="space-y-2 pt-2 border-t border-[var(--border)]">
            <label className="block text-xs font-medium text-[var(--text)]">
              Keyword Format
            </label>
            <div className="inline-flex rounded-lg border border-[var(--border)] bg-[var(--surface)] p-1">
              {(['Single', 'Double', 'Auto'] as KeywordFormat[]).map((fmt) => (
                <button
                  key={fmt}
                  type="button"
                  onClick={() => onChange({ keywordFormat: fmt })}
                  className={`cursor-pointer px-4 py-1.5 text-xs font-semibold rounded-md transition-all hover-btn-pink ${
                    settings.keywordFormat === fmt
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-[var(--muted)] hover:text-[var(--text)]'
                  }`}
                >
                  {fmt}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-[var(--muted)]">
              {settings.keywordFormat === 'Single' && 'Single words only (no phrases)'}
              {settings.keywordFormat === 'Double' && 'Two-word combinations'}
              {settings.keywordFormat === 'Auto' && 'AI decides the best mix'}
            </p>
          </div>

          {/* 5. Include Keywords */}
          <div className="space-y-2 pt-2 border-t border-[var(--border)]">
            <label className="block text-xs font-medium text-[var(--text)]">
              Include Keywords
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={includeInput}
                onChange={(e) => setIncludeInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddInclude();
                  }
                }}
                placeholder="Must-include keywords (press Enter or +)"
                className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-[var(--text)] placeholder:text-[var(--muted)] focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={handleAddInclude}
                className="cursor-pointer flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 text-[var(--text)] hover:bg-slate-700 transition-colors hover-btn-pink"
                title="Add include keyword"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            {settings.includeKeywords.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {settings.includeKeywords.map((kw) => (
                  <span
                    key={kw}
                    className="inline-flex items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-300"
                  >
                    <span>{kw}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveInclude(kw)}
                      className="cursor-pointer hover:text-white"
                      title="Remove"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* 6. Exclude Keywords */}
          <div className="space-y-2 pt-2 border-t border-[var(--border)]">
            <label className="block text-xs font-medium text-[var(--text)]">
              Exclude Keywords
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={excludeInput}
                onChange={(e) => setExcludeInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddExclude();
                  }
                }}
                placeholder="Must-exclude keywords (press Enter or +)"
                className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-[var(--text)] placeholder:text-[var(--muted)] focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={handleAddExclude}
                className="cursor-pointer flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 text-[var(--text)] hover:bg-slate-700 transition-colors hover-btn-pink"
                title="Add exclude keyword"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            {settings.excludeKeywords.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {settings.excludeKeywords.map((kw) => (
                  <span
                    key={kw}
                    className="inline-flex items-center gap-1 rounded-md border border-rose-500/30 bg-rose-500/10 px-2 py-0.5 text-xs text-rose-300"
                  >
                    <span>{kw}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveExclude(kw)}
                      className="cursor-pointer hover:text-white"
                      title="Remove"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
