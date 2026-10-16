import React, { useState } from 'react';
import { FAQS } from '../constants/faqs';
import { HelpCircle, ChevronDown, ChevronUp, ArrowLeft } from 'lucide-react';

interface FaqSectionProps {
  onBackToGenerator: () => void;
}

export const FaqSection: React.FC<FaqSectionProps> = ({ onBackToGenerator }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8">
      {/* Back to Generator button */}
      <div className="mb-6">
        <button
          type="button"
          onClick={onBackToGenerator}
          className="cursor-pointer inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2 text-xs sm:text-sm font-semibold text-[var(--text)] hover:opacity-80 transition-colors shadow-sm hover-btn-pink"
        >
          <ArrowLeft className="h-4 w-4 text-indigo-400" />
          <span>Back to Generator</span>
        </button>
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8 shadow-xl backdrop-blur-sm">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[var(--border)]">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
            <HelpCircle className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[var(--text)]">Frequently Asked Questions</h1>
            <p className="text-xs sm:text-sm text-[var(--muted)]">Everything you need to know about StockMeta AI</p>
          </div>
        </div>

        <div className="divide-y divide-[var(--border)]">
          {FAQS.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div key={idx} className="py-4">
                <button
                  type="button"
                  onClick={() => toggle(idx)}
                  className="cursor-pointer flex w-full items-center justify-between py-1 text-left text-sm sm:text-base font-semibold text-[var(--text)] hover:opacity-80 transition-opacity"
                  aria-expanded={isOpen}
                >
                  <span className="pr-4">{faq.question}</span>
                  <div className="shrink-0 text-[var(--muted)]">
                    {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </button>
                <div
                  className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                    isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                  }`}
                >
                  <div className="overflow-hidden">
                    <div
                      className={`pt-2.5 pb-2 text-xs sm:text-sm text-[var(--muted)] leading-relaxed transition-all duration-300 ${
                        isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'
                      }`}
                    >
                      {faq.answer}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Back Button */}
        <div className="mt-8 pt-6 border-t border-[var(--border)] flex justify-center">
          <button
            type="button"
            onClick={onBackToGenerator}
            className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-indigo-500 transition-colors shadow-md hover-btn-pink"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Return to Generator</span>
          </button>
        </div>
      </div>
    </div>
  );
};
