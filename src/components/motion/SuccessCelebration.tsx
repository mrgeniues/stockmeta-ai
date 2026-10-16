import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface SuccessCelebrationProps {
  isOpen: boolean;
  onClose: () => void;
  count: number;
}

const BLUE_CONFETTI_COLORS = [
  '#38bdf8', // sky blue
  '#60a5fa', // soft blue
  '#3b82f6', // royal blue
  '#93c5fd', // ice blue
  '#e0f2fe', // icy white
];

export const SuccessCelebration: React.FC<SuccessCelebrationProps> = ({
  isOpen,
  onClose,
  count,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Auto-dismiss after 4 seconds
    const timer = setTimeout(() => {
      onClose();
    }, 4200);

    // Canvas confetti burst in brand blue
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return () => clearTimeout(timer);
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = 360;
    const height = 240;
    canvas.width = width * 2;
    canvas.height = height * 2;
    ctx.scale(2, 2);

    interface ConfettiPiece {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      color: string;
      rotation: number;
      vRot: number;
      alpha: number;
    }

    const pieces: ConfettiPiece[] = [];
    const originX = width / 2;
    const originY = height / 2 - 10;

    for (let i = 0; i < 48; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 5.5;
      pieces.push({
        x: originX,
        y: originY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.5,
        size: 3 + Math.random() * 4,
        color: BLUE_CONFETTI_COLORS[Math.floor(Math.random() * BLUE_CONFETTI_COLORS.length)],
        rotation: Math.random() * 360,
        vRot: (Math.random() - 0.5) * 12,
        alpha: 1,
      });
    }

    let animId: number;
    const render = () => {
      ctx.clearRect(0, 0, width, height);
      let alive = false;

      pieces.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.12; // gentle gravity
        p.vx *= 0.98;
        p.rotation += p.vRot;
        p.alpha -= 0.012;

        if (p.alpha > 0) {
          alive = true;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.globalAlpha = Math.max(0, p.alpha);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.7);
          ctx.restore();
        }
      });

      if (alive) {
        animId = requestAnimationFrame(render);
      }
    };

    animId = requestAnimationFrame(render);

    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(animId);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Batch generation success"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-sm rounded-2xl border border-blue-500/30 bg-[var(--surface)] p-6 text-center shadow-2xl shadow-blue-500/20 overflow-hidden animate-pop-in"
      >
        {/* Subtle Confetti Canvas */}
        <canvas
          ref={canvasRef}
          className="pointer-events-none absolute inset-0 w-full h-full"
          style={{ width: '100%', height: '100%' }}
        />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="cursor-pointer absolute top-3 right-3 text-[var(--muted)] hover:text-[var(--text)] p-1 rounded-lg transition-colors z-10"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Checkmark with SVG Draw Animation */}
        <div className="relative mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-500/10 ring-2 ring-blue-500/40 shadow-lg shadow-blue-500/20">
          <svg
            className="h-9 w-9 text-blue-400 animate-checkmark-draw"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        {/* Text */}
        <h3 className="text-lg font-bold text-[var(--text)] mb-1 tracking-tight">
          Batch Generation Complete!
        </h3>
        <p className="text-xs text-[var(--muted)] mb-4">
          Successfully generated agency-grade metadata for{' '}
          <span className="font-semibold text-blue-400">{count}</span> file{count === 1 ? '' : 's'}.
        </p>

        {/* Action Button */}
        <button
          type="button"
          onClick={onClose}
          className="cursor-pointer w-full rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 py-2.5 px-4 text-xs font-bold text-white transition-colors shadow-md shadow-blue-600/30"
        >
          View Ready Metadata
        </button>
      </div>
    </div>
  );
};
