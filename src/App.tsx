import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  FileItem,
  AppSettings,
  StockPlatformPreset,
  ToastMessage,
  FileStatus,
  PlatformSettings,
  DEFAULT_PLATFORM_SETTINGS,
} from './types';
import { PLATFORM_PRESETS } from './constants/presets';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { PrivacyBanner } from './components/PrivacyBanner';
import { ApiKeySection } from './components/ApiKeySection';
import { DropZone } from './components/DropZone';
import { UploadedFilesList } from './components/UploadedFilesList';
import { GeneratedMetadataCard } from './components/GeneratedMetadataCard';
import { SettingsPanel } from './components/SettingsPanel';
import { GeneratorBar } from './components/GeneratorBar';
import { ExportSection } from './components/ExportSection';
import { FaqSection } from './components/FaqSection';
import { Footer } from './components/Footer';
import { ToastContainer } from './components/ToastContainer';
import { AlertCircle, Plus } from 'lucide-react';
import { AuroraBackground } from './components/AuroraBackground';
import { ParticleCanvas } from './components/ParticleCanvas';
import { SuccessCelebration } from './components/motion/SuccessCelebration';
import { ScrollReveal } from './components/motion/ScrollReveal';
import { KeyPool, generateMetadataForFile } from './services/geminiService';
import { captureVideoPoster } from './services/imageProcessing';
import { exportFilesToCsv } from './utils/csvExport';

const LOCAL_STORAGE_KEYS = 'stockmeta_ai_keys';
const LOCAL_STORAGE_PLATFORM_SETTINGS = 'stockmeta_platform_settings';

// Default initial settings matching Adobe Stock preset with Transparent (Original) background
const DEFAULT_SETTINGS: AppSettings = {
  titleLength: 150,
  descriptionLength: 150,
  keywordsCount: 45,
  keywordFormat: 'Single',
  includeKeywords: [],
  excludeKeywords: [],
  filenameAsTitle: false,
  silhouetteMode: false,
  filenameOnlyMode: false,
  pngBackground: 'Transparent (Original)',
  model: 'gemini-3.8-flash',
};

