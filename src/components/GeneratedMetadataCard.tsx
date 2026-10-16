import React, { useState, useEffect, useRef } from 'react';
import { FileItem, StockPlatformPreset, PlatformSettings } from '../types';
import { PRESET_LIST, PLATFORM_PRESETS } from '../constants/presets';
import { copyTextToClipboard } from '../utils/clipboard';
import {
  Sparkles,
  Copy,
  RefreshCw,
  Trash2,
  Plus,
  X,
  Check,
  CheckCircle2,
  AlertTriangle,
  FileCheck2,
  Info,
  ChevronDown,
  ChevronRight,
  Maximize2,
  Minimize2,
  Loader2,
  Clock,
  Film,
} from 'lucide-react';
import { analyzeCompliance } from '../utils/compliance';
import { AnimatedCounter } from './motion/AnimatedCounter';

interface GeneratedMetadataCardProps {
  files: FileItem[];
  silhouetteMode: boolean;
  maxTitleLength: number;
  maxDescLength: number;
  targetKeywordsCount?: number;
  activePreset?: StockPlatformPreset;
  onSelectPreset?: (preset: StockPlatformPreset) => void;
  platformSettings?: PlatformSettings;
  onUpdateFileMetadata: (
    id: string,
    updated: { title?: string; description?: string; keywords?: string[] }
  ) => void;
  onRegenerateFile: (id: string) => void;
  onRemoveFile: (id: string) => void;
  onToast: (type: 'success' | 'error' | 'info', message: string) => void;
  isGenerating: boolean;
  concurrency?: number;
}

function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * 12 Vibrant Keyword Chip color palettes cycling in order:
 * red, orange, pink, magenta, green, teal, blue, purple, yellow, cyan, lime, indigo.
 *
 * Each chip provides dark, crisp readable text on bright vibrant background pills
 * that remain completely legible in both Light theme and dark themes.
 */
const VIBRANT_KEYWORD_PALETTE = [
  // 1. Red
  {
    pill: 'bg-rose-200 text-rose-950 border-rose-400/60 hover:bg-rose-300 dark:bg-rose-300 dark:text-neutral-950 dark:border-rose-400',
    removeBtn: 'text-rose-800/80 hover:text-black dark:text-neutral-900/80 dark:hover:text-black',
  },
  // 2. Orange
  {
    pill: 'bg-orange-200 text-orange-950 border-orange-400/60 hover:bg-orange-300 dark:bg-orange-300 dark:text-neutral-950 dark:border-orange-400',
    removeBtn: 'text-orange-800/80 hover:text-black dark:text-neutral-900/80 dark:hover:text-black',
  },
  // 3. Pink
  {
    pill: 'bg-pink-200 text-pink-950 border-pink-400/60 hover:bg-pink-300 dark:bg-pink-300 dark:text-neutral-950 dark:border-pink-400',
    removeBtn: 'text-pink-800/80 hover:text-black dark:text-neutral-900/80 dark:hover:text-black',
  },
  // 4. Magenta
  {
    pill: 'bg-fuchsia-200 text-fuchsia-950 border-fuchsia-400/60 hover:bg-fuchsia-300 dark:bg-fuchsia-300 dark:text-neutral-950 dark:border-fuchsia-400',
    removeBtn: 'text-fuchsia-800/80 hover:text-black dark:text-neutral-900/80 dark:hover:text-black',
  },
  // 5. Green
  {
    pill: 'bg-emerald-200 text-emerald-950 border-emerald-400/60 hover:bg-emerald-300 dark:bg-emerald-300 dark:text-neutral-950 dark:border-emerald-400',
    removeBtn: 'text-emerald-800/80 hover:text-black dark:text-neutral-900/80 dark:hover:text-black',
  },
  // 6. Teal
  {
    pill: 'bg-teal-200 text-teal-950 border-teal-400/60 hover:bg-teal-300 dark:bg-teal-300 dark:text-neutral-950 dark:border-teal-400',
    removeBtn: 'text-teal-800/80 hover:text-black dark:text-neutral-900/80 dark:hover:text-black',
  },
  // 7. Blue
  {
    pill: 'bg-sky-200 text-sky-950 border-sky-400/60 hover:bg-sky-300 dark:bg-sky-300 dark:text-neutral-950 dark:border-sky-400',
    removeBtn: 'text-sky-800/80 hover:text-black dark:text-neutral-900/80 dark:hover:text-black',
  },
  // 8. Purple
  {
    pill: 'bg-purple-200 text-purple-950 border-purple-400/60 hover:bg-purple-300 dark:bg-purple-300 dark:text-neutral-950 dark:border-purple-400',
    removeBtn: 'text-purple-800/80 hover:text-black dark:text-neutral-900/80 dark:hover:text-black',
  },
  // 9. Yellow
  {
    pill: 'bg-yellow-200 text-yellow-950 border-yellow-400/60 hover:bg-yellow-300 dark:bg-yellow-300 dark:text-neutral-950 dark:border-yellow-400',
    removeBtn: 'text-yellow-800/80 hover:text-black dark:text-neutral-900/80 dark:hover:text-black',
  },
  // 10. Cyan
  {
    pill: 'bg-cyan-200 text-cyan-950 border-cyan-400/60 hover:bg-cyan-300 dark:bg-cyan-300 dark:text-neutral-950 dark:border-cyan-400',
    removeBtn: 'text-cyan-800/80 hover:text-black dark:text-neutral-900/80 dark:hover:text-black',
  },
  // 11. Lime
  {
    pill: 'bg-lime-200 text-lime-950 border-lime-400/60 hover:bg-lime-300 dark:bg-lime-300 dark:text-neutral-950 dark:border-lime-400',
    removeBtn: 'text-lime-800/80 hover:text-black dark:text-neutral-900/80 dark:hover:text-black',
  },
  // 12. Indigo
  {
    pill: 'bg-indigo-200 text-indigo-950 border-indigo-400/60 hover:bg-indigo-300 dark:bg-indigo-300 dark:text-neutral-950 dark:border-indigo-400',
    removeBtn: 'text-indigo-800/80 hover:text-black dark:text-neutral-900/80 dark:hover:text-black',
  },
];

/**
 * Small File Preview Thumbnail with bottom-left type pill ('IMG' | 'VID' | 'SVG')
 */
