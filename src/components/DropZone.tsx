import React, { useRef, useState } from 'react';
import { Plus } from 'lucide-react';
import { MagneticButton } from './motion/MagneticButton';
import { AnimatedCounter } from './motion/AnimatedCounter';

interface DropZoneProps {
  currentCount: number;
  onFilesSelected: (files: File[]) => void;
  onToast: (type: 'success' | 'error' | 'info', message: string) => void;
  disabled?: boolean;
}

const ACCEPTED_EXTENSIONS = [
  'jpg',
  'jpeg',
  'png',
  'webp',
  'svg',
  'mp4',
  'avi',
  'mov',
  'wmv',
  'flv',
  'webm',
];

const ACCEPTED_MIMES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/svg+xml',
  'video/mp4',
  'video/avi',
  'video/x-msvideo',
  'video/mov',
  'video/quicktime',
  'video/wmv',
  'video/x-ms-wmv',
  'video/flv',
  'video/x-flv',
  'video/webm',
];

// Max files per batch: 100 keeps uploads, poster extraction and generation
// within a smooth range (verified at 64; 500 was never verified end-to-end).
const MAX_FILES = 100;

export const DropZone: React.FC<DropZoneProps> = ({
  currentCount,
  onFilesSelected,
  onToast,
  disabled = false,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAcceptedFile = (file: File): boolean => {
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (ACCEPTED_EXTENSIONS.includes(ext)) {
      return true;
    }
    if (ACCEPTED_MIMES.includes(file.type.toLowerCase())) {
      return true;
    }
    return false;
  };

  const processIncomingFiles = (incomingList: FileList | File[]) => {
    const rawFiles = Array.from(incomingList);
    if (rawFiles.length === 0) return;

    const accepted: File[] = [];
    let rejectedCount = 0;

    for (const file of rawFiles) {
      if (isAcceptedFile(file)) {
        accepted.push(file);
      } else {
        rejectedCount++;
      }
    }

    if (rejectedCount > 0) {
      onToast(
        'error',
        `${rejectedCount} file${rejectedCount > 1 ? 's' : ''} rejected. Only JPEG, PNG, WebP, SVG and video files (MP4, AVI, MOV, WMV, FLV, WebM) are supported.`
      );
    }

    if (accepted.length === 0) {
      return;
    }

    const availableSlots = MAX_FILES - currentCount;
    if (availableSlots <= 0) {
      onToast('error', `Maximum limit of ${MAX_FILES} files reached. Please clear files to add more.`);
      return;
    }

    let filesToAdd = accepted;
    if (accepted.length > availableSlots) {
      filesToAdd = accepted.slice(0, availableSlots);
      onToast(
        'info',
        `Added ${availableSlots} files. Maximum ${MAX_FILES} file limit reached.`
      );
    }

    onFilesSelected(filesToAdd);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (disabled) return;

    if (e.dataTransfer?.files) {
      processIncomingFiles(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processIncomingFiles(e.target.files);
      // Reset input value so re-selecting the same file works
      e.target.value = '';
    }
  };

  return (
    <div className="w-full h-full flex flex-col">
      <div
        onClick={() => {
          if (!disabled) {
            fileInputRef.current?.click();
          }
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative flex-1 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-3 sm:p-4 text-center transition-all cursor-pointer select-none min-h-[190px] hover-pink-lift ${
          isDragOver
            ? 'border-[var(--accent)] bg-[var(--surface)] shadow-lg scale-[1.005]'
            : 'border-[var(--border)] bg-[var(--surface)] hover:border-[var(--accent)] hover:opacity-95'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/svg+xml,video/mp4,video/avi,video/quicktime,video/x-msvideo,video/x-ms-wmv,video/x-flv,video/webm,.jpg,.jpeg,.png,.webp,.svg,.mp4,.avi,.mov,.wmv,.flv,.webm"
          onChange={handleFileChange}
          className="hidden"
          disabled={disabled}
        />

        {/* + Icon */}
        <div className="mb-1.5 flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500 ring-1 ring-blue-500/20">
          <Plus className="h-5 w-5" />
        </div>

        {/* Text: Drop or */}
        <h3 className="text-sm sm:text-base font-semibold text-[var(--text)] mb-0.5">
          Drop or
        </h3>

        {/* Choose Files Button - BLUE button */}
        <MagneticButton
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (!disabled) {
              fileInputRef.current?.click();
            }
          }}
          disabled={disabled}
          strength={0.25}
          className="mt-1 mb-1 cursor-pointer inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 px-5 py-1.5 text-xs sm:text-sm font-semibold text-white shadow-md shadow-blue-500/25 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Choose Files
        </MagneticButton>

        {/* Caption under button */}
        <p className="text-[11px] text-[var(--muted)] mb-1.5">
          Select multiple files for batch processing
        </p>

        {/* Three small pills: Images, Videos, SVG */}
        <div className="flex items-center justify-center gap-1.5 mb-2">
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] shadow-xs">
            Images
          </span>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] shadow-xs">
            Videos
          </span>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] shadow-xs">
            SVG
          </span>
        </div>

        {/* Supported Formats Text */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 text-[11px] text-[var(--muted)] max-w-xs leading-relaxed">
          <span>Supported: JPG, PNG, WebP, SVG</span>
          <span aria-hidden="true">·</span>
          <span>MP4, AVI, MOV, WMV, FLV, WebM</span>
          <span aria-hidden="true">·</span>
          <span>Max {MAX_FILES} files</span>
        </div>

        {/* Counter Badge at bottom-right */}
        <div className="absolute bottom-2.5 right-2.5 pointer-events-none">
          <span className="inline-flex items-center rounded-md border border-[var(--border)] bg-[var(--surface)]/90 backdrop-blur-xs px-2 py-0.5 text-xs font-mono font-semibold text-[var(--muted)] tabular-nums shadow-xs">
            <AnimatedCounter value={currentCount} />/{MAX_FILES}
          </span>
        </div>
      </div>
    </div>
  );
};