export default function App() {
  // Navigation View: 'generator' | 'faq'
  const [currentView, setCurrentView] = useState<'generator' | 'faq'>('generator');

  // Saved API Keys in localStorage
  const [savedKeys, setSavedKeys] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEYS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed.slice(0, 3);
        }
      }
    } catch {
      // Fallback
    }
    return [];
  });

  // API key dialog trigger and persistent prompt
  const [apiKeyOpenTrigger, setApiKeyOpenTrigger] = useState<number>(0);
  const [showKeyRequiredPrompt, setShowKeyRequiredPrompt] = useState<boolean>(false);

  const triggerOpenKeyInput = useCallback(() => {
    setApiKeyOpenTrigger((prev) => prev + 1);
    setShowKeyRequiredPrompt(true);
    setTimeout(() => {
      document.getElementById('api-key-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 50);
  }, []);

  useEffect(() => {
    if (savedKeys.length > 0) {
      setShowKeyRequiredPrompt(false);
    }
  }, [savedKeys.length]);

  // Settings
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [activePreset, setActivePreset] = useState<StockPlatformPreset>('Adobe Stock');

  // Per-Platform Settings with localStorage persistence
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_PLATFORM_SETTINGS);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          ...DEFAULT_PLATFORM_SETTINGS,
          ...parsed,
          istock: { ...DEFAULT_PLATFORM_SETTINGS.istock, ...parsed?.istock },
          rf123: { ...DEFAULT_PLATFORM_SETTINGS.rf123, ...parsed?.rf123 },
          freepik: { ...DEFAULT_PLATFORM_SETTINGS.freepik, ...parsed?.freepik },
          pond5: { ...DEFAULT_PLATFORM_SETTINGS.pond5, ...parsed?.pond5 },
          depositphotos: { ...DEFAULT_PLATFORM_SETTINGS.depositphotos, ...parsed?.depositphotos },
          canva: { ...DEFAULT_PLATFORM_SETTINGS.canva, ...parsed?.canva },
        };
      }
    } catch {
      // fallback
    }
    return DEFAULT_PLATFORM_SETTINGS;
  });

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_PLATFORM_SETTINGS, JSON.stringify(platformSettings));
    } catch {
      // ignore
    }
  }, [platformSettings]);

  const handleUpdatePlatformSettings = (updated: Partial<PlatformSettings>) => {
    setPlatformSettings((prev) => ({
      ...prev,
      ...updated,
    }));
  };

  // Files & Generation State
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationCount, setCelebrationCount] = useState(0);

  // Track cancellation if needed
  const cancelRequestedRef = useRef(false);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((type: 'success' | 'error' | 'info', message: string) => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 6);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Sync saved keys to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEYS, JSON.stringify(savedKeys));
    } catch {
      // Ignore
    }
  }, [savedKeys]);

  const handleSaveKey = (newKey: string) => {
    setSavedKeys((prev) => {
      if (prev.length >= 3) return prev;
      return [...prev, newKey];
    });
  };

  const handleRemoveKey = (index: number) => {
    setSavedKeys((prev) => prev.filter((_, i) => i !== index));
  };

  // Key availability: strictly requires visitor to have at least 1 saved key in localStorage
  const hasAvailableKey = savedKeys.length >= 1;

  // Build active key pool: returns ONLY the visitor's saved keys from localStorage; empty pool if no keys
  const getActiveKeyPool = useCallback((): KeyPool => {
    return new KeyPool([...savedKeys]);
  }, [savedKeys]);

  // Handle files selected via DropZone
  const handleFilesSelected = async (newRawFiles: File[]) => {
    const newItems: FileItem[] = newRawFiles.map((file) => {
      const isVideo =
        file.type.startsWith('video/') ||
        /\.(mp4|avi|mov|wmv|flv|webm)$/i.test(file.name);
      // For images, SVG and videos, create direct object URL for immediate real thumbnail
      const previewUrl = URL.createObjectURL(file);
      return {
        id: Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        previewUrl,
        isVideo,
        status: 'Pending' as FileStatus,
        isExpanded: false,
      };
    });

    setFiles((prev) => [...prev, ...newItems]);
    addToast('success', `Added ${newItems.length} file${newItems.length > 1 ? 's' : ''}`);

    // Asynchronously capture real full-color poster frames for videos
    for (const item of newItems) {
      if (item.isVideo) {
        captureVideoPoster(item.file).then((posterData) => {
          if (posterData) {
            setFiles((prev) =>
              prev.map((f) => {
                if (f.id === item.id) {
                  if (f.previewUrl && f.previewUrl.startsWith('blob:')) {
                    try {
                      URL.revokeObjectURL(f.previewUrl);
                    } catch {
                      // ignore
                    }
                  }
                  return { ...f, previewUrl: posterData };
                }
                return f;
              })
            );
          }
        });
      }
    }
  };

  // Clear all files
  const handleClearAll = () => {
    files.forEach((f) => {
      if (f.previewUrl && f.previewUrl.startsWith('blob:')) {
        try {
          URL.revokeObjectURL(f.previewUrl);
        } catch {
          // ignore
        }
      }
    });
    setFiles([]);
    addToast('info', 'All uploaded files cleared');
  };

  // Remove individual file
  const handleRemoveFile = (id: string) => {
    const target = files.find((f) => f.id === id);
    if (target?.previewUrl && target.previewUrl.startsWith('blob:')) {
      try {
        URL.revokeObjectURL(target.previewUrl);
      } catch {
        // ignore
      }
    }
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  // Update metadata manually in results editor
  const handleUpdateFileMetadata = (
    id: string,
    updated: { title?: string; description?: string; keywords?: string[] }
  ) => {
    setFiles((prev) =>
      prev.map((f) => {
        if (f.id !== id) return f;
        const currentMeta = f.metadata || { title: '', description: '', keywords: [] };
        return {
          ...f,
          metadata: {
            ...currentMeta,
            ...updated,
          },
        };
      })
    );
  };

  // Toggle card expand
  const handleToggleExpand = (id: string) => {
    setFiles((prev) =>
      prev.map((f) => {
        if (f.id !== id) return f;
        const currentExpanded = Boolean(f.isExpanded);
        return {
          ...f,
          isExpanded: !currentExpanded,
        };
      })
    );
  };

  // Preset Selection
  const handleSelectPreset = (preset: StockPlatformPreset) => {
    setActivePreset(preset);
    const config = PLATFORM_PRESETS[preset];
    if (config) {
      setSettings((prev) => ({
        ...prev,
        titleLength: config.titleLength,
        descriptionLength: config.descriptionLength,
        keywordsCount: config.keywordsCount,
        keywordFormat: config.keywordFormat,
      }));
      addToast('info', `Applied ${preset} platform guidelines`);
    }
  };

  // Single file generation / regeneration
  const processSingleFile = async (item: FileItem, pool: KeyPool) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === item.id ? { ...f, status: 'Processing', errorMessage: undefined } : f))
    );

    try {
      const meta = await generateMetadataForFile(
        item.file,
        settings,
        pool,
        activePreset,
        platformSettings
      );
      setFiles((prev) =>
        prev.map((f) =>
          f.id === item.id
            ? {
                ...f,
                status: 'Done',
                metadata: meta,
                isExpanded: true,
              }
            : f
        )
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('API key required') || msg.includes('No valid visitor Gemini API key')) {
        setShowKeyRequiredPrompt(true);
        triggerOpenKeyInput();
        addToast('error', 'API key required — add your own Gemini API key in settings');
      }
      setFiles((prev) =>
        prev.map((f) =>
          f.id === item.id
            ? {
                ...f,
                status: 'Error',
                errorMessage: msg,
                isExpanded: true,
              }
            : f
        )
      );
    }
  };

  // Regenerate single file
  const handleRegenerateFile = async (id: string) => {
    const item = files.find((f) => f.id === id);
    if (!item) return;

    // FIRST check the saved key pool. If it is empty, do NOT call any API and do NOT attempt generation.
    if (!hasAvailableKey || savedKeys.length === 0) {
      setShowKeyRequiredPrompt(true);
      triggerOpenKeyInput();
      addToast('error', 'API key required — add your own Gemini API key in settings');
      return;
    }

    const pool = getActiveKeyPool();
    if (!pool.available) {
      setShowKeyRequiredPrompt(true);
      triggerOpenKeyInput();
      addToast('error', 'API key required — add your own Gemini API key in settings');
      return;
    }

    addToast('info', `Regenerating metadata for ${item.name}...`);
    await processSingleFile(item, pool);
    addToast('success', `Completed regeneration for ${item.name}`);
  };

  // Batch Generation with 3 concurrent workers
  const handleGenerateBatch = async () => {
    // FIRST check the saved key pool. If it is empty, do NOT call any API and do NOT attempt generation.
    if (!hasAvailableKey || savedKeys.length === 0) {
      setShowKeyRequiredPrompt(true);
      triggerOpenKeyInput();
      addToast('error', 'API key required — add your own Gemini API key in settings');
      return;
    }
    if (files.length === 0) {
      addToast('error', 'Please upload files');
      return;
    }

    const pool = getActiveKeyPool();
    if (!pool.available) {
      setShowKeyRequiredPrompt(true);
      triggerOpenKeyInput();
      addToast('error', 'API key required — add your own Gemini API key in settings');
      return;
    }

    setIsGenerating(true);
    cancelRequestedRef.current = false;

    // Filter files that are not yet Done (or all files if user clicks generate)
    const pendingFiles = files.filter((f) => f.status !== 'Done');
    const queue = pendingFiles.length > 0 ? pendingFiles : files;

    // Reset status to Pending if re-running on previously completed files so progress bar resets to 0/total
    if (pendingFiles.length === 0) {
      setFiles((prev) => prev.map((f) => ({ ...f, status: 'Pending' as FileStatus })));
    }

    // Concurrency queue with 3 workers
    let queueIndex = 0;
    const concurrency = 3;

    const worker = async () => {
      while (queueIndex < queue.length && !cancelRequestedRef.current) {
        const item = queue[queueIndex++];
        if (!item) break;
        await processSingleFile(item, pool);
      }
    };

    const workerPromises = Array.from(
      { length: Math.min(concurrency, queue.length) },
      () => worker()
    );

    await Promise.all(workerPromises);

    setIsGenerating(false);
    const count = queue.length;
    if (count > 0 && !cancelRequestedRef.current) {
      setCelebrationCount(count);
      setShowCelebration(true);
    }
    addToast('success', 'Batch generation complete');
  };

  // Export CSV
  const handleExportCsv = () => {
    const success = exportFilesToCsv(files, activePreset, platformSettings);
    if (success) {
      addToast('success', `Exported CSV for ${activePreset}`);
    } else {
      addToast('error', 'No completed files with metadata to export');
    }
  };

  const completedCount = files.filter((f) => f.status === 'Done').length;

  return (
    <div className="relative min-h-screen bg-[var(--bg)] text-[var(--text)] flex flex-col font-sans selection:bg-pink-500/30 selection:text-pink-200" id="top">
      {/* (a) & (b) Fixed Aurora Wash & Floating Orbs background layer */}
      <AuroraBackground />

      {/* Full-screen fixed Blue Particle System (z-index below content, above background) */}
      <ParticleCanvas />

      {/* Header Navigation */}
      <Navbar currentView={currentView} onNavigate={setCurrentView} />

      {/* Main Content View Switcher */}
      {currentView === 'faq' ? (
        <main className="relative z-10 flex-1 pb-16 animate-entrance-1">
          <FaqSection onBackToGenerator={() => setCurrentView('generator')} />
        </main>
      ) : (
        <main className="relative z-10 flex-1 pb-16" id="generator">
          <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* LEFT MAIN COLUMN (~65% width) */}
              <div className="lg:col-span-8 flex flex-col gap-6">
                {/* 1. Header row: left-aligned H1 with 'Metadata' blue pill, right-aligned V 1.0 badge */}
                <div className="animate-entrance-1">
                  <Hero />
                </div>

                {/* 2. Privacy banner (full left-column width) */}
                <div className="animate-entrance-2">
                  <PrivacyBanner />
                </div>

                {/* 3. API Key & Model Settings (collapsible with counter and dashed add box) */}
                <div className="animate-entrance-3">
                  <ApiKeySection
                    savedKeys={savedKeys}
                    onSaveKey={handleSaveKey}
                    onRemoveKey={handleRemoveKey}
                    model={settings.model}
                    onModelChange={(model) => setSettings((s) => ({ ...s, model }))}
                    onToast={addToast}
                    openTrigger={apiKeyOpenTrigger}
                  />
                </div>

                {/* 4. TWO boxes SIDE BY SIDE: (a) Drop Zone + (b) Uploaded Files */}
                <div className="animate-entrance-4 grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch">
                  <DropZone
                    currentCount={files.length}
                    onFilesSelected={handleFilesSelected}
                    onToast={addToast}
                    disabled={isGenerating}
                  />

                  <UploadedFilesList
                    files={files}
                    silhouetteMode={settings.silhouetteMode}
                    onClearAll={handleClearAll}
                    isGenerating={isGenerating}
                  />
                </div>

                {/* 5. Generated Metadata Results Card (placed ABOVE Essential Settings) */}
                <div className="animate-entrance-5">
                  <GeneratedMetadataCard
                    files={files}
                    silhouetteMode={settings.silhouetteMode}
                    maxTitleLength={settings.titleLength}
                    maxDescLength={settings.descriptionLength}
                    targetKeywordsCount={settings.keywordsCount}
                    activePreset={activePreset}
                    onSelectPreset={setActivePreset}
                    platformSettings={platformSettings}
                    onUpdateFileMetadata={handleUpdateFileMetadata}
                    onRegenerateFile={handleRegenerateFile}
                    onRemoveFile={handleRemoveFile}
                    onToast={addToast}
                    isGenerating={isGenerating}
                    concurrency={3}
                  />
                </div>

                {/* 6. Essential Settings (with gear icon for Additional Settings) */}
                <ScrollReveal delayMs={40} className="animate-entrance-6">
                  <SettingsPanel
                    settings={settings}
                    onChange={(updated) => setSettings((s) => ({ ...s, ...updated }))}
                    onToast={addToast}
                  />
                </ScrollReveal>

                {/* Persistent API Key Required Prompt when user attempted generation or has no key */}
                {(showKeyRequiredPrompt || (!hasAvailableKey && files.length > 0)) && (
                  <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
                    <div className="flex items-center gap-3 text-rose-400">
                      <AlertCircle className="h-5 w-5 shrink-0 text-rose-400" />
                      <div>
                        <div className="text-xs sm:text-sm font-bold text-white">
                          API key required — add your own Gemini API key in settings
                        </div>
                        <div className="text-[11px] text-rose-300">
                          Each visitor must provide their own Gemini key. Keys are saved locally in your browser only.
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={triggerOpenKeyInput}
                      className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-bold px-4 py-2 text-xs shadow-md shadow-rose-600/30 transition-all shrink-0"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Add API key</span>
                    </button>
                  </div>
                )}

                {/* 7. Full-width Generate Metadata button with progress bar */}
                <ScrollReveal delayMs={60} className="animate-entrance-6">
                  <GeneratorBar
                    hasAvailableKey={hasAvailableKey}
                    filesCount={files.length}
                    isGenerating={isGenerating}
                    completedCount={completedCount}
                    totalCount={files.length}
                    onGenerate={handleGenerateBatch}
                    onOpenApiKey={triggerOpenKeyInput}
                  />
                </ScrollReveal>
              </div>

              {/* RIGHT SIDEBAR (~30% width) */}
              <div className="lg:col-span-4 flex flex-col gap-6 lg:sticky lg:top-20 animate-entrance-sidebar">
                {/* Export Options panel (3x3 grid + gear popovers + Export to CSV) */}
                <ExportSection
                  files={files}
                  activePreset={activePreset}
                  onSelectPreset={handleSelectPreset}
                  onExportCsv={handleExportCsv}
                  platformSettings={platformSettings}
                  onUpdatePlatformSettings={handleUpdatePlatformSettings}
                />
              </div>
            </div>
          </div>
        </main>
      )}

      {/* 9. Footer */}
      <Footer />

      {/* Success pop when batch generation completes: checkmark draw + blue confetti burst */}
      <SuccessCelebration
        isOpen={showCelebration}
        count={celebrationCount}
        onClose={() => setShowCelebration(false)}
      />

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
