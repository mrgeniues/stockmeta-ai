import React from 'react';
import { useTheme } from '../context/ThemeContext';

export const AuroraBackground: React.FC = () => {
  const { themeConfig } = useTheme();

  return (
    <div
      className="aurora-bg-layer fixed inset-0 pointer-events-none overflow-hidden z-0"
      aria-hidden="true"
    >
      {/* Subtle Aurora Wash Blobs (Transform and Opacity only, recolors dynamically with active theme) */}
      <div
        className="absolute -top-[15%] -left-[10%] w-[680px] h-[680px] rounded-full blur-[130px] animate-aurora-1 will-change-transform transition-all duration-700"
        style={{
          background: `radial-gradient(circle, ${themeConfig.aurora.blob1} 0%, transparent 70%)`,
        }}
      />
      <div
        className="absolute top-[35%] -right-[15%] w-[620px] h-[620px] rounded-full blur-[140px] animate-aurora-2 will-change-transform transition-all duration-700"
        style={{
          background: `radial-gradient(circle, ${themeConfig.aurora.blob2} 0%, transparent 70%)`,
        }}
      />
      <div
        className="absolute -bottom-[20%] left-[15%] w-[750px] h-[550px] rounded-full blur-[150px] animate-aurora-3 will-change-transform transition-all duration-700"
        style={{
          background: `radial-gradient(circle, ${themeConfig.aurora.blob3} 0%, transparent 70%)`,
        }}
      />

      {/* Gentle Floating Orbs (soft blurred glowing orbs adapting to active theme palette) */}
      {/* Orb 1: Top-left / center drifting */}
      <div
        className="floating-orb absolute top-[18%] left-[15%] w-[190px] h-[190px] rounded-full blur-[70px] animate-orb-1 will-change-transform transition-all duration-700"
        style={{
          backgroundColor: themeConfig.aurora.orb1,
        }}
      />
      {/* Orb 2: Bottom-right floating */}
      <div
        className="floating-orb absolute top-[62%] right-[12%] w-[230px] h-[230px] rounded-full blur-[80px] animate-orb-2 will-change-transform transition-all duration-700"
        style={{
          backgroundColor: themeConfig.aurora.orb2,
        }}
      />
      {/* Orb 3: Mid-center soft drift */}
      <div
        className="floating-orb absolute top-[40%] left-[45%] w-[160px] h-[160px] rounded-full blur-[60px] animate-orb-3 will-change-transform transition-all duration-700"
        style={{
          backgroundColor: themeConfig.aurora.orb3,
        }}
      />

      {/* Faint fine grid overlay for subtle depth */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-35" />
    </div>
  );
};