const FileThumbnailBox: React.FC<{
  item: FileItem;
  silhouetteMode?: boolean;
  sizeClasses?: string;
}> = ({ item, silhouetteMode, sizeClasses = 'w-full aspect-video' }) => {
  const isSvg =
    item.type === 'image/svg+xml' ||
    item.file?.type === 'image/svg+xml' ||
    item.name.toLowerCase().endsWith('.svg');

  const isVideo = Boolean(
    item.isVideo ||
    item.type?.startsWith('video/') ||
    item.file?.type?.startsWith('video/') ||
    /\.(mp4|webm|mov|mkv|avi)$/i.test(item.name)
  );

  const typeLabel = isVideo ? 'VID' : isSvg ? 'SVG' : 'IMG';
  const isPosterOrImage = Boolean(
    item.previewUrl && (item.previewUrl.startsWith('data:image/') || !isVideo)
  );

  return (
    <div
      className={`relative rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--bg)] flex items-center justify-center shadow-inner group ${sizeClasses}`}
    >
      {isPosterOrImage ? (
        <img
          src={item.previewUrl}
          alt={item.name}
          className={`h-full w-full object-cover select-none transition-transform duration-300 group-hover:scale-105 ${
            silhouetteMode ? 'brightness-0 contrast-200' : ''
          }`}
          loading="lazy"
        />
      ) : isVideo ? (
        <div className="h-full w-full bg-slate-900/90 flex flex-col items-center justify-center select-none text-blue-400">
          <Film className="h-5 w-5 animate-pulse opacity-80" />
        </div>
      ) : (
        <img
          src={item.previewUrl || ''}
          alt={item.name}
          className={`h-full w-full object-cover select-none ${
            silhouetteMode ? 'brightness-0 contrast-200' : ''
          }`}
          loading="lazy"
        />
      )}

      {/* Overlay type badge at bottom-left */}
      <div className="absolute bottom-1.5 left-1.5 rounded-md bg-black/85 px-1.5 py-0.5 text-[9px] font-mono font-bold text-white shadow-md pointer-events-none select-none tracking-wider">
        {typeLabel}
      </div>
    </div>
  );
};

