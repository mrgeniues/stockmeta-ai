import React from 'react';
import { ToastMessage } from '../types';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0">
      {toasts.map((toast) => {
        let borderClass = 'border-[var(--border)] bg-[var(--surface)] text-[var(--text)]';
        let Icon = Info;
        let iconColor = 'text-indigo-400';

        if (toast.type === 'success') {
          borderClass = 'border-emerald-500/30 bg-[var(--surface)] text-[var(--text)]';
          Icon = CheckCircle2;
          iconColor = 'text-emerald-500';
        } else if (toast.type === 'error') {
          borderClass = 'border-rose-500/30 bg-[var(--surface)] text-[var(--text)]';
          Icon = AlertCircle;
          iconColor = 'text-rose-500';
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between gap-3 rounded-xl border p-3.5 shadow-2xl backdrop-blur-md transition-all animate-in fade-in slide-in-from-bottom-2 duration-200 ${borderClass}`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Icon className={`h-4 w-4 shrink-0 ${iconColor}`} />
              <p className="text-xs font-medium leading-snug">{toast.message}</p>
            </div>
            <button
              onClick={() => onDismiss(toast.id)}
              className="cursor-pointer text-[var(--muted)] hover:text-[var(--text)] p-0.5 rounded transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
