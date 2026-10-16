export type KeywordFormat = 'Single' | 'Double' | 'Auto';

export type PngBackground = 'White Background' | 'Black Background' | 'Transparent (Original)';

export type StockPlatformPreset =
  | 'Adobe Stock'
  | 'Vecteezy'
  | '123RF'
  | 'Freepik'
  | 'Pond5'
  | 'Depositphotos'
  | 'Canva'
  | 'iStock'
  | 'General';

export interface PresetConfig {
  name: StockPlatformPreset;
  titleLength: number;
  descriptionLength: number;
  keywordsCount: number;
  keywordFormat: KeywordFormat;
}

export interface AppSettings {
  titleLength: number;
  descriptionLength: number;
  keywordsCount: number;
  keywordFormat: KeywordFormat;
  includeKeywords: string[];
  excludeKeywords: string[];
  filenameAsTitle: boolean;
  silhouetteMode: boolean;
  filenameOnlyMode: boolean;
  pngBackground: PngBackground;
  model: 'gemini-3.8-flash' | 'gemini-3.1-pro-preview';
}

export type FileStatus = 'Pending' | 'Processing' | 'Done' | 'Error';

export interface FileMetadata {
  title: string;
  description: string;
  keywords: string[];
  category?: number | string;
  complianceScore?: number;
  complianceWarnings?: string[];
}

export interface FileItem {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  previewUrl: string;
  isVideo: boolean;
  status: FileStatus;
  errorMessage?: string;
  metadata?: FileMetadata;
  isExpanded?: boolean;
}

export interface UploadProgress {
  isUploading: boolean;
  completed: number;
  total: number;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

export interface PlatformSettings {
  istock: { editorial: boolean; artistName: string };
  rf123: { countries: string };
  freepik: { aiGenerated: boolean };
  pond5: { editorial: boolean };
  depositphotos: { editorial: boolean; adultContent: boolean };
  canva: { artistName: string };
}

export const DEFAULT_PLATFORM_SETTINGS: PlatformSettings = {
  istock: { editorial: false, artistName: '' },
  rf123: { countries: 'US, UK, PK' },
  freepik: { aiGenerated: false },
  pond5: { editorial: false },
  depositphotos: { editorial: false, adultContent: false },
  canva: { artistName: '' },
};
