import React, { useEffect } from 'react';
import { FileItem } from '../types';
import { X, ExternalLink, Download, Film, Image as ImageIcon, FileCode } from 'lucide-react';

interface PeekPreviewModalProps {
  item: FileItem | null;
  onClose: () => void;
  silhouetteMode?: boolean;
}

function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export const PeekPreviewModal: React.FC<PeekPreviewModalProps> = ({
  item,
  onClose,
  silhouetteMode = false,
}) => {
  useEffect(() => {
    if (!item) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [item, onClose]);

  if (!item) return null;

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

  // For video preview, prefer blob URL or original file URL for playback
  const mediaSrc =
    item.file && typeof URL !== 'undefined'
      ? URL.createObjectURL(item.file)
      : item.previewUrl;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Preview of ${item.name}`}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative max-h-[90vh] w-full max-w-4xl flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border)] px-4 sm:px-6 py-3.5 bg-[var(--surface)]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20 shrink-0">
              {isVideo ? (
                <Film className="h-5 w-5" />
              ) : isSvg ? (
                <FileCode className="h-5 w-5" />
              ) : (
                <ImageIcon className="h-5 w-5" />
              )}
            </div>
            <div className="min-w-0">
              <h3 className="truncate text-sm sm:text-base font-bold text-[var(--text)]" title={item.name}>
                {item.name}
              </h3>
              <div className="flex items-center gap-2 text-xs text-[var(--muted)] font-mono">
                <span>{formatBytes(item.size)}</span>
                <span>·</span>
                <span className="font-semibold text-blue-400">{extension}</span>
                <span>·</span>
                <span>Status: {item.status}</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer ml-3 flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--border)]/30 transition-colors"
            title="Close preview (Esc)"
            aria-label="Close preview"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Media Preview Viewport */}
        <div className="flex-1 min-h-[300px] max-h-[65vh] bg-[#050811] flex items-center justify-center p-4 overflow-hidden relative">
          {isVideo ? (
            <video
              src={mediaSrc}
              controls
              autoPlay
              playsInline
              className={`max-h-[60vh] max-w-full rounded-lg shadow-lg ${
                silhouetteMode ? 'brightness-0 contrast-200' : ''
              }`}
            />
          ) : (
            <img
              src={mediaSrc}
              alt={item.name}
              className={`max-h-[60vh] max-w-full object-contain rounded-lg shadow-lg ${
                silhouetteMode ? 'brightness-0 contrast-200' : ''
              }`}
            />
          )}

          {/* Type Badge */}
          <div className="absolute bottom-4 left-4 rounded-md bg-black/85 backdrop-blur-xs px-2 py-1 text-xs font-mono font-bold text-white shadow-md pointer-events-none tracking-wider border border-white/10">
            {isVideo ? 'VIDEO' : isSvg ? 'VECTOR SVG' : 'IMAGE'}
          </div>
        </div>

        {/* Footer info & metadata summary if generated */}
        {item.metadata && (
          <div className="p-3.5 sm:p-4 border-t border-[var(--border)] bg-[var(--bg)]/70 text-xs text-[var(--muted)] flex flex-col gap-1 max-h-36 overflow-y-auto metadata-slim-scrollbar">
            {item.metadata.title && (
              <div className="font-semibold text-[var(--text)] truncate">
                <span className="text-blue-400 font-mono text-[11px] uppercase mr-1.5">Title:</span>
                {item.metadata.title}
              </div>
            )}
            {item.metadata.keywords && item.metadata.keywords.length > 0 && (
              <div className="truncate">
                <span className="text-blue-400 font-mono text-[11px] uppercase mr-1.5">
                  Keywords ({item.metadata.keywords.length}):
                </span>
                {item.metadata.keywords.join(', ')}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