export const GeneratedMetadataCard: React.FC<GeneratedMetadataCardProps> = ({
  files,
  silhouetteMode,
  maxTitleLength,
  maxDescLength,
  targetKeywordsCount = 45,
  activePreset = 'Adobe Stock',
  onSelectPreset,
  platformSettings,
  onUpdateFileMetadata,
  onRegenerateFile,
  onRemoveFile,
  onToast,
  isGenerating,
  concurrency = 3,
}) => {
  // Top single platform dropdown state
  const [selectedPlatform, setSelectedPlatform] = useState<StockPlatformPreset>(activePreset);

  // Accordion expanded state record: fileId -> boolean
  const [expandedFileIds, setExpandedFileIds] = useState<Record<string, boolean>>({});

  // Full detail mode toggle per file
  const [fullDetailFileIds, setFullDetailFileIds] = useState<Record<string, boolean>>({});

  // Input states for adding new keywords per file
  const [newKeywordInputs, setNewKeywordInputs] = useState<Record<string, string>>({});

  // Completed files count
  const completedFiles = files.filter((f) => f.status === 'Done' && f.metadata);
  const doneCount = completedFiles.length;
  const totalCount = files.length;
  const progressPct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;
  const realConcurrency = Math.min(concurrency, Math.max(1, totalCount));

  // Auto-expand newly completed files so the user watches metadata appear file-by-file
  const prevStatusesRef = useRef<Record<string, string>>({});

  // Auto-scroll refs & state during generation
  const listRef = useRef<HTMLDivElement | null>(null);
  const rowRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const isProgrammaticRef = useRef(false);
  const lastManualScrollRef = useRef(0);
  const programmaticTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Derive active file from existing generating state (first file with status generating/processing, or existing isGenerating + current index)
  const activeProcessingFile = files.find((f) => f.status === 'Processing');
  const activeFile =
    activeProcessingFile ||
    (isGenerating ? files.find((f) => f.status === 'Pending') || files[0] : undefined);
  const activeFileId = activeFile?.id;

  const handleScroll = () => {
    if (!isProgrammaticRef.current) {
      lastManualScrollRef.current = Date.now();
    }
  };

  useEffect(() => {
    if (isGenerating && activeFileId) {
      const now = Date.now();
      if (now - lastManualScrollRef.current > 5000) {
        const rowEl = rowRefs.current.get(activeFileId);
        if (rowEl) {
          isProgrammaticRef.current = true;
          rowEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          if (programmaticTimerRef.current) {
            clearTimeout(programmaticTimerRef.current);
          }
          programmaticTimerRef.current = setTimeout(() => {
            isProgrammaticRef.current = false;
          }, 600);
        }
      }
    }

    return () => {
      if (programmaticTimerRef.current) {
        clearTimeout(programmaticTimerRef.current);
      }
    };
  }, [activeFileId, isGenerating]);
  useEffect(() => {
    files.forEach((f) => {
      const prev = prevStatusesRef.current[f.id];
      if (prev !== 'Done' && f.status === 'Done') {
        // Just-completed file -> auto-expand immediately!
        setExpandedFileIds((old) => ({ ...old, [f.id]: true }));
      }
      prevStatusesRef.current[f.id] = f.status;
    });
  }, [files]);

  // Keep in sync if parent activePreset changes
  useEffect(() => {
    if (activePreset && activePreset !== selectedPlatform) {
      setSelectedPlatform(activePreset);
    }
  }, [activePreset, selectedPlatform]);

  const handlePlatformChange = (preset: StockPlatformPreset) => {
    setSelectedPlatform(preset);
    if (onSelectPreset) {
      onSelectPreset(preset);
    }
    onToast('info', `Switched platform view to ${preset}`);
  };

  const toggleExpand = (fileId: string) => {
    setExpandedFileIds((prev) => {
      const current = isGenerating ? prev[fileId] !== false : Boolean(prev[fileId]);
      return {
        ...prev,
        [fileId]: !current,
      };
    });
  };

  const toggleFullDetail = (fileId: string) => {
    setFullDetailFileIds((prev) => ({
      ...prev,
      [fileId]: !prev[fileId],
    }));
  };

  const expandAll = () => {
    const allExpanded: Record<string, boolean> = {};
    files.forEach((f) => {
      allExpanded[f.id] = true;
    });
    setExpandedFileIds(allExpanded);
  };

  const collapseAll = () => {
    const allCollapsed: Record<string, boolean> = {};
    files.forEach((f) => {
      allCollapsed[f.id] = false;
    });
    setExpandedFileIds(allCollapsed);
  };

  // 1. Description Counter Max: Live user setting (never hardcoded 150)
  const effectiveMaxDesc = maxDescLength || 200;

  // 2. Title Counter Max: User live setting as max, respecting official platform caps only when that platform is selected
  // (e.g. Freepik title ≤ 100, Canva title ≤ 100, Vecteezy title ≤ 100, 123RF title ≤ 100, Pond5 title ≤ 120, iStock title ≤ 150)
  const userTitleTarget = maxTitleLength || 200;
  let effectiveMaxTitle = userTitleTarget;
  if (selectedPlatform === 'Freepik') {
    effectiveMaxTitle = 100;
  } else if (selectedPlatform === 'Vecteezy') {
    effectiveMaxTitle = 100;
  } else if (selectedPlatform === 'Canva') {
    effectiveMaxTitle = 100;
  } else if (selectedPlatform === '123RF') {
    effectiveMaxTitle = 100;
  } else if (selectedPlatform === 'Pond5') {
    effectiveMaxTitle = 120;
  } else if (selectedPlatform === 'iStock') {
    effectiveMaxTitle = 150;
  } else if (selectedPlatform === 'Adobe Stock') {
    effectiveMaxTitle = Math.max(200, userTitleTarget);
  } else {
    // General
    effectiveMaxTitle = userTitleTarget;
  }

  // 3. Keywords Counter Max: User live setting (targetKeywordsCount), capped only by hard platform caps
  // (e.g. Canva ≤ 25 keywords, Freepik ≤ 40 keywords, Adobe Stock ≤ 49 keywords)
  const userKeywordsTarget = targetKeywordsCount || 49;
  let effectiveMaxKeywords = userKeywordsTarget;
  if (selectedPlatform === 'Canva') {
    effectiveMaxKeywords = Math.min(25, userKeywordsTarget);
  } else if (selectedPlatform === 'Freepik') {
    effectiveMaxKeywords = Math.min(40, userKeywordsTarget);
  } else if (selectedPlatform === 'Adobe Stock') {
    effectiveMaxKeywords = Math.min(49, userKeywordsTarget);
  }

  const handleCopy = async (text: string, label: string) => {
    if (!text) {
      onToast('info', `No ${label.toLowerCase()} to copy`);
      return;
    }
    const success = await copyTextToClipboard(text);
    if (success) {
      onToast('success', `Copied ${label.toLowerCase()} to clipboard`);
    } else {
      onToast('error', `Failed to copy ${label.toLowerCase()}`);
    }
  };

  const handleCopyAll = async (item: FileItem) => {
    let title = item.metadata?.title || '';
    if (selectedPlatform === 'Adobe Stock' && title.endsWith('.')) {
      title = title.replace(/\.+$/, '');
    }
    const desc = item.metadata?.description || '';
    const kw = (item.metadata?.keywords || []).join(', ');
    const combined = `[${selectedPlatform}]\nTitle: ${title}\nDescription: ${desc}\nKeywords: ${kw}`;
    await handleCopy(combined, 'all metadata');
  };

  const handleCopyAllGeneratedFiles = async () => {
    if (completedFiles.length === 0) return;
    const allText = completedFiles
      .map((item, idx) => {
        let title = item.metadata?.title || '';
        if (selectedPlatform === 'Adobe Stock' && title.endsWith('.')) {
          title = title.replace(/\.+$/, '');
        }
        const desc = item.metadata?.description || '';
        const kw = (item.metadata?.keywords || []).join(', ');
        return `[#${idx + 1}] ${item.name} (${selectedPlatform})\nTitle: ${title}\nDescription: ${desc}\nKeywords: ${kw}\n`;
      })
      .join('\n---\n\n');
    await handleCopy(allText, 'all files metadata');
  };

  const handleAddKeyword = (id: string, currentKeywords: string[]) => {
    const inputVal = (newKeywordInputs[id] || '').trim();
    if (!inputVal) return;

    const incomingParts = inputVal
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);
    const updated = [...currentKeywords];
    for (const part of incomingParts) {
      if (!updated.some((k) => k.toLowerCase() === part.toLowerCase())) {
        updated.push(part);
      }
    }

    onUpdateFileMetadata(id, { keywords: updated });
    setNewKeywordInputs((prev) => ({ ...prev, [id]: '' }));
    onToast('success', `Added keyword${incomingParts.length > 1 ? 's' : ''}`);
  };

  const handleRemoveKeyword = (
    id: string,
    kwToRemove: string,
    currentKeywords: string[]
  ) => {
    const updated = currentKeywords.filter((k) => k !== kwToRemove);
    onUpdateFileMetadata(id, { keywords: updated });
  };

  const handleFixAdobePeriod = (id: string, currentTitle: string) => {
    const cleanTitle = currentTitle.replace(/\.+$/, '');
    onUpdateFileMetadata(id, { title: cleanTitle });
    onToast('success', 'Removed trailing period for Adobe Stock');
  };

  // Files to display: during batch generation, show all uploaded files in live states; otherwise show completed files
  const displayedFiles = isGenerating ? files : completedFiles;
  const hasItemsToShow = displayedFiles.length > 0;

  const allAreExpanded =
    displayedFiles.length > 0 &&
    displayedFiles.every((f) =>
      isGenerating ? expandedFileIds[f.id] !== false : Boolean(expandedFileIds[f.id])
    );

  return (
    <section
      id="generated-metadata-results"
      aria-label="Generated Metadata Results"
      className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6 shadow-xl backdrop-blur-sm transition-all"
    >
      {/* 1. Header Bar: Title, Live Status/Count & Global Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[var(--border)]">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-500 dark:text-blue-400">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-[var(--text)] tracking-tight">
                Generated Metadata
              </h2>
              {isGenerating ? (
                <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-500 dark:text-blue-300 tabular-nums border border-blue-500/30 animate-pulse flex items-center gap-1.5">
                  <Loader2 className="h-3 w-3 animate-spin shrink-0" />
                  <span>
                    {doneCount} / {totalCount} ready
                  </span>
                </span>
              ) : (
                <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-full bg-[var(--surface)] text-[var(--muted)] tabular-nums border border-[var(--border)]">
                  <AnimatedCounter value={completedFiles.length} /> ready
                </span>
              )}
            </div>
            <p className="text-xs text-[var(--muted)]">
              Interactive accordion metadata cards formatted for stock agency rules
            </p>
          </div>
        </div>

        {hasItemsToShow && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={allAreExpanded ? collapseAll : expandAll}
              className="cursor-pointer inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--border)]/30 text-[var(--text)] px-2.5 py-1.5 text-xs font-medium transition-colors shadow-2xs"
              title={allAreExpanded ? 'Collapse all file rows' : 'Expand all file rows'}
            >
              {allAreExpanded ? (
                <>
                  <Minimize2 className="h-3.5 w-3.5 text-[var(--muted)]" />
                  <span>Collapse All</span>
                </>
              ) : (
                <>
                  <Maximize2 className="h-3.5 w-3.5 text-[var(--muted)]" />
                  <span>Expand All</span>
                </>
              )}
            </button>

            {completedFiles.length > 0 && (
              <button
                type="button"
                onClick={handleCopyAllGeneratedFiles}
                className="cursor-pointer inline-flex items-center gap-1.5 rounded-lg border border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 dark:text-blue-300 px-3 py-1.5 text-xs font-semibold transition-colors shadow-2xs"
                title="Copy metadata for all completed files"
              >
                <Copy className="h-3.5 w-3.5" />
                <span>Copy All Results</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* 2. BATCH PROGRESS BAR: Visible ONLY while batch generation is actively running */}
      {isGenerating && totalCount > 0 && (
        <div className="mt-4 relative overflow-hidden rounded-xl bg-[#091528] border border-blue-500/30 p-3 sm:p-3.5 shadow-lg">
          {/* Animated blue progress fill behind text */}
          <div
            className="absolute inset-y-0 left-0 bg-blue-600/25 transition-all duration-300 ease-out"
            style={{ width: `${progressPct}%` }}
          />

          {/* Left: spinner + blue text; Right: white text counts */}
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-blue-400 font-medium">
              <Loader2 className="h-4 w-4 animate-spin shrink-0 text-blue-400" />
              <span className="font-semibold text-blue-400">
                Processing with {realConcurrency} concurrent workers...
              </span>
            </div>
            <div className="font-mono text-xs font-bold text-white tracking-wide">
              {doneCount} / {totalCount} ({progressPct}%)
            </div>
          </div>

          {/* Glowing bottom progress fill line */}
          <div className="relative z-10 mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-blue-950/80">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 via-sky-400 to-cyan-400 transition-all duration-300 ease-out shadow-[0_0_10px_rgba(59,130,246,0.6)]"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      )}

      {/* 3. Top Platform Selector Dropdown & Guidelines Pill */}
      {hasItemsToShow && (
        <div className="mt-4 flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 rounded-xl border border-[var(--border)] bg-[var(--bg)]/70">
          {/* Dropdown for 9 platforms */}
          <div className="flex items-center gap-2.5 min-w-0">
            <label
              htmlFor="target-platform-dropdown"
              className="text-xs font-bold text-[var(--text)] uppercase tracking-wider whitespace-nowrap font-mono"
            >
              Target Platform:
            </label>
            <select
              id="target-platform-dropdown"
              value={selectedPlatform}
              onChange={(e) =>
                handlePlatformChange(e.target.value as StockPlatformPreset)
              }
              className="cursor-pointer rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] px-3 py-1.5 text-xs font-semibold focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs"
            >
              {PRESET_LIST.map((preset) => (
                <option key={preset} value={preset}>
                  {preset}
                </option>
              ))}
            </select>
          </div>

          {/* Platform guidelines pill */}
          <div className="inline-flex items-center justify-between gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs text-[var(--muted)] min-w-0">
            <div className="flex items-center gap-1.5 truncate">
              <Info className="h-3.5 w-3.5 text-blue-400 shrink-0" />
              <span className="truncate">
                {selectedPlatform === 'Adobe Stock' &&
                  'Adobe Stock: 5-200 chars · No trailing period · Category in CSV · Max 49 keywords'}
                {selectedPlatform === 'Freepik' &&
                  `Freepik: Max 100 chars title · Tags max 40 ${
                    platformSettings?.freepik.aiGenerated ? '· [AI tags active]' : ''
                  }`}
                {selectedPlatform === 'Canva' &&
                  'Canva: Max 100 chars · Max 25 keywords · Filename, Title, Keywords'}
                {selectedPlatform === 'Vecteezy' &&
                  'Vecteezy: Max 100 chars title · Max 30 keywords · Standard license row'}
                {selectedPlatform === '123RF' &&
                  '123RF: Description & Country columns exported in CSV'}
                {selectedPlatform === 'Pond5' &&
                  'Pond5: City, State, Country columns exported in CSV'}
                {selectedPlatform === 'Depositphotos' &&
                  'Depositphotos: Description & Keywords exported in CSV (no Title column)'}
                {selectedPlatform === 'iStock' &&
                  'iStock: Max 150 chars title & description · Max 50 keywords'}
                {selectedPlatform === 'General' &&
                  'General: Filename, Title, Description, Keywords, Category'}
              </span>
            </div>
            <span className="font-mono text-[10px] text-[var(--accent)] shrink-0 font-semibold">
              Max: {effectiveMaxTitle}c / {effectiveMaxKeywords} tags
            </span>
          </div>
        </div>
      )}

      {/* 4. Empty State when no metadata has been generated yet & not generating */}
      {!hasItemsToShow && (
        <div className="py-12 text-center flex flex-col items-center justify-center text-[var(--muted)]">
          <div className="h-12 w-12 rounded-2xl bg-[var(--border)]/30 border border-[var(--border)] flex items-center justify-center mb-3 text-[var(--muted)]">
            <FileCheck2 className="h-6 w-6 stroke-[1.5]" />
          </div>
          <h3 className="text-sm font-semibold text-[var(--text)] mb-1">
            No metadata generated yet
          </h3>
          <p className="text-xs max-w-md text-[var(--muted)]">
            Upload images or videos above, configure your settings, and click{' '}
            <span className="font-semibold text-[var(--text)]">Generate Metadata</span> below to review accordion metadata cards.
          </p>
        </div>
      )}

      {/* 5. Live File Rows with Slim Custom Scrollbar (max-h 760px) */}
      {hasItemsToShow && (
        <div
          ref={listRef}
          onScroll={handleScroll}
          className="mt-4 space-y-3.5 max-h-[760px] overflow-y-auto pr-1 metadata-slim-scrollbar"
        >
          {displayedFiles.map((item, index) => {
            const isSvg =
              item.type === 'image/svg+xml' ||
              item.file?.type === 'image/svg+xml' ||
              item.name.toLowerCase().endsWith('.svg');

            const isVideo = Boolean(
              item.isVideo ||
              item.type?.startsWith('video/') ||
              item.file?.type?.startsWith('video/') ||
              /\.(mp4|webm|mov|mkv|avi)$/i.test(item.name)
            );

            const extension = item.name.includes('.')
              ? (item.name.split('.').pop() || '').toUpperCase()
              : isVideo
              ? 'MP4'
              : isSvg
              ? 'SVG'
              : 'JPG';

            const typeLabel = isVideo ? 'VID' : isSvg ? 'SVG' : 'IMG';
            const isPosterOrImage = Boolean(
              item.previewUrl && (item.previewUrl.startsWith('data:image/') || !isVideo)
            );
            const isActiveRow = item.id === activeFileId;

            // ===============================================================
            // STATE 1: QUEUED FILE (Not-yet-started, status === 'Pending')
            // ===============================================================
            if (item.status === 'Pending') {
              return (
                <div
                  key={item.id}
                  ref={(el) => {
                    if (el) rowRefs.current.set(item.id, el);
                    else rowRefs.current.delete(item.id);
                  }}
                  className={`rounded-xl border ${
                    isActiveRow && isGenerating
                      ? 'border-blue-500/60 bg-blue-500/5 ring-1 ring-blue-500/30'
                      : 'border-[var(--border)] bg-[var(--surface)]/70'
                  } p-3.5 flex items-center justify-between gap-3 transition-colors hover:border-[var(--accent)]/30`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 shrink-0">
                      <FileThumbnailBox
                        item={item}
                        silhouetteMode={silhouetteMode}
                        sizeClasses="w-10 h-10"
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-[var(--border)]/40 text-[var(--muted)] shrink-0 border border-[var(--border)]">
                          #{index + 1}
                        </span>
                        <span
                          className="truncate text-xs font-semibold text-[var(--text)] tracking-tight"
                          title={item.name}
                        >
                          {item.name}
                        </span>
                      </div>
                      <div className="text-[11px] text-[var(--muted)] font-mono flex items-center gap-1.5 mt-0.5">
                        <span>{formatBytes(item.size)}</span>
                        <span>·</span>
                        <span className="uppercase font-semibold tracking-wider text-[10px]">
                          {extension}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] px-2.5 py-0.5 text-xs font-mono font-medium shadow-2xs select-none">
                      <Clock className="h-3 w-3 text-[var(--muted)]" />
                      <span>Queued</span>
                    </span>
                  </div>
                </div>
              );
            }

            // ===============================================================
            // STATE 2: PROCESSING FILE (Currently being generated, status === 'Processing')
            // ===============================================================
            if (item.status === 'Processing') {
              return (
                <div
                  key={item.id}
                  ref={(el) => {
                    if (el) rowRefs.current.set(item.id, el);
                    else rowRefs.current.delete(item.id);
                  }}
                  className={`rounded-2xl border ${
                    isActiveRow
                      ? 'border-blue-500 bg-[var(--surface)] shadow-lg ring-2 ring-blue-500/40'
                      : 'border-blue-500/40 bg-[var(--surface)] shadow-md ring-1 ring-blue-500/20'
                  } transition-all overflow-hidden`}
                >
                  {/* Processing Header */}
                  <div className="w-full flex items-center justify-between gap-3 p-3.5 sm:p-4 bg-blue-500/5 select-none">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-10 w-10 shrink-0 relative">
                        <FileThumbnailBox
                          item={item}
                          silhouetteMode={silhouetteMode}
                          sizeClasses="w-10 h-10"
                        />
                        <div className="absolute inset-0 bg-blue-950/40 backdrop-blur-[1px] rounded-xl flex items-center justify-center">
                          <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
                        </div>
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-400 shrink-0 border border-blue-500/40">
                            #{index + 1}
                          </span>
                          <span
                            className="truncate text-xs sm:text-sm font-semibold text-[var(--text)] tracking-tight"
                            title={item.name}
                          >
                            {item.name}
                          </span>
                        </div>
                        <div className="text-[11px] text-[var(--muted)] font-mono flex items-center gap-1.5 mt-0.5">
                          <span>{formatBytes(item.size)}</span>
                          <span>·</span>
                          <span className="uppercase font-semibold tracking-wider text-[10px]">
                            {extension}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/40 bg-blue-500/10 text-blue-400 px-2.5 py-0.5 text-xs font-mono font-bold animate-pulse shadow-2xs">
                        <Loader2 className="h-3 w-3 animate-spin shrink-0" />
                        <span>Generating...</span>
                      </span>
                    </div>
                  </div>

                  {/* Two-Column Detail View: Shimmer/Skeleton Loading Placeholder */}
                  <div className="p-4 sm:p-5 pt-3 border-t border-[var(--border)] bg-[var(--bg)]/40">
                    <div className="flex flex-col sm:flex-row gap-5 items-start">
                      {/* Left: Compact Asset Preview with Generating Overlay */}
                      <div className="w-full sm:w-[210px] sm:shrink-0 flex flex-col gap-2.5">
                        <div className="relative rounded-xl overflow-hidden border border-blue-500/30 bg-[var(--bg)] aspect-video sm:aspect-square w-full flex items-center justify-center shadow-inner group">
                          {isPosterOrImage ? (
                            <img
                              src={item.previewUrl}
                              alt={item.name}
                              className={`h-full w-full object-cover select-none ${
                                silhouetteMode ? 'brightness-0 contrast-200' : ''
                              }`}
                              loading="lazy"
                            />
                          ) : isVideo ? (
                            <div className="h-full w-full bg-slate-900/90 flex flex-col items-center justify-center select-none text-blue-400">
                              <Film className="h-5 w-5 animate-pulse opacity-80" />
                            </div>
                          ) : (
                            <img
                              src={item.previewUrl || ''}
                              alt={item.name}
                              className="h-full w-full object-cover select-none"
                              loading="lazy"
                            />
                          )}

                          <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px] flex flex-col items-center justify-center gap-1.5 text-white">
                            <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
                            <span className="text-[10px] font-mono font-bold tracking-wider text-blue-300 uppercase">
                              Generating...
                            </span>
                          </div>

                          <div className="absolute bottom-1.5 left-1.5 rounded-md bg-black/85 px-1.5 py-0.5 text-[9px] font-mono font-bold text-white shadow-md pointer-events-none select-none tracking-wider">
                            {typeLabel}
                          </div>
                        </div>

                        <div className="w-full">
                          <div className="truncate text-xs font-semibold text-[var(--text)] leading-snug">
                            {item.name}
                          </div>
                          <div className="text-[11px] text-[var(--muted)] font-mono mt-0.5 flex items-center gap-1.5">
                            <span>{formatBytes(item.size)}</span>
                            <span>·</span>
                            <span className="uppercase font-semibold tracking-wider text-[10px]">
                              {extension}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Shimmer Skeleton Placeholder for Metadata Fields */}
                      <div className="min-w-0 flex-1 flex flex-col gap-4">
                        {/* Shimmer for Title */}
                        <div>
                          <div className="flex items-center justify-between text-xs mb-1.5">
                            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[var(--muted)] font-mono flex items-center gap-1.5">
                              <Loader2 className="h-3 w-3 animate-spin text-blue-400" />
                              <span>OPTIMIZED TITLE</span>
                            </span>
                            <span className="text-[10px] text-blue-400 font-mono animate-pulse">
                              Analyzing visual cues...
                            </span>
                          </div>
                          <div className="h-9 w-full rounded-lg bg-[var(--border)]/40 animate-pulse border border-[var(--border)]" />
                        </div>

                        {/* Shimmer for Description */}
                        <div>
                          <div className="flex items-center justify-between text-xs mb-1.5">
                            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[var(--muted)] font-mono">
                              COMMERCIAL DESCRIPTION
                            </span>
                            <span className="text-[10px] text-[var(--muted)] font-mono">
                              Generating commercial copy...
                            </span>
                          </div>
                          <div className="space-y-2 p-3 rounded-lg border border-[var(--border)] bg-[var(--surface)]/40">
                            <div className="h-3.5 w-full rounded bg-[var(--border)]/50 animate-pulse" />
                            <div className="h-3.5 w-4/5 rounded bg-[var(--border)]/50 animate-pulse" />
                            <div className="h-3.5 w-3/5 rounded bg-[var(--border)]/50 animate-pulse" />
                          </div>
                        </div>

                        {/* Shimmer for Keywords */}
                        <div>
                          <div className="flex items-center justify-between text-xs mb-1.5">
                            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[var(--muted)] font-mono">
                              KEYWORDS
                            </span>
                            <span className="text-[10px] text-[var(--muted)] font-mono">
                              Extracting tags...
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2 p-3 rounded-xl border border-[var(--border)] bg-[var(--surface)]/40">
                            <div className="h-6 w-16 rounded-lg bg-[var(--border)]/50 animate-pulse" />
                            <div className="h-6 w-20 rounded-lg bg-[var(--border)]/50 animate-pulse" />
                            <div className="h-6 w-14 rounded-lg bg-[var(--border)]/50 animate-pulse" />
                            <div className="h-6 w-24 rounded-lg bg-[var(--border)]/50 animate-pulse" />
                            <div className="h-6 w-18 rounded-lg bg-[var(--border)]/50 animate-pulse" />
                            <div className="h-6 w-12 rounded-lg bg-[var(--border)]/50 animate-pulse" />
                            <div className="h-6 w-22 rounded-lg bg-[var(--border)]/50 animate-pulse" />
                            <div className="h-6 w-16 rounded-lg bg-[var(--border)]/50 animate-pulse" />
                          </div>
                        </div>

                        {/* Shimmer for Policy Check */}
                        <div className="h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)]/40 flex items-center px-3 gap-2">
                          <div className="h-4 w-24 rounded bg-[var(--border)]/50 animate-pulse" />
                          <div className="h-4 w-12 rounded bg-[var(--border)]/50 animate-pulse ml-auto" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            }

            // ===============================================================
            // STATE 3: COMPLETED FILE (Metadata ready, status === 'Done')
            // ===============================================================
            const isExpanded = isGenerating
              ? expandedFileIds[item.id] !== false // Auto-expanded by default during batch runs!
              : Boolean(expandedFileIds[item.id]);

            const isFullDetail = Boolean(fullDetailFileIds[item.id]);
            const keywords = item.metadata?.keywords || [];
            const title = item.metadata?.title || '';
            const desc = item.metadata?.description || '';

            const hasAdobePeriodWarning =
              selectedPlatform === 'Adobe Stock' && title.trim().endsWith('.');

            const complianceData =
              item.metadata?.complianceScore !== undefined &&
              item.metadata?.complianceWarnings !== undefined
                ? {
                    score: item.metadata.complianceScore,
                    warnings: item.metadata.complianceWarnings,
                  }
                : analyzeCompliance(title, keywords);

            const complianceScore = complianceData.score;
            const complianceWarnings = complianceData.warnings;
            const complianceBadgeClass =
              complianceScore >= 80
                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-500 dark:text-emerald-400'
                : complianceScore >= 50
                ? 'border-amber-500/40 bg-amber-500/10 text-amber-500 dark:text-amber-400'
                : 'border-rose-500/40 bg-rose-500/10 text-rose-500 dark:text-rose-400';

            return (
              <div
                key={item.id}
                ref={(el) => {
                  if (el) rowRefs.current.set(item.id, el);
                  else rowRefs.current.delete(item.id);
                }}
                className={`rounded-2xl border ${
                  isActiveRow && isGenerating
                    ? 'border-blue-500/60 ring-2 ring-blue-500/30 bg-[var(--surface)]'
                    : 'border-[var(--border)] bg-[var(--surface)]'
                } transition-all overflow-hidden shadow-sm hover:border-[var(--accent)]/40`}
              >
                {/* Collapsible Row Header (Chevron + Small Thumbnail + Filename + Compliance Badge) */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => toggleExpand(item.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toggleExpand(item.id);
                    }
                  }}
                  className="w-full cursor-pointer flex items-center justify-between gap-3 p-3.5 sm:p-4 bg-[var(--surface)] hover:bg-[var(--border)]/20 transition-colors select-none"
                  aria-expanded={isExpanded}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Animated Chevron */}
                    <div className="text-[var(--muted)] transition-transform duration-200 shrink-0">
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-[var(--accent)]" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </div>

                    {/* Small thumbnail in collapsed row */}
                    <div className="h-10 w-10 shrink-0">
                      <FileThumbnailBox
                        item={item}
                        silhouetteMode={silhouetteMode}
                        sizeClasses="w-10 h-10"
                      />
                    </div>

                    {/* Filename & size */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-500 dark:text-blue-400 shrink-0 border border-blue-500/30">
                          #{index + 1}
                        </span>
                        <span
                          className="truncate text-xs sm:text-sm font-semibold text-[var(--text)] tracking-tight"
                          title={item.name}
                        >
                          {item.name}
                        </span>
                      </div>
                      <div className="text-[11px] text-[var(--muted)] font-mono flex items-center gap-1.5 mt-0.5">
                        <span>{formatBytes(item.size)}</span>
                        <span>·</span>
                        <span className="uppercase font-semibold tracking-wider text-[10px]">
                          {extension}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right side of row header: Compliance score badge */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-bold font-mono ${complianceBadgeClass}`}
                    >
                      <span className="hidden sm:inline">Compliance:</span>
                      <span>{complianceScore}/100</span>
                    </span>
                  </div>
                </div>

                {/* Expanded Accordion Body: Two-Column Detail View */}
                {isExpanded && (
                  <div className="p-4 sm:p-5 pt-3 border-t border-[var(--border)] bg-[var(--bg)]/40">
                    <div className="flex flex-col sm:flex-row gap-5 items-start">
                      {/* ======================================================== */}
                      {/* LEFT COLUMN: Compact Asset Preview (~200-220px wide)     */}
                      {/* ======================================================== */}
                      <div className="w-full sm:w-[210px] sm:shrink-0 flex flex-col gap-2.5">
                        {/* Preview Box with Verified Badge & X Close Button */}
                        <div className="relative rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--bg)] aspect-video sm:aspect-square w-full flex items-center justify-center shadow-inner group">
                          {isPosterOrImage ? (
                            <img
                              src={item.previewUrl}
                              alt={item.name}
                              className={`h-full w-full object-cover select-none transition-transform duration-300 group-hover:scale-105 ${
                                silhouetteMode ? 'brightness-0 contrast-200' : ''
                              }`}
                              loading="lazy"
                            />
                          ) : isVideo ? (
                            <div className="h-full w-full bg-slate-900/90 flex flex-col items-center justify-center select-none text-blue-400">
                              <Film className="h-5 w-5 animate-pulse opacity-80" />
                            </div>
                          ) : (
                            <img
                              src={item.previewUrl || ''}
                              alt={item.name}
                              className={`h-full w-full object-cover select-none ${
                                silhouetteMode ? 'brightness-0 contrast-200' : ''
                              }`}
                              loading="lazy"
                            />
                          )}

                          {/* Top-Left: Green "VERIFIED" badge with checkmark (shown when score >= 80) */}
                          {complianceScore >= 80 && (
                            <div className="absolute top-2 left-2 z-10 inline-flex items-center gap-1 rounded-md bg-emerald-600/90 text-white backdrop-blur-xs px-2 py-0.5 text-[10px] font-bold shadow-md tracking-wider pointer-events-none">
                              <Check className="h-3 w-3 stroke-[2.5]" />
                              <span>VERIFIED</span>
                            </div>
                          )}

                          {/* Top-Right: X close button that collapses the detail view */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleExpand(item.id);
                            }}
                            className="cursor-pointer absolute top-2 right-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 hover:bg-black/85 text-white transition-colors shadow-md hover:scale-105"
                            title="Collapse detail view"
                            aria-label="Collapse detail view"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>

                          {/* Bottom-Left: Type badge pill ('VID' | 'SVG' | 'IMG') */}
                          <div className="absolute bottom-1.5 left-1.5 rounded-md bg-black/85 px-1.5 py-0.5 text-[9px] font-mono font-bold text-white shadow-md pointer-events-none select-none tracking-wider">
                            {typeLabel}
                          </div>
                        </div>

                        {/* Filename & specs below thumbnail */}
                        <div className="w-full">
                          <div
                            className="truncate text-xs font-semibold text-[var(--text)] leading-snug"
                            title={item.name}
                          >
                            {item.name}
                          </div>
                          <div className="text-[11px] text-[var(--muted)] font-mono mt-0.5 flex items-center gap-1.5">
                            <span>{formatBytes(item.size)}</span>
                            <span>·</span>
                            <span className="uppercase font-semibold tracking-wider text-[10px]">
                              {extension}
                            </span>
                          </div>
                        </div>

                        {/* Per-File Actions below preview */}
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          <button
                            type="button"
                            onClick={() => handleCopyAll(item)}
                            className="cursor-pointer flex-1 inline-flex items-center justify-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--border)]/40 px-2 py-1.5 text-xs font-semibold text-[var(--text)] transition-colors shadow-2xs"
                            title="Copy formatted metadata for this file"
                          >
                            <Copy className="h-3.5 w-3.5" />
                            <span>Copy All</span>
                          </button>

                          <button
                            type="button"
                            disabled={isGenerating}
                            onClick={() => onRegenerateFile(item.id)}
                            className="cursor-pointer inline-flex items-center justify-center gap-1 rounded-lg border border-blue-500/30 bg-blue-500/10 px-2.5 py-1.5 text-xs font-semibold text-blue-500 dark:text-blue-300 hover:bg-blue-500/20 transition-colors shadow-2xs disabled:opacity-40"
                            title="Regenerate metadata for this file"
                          >
                            <RefreshCw className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Regenerate</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => onRemoveFile(item.id)}
                            className="cursor-pointer inline-flex items-center justify-center p-1.5 text-[var(--muted)] hover:text-red-500 rounded transition-colors"
                            title="Delete file"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* ======================================================== */}
                      {/* RIGHT COLUMN: Metadata Panel with Reference Label Styling*/}
                      {/* ======================================================== */}
                      <div className="min-w-0 flex-1 flex flex-col gap-4">
                        {/* 1. OPTIMIZED TITLE + FULL DETAIL TOGGLE BUTTON */}
                        <div>
                          <div className="flex items-center justify-between gap-2 text-xs mb-1.5">
                            <label className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[var(--muted)] font-mono flex items-center gap-2">
                              <span>OPTIMIZED TITLE</span>
                              {hasAdobePeriodWarning && (
                                <span className="inline-flex items-center gap-1 text-[10px] text-amber-500 font-normal lowercase">
                                  <span>(Adobe strips trailing period)</span>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleFixAdobePeriod(item.id, title);
                                    }}
                                    className="cursor-pointer underline font-semibold text-amber-400 hover:text-amber-300"
                                  >
                                    Fix
                                  </button>
                                </span>
                              )}
                            </label>

                            <div className="flex items-center gap-2">
                              {/* Character Counter */}
                              <span
                                className={`font-mono text-xs tabular-nums ${
                                  title.length > effectiveMaxTitle
                                    ? 'text-amber-500 font-bold'
                                    : 'text-[var(--muted)]'
                                }`}
                              >
                                {title.length}/{effectiveMaxTitle}
                              </span>

                              {/* Title Copy Button */}
                              <button
                                type="button"
                                onClick={() => {
                                  let t = title;
                                  if (selectedPlatform === 'Adobe Stock' && t.endsWith('.')) {
                                    t = t.replace(/\.+$/, '');
                                  }
                                  handleCopy(t, 'Title');
                                }}
                                className="cursor-pointer text-[var(--muted)] hover:text-[var(--text)] inline-flex items-center gap-1 text-xs font-medium"
                                title="Copy Title"
                              >
                                <Copy className="h-3.5 w-3.5" />
                                <span className="hidden sm:inline">Copy</span>
                              </button>

                              {/* FULL DETAIL Toggle Button with expand-arrow icon */}
                              <button
                                type="button"
                                onClick={() => toggleFullDetail(item.id)}
                                className={`cursor-pointer inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] font-bold tracking-wide font-mono transition-all shadow-2xs ${
                                  isFullDetail
                                    ? 'border-blue-500/50 bg-blue-500/15 text-blue-500 dark:text-blue-300'
                                    : 'border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--border)]/30 text-[var(--text)]'
                                }`}
                                title={
                                  isFullDetail
                                    ? 'Click to show compact view'
                                    : 'Click to expand full description and all keywords'
                                }
                              >
                                {isFullDetail ? (
                                  <>
                                    <Minimize2 className="h-3 w-3 text-blue-500 dark:text-blue-300" />
                                    <span>FULL DETAIL</span>
                                  </>
                                ) : (
                                  <>
                                    <Maximize2 className="h-3 w-3 text-[var(--muted)]" />
                                    <span>FULL DETAIL</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>

                          {/* Bold Title Text (Editable) */}
                          <input
                            type="text"
                            value={title}
                            onChange={(e) =>
                              onUpdateFileMetadata(item.id, { title: e.target.value })
                            }
                            className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm sm:text-base font-bold text-[var(--text)] placeholder:text-[var(--muted)]/60 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                          />
                        </div>

                        {/* 2. COMMERCIAL DESCRIPTION */}
                        <div>
                          <div className="flex items-center justify-between text-xs mb-1.5">
                            <label className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[var(--muted)] font-mono flex items-center gap-2">
                              <span>COMMERCIAL DESCRIPTION</span>
                              {(selectedPlatform === 'Adobe Stock' ||
                                selectedPlatform === 'Canva' ||
                                selectedPlatform === 'Freepik') && (
                                <span className="text-[10px] text-[var(--muted)] font-normal lowercase">
                                  (Optional for {selectedPlatform} CSV)
                                </span>
                              )}
                            </label>
                            <div className="flex items-center gap-2.5">
                              <span
                                className={`font-mono text-xs tabular-nums ${
                                  desc.length > effectiveMaxDesc
                                    ? 'text-amber-500 font-bold'
                                    : 'text-[var(--muted)]'
                                }`}
                              >
                                {desc.length}/{effectiveMaxDesc}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCopy(desc, 'Description')}
                                className="cursor-pointer text-[var(--muted)] hover:text-[var(--text)] inline-flex items-center gap-1 text-xs font-medium"
                                title="Copy Description"
                              >
                                <Copy className="h-3.5 w-3.5" />
                                <span>Copy</span>
                              </button>
                            </div>
                          </div>
                          <textarea
                            rows={isFullDetail ? 6 : 3}
                            value={desc}
                            onChange={(e) =>
                              onUpdateFileMetadata(item.id, {
                                description: e.target.value,
                              })
                            }
                            className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs sm:text-sm text-[var(--text)] placeholder:text-[var(--muted)]/60 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-y transition-all"
                          />
                        </div>

                        {/* 3. KEYWORDS (n) with Vibrant Cycling Color Chips */}
                        <div>
                          <div className="flex items-center justify-between text-xs mb-1.5">
                            <label className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[var(--muted)] font-mono flex items-center gap-2">
                              <span>KEYWORDS ({keywords.length}/{effectiveMaxKeywords})</span>
                            </label>
                            <button
                              type="button"
                              onClick={() =>
                                handleCopy(keywords.join(', '), 'Keywords')
                              }
                              className="cursor-pointer text-[var(--muted)] hover:text-[var(--text)] inline-flex items-center gap-1 text-xs font-medium"
                              title="Copy Keywords"
                            >
                              <Copy className="h-3.5 w-3.5" />
                              <span>Copy Keywords</span>
                            </button>
                          </div>

                          {/* Vibrant Cycling Color Chips Container */}
                          <div
                            className={`flex flex-wrap gap-1.5 mb-2.5 p-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)]/70 transition-all ${
                              isFullDetail
                                ? 'max-h-80 overflow-y-auto'
                                : 'max-h-36 overflow-y-auto'
                            }`}
                          >
                            {keywords.length === 0 && (
                              <span className="text-xs text-[var(--muted)] italic">
                                No keywords added. Type below to add.
                              </span>
                            )}
                            {keywords.map((kw, i) => {
                              const palette =
                                VIBRANT_KEYWORD_PALETTE[i % VIBRANT_KEYWORD_PALETTE.length];

                              return (
                                <span
                                  key={i}
                                  className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold tracking-tight transition-colors border shadow-2xs ${palette.pill}`}
                                >
                                  <span>{kw}</span>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleRemoveKeyword(item.id, kw, keywords)
                                    }
                                    className={`cursor-pointer p-0.5 rounded transition-colors ${palette.removeBtn}`}
                                    title={`Remove "${kw}"`}
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </span>
                              );
                            })}
                          </div>

                          {/* Add Keyword Input + Button */}
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="Add keyword (comma separated)..."
                              value={newKeywordInputs[item.id] || ''}
                              onChange={(e) =>
                                setNewKeywordInputs((prev) => ({
                                  ...prev,
                                  [item.id]: e.target.value,
                                }))
                              }
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleAddKeyword(item.id, keywords);
                                }
                              }}
                              className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs text-[var(--text)] placeholder:text-[var(--muted)]/60 focus:border-blue-500 focus:outline-none transition-colors"
                            />
                            <button
                              type="button"
                              onClick={() => handleAddKeyword(item.id, keywords)}
                              className="cursor-pointer inline-flex items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--border)]/40 text-[var(--text)] px-3 py-1.5 text-xs font-semibold transition-colors shadow-2xs"
                            >
                              <Plus className="h-3.5 w-3.5" />
                              <span>Add</span>
                            </button>
                          </div>
                        </div>

                        {/* 4. COMPLIANCE POLICY CHECK PANEL */}
                        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)]/70 p-3 text-xs space-y-2">
                          <div className="flex items-center justify-between font-semibold text-[var(--text)] text-[11px]">
                            <div className="flex items-center gap-2">
                              <span>Policy Check</span>
                              <span
                                className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.2 text-[10px] font-bold font-mono ${complianceBadgeClass}`}
                              >
                                <span>{complianceScore}/100</span>
                              </span>
                            </div>
                            <span
                              className={`font-mono text-[10px] uppercase px-1.5 py-0.2 rounded font-bold ${
                                complianceScore >= 80
                                  ? 'bg-emerald-500/10 text-emerald-500'
                                  : 'bg-amber-500/10 text-amber-500'
                              }`}
                            >
                              {complianceScore >= 80 ? 'Passed' : 'Needs Review'}
                            </span>
                          </div>

                          {complianceWarnings.length > 0 ? (
                            <div className="space-y-1.5 max-h-24 overflow-y-auto pr-1">
                              {complianceWarnings.map((warn, wIdx) => (
                                <div
                                  key={wIdx}
                                  className="flex items-start gap-1.5 text-xs text-amber-500 dark:text-amber-300 leading-tight"
                                >
                                  <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                                  <span>{warn}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 text-xs text-emerald-500 dark:text-emerald-400 font-medium">
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                              <span>Passed — 0 policy issues detected</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
