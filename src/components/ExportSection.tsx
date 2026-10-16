import React, { useState } from 'react';
import { FileItem, StockPlatformPreset, PlatformSettings } from '../types';
import { PRESET_LIST } from '../constants/presets';
import { Download, AlertCircle, Settings, X, Sparkles } from 'lucide-react';
import { TiltCard } from './motion/TiltCard';
import { MagneticButton } from './motion/MagneticButton';

interface LogoConfig {
  url: string;
  alt: string;
  pillClassName?: string;
  imgClassName?: string;
  imgStyle?: React.CSSProperties;
}

// Hotlink-safe Wikimedia Commons logo assets for stock platforms
const PLATFORM_LOGOS: Partial<Record<StockPlatformPreset, LogoConfig>> = {
  'Adobe Stock': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/0/0b/Adobe_Stock_icon.svg',
    alt: 'Adobe Stock logo',
    pillClassName: 'min-w-[56px] px-2',
    imgClassName: 'h-6 max-w-[52px]',
  },
  Vecteezy: {
    url: 'https://upload.wikimedia.org/wikipedia/commons/0/00/Vecteezy_logo.svg',
    alt: 'Vecteezy logo',
    pillClassName: 'min-w-[56px] px-2',
    imgClassName: 'h-6 max-w-[54px]',
  },
  '123RF': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/a/af/123RF_logo.svg',
    alt: '123RF logo',
    pillClassName: 'min-w-[66px] px-2',
    imgClassName: 'h-6 max-w-[62px]',
  },
  Freepik: {
    url: 'https://upload.wikimedia.org/wikipedia/commons/3/3f/FREEPIK_logo.svg',
    alt: 'Freepik logo',
    pillClassName: 'min-w-[66px] px-2',
    imgClassName: 'h-6 max-w-[62px]',
    // High-contrast colorization: tint light gray SVG paths (#C8C8C8) to vibrant official Freepik Blue (#1273EB)
    imgStyle: {
      filter: 'brightness(0) saturate(100%) invert(32%) sepia(90%) saturate(3000%) hue-rotate(205deg)',
    },
  },
  Depositphotos: {
    url: 'https://upload.wikimedia.org/wikipedia/commons/9/9b/Depositphotos_logo.jpg',
    alt: 'Depositphotos logo',
    pillClassName: 'min-w-[64px] px-1.5 overflow-hidden',
    imgClassName: 'h-7 max-w-[60px] scale-[1.32]',
    // Invert black background to white so it seamlessly blends with the white pill, rendering black mark
    imgStyle: {
      filter: 'invert(1)',
    },
  },
  Canva: {
    url: 'https://upload.wikimedia.org/wikipedia/commons/d/d8/Canva_Logo.jpg',
    alt: 'Canva logo',
    pillClassName: 'min-w-[56px] px-2',
    imgClassName: 'h-6 max-w-[54px]',
  },
  iStock: {
    url: 'https://upload.wikimedia.org/wikipedia/commons/6/68/IStock_by_Getty_Images_Logo.svg',
    alt: 'iStock logo',
    pillClassName: 'min-w-[56px] px-2',
    imgClassName: 'h-6 max-w-[54px]',
  },
};

interface ExportSectionProps {
  files: FileItem[];
  activePreset: StockPlatformPreset;
  onSelectPreset: (preset: StockPlatformPreset) => void;
  onExportCsv: () => void;
  platformSettings: PlatformSettings;
  onUpdatePlatformSettings: (updated: Partial<PlatformSettings>) => void;
}

const PLATFORMS_WITH_GEAR: StockPlatformPreset[] = [
  'iStock',
  '123RF',
  'Freepik',
  'Pond5',
  'Depositphotos',
  'Canva',
];

