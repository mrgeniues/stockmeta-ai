import React, { useState, useEffect } from 'react';
import { ExternalLink, Key, Plus, Trash2, CheckCircle2, Cpu, ChevronDown, Loader2 } from 'lucide-react';

interface ApiKeySectionProps {
  savedKeys: string[];
  onSaveKey: (newKey: string) => void;
  onRemoveKey: (index: number) => void;
  model: 'gemini-3.8-flash' | 'gemini-3.1-pro-preview';
  onModelChange: (model: 'gemini-3.8-flash' | 'gemini-3.1-pro-preview') => void;
  onToast: (type: 'success' | 'error' | 'info', message: string) => void;
  openTrigger?: number;
}

export const ApiKeySection: React.FC<ApiKeySectionProps> = ({
  savedKeys,
  onSaveKey,
  onRemoveKey,
  model,
  onModelChange,
  onToast,
  openTrigger,
}) => {
  const apiKeys = savedKeys;
  const [inputValue, setInputValue] = useState('');
  const [showInputSlot, setShowInputSlot] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    if (openTrigger) {
      setIsCollapsed(false);
      setShowInputSlot(true);
    }
  }, [openTrigger]);

  const handleSave = async () => {
    const trimmed = inputValue.trim();
    if (!trimmed) {
      onToast('error', 'Please enter a valid API key');
      return;
    }
    if (savedKeys.includes(trimmed)) {
      onToast('error', 'This API key is already added');
      return;
    }
    if (savedKeys.length >= 3) {
      onToast('error', 'Maximum 3 API keys can be saved');
      return;
    }

    setIsValidating(true);
    try {
      // Validate key via Gemini models endpoint: STRICT check requiring response.ok === true
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(trimmed)}`,
        { method: 'GET' }
      );

      // If response is not ok (400/401/403/404/etc), REJECT - do not save, keep dialog open
      if (!response.ok) {
        let errorDetail = '';
        try {
          const data = await response.json();
          if (data?.error?.message) {
            errorDetail = `: ${data.error.message}`;
          }
        } catch {
          // ignore json parse error
        }
        onToast(
          'error',
          `Invalid API key — please check the key and try again${errorDetail}`
        );
        return;
      }

      // ONLY on response.ok === true: save the key, show success toast, close dialog
      onSaveKey(trimmed);
      setInputValue('');
      setShowInputSlot(false);
      onToast('success', 'API key verified and saved successfully');
    } catch (err: unknown) {
      // If fetch throws or network fails, REJECT - do not save, keep dialog open
      const msg = err instanceof Error ? err.message : String(err);
      onToast(
        'error',
        `Invalid API key — please check the key and try again (${msg})`
      );
    } finally {
      setIsValidating(false);
    }
  };

  const maskKey = (key: string) => {
    if (key.length <= 8) {
      return '****' + key.slice(-2);
    }
    return `${key.slice(0, 4)}...${key.slice(-4)}`;
  };

  return (
    <div className="w-full" id="api-key-section">
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6 shadow-xl backdrop-blur-sm">
        {/* Header: Bold section header on LEFT; "0/3" counter pill + collapse chevron on RIGHT */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent)]/10 text-[var(--accent)]">
              <Key className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[var(--text)]">API Key &amp; Model Settings</h2>
              <p className="text-xs text-[var(--muted)]">
                Configure your Gemini credentials and generation model
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="font-mono text-xs font-semibold px-2.5 py-0.5 rounded-md bg-[var(--accent)]/10 text-[var(--accent)] tabular-nums border border-[var(--accent)]/30">
              {savedKeys.length}/3
            </span>
            <button
              type="button"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="cursor-pointer flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)] transition-colors"
              title={isCollapsed ? 'Expand section' : 'Collapse section'}
              aria-label={isCollapsed ? 'Expand section' : 'Collapse section'}
            >
              <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isCollapsed ? '-rotate-90' : ''}`} />
            </button>
          </div>
        </div>

        {/* Collapsible Body */}
        {!isCollapsed && (
          <div className="mt-4 pt-4 border-t border-[var(--border)] space-y-4">
            {/* Input slot when adding a key */}
            {showInputSlot && savedKeys.length < 3 && (
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[var(--text)]">
                    Enter Gemini API Key ({savedKeys.length + 1}/3)
                  </span>
                  <a
                    href="https://aistudio.google.com/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-[var(--accent)] hover:opacity-80 transition-opacity"
                  >
                    <span>Get a free key</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="password"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSave();
                      }
                    }}
                    placeholder="Paste Gemini API key (AIza...)"
                    autoFocus
                    className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs sm:text-sm text-[var(--text)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] font-mono"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={isValidating}
                      onClick={handleSave}
                      className="cursor-pointer inline-flex items-center gap-1.5 rounded-lg bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-white hover:opacity-90 active:scale-[0.98] transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isValidating ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          <span>Verifying...</span>
                        </>
                      ) : (
                        <span>Save</span>
                      )}
                    </button>
                    <button
                      type="button"
                      disabled={isValidating}
                      onClick={() => {
                        setShowInputSlot(false);
                        setInputValue('');
                      }}
                      className="cursor-pointer rounded-lg border border-slate-700 px-3 py-2 text-xs text-[var(--muted)] hover:text-[var(--text)] transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* If no keys and not currently showing input slot: dashed-border box */}
            {apiKeys.length === 0 && !showInputSlot && (
              <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[var(--border)] bg-[var(--surface)] p-6 text-center space-y-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--surface)] border border-[var(--border)] text-[var(--muted)]">
                  <Key className="h-5 w-5" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-sm font-semibold text-[var(--text)]">No Gemini Key Added Yet.</p>
                  <p className="text-xs text-[var(--muted)]">Click + to add one.</p>
                </div>
                <p className="text-xs text-[var(--muted)] max-w-sm">
                  Adding multiple API keys helps distribute requests and avoid rate limits
                </p>
                <div className="w-full pt-1 space-y-2">
                  <p className="text-xs sm:text-sm text-[var(--muted)]">
                    Add your own API key to generate metadata
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowInputSlot(true)}
                    className="cursor-pointer w-full flex items-center justify-center gap-2 rounded-xl bg-[var(--accent)] hover:opacity-90 active:scale-[0.99] text-white font-semibold py-2.5 px-4 text-xs sm:text-sm transition-all shadow-md shadow-[var(--card-glow)] hover-btn-pink"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Gemini API Key</span>
                  </button>
                </div>
                <div className="pt-1">
                  <a
                    href="https://aistudio.google.com/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--accent)] hover:opacity-80 transition-opacity"
                  >
                    <span>Get a free key</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            )}

            {/* Saved Keys Rows */}
            {savedKeys.length > 0 && (
              <div className="space-y-2">
                {savedKeys.map((key, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2.5"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs sm:text-sm text-[var(--text)]">
                        {maskKey(key)}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-400">
                        <CheckCircle2 className="h-3 w-3" />
                        Saved
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        onRemoveKey(index);
                        onToast('info', 'API key removed');
                      }}
                      className="cursor-pointer text-[var(--muted)] hover:text-rose-400 p-1 rounded transition-colors"
                      title="Remove API key"
                      aria-label="Remove API key"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}

                {savedKeys.length < 3 && !showInputSlot && (
                  <div className="pt-1 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setShowInputSlot(true)}
                      className="cursor-pointer flex items-center gap-1.5 text-xs font-semibold text-[var(--accent)] hover:opacity-80 transition-opacity"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Add another key ({savedKeys.length}/3)</span>
                    </button>
                    <a
                      href="https://aistudio.google.com/apikey"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-[var(--accent)] hover:opacity-80 transition-opacity"
                    >
                      <span>Get a free key</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Helper Text when keys exist */}
            {savedKeys.length > 0 && (
              <p className="text-xs text-[var(--muted)]">
                Adding multiple API keys helps distribute requests and avoid rate limits
              </p>
            )}

            {/* Model Selection Row */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[var(--border)]">
              <span className="text-xs text-[var(--muted)]">
                Generation model (runs with your saved API key)
              </span>
              <div className="flex items-center gap-2">
                <Cpu className="h-3.5 w-3.5 text-[var(--muted)]" />
                <span className="text-xs font-medium text-[var(--muted)]">Model:</span>
                <select
                  value={model}
                  onChange={(e) => onModelChange(e.target.value as 'gemini-3.8-flash' | 'gemini-3.1-pro-preview')}
                  className="cursor-pointer rounded-lg border border-slate-700 bg-[var(--surface)] px-3 py-1.5 text-xs sm:text-sm font-medium text-[var(--text)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                >
                  <option value="gemini-3.8-flash">gemini-3.8-flash (Fast &amp; High Limit)</option>
                  <option value="gemini-3.1-pro-preview">gemini-3.1-pro-preview (High Quality)</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
