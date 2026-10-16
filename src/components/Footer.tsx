import React, { useState } from 'react';

export const Footer: React.FC = () => {
  const [modalType, setModalType] = useState<'terms' | 'privacy' | 'dmca' | null>(null);

  return (
    <>
      <footer className="relative z-10 border-t border-[var(--border)] bg-[var(--surface)] py-8 text-center text-xs text-[var(--muted)]">
        <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => setModalType('terms')}
            className="cursor-pointer hover:text-[var(--text)] transition-colors"
          >
            Terms and Conditions
          </button>
          <span className="hidden sm:inline">|</span>
          <button
            type="button"
            onClick={() => setModalType('privacy')}
            className="cursor-pointer hover:text-[var(--text)] transition-colors"
          >
            Privacy Policy
          </button>
          <span className="hidden sm:inline">|</span>
          <button
            type="button"
            onClick={() => setModalType('dmca')}
            className="cursor-pointer hover:text-[var(--text)] transition-colors"
          >
            DMCA
          </button>
          <span className="hidden sm:inline">©</span>
          <span className="sm:hidden">·</span>
          <span>© 2026 StockMeta AI</span>
        </div>
      </footer>

      {/* Information Modal */}
      {modalType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl animate-in fade-in duration-150">
            <h3 className="text-lg font-bold text-[var(--text)] mb-2">
              {modalType === 'terms' && 'Terms and Conditions'}
              {modalType === 'privacy' && 'Privacy Policy'}
              {modalType === 'dmca' && 'DMCA Notice & Takedown'}
            </h3>
            <p className="text-xs text-[var(--muted)] leading-relaxed mb-5">
              {modalType === 'terms' &&
                'StockMeta AI is provided as a client-side utility for preparing commercial stock photography, vector, and footage metadata. You retain 100% intellectual property ownership of your uploaded assets and the generated metadata output.'}
              {modalType === 'privacy' &&
                'StockMeta AI operates entirely inside your local web browser. Your visual files and API credentials never pass through any secondary intermediary server; calls are made directly to the AI provider endpoint from your browser.'}
              {modalType === 'dmca' &&
                'StockMeta AI does not host, store, or transmit your media files on any public server. All media analysis occurs in client memory during your active session.'}
            </p>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setModalType(null)}
                className="cursor-pointer rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