export const ExportSection: React.FC<ExportSectionProps> = ({
  files,
  activePreset,
  onSelectPreset,
  onExportCsv,
  platformSettings,
  onUpdatePlatformSettings,
}) => {
  const [activePopover, setActivePopover] = useState<StockPlatformPreset | null>(null);

  const completedCount = files.filter((f) => f.status === 'Done' && f.metadata).length;
  const canExport = completedCount >= 1;

  return (
    <aside className="w-full flex flex-col gap-5" id="export-section">
      {/* 1. Export Options Panel */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden shadow-xl backdrop-blur-sm">
        {/* Header: bold "Export Options" + smaller subtitle */}
        <div className="bg-[var(--accent)]/10 border-b border-[var(--border)] px-5 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[var(--text)]">Export Options</h2>
              <p className="text-xs text-[var(--muted)] mt-0.5">
                Choose platforms to export your metadata
              </p>
            </div>
            <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/30 tabular-nums">
              {completedCount} ready
            </span>
          </div>
        </div>

        {/* Body: 3x3 Grid of Platform Cards */}
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-3 gap-2.5">
            {PRESET_LIST.map((preset) => {
              const isSelected = activePreset === preset;
              const isPopoverOpen = activePopover === preset;
              const logoInfo = PLATFORM_LOGOS[preset];
              const hasGear = PLATFORMS_WITH_GEAR.includes(preset);

              return (
                <div key={preset} className="relative">
                  <TiltCard
                    maxTilt={9}
                    glare={true}
                    className="rounded-xl"
                  >
                    <div
                      onClick={() => onSelectPreset(preset)}
                      className={`relative cursor-pointer rounded-xl p-2.5 pt-2 min-h-[96px] flex flex-col items-center justify-between transition-all select-none border text-center hover-pink-lift ${
                        isSelected
                          ? 'border-[var(--accent)] bg-[var(--surface)] text-[var(--text)] font-semibold ring-2 ring-[var(--accent)] shadow-md shadow-[var(--card-glow)]'
                          : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text)] hover:opacity-90'
                      }`}
                    >
                      {/* Small gear icon at top-right ONLY for platforms with settings */}
                      {hasGear && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActivePopover(isPopoverOpen ? null : preset);
                          }}
                          className={`absolute top-1.5 right-1.5 cursor-pointer p-1 rounded transition-colors z-20 ${
                            isPopoverOpen || isSelected
                              ? 'text-[var(--accent)] hover:text-[var(--text)]'
                              : 'text-[var(--muted)] hover:text-[var(--text)]'
                          }`}
                          title={`${preset} Settings`}
                          aria-label={`${preset} Settings`}
                        >
                          <Settings className="h-3.5 w-3.5" />
                        </button>
                      )}

                      {/* Logo / Brand Icon area (~32-40px, centered at top of card) */}
                      <div className="w-full flex items-center justify-center pt-1 min-h-[38px]">
                        {logoInfo ? (
                          <div
                            className={`h-9 py-1 rounded-lg bg-[var(--pill-bg)] border border-[var(--pill-border)] flex items-center justify-center shadow-xs ${
                              logoInfo.pillClassName || 'min-w-[56px] px-2'
                            }`}
                          >
                            <img
                              src={logoInfo.url}
                              alt={logoInfo.alt}
                              style={logoInfo.imgStyle}
                              className={`w-auto object-contain select-none pointer-events-none transition-transform ${
                                logoInfo.imgClassName || 'h-6 max-w-[54px]'
                              }`}
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                const parent = e.currentTarget.parentElement;
                                if (parent) {
                                  parent.style.display = 'none';
                                }
                              }}
                            />
                          </div>
                        ) : preset === 'General' ? (
                          <div className="h-9 w-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                            <Sparkles className="h-4 w-4" />
                          </div>
                        ) : (
                          /* Pond5: name-only (no img element) */
                          <div className="h-9" />
                        )}
                      </div>

                      {/* Platform Name below logo */}
                      <div className="text-xs font-medium leading-tight break-words mt-1.5 w-full">
                        {preset}
                      </div>
                    </div>
                  </TiltCard>

                  {/* Platform Settings Popover */}
                  {isPopoverOpen && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 shadow-2xl text-xs text-[var(--text)] animate-in fade-in zoom-in-95 duration-150 backdrop-blur-md"
                    >
                      <div className="flex items-center justify-between pb-2 mb-2 border-b border-[var(--border)] font-semibold text-[var(--accent)]">
                        <span>{preset} Settings</span>
                        <button
                          type="button"
                          onClick={() => setActivePopover(null)}
                          className="cursor-pointer text-[var(--muted)] hover:text-[var(--text)] p-0.5"
                          aria-label="Close"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {preset === 'iStock' && (
                        <div className="space-y-2.5">
                          <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={platformSettings.istock.editorial}
                              onChange={(e) =>
                                onUpdatePlatformSettings({
                                  istock: { ...platformSettings.istock, editorial: e.target.checked },
                                })
                              }
                              className="h-3.5 w-3.5 rounded border-[var(--border)] bg-[var(--surface)] text-[var(--accent)] focus:ring-[var(--accent)] accent-[var(--accent)] cursor-pointer"
                            />
                            <span className="text-xs">Editorial</span>
                          </label>

                          <div className="space-y-1">
                            <label className="block text-[11px] text-[var(--muted)]">Artist Name</label>
                            <input
                              type="text"
                              placeholder="Your Artist Name"
                              value={platformSettings.istock.artistName}
                              onChange={(e) =>
                                onUpdatePlatformSettings({
                                  istock: { ...platformSettings.istock, artistName: e.target.value },
                                })
                              }
                              className="w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-xs text-[var(--text)] placeholder-[var(--muted)]/50 focus:border-[var(--accent)] focus:outline-hidden focus:ring-1 focus:ring-[var(--accent)]"
                            />
                          </div>
                        </div>
                      )}

                      {preset === '123RF' && (
                        <div className="space-y-1">
                          <label className="block text-[11px] text-[var(--muted)]">Countries</label>
                          <input
                            type="text"
                            placeholder="US, UK, PK"
                            value={platformSettings.rf123.countries}
                            onChange={(e) =>
                              onUpdatePlatformSettings({
                                rf123: { countries: e.target.value },
                              })
                            }
                            className="w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-xs text-[var(--text)] placeholder-[var(--muted)]/50 focus:border-[var(--accent)] focus:outline-hidden focus:ring-1 focus:ring-[var(--accent)]"
                          />
                        </div>
                      )}

                      {preset === 'Freepik' && (
                        <div className="space-y-2">
                          <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={platformSettings.freepik.aiGenerated}
                              onChange={(e) =>
                                onUpdatePlatformSettings({
                                  freepik: { aiGenerated: e.target.checked },
                                })
                              }
                              className="h-3.5 w-3.5 rounded border-[var(--border)] bg-[var(--surface)] text-[var(--accent)] focus:ring-[var(--accent)] accent-[var(--accent)] cursor-pointer"
                            />
                            <span className="text-xs">AI Generated Content</span>
                          </label>
                        </div>
                      )}

                      {preset === 'Pond5' && (
                        <div className="space-y-2">
                          <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={platformSettings.pond5.editorial}
                              onChange={(e) =>
                                onUpdatePlatformSettings({
                                  pond5: { editorial: e.target.checked },
                                })
                              }
                              className="h-3.5 w-3.5 rounded border-[var(--border)] bg-[var(--surface)] text-[var(--accent)] focus:ring-[var(--accent)] accent-[var(--accent)] cursor-pointer"
                            />
                            <span className="text-xs">Editorial</span>
                          </label>
                        </div>
                      )}

                      {preset === 'Depositphotos' && (
                        <div className="space-y-2.5">
                          <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={platformSettings.depositphotos.editorial}
                              onChange={(e) =>
                                onUpdatePlatformSettings({
                                  depositphotos: {
                                    ...platformSettings.depositphotos,
                                    editorial: e.target.checked,
                                  },
                                })
                              }
                              className="h-3.5 w-3.5 rounded border-[var(--border)] bg-[var(--surface)] text-[var(--accent)] focus:ring-[var(--accent)] accent-[var(--accent)] cursor-pointer"
                            />
                            <span className="text-xs">Editorial</span>
                          </label>

                          <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={platformSettings.depositphotos.adultContent}
                              onChange={(e) =>
                                onUpdatePlatformSettings({
                                  depositphotos: {
                                    ...platformSettings.depositphotos,
                                    adultContent: e.target.checked,
                                  },
                                })
                              }
                              className="h-3.5 w-3.5 rounded border-[var(--border)] bg-[var(--surface)] text-[var(--accent)] focus:ring-[var(--accent)] accent-[var(--accent)] cursor-pointer"
                            />
                            <span className="text-xs">Adult Content</span>
                          </label>
                        </div>
                      )}

                      {preset === 'Canva' && (
                        <div className="space-y-1">
                          <label className="block text-[11px] text-[var(--muted)]">Artist Name</label>
                          <input
                            type="text"
                            placeholder="Your Artist Name"
                            value={platformSettings.canva.artistName}
                            onChange={(e) =>
                              onUpdatePlatformSettings({
                                canva: { artistName: e.target.value },
                              })
                            }
                            className="w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-xs text-[var(--text)] placeholder-[var(--muted)]/50 focus:border-[var(--accent)] focus:outline-hidden focus:ring-1 focus:ring-[var(--accent)]"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Files-ready count and output filename text */}
          <div className="pt-2 border-t border-[var(--border)] space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[var(--muted)]">Files ready for export:</span>
              <span className="font-mono font-semibold text-blue-400 tabular-nums">
                {completedCount} file{completedCount === 1 ? '' : 's'}
              </span>
            </div>

            <div className="text-xs text-[var(--text)] truncate">
              <span className="text-[var(--muted)]">Output: </span>
              <span className="font-mono text-[var(--accent)] text-[11px]">
                stockmeta-{activePreset.toLowerCase().replace(/\s+/g, '-')}.csv
              </span>
            </div>
          </div>

          {/* 2. Full-width "Export to CSV" button with Magnetic Hover & Material Ripple */}
          <div className="pt-2">
            <MagneticButton
              type="button"
              onClick={onExportCsv}
              disabled={!canExport}
              strength={0.2}
              className={`cursor-pointer w-full flex items-center justify-center gap-2 rounded-xl py-3 px-4 text-sm font-bold text-white shadow-lg transition-all hover-btn-pink ${
                canExport
                  ? 'bg-[var(--accent)] hover:opacity-90 active:scale-[0.99] shadow-lg shadow-[var(--card-glow)] ring-1 ring-white/10'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed shadow-none'
              }`}
            >
              <Download className="h-4 w-4" />
              <span>Export to CSV</span>
            </MagneticButton>

            {/* Disabled hint when completedCount === 0 */}
            {!canExport && (
              <div className="mt-2.5 flex items-center justify-center gap-1.5 text-xs text-amber-400 text-center">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span>No completed files with metadata to export</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
};
