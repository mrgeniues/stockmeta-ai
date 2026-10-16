import React from 'react';
import { FileItem } from '../types';
import {
  Trash2,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Clock,
  Image as ImageIcon,
  Folder,
} from 'lucide-react';
import { TiltCard } from './motion/TiltCard';
import { AnimatedCounter } from './motion/AnimatedCounter';

interface UploadedFilesListProps {
  files: FileItem[];
  silhouetteMode: boolean;
  onClearAll: () => void;
  isGenerating: boolean;
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
 * Renders a small real thumbnail (~44px) displaying actual image/svg/video content with object-cover.
 * Overlaid at the bottom-left corner with a small dark-pill type badge: 'VID' | 'IMG' | 'SVG'.
 */
const RealThumbnail: React.FC<{ item: FileItem; silhouetteMode?: boolean }> = ({ item, silhouetteMode }) => {
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
    <div className="relative h-11 w-11 shrink-0 rounded-lg overflow-hidden border border-[var(--border)] bg-[var(--surface)] flex items-center justify-center shadow-xs">
      {isPosterOrImage ? (
        <img
          src={item.previewUrl}
          alt={item.name}
          className={`h-full w-full object-cover select-none ${
            silhouetteMode ? 'brightness-0 contrast-200' : ''
          }`}
          loading="lazy"
        />
      ) : isVideo && item.previewUrl ? (
        <video
          src={item.previewUrl}
          className={`h-full w-full object-cover pointer-events-none select-none ${
            silhouetteMode ? 'brightness-0 contrast-200' : ''
          }`}
          muted
          playsInline
          preload="metadata"
        />
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
      {/* Small dark-pill type badge overlaid at bottom-left corner */}
      <div className="absolute bottom-0.5 left-0.5 rounded bg-black/85 px-1 py-0.2 text-[8px] font-mono font-bold text-white shadow-xs pointer-events-none select-none tracking-tight">
        {typeLabel}
      </div>
    </div>
  );
};

export const UploadedFilesList: React.FC<UploadedFilesListProps> = ({
  files,
  silhouetteMode,
  onClearAll,
  isGenerating,
}) => {
  return (
    <div className="w-full h-full flex flex-col" id="uploaded-files-section">
      <div className="flex-1 flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5 shadow-xl backdrop-blur-sm min-h-[190px]">
        {/* Header row: image icon + "Uploaded Files" + count badge + RED "CLEAR ALL" button */}
        <div className="flex items-center justify-between pb-3">
          <div className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-blue-500" />
            <h3 className="text-sm sm:text-base font-bold text-[var(--text)]">Uploaded Files</h3>
            <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-full bg-[var(--surface)] text-[var(--muted)] tabular-nums border border-[var(--border)]">
              <AnimatedCounter value={files.length} /> {files.length === 1 ? 'file' : 'files'}
            </span>
          </div>

          {files.length > 0 && (
            <button
              type="button"
              onClick={onClearAll}
              disabled={isGenerating}
              className="cursor-pointer inline-flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-500 dark:text-red-400 px-2.5 py-1 text-xs font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              title="Clear all uploaded files"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>CLEAR ALL</span>
            </button>
          )}
        </div>

        {/* Divider */}
        <div className="border-b border-[var(--border)] mb-3" />

        {/* Empty State */}
        {files.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center py-6 text-slate-500">
            <Folder className="h-10 w-10 text-slate-600 mb-2 stroke-[1.5]" />
            <p className="text-sm font-medium text-[var(--muted)]">No files uploaded yet</p>
          </div>
        )}

        {/* Compact File Rows (Thumbnail + Truncated Filename with Full Tooltip + Status Badge only) */}
        {files.length > 0 && (
          <div className="flex-1 overflow-y-auto max-h-[200px] space-y-2 pr-1 metadata-slim-scrollbar">
            {files.map((item) => (
              <TiltCard
                key={item.id}
                maxTilt={2}
                glare={false}
                className="rounded-xl"
              >
                <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden transition-all shadow-xs hover:border-[var(--accent)]/40 p-2.5 sm:p-3">
                  <div className="flex items-center justify-between gap-3">
                    {/* (1) Small Real Thumbnail + (2) Filename Truncated with CSS Ellipsis & Full Native Tooltip */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <RealThumbnail item={item} silhouetteMode={silhouetteMode} />

                      <div className="min-w-0 flex-1">
                        <div
                          className="truncate text-xs sm:text-sm font-semibold text-[var(--text)] tracking-tight"
                          title={item.name}
                        >
                          {item.name}
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-[var(--muted)]">
                          <span>{formatBytes(item.size)}</span>
                          <span aria-hidden="true">·</span>
                          <span className="uppercase font-mono text-[10px] tracking-wider font-semibold">
                            {item.name.includes('.')
                              ? (item.name.split('.').pop() || '').toUpperCase()
                              : item.isVideo
                              ? 'MP4'
                              : 'JPG'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* (3) Status Badge */}
                    <div className="flex items-center gap-2 shrink-0">
                      {item.status === 'Pending' && (
                        <span className="inline-flex items-center gap-1 rounded-md border border-[var(--border)] bg-[var(--surface)] px-2 py-0.5 text-[11px] font-medium text-[var(--muted)]">
                          <Clock className="h-3 w-3" />
                          <span className="hidden sm:inline">Pending</span>
                        </span>
                      )}

                      {item.status === 'Processing' && (
                        <span className="inline-flex items-center gap-1 rounded-md border border-blue-500/30 bg-blue-500/10 px-2 py-0.5 text-[11px] font-medium text-blue-400">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          <span className="hidden sm:inline">Generating</span>
                        </span>
                      )}

                      {item.status === 'Done' && (
                        <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-400">
                          <CheckCircle2 className="h-3 w-3" />
                          <span className="hidden sm:inline">Completed</span>
                        </span>
                      )}

                      {item.status === 'Error' && (
                        <span className="inline-flex items-center gap-1 rounded-md border border-rose-500/30 bg-rose-500/10 px-2 py-0.5 text-[11px] font-medium text-rose-400">
                          <AlertCircle className="h-3 w-3" />
                          <span className="hidden sm:inline">Error</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </TiltCard>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
