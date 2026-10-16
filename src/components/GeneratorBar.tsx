import React from 'react';
import { Sparkles, Loader2, AlertCircle } from 'lucide-react';
import { MagneticButton } from './motion/MagneticButton';

interface GeneratorBarProps {
  hasAvailableKey: boolean;
  filesCount: number;
  isGenerating: boolean;
  completedCount: number;
  totalCount: number;
  onGenerate: () => void;
  onOpenApiKey?: () => void;
}

export const GeneratorBar: React.FC<GeneratorBarProps> = ({
  hasAvailableKey,
  filesCount,
  isGenerating,
  completedCount,
  totalCount,
  onGenerate,
  onOpenApiKey,
}) => {
  const canGenerate = hasAvailableKey && filesCount > 0;

  // Exact requested disabled hint text
  let disabledHint = '';
  if (!hasAvailableKey) {
    disabledHint = 'API key required — add your own Gemini API key in settings';
  } else if (filesCount === 0) {
    disabledHint = 'Please upload files';
  }

  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="w-full" id="generator-action">
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6 shadow-xl backdrop-blur-sm">
        {/* Progress Bar (during generation) */}
        {isGenerating && (
          <div className="mb-5 space-y-2">
            <div className="flex justify-between text-xs font-semibold text-[var(--text)]">
              <span className="flex items-center gap-1.5 text-[var(--accent)]">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Processing with 3 concurrent workers...
              </span>
              <span className="font-mono tabular-nums">
                {completedCount} / {totalCount} ({progressPercent}%)
              </span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full bg-[var(--accent)] transition-all duration-300 ease-out relative overflow-hidden animate-progress-shimmer"
                style={{ width: `${progressPercent}%` }}
              >
                {/* Shimmer sweep overlay across active progress bar */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer-sweep pointer-events-none" />
              </div>
            </div>
          </div>
        )}

        {/* Full-width Big Button with Magnetic Hover & Material Ripple */}
        <MagneticButton
          type="button"
          onClick={onGenerate}
          disabled={!canGenerate || isGenerating}
          strength={0.2}
          className={`cursor-pointer w-full group relative overflow-hidden flex items-center justify-center gap-2.5 rounded-xl py-4 px-6 text-base sm:text-lg font-bold text-white shadow-xl transition-all duration-200 hover-btn-pink ${
            !canGenerate || isGenerating
              ? 'cursor-not-allowed opacity-50 bg-slate-800 text-slate-400 shadow-none'
              : 'bg-[var(--accent)] hover:opacity-90 active:scale-[0.99] shadow-lg shadow-[var(--card-glow)] ring-1 ring-white/15 animate-pink-pulse'
          }`}
        >
          {/* Shimmering sweep animation on the button */}
          {canGenerate && !isGenerating && (
            <div
              className="absolute inset-0 -translate-x-full animate-shimmer-sweep bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none"
              aria-hidden="true"
            />
          )}

          {isGenerating ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Generating Metadata ({completedCount}/{totalCount})...</span>
            </>
          ) : (
            <>
              <Sparkles className="h-5 w-5 text-white/90 group-hover:scale-110 transition-transform" />
              <span>GENERATE METADATA</span>
            </>
          )}
        </MagneticButton>

        {/* Disabled hint text / key prompt */}
        {!hasAvailableKey ? (
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-xs text-rose-400 font-medium">
            <div className="flex items-center gap-1.5">
              <AlertCircle className="h-3.5 w-3.5 shrink-0 text-rose-500" />
              <span>API key required — add your own Gemini API key to generate metadata</span>
            </div>
            {onOpenApiKey && (
              <button
                type="button"
                onClick={onOpenApiKey}
                className="cursor-pointer inline-flex items-center gap-1 rounded-md bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 px-2.5 py-0.5 text-xs font-semibold transition-colors"
              >
                <span>Add API key</span>
              </button>
            )}
          </div>
        ) : !canGenerate && disabledHint ? (
          <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-amber-400">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            <span>{disabledHint}</span>
          </div>
        ) : null}
      </div>
    </div>
  );
};
