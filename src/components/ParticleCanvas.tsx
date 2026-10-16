import React, { useEffect, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';
import { ThemeParticleColor } from '../constants/themes';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  pushVx: number;
  pushVy: number;
  layer: number; // 0 = distant, 1 = midground, 2 = foreground
  baseRadius: number;
  glowRadius: number;
  colorA: ThemeParticleColor;
  colorB: ThemeParticleColor;
  twinkleSpeed: number;
  twinklePhase: number;
  shimmerSpeed: number;
  shimmerPhase: number;
  baseAlpha: number;
  currentAlpha: number;
  renderX: number;
  renderY: number;
  currentColor: { r: number; g: number; b: number };
}

interface ShootingStar {
  x: number;
  y: number;
  vx: number;
  vy: number;
  length: number;
  life: number;
  maxLife: number;
  alpha: number;
}

export const ParticleCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { themeConfig } = useTheme();

  // Ref to hold the active theme palette so the loop always reads the latest values without re-mounting
  const themeRef = useRef(themeConfig);
  const particlesRef = useRef<Particle[]>([]);

  // Update theme reference and re-assign particle color pairs when active theme changes
  useEffect(() => {
    themeRef.current = themeConfig;
    const particles = particlesRef.current;
    const tones = themeConfig.particles;
    if (tones.length > 0) {
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.colorA = tones[i % tones.length];
        p.colorB = tones[(i + 1) % tones.length] || tones[0];
      }
    }
  }, [themeConfig]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number | null = null;
    let isPaused = false;
    let lastTime = performance.now();

    // Check if user has reduced-motion preference (slow down instead of freezing)
    let speedMultiplier = 1.0;
    try {
      const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      if (motionQuery.matches) {
        speedMultiplier = 0.35;
      }
      const handleMotionChange = (e: MediaQueryListEvent) => {
        speedMultiplier = e.matches ? 0.35 : 1.0;
      };
      motionQuery.addEventListener('change', handleMotionChange);
    } catch {
      // Fallback
    }

    // Interactive mouse state & smooth parallax lerp
    const mouse = {
      x: -9999,
      y: -9999,
      isActive: false,
    };
    let smoothMouseOffsetX = 0;
    let smoothMouseOffsetY = 0;

    // Shooting stars state
    const shootingStars: ShootingStar[] = [];
    let nextShootingStarTime = performance.now() + 3000 + Math.random() * 3000;

    let width = 0;
    let height = 0;
    let dpr = 1;

    // Compute particle count based on screen area (balanced for high performance & visual richness)
    const computeParticleCount = (w: number, h: number) => {
      const area = w * h;
      return Math.round(Math.min(130, Math.max(45, area / 13500)));
    };

    // Parallax depth weights for the 3 layers
    const LAYER_PARALLAX = [0.016, 0.038, 0.075];

    // Initialize or re-size canvas and distribute particles across 3 layers
    const initOrResize = () => {
      const winW = window.innerWidth || document.documentElement.clientWidth || 1024;
      const winH = window.innerHeight || document.documentElement.clientHeight || 768;
      width = Math.max(winW, 320);
      height = Math.max(winH, 320);
      dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const targetCount = computeParticleCount(width, height);
      const tones = themeRef.current.particles;
      const isLight = !themeRef.current.isDark;

      const particles: Particle[] = [];
      for (let i = 0; i < targetCount; i++) {
        // Distribute into 3 layers: 40% distant (0), 40% midground (1), 20% foreground (2)
        const rand = Math.random();
        const layer = rand < 0.4 ? 0 : rand < 0.8 ? 1 : 2;

        const colorA = tones[i % tones.length] || { r: 56, g: 189, b: 248, hex: '#38bdf8' };
        const colorB = tones[(i + 1) % tones.length] || colorA;

        // Layer-dependent sizing, speeds, and alphas
        let speed = 12 + Math.random() * 14;
        let baseRadius = 1.6 + Math.random() * 0.8;
        let baseAlpha = isLight ? 0.48 + Math.random() * 0.2 : 0.55 + Math.random() * 0.2;
        let glowRadius = baseRadius * 3.0;

        if (layer === 1) {
          speed = 22 + Math.random() * 18;
          baseRadius = 2.4 + Math.random() * 1.0;
          baseAlpha = isLight ? 0.62 + Math.random() * 0.22 : 0.72 + Math.random() * 0.22;
          glowRadius = baseRadius * 3.6;
        } else if (layer === 2) {
          speed = 34 + Math.random() * 22;
          baseRadius = 3.6 + Math.random() * 1.6;
          baseAlpha = isLight ? 0.78 + Math.random() * 0.18 : 0.88 + Math.random() * 0.12;
          glowRadius = baseRadius * 4.4;
        }

        const angle = Math.random() * Math.PI * 2;
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;

        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx,
          vy,
          pushVx: 0,
          pushVy: 0,
          layer,
          baseRadius,
          glowRadius,
          colorA,
          colorB,
          twinkleSpeed: 1.2 + Math.random() * 2.2,
          twinklePhase: Math.random() * Math.PI * 2,
          shimmerSpeed: 0.9 + Math.random() * 1.6,
          shimmerPhase: Math.random() * Math.PI * 2,
          baseAlpha,
          currentAlpha: baseAlpha,
          renderX: 0,
          renderY: 0,
          currentColor: { ...colorA },
        });
      }

      particlesRef.current = particles;
    };

    initOrResize();

    // Debounced window resize listener
    let resizeTimer: number | null = null;
    const handleResize = () => {
      if (resizeTimer) window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(initOrResize, 120);
    };
    window.addEventListener('resize', handleResize);

    // Mouse move & leave listeners for interactive repel & 3D parallax
    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.isActive = true;
    };
    const handleMouseLeave = () => {
      mouse.isActive = false;
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mouseleave', handleMouseLeave, { passive: true });

    // Handle visibility changes without leaving dead animation frame loops
    const handleVisibilityChange = () => {
      if (document.hidden) {
        isPaused = true;
      } else {
        isPaused = false;
        lastTime = performance.now();
        if (animationFrameId === null) {
          animationFrameId = requestAnimationFrame(loop);
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Spawns a shooting star streak across the upper portion of the sky
    const spawnShootingStar = () => {
      if (shootingStars.length >= 2) return;
      const angle = (22 + Math.random() * 26) * (Math.PI / 180);
      const speed = 520 + Math.random() * 320;
      const startX = Math.random() * (width * 0.75);
      const startY = Math.random() * (height * 0.38);
      const length = 140 + Math.random() * 130;
      const maxLife = 0.8 + Math.random() * 0.5;

      shootingStars.push({
        x: startX,
        y: startY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        length,
        life: 0,
        maxLife,
        alpha: 1,
      });
    };

    const CONNECTION_MAX_DIST = 115;
    const MOUSE_REPEL_RADIUS = 150;

    // Main animation loop
    const loop = (currentTime: number) => {
      // Re-schedule first to guarantee the loop never freezes
      animationFrameId = requestAnimationFrame(loop);

      if (isPaused) return;

      const deltaSeconds = Math.min((currentTime - lastTime) / 1000, 0.064);
      lastTime = currentTime;

      const currentTheme = themeRef.current;
      const isLight = !currentTheme.isDark;
      const tones = currentTheme.particles;
      const primaryTone = tones[0] || { r: 56, g: 189, b: 248, hex: '#38bdf8' };
      const secondaryTone = tones[1] || primaryTone;

      // Smooth mouse parallax lerp
      if (mouse.isActive) {
        const targetOffsetX = mouse.x - width / 2;
        const targetOffsetY = mouse.y - height / 2;
        smoothMouseOffsetX += (targetOffsetX - smoothMouseOffsetX) * 0.05;
        smoothMouseOffsetY += (targetOffsetY - smoothMouseOffsetY) * 0.05;
      } else {
        smoothMouseOffsetX += (0 - smoothMouseOffsetX) * 0.03;
        smoothMouseOffsetY += (0 - smoothMouseOffsetY) * 0.03;
      }

      // Check shooting star spawn timing (~every 4-8s)
      if (currentTime > nextShootingStarTime) {
        spawnShootingStar();
        nextShootingStarTime = currentTime + 4200 + Math.random() * 4200;
      }

      ctx.clearRect(0, 0, width, height);

      const timeInSec = currentTime * 0.001;
      const particles = particlesRef.current;
      const pCount = particles.length;

      // 1. Update particle drift, repel force, twinkle, and animated color shimmer
      for (let i = 0; i < pCount; i++) {
        const p = particles[i];

        // Animated color shimmer/pulse (interpolating smoothly between colorA and colorB)
        const shimmerT = 0.5 + 0.5 * Math.sin(timeInSec * p.shimmerSpeed + p.shimmerPhase);
        p.currentColor.r = Math.round(p.colorA.r + (p.colorB.r - p.colorA.r) * shimmerT);
        p.currentColor.g = Math.round(p.colorA.g + (p.colorB.g - p.colorA.g) * shimmerT);
        p.currentColor.b = Math.round(p.colorA.b + (p.colorB.b - p.colorA.b) * shimmerT);

        // Twinkle / pulse opacity oscillation
        const twinkleOsc = 0.6 + 0.4 * Math.sin(timeInSec * p.twinkleSpeed + p.twinklePhase);
        p.currentAlpha = p.baseAlpha * twinkleOsc;

        // Calculate rendered position with layer parallax
        const parallaxWeight = LAYER_PARALLAX[p.layer];
        p.renderX = p.x + smoothMouseOffsetX * parallaxWeight;
        p.renderY = p.y + smoothMouseOffsetY * parallaxWeight;

        // Interactive mouse repel interaction (gentle push away with smooth return)
        if (mouse.isActive) {
          const dx = p.renderX - mouse.x;
          const dy = p.renderY - mouse.y;
          const dist = Math.hypot(dx, dy);
          if (dist < MOUSE_REPEL_RADIUS && dist > 0.01) {
            const force = (1 - dist / MOUSE_REPEL_RADIUS) * 60 * deltaSeconds;
            p.pushVx += (dx / dist) * force * 5;
            p.pushVy += (dy / dist) * force * 5;
          }
        }

        // Apply friction to push velocity so particles return smoothly to natural drift
        p.pushVx *= 0.91;
        p.pushVy *= 0.91;

        // Regular drift position update
        p.x += (p.vx * speedMultiplier + p.pushVx) * deltaSeconds;
        p.y += (p.vy * speedMultiplier + p.pushVy) * deltaSeconds;

        // Screen boundary wrap with padding
        const pad = 35;
        if (p.x < -pad) p.x = width + pad;
        else if (p.x > width + pad) p.x = -pad;
        if (p.y < -pad) p.y = height + pad;
        else if (p.y > height + pad) p.y = -pad;
      }

      // 2. Draw connecting lines between nearby midground and foreground particles
      ctx.lineWidth = 0.9;
      for (let i = 0; i < pCount; i++) {
        const p1 = particles[i];
        if (p1.layer === 0) continue; // Keep distant layer clean

        for (let j = i + 1; j < pCount; j++) {
          const p2 = particles[j];
          if (p2.layer === 0) continue;

          const dx = p1.renderX - p2.renderX;
          const dy = p1.renderY - p2.renderY;
          const dist = Math.hypot(dx, dy);

          if (dist < CONNECTION_MAX_DIST) {
            const factor = 1 - dist / CONNECTION_MAX_DIST;
            const lineAlpha =
              factor * (isLight ? 0.38 : 0.3) * Math.min(p1.currentAlpha, p2.currentAlpha);

            if (lineAlpha > 0.02) {
              const midR = Math.round((p1.currentColor.r + p2.currentColor.r) / 2);
              const midG = Math.round((p1.currentColor.g + p2.currentColor.g) / 2);
              const midB = Math.round((p1.currentColor.b + p2.currentColor.b) / 2);

              ctx.strokeStyle = `rgba(${midR}, ${midG}, ${midB}, ${lineAlpha.toFixed(3)})`;
              ctx.beginPath();
              ctx.moveTo(p1.renderX, p1.renderY);
              ctx.lineTo(p2.renderX, p2.renderY);
              ctx.stroke();
            }
          }
        }
      }

      // 3. Draw particles in 3 depth layers (distant layer 0, midground layer 1, foreground layer 2)
      for (let layerIdx = 0; layerIdx < 3; layerIdx++) {
        for (let i = 0; i < pCount; i++) {
          const p = particles[i];
          if (p.layer !== layerIdx) continue;

          const { r, g, b } = p.currentColor;
          const rx = p.renderX;
          const ry = p.renderY;
          const alpha = p.currentAlpha;

          // (a) Soft glowing halo
          const haloGrad = ctx.createRadialGradient(rx, ry, 0, rx, ry, p.glowRadius);
          if (isLight) {
            haloGrad.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${(alpha * 0.65).toFixed(3)})`);
            haloGrad.addColorStop(0.35, `rgba(${r}, ${g}, ${b}, ${(alpha * 0.3).toFixed(3)})`);
            haloGrad.addColorStop(0.7, `rgba(${r}, ${g}, ${b}, ${(alpha * 0.08).toFixed(3)})`);
            haloGrad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
          } else {
            haloGrad.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${(alpha * 0.85).toFixed(3)})`);
            haloGrad.addColorStop(0.3, `rgba(${r}, ${g}, ${b}, ${(alpha * 0.45).toFixed(3)})`);
            haloGrad.addColorStop(0.65, `rgba(${r}, ${g}, ${b}, ${(alpha * 0.14).toFixed(3)})`);
            haloGrad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
          }

          ctx.fillStyle = haloGrad;
          ctx.beginPath();
          ctx.arc(rx, ry, p.glowRadius, 0, Math.PI * 2);
          ctx.fill();

          // (b) Crisp saturated particle core
          const coreAlpha = Math.min(1, alpha * (isLight ? 1.0 : 1.15));
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${coreAlpha.toFixed(3)})`;
          ctx.beginPath();
          ctx.arc(rx, ry, p.baseRadius, 0, Math.PI * 2);
          ctx.fill();

          // (c) Starlight sparkle center for mid/foreground layers
          if (layerIdx > 0) {
            if (isLight) {
              // Deep crisp nucleus on light theme for high-definition contrast
              ctx.fillStyle = `rgba(15, 23, 42, ${(alpha * 0.7).toFixed(3)})`;
              ctx.beginPath();
              ctx.arc(rx, ry, p.baseRadius * 0.4, 0, Math.PI * 2);
              ctx.fill();
            } else {
              // Bright white spark on dark themes
              ctx.fillStyle = `rgba(255, 255, 255, ${(alpha * 0.95).toFixed(3)})`;
              ctx.beginPath();
              ctx.arc(rx, ry, p.baseRadius * 0.45, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        }
      }

      // 4. Update & Draw Shooting Star Streaks
      for (let sIdx = shootingStars.length - 1; sIdx >= 0; sIdx--) {
        const star = shootingStars[sIdx];
        star.life += deltaSeconds;
        star.x += star.vx * deltaSeconds;
        star.y += star.vy * deltaSeconds;

        const progress = star.life / star.maxLife;
        if (progress >= 1) {
          shootingStars.splice(sIdx, 1);
          continue;
        }

        // Fast fade-in, smooth graceful fade-out
        let starAlpha = progress < 0.2 ? progress / 0.2 : 1 - (progress - 0.2) / 0.8;

        const headX = star.x;
        const headY = star.y;
        const speedMagnitude = Math.hypot(star.vx, star.vy);
        const tailUnitX = -star.vx / speedMagnitude;
        const tailUnitY = -star.vy / speedMagnitude;
        const tailX = headX + tailUnitX * star.length;
        const tailY = headY + tailUnitY * star.length;

        const grad = ctx.createLinearGradient(headX, headY, tailX, tailY);
        if (isLight) {
          grad.addColorStop(0, `rgba(${primaryTone.r}, ${primaryTone.g}, ${primaryTone.b}, ${(starAlpha * 0.95).toFixed(3)})`);
          grad.addColorStop(0.25, `rgba(${primaryTone.r}, ${primaryTone.g}, ${primaryTone.b}, ${(starAlpha * 0.75).toFixed(3)})`);
          grad.addColorStop(0.65, `rgba(${secondaryTone.r}, ${secondaryTone.g}, ${secondaryTone.b}, ${(starAlpha * 0.35).toFixed(3)})`);
          grad.addColorStop(1, `rgba(${secondaryTone.r}, ${secondaryTone.g}, ${secondaryTone.b}, 0)`);
        } else {
          grad.addColorStop(0, `rgba(255, 255, 255, ${(starAlpha * 0.98).toFixed(3)})`);
          grad.addColorStop(0.2, `rgba(${primaryTone.r}, ${primaryTone.g}, ${primaryTone.b}, ${(starAlpha * 0.9).toFixed(3)})`);
          grad.addColorStop(0.6, `rgba(${secondaryTone.r}, ${secondaryTone.g}, ${secondaryTone.b}, ${(starAlpha * 0.45).toFixed(3)})`);
          grad.addColorStop(1, `rgba(${secondaryTone.r}, ${secondaryTone.g}, ${secondaryTone.b}, 0)`);
        }

        ctx.strokeStyle = grad;
        ctx.lineWidth = 2.2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(headX, headY);
        ctx.lineTo(tailX, tailY);
        ctx.stroke();

        // Glowing head dot
        ctx.fillStyle = `rgba(${primaryTone.r}, ${primaryTone.g}, ${primaryTone.b}, ${starAlpha.toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(headX, headY, 2.8, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    // Kick off animation loop
    animationFrameId = requestAnimationFrame(loop);

    return () => {
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
      if (resizeTimer) {
        window.clearTimeout(resizeTimer);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div
      className="particle-canvas-layer fixed inset-0 pointer-events-none z-[1] overflow-hidden"
      aria-hidden="true"
    >
      <canvas
        ref={canvasRef}
        className="block w-full h-full"
      />
    </div>
  );
};
