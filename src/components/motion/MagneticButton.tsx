import React, { useRef, useState, useEffect } from 'react';

interface Ripple {
  id: number;
  x: number;
  y: number;
  size: number;
}

interface MagneticButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  strength?: number; // 0.1 to 0.4 pull strength
  className?: string;
  enableRipple?: boolean;
}

export const MagneticButton: React.FC<MagneticButtonProps> = ({
  children,
  strength = 0.22,
  className = '',
  enableRipple = true,
  onClick,
  disabled,
  ...props
}) => {
  const btnRef = useRef<HTMLButtonElement>(null);
  const [transform, setTransform] = useState<string>('translate3d(0, 0, 0)');
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const [isReducedMotion, setIsReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setIsReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || isReducedMotion || !btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = (e.clientX - centerX) * strength;
    const dy = (e.clientY - centerY) * strength;

    setTransform(`translate3d(${dx.toFixed(2)}px, ${dy.toFixed(2)}px, 0)`);
  };

  const handleMouseLeave = () => {
    if (disabled || isReducedMotion) return;
    setTransform('translate3d(0, 0, 0)');
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled && enableRipple && !isReducedMotion && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const size = Math.max(rect.width, rect.height) * 2;
      const id = Date.now() + Math.random();

      setRipples((prev) => [...prev, { id, x, y, size }]);
      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== id));
      }, 600);
    }
    if (onClick) {
      onClick(e);
    }
  };

  return (
    <button
      ref={btnRef}
      disabled={disabled}
      onClick={handleClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform,
        transition: transform === 'translate3d(0, 0, 0)' ? 'transform 350ms cubic-bezier(0.16, 1, 0.3, 1)' : 'transform 70ms ease-out',
        willChange: 'transform',
      }}
      className={`relative overflow-hidden ${className}`}
      {...props}
    >
      {/* Click Ripples */}
      {ripples.map((r) => (
        <span
          key={r.id}
          className="pointer-events-none absolute rounded-full bg-white/25 animate-ripple-expand"
          style={{
            top: r.y - r.size / 2,
            left: r.x - r.size / 2,
            width: r.size,
            height: r.size,
          }}
          aria-hidden="true"
        />
      ))}
      {children}
    </button>
  );
};
