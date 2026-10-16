import React from 'react';
import { ShieldCheck } from 'lucide-react';

export const PrivacyBanner: React.FC = () => {
  return (
    <div className="w-full">
      <div className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-xs sm:text-sm text-[var(--text)] shadow-sm hover-pink-lift transition-all">
        <ShieldCheck className="h-5 w-5 shrink-0 text-[var(--accent)]" />
        <p className="leading-relaxed">
          Your files are processed in your browser – no data is uploaded to any server.
        </p>
      </div>
    </div>
  );
};

