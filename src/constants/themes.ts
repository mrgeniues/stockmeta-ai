export type ThemeId = 'midnight' | 'ocean' | 'sunset' | 'light' | 'emerald' | 'dark-blue';

export interface ThemeColors {
  bg: string;
  surface: string;
  text: string;
  muted: string;
  accent: string;
}

export interface ThemeParticleColor {
  r: number;
  g: number;
  b: number;
  hex: string;
}

export interface ThemeAuroraConfig {
  blob1: string;
  blob2: string;
  blob3: string;
  orb1: string;
  orb2: string;
  orb3: string;
}

export interface ThemeDefinition {
  id: ThemeId;
  label: string;
  isDark: boolean;
  colors: ThemeColors;
  aurora: ThemeAuroraConfig;
  particles: ThemeParticleColor[];
}

export const THEMES: ThemeDefinition[] = [
  {
    id: 'midnight',
    label: 'Midnight (Default)',
    isDark: true,
    colors: {
      bg: '#0d0a11',
      surface: '#1a1420',
      text: '#f1f5f9',
      muted: '#94a3b8',
      accent: '#ec4899',
    },
    aurora: {
      blob1: 'rgba(236, 72, 153, 0.14)',
      blob2: 'rgba(99, 102, 241, 0.16)',
      blob3: 'rgba(168, 85, 247, 0.12)',
      orb1: 'rgba(236, 72, 153, 0.18)',
      orb2: 'rgba(99, 102, 241, 0.15)',
      orb3: 'rgba(244, 114, 182, 0.12)',
    },
    particles: [
      { r: 236, g: 72, b: 153, hex: '#ec4899' },
      { r: 244, g: 114, b: 182, hex: '#f472b6' },
      { r: 168, g: 85, b: 247, hex: '#a855f7' },
      { r: 217, g: 70, b: 239, hex: '#d946ef' },
    ],
  },
  {
    id: 'ocean',
    label: 'Ocean',
    isDark: true,
    colors: {
      bg: '#0a1628',
      surface: '#0f2038',
      text: '#e0f2fe',
      muted: '#7dd3fc',
      accent: '#38bdf8',
    },
    aurora: {
      blob1: 'rgba(56, 189, 248, 0.16)',
      blob2: 'rgba(14, 165, 233, 0.14)',
      blob3: 'rgba(37, 99, 235, 0.12)',
      orb1: 'rgba(56, 189, 248, 0.18)',
      orb2: 'rgba(14, 165, 233, 0.15)',
      orb3: 'rgba(99, 102, 241, 0.12)',
    },
    particles: [
      { r: 56, g: 189, b: 248, hex: '#38bdf8' },
      { r: 14, g: 165, b: 233, hex: '#0ea5e9' },
      { r: 37, g: 99, b: 235, hex: '#2563eb' },
      { r: 96, g: 165, b: 250, hex: '#60a5fa' },
    ],
  },
  {
    id: 'sunset',
    label: 'Sunset',
    isDark: true,
    colors: {
      bg: '#1a0f1e',
      surface: '#2a1530',
      text: '#fef3c7',
      muted: '#d6bc9f',
      accent: '#f97316',
    },
    aurora: {
      blob1: 'rgba(249, 115, 22, 0.15)',
      blob2: 'rgba(236, 72, 153, 0.14)',
      blob3: 'rgba(245, 158, 11, 0.12)',
      orb1: 'rgba(249, 115, 22, 0.18)',
      orb2: 'rgba(236, 72, 153, 0.15)',
      orb3: 'rgba(245, 158, 11, 0.12)',
    },
    particles: [
      { r: 249, g: 115, b: 22, hex: '#f97316' },
      { r: 245, g: 158, b: 11, hex: '#f59e0b' },
      { r: 244, g: 63, b: 94, hex: '#f43f5e' },
      { r: 236, g: 72, b: 153, hex: '#ec4899' },
    ],
  },
  {
    id: 'light',
    label: 'Light',
    isDark: false,
    colors: {
      bg: '#f8fafc',
      surface: '#ffffff',
      text: '#0f172a',
      muted: '#64748b',
      accent: '#2563eb',
    },
    aurora: {
      blob1: 'rgba(37, 99, 235, 0.08)',
      blob2: 'rgba(14, 165, 233, 0.07)',
      blob3: 'rgba(99, 102, 241, 0.06)',
      orb1: 'rgba(37, 99, 235, 0.10)',
      orb2: 'rgba(14, 165, 233, 0.08)',
      orb3: 'rgba(99, 102, 241, 0.07)',
    },
    particles: [
      { r: 29, g: 78, b: 216, hex: '#1d4ed8' },
      { r: 37, g: 99, b: 235, hex: '#2563eb' },
      { r: 2, g: 132, b: 199, hex: '#0284c7' },
      { r: 67, g: 56, b: 202, hex: '#4338ca' },
    ],
  },
  {
    id: 'emerald',
    label: 'Emerald',
    isDark: true,
    colors: {
      bg: '#07120e',
      surface: '#0d1f16',
      text: '#d1fae5',
      muted: '#6ee7b7',
      accent: '#10b981',
    },
    aurora: {
      blob1: 'rgba(16, 185, 129, 0.15)',
      blob2: 'rgba(6, 182, 212, 0.14)',
      blob3: 'rgba(5, 150, 105, 0.12)',
      orb1: 'rgba(16, 185, 129, 0.18)',
      orb2: 'rgba(52, 211, 153, 0.15)',
      orb3: 'rgba(6, 182, 212, 0.12)',
    },
    particles: [
      { r: 16, g: 185, b: 129, hex: '#10b981' },
      { r: 52, g: 211, b: 153, hex: '#34d399' },
      { r: 13, g: 148, b: 136, hex: '#0d9488' },
      { r: 5, g: 150, b: 105, hex: '#059669' },
    ],
  },
  {
    id: 'dark-blue',
    label: 'Dark Blue',
    isDark: true,
    colors: {
      bg: '#020617',
      surface: '#0a1128',
      text: '#e0e7ff',
      muted: '#93c5fd',
      accent: '#3b82f6',
    },
    aurora: {
      blob1: 'rgba(37, 99, 235, 0.16)',
      blob2: 'rgba(79, 70, 229, 0.15)',
      blob3: 'rgba(30, 58, 138, 0.20)',
      orb1: 'rgba(59, 130, 246, 0.18)',
      orb2: 'rgba(99, 102, 241, 0.16)',
      orb3: 'rgba(29, 78, 216, 0.14)',
    },
    particles: [
      { r: 59, g: 130, b: 246, hex: '#3b82f6' },
      { r: 191, g: 219, b: 254, hex: '#bfdbfe' },
      { r: 147, g: 197, b: 253, hex: '#93c5fd' },
      { r: 99, g: 102, b: 241, hex: '#6366f1' },
    ],
  },
];
