import { PresetConfig, StockPlatformPreset } from '../types';

export const PLATFORM_PRESETS: Record<StockPlatformPreset, PresetConfig> = {
  'Adobe Stock': {
    name: 'Adobe Stock',
    titleLength: 150,
    descriptionLength: 150,
    keywordsCount: 45,
    keywordFormat: 'Single',
  },
  Vecteezy: {
    name: 'Vecteezy',
    titleLength: 100,
    descriptionLength: 150,
    keywordsCount: 30,
    keywordFormat: 'Single',
  },
  '123RF': {
    name: '123RF',
    titleLength: 100,
    descriptionLength: 150,
    keywordsCount: 50,
    keywordFormat: 'Single',
  },
  Freepik: {
    name: 'Freepik',
    titleLength: 100,
    descriptionLength: 150,
    keywordsCount: 40,
    keywordFormat: 'Single',
  },
  Pond5: {
    name: 'Pond5',
    titleLength: 120,
    descriptionLength: 200,
    keywordsCount: 45,
    keywordFormat: 'Auto',
  },
  Depositphotos: {
    name: 'Depositphotos',
    titleLength: 100,
    descriptionLength: 150,
    keywordsCount: 50,
    keywordFormat: 'Single',
  },
  Canva: {
    name: 'Canva',
    titleLength: 100,
    descriptionLength: 100,
    keywordsCount: 25,
    keywordFormat: 'Auto',
  },
  iStock: {
    name: 'iStock',
    titleLength: 150,
    descriptionLength: 150,
    keywordsCount: 50,
    keywordFormat: 'Single',
  },
  General: {
    name: 'General',
    titleLength: 150,
    descriptionLength: 150,
    keywordsCount: 45,
    keywordFormat: 'Single',
  },
};

export const PRESET_LIST: StockPlatformPreset[] = [
  'Adobe Stock',
  'Vecteezy',
  '123RF',
  'Freepik',
  'Pond5',
  'Depositphotos',
  'Canva',
  'iStock',
  'General',
];
