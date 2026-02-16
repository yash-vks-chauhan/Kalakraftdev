'use client';

import React, { useRef, useEffect, useMemo, useCallback } from 'react';
import { cn } from '../../lib/utils';

interface OptimizedParticlesProps {
  className?: string;
  quantity?: number;
  color?: string;
  vx?: number;
  vy?: number;
  size?: number;
  duration?: number;
  onComplete?: () => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  life: number;
  maxLife: number;
}

const OptimizedParticles: React.FC<OptimizedParticlesProps> = ({
  className = '',
  quantity = 60,
  color = '#ffffff',
  vx = 0,
  vy = 0,
  size = 1,
  duration = 800,
  onComplete
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationIdRef = useRef<number>();
  const particlesRef = useRef<Particle[]>([]);
  const startTimeRef = useRef<number>(0);
  const isRunningRef = useRef<boolean>(false);

  // Memoized RGB color conversion
  const rgbColor = useMemo(() => {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    return [r, g, b];
  }, [color]);

  // Initialize particles with better distribution
  const initializeParticles = useCallback((canvas: HTMLCanvasElement) => {
    const particles: Particle[] = [];
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    for (let i = 0; i < quantity; i++) {
      // Create particles in a circular pattern around center
      const angle = (i / quantity) * Math.PI * 2;
      const radius = Math.random() * 100 + 50;
      
      particles.push({
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
        vx: vx + (Math.random() - 0.5) * 2,
        vy: vy + (Math.random() - 0.5) * 2,
        size: size + Math.random() * 1,
        opacity: 0,
        life: 0,
        maxLife: duration * 0.8 + Math.random() * duration * 0.4 // Vary particle lifetime
      });
    }

    return particles;
  }, [quantity, vx, vy, size, duration]);

  // Optimized render function using ImageData for better performance
  const render = useCallback((ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, currentTime: number) => {
    if (!startTimeRef.current) {
      startTimeRef.current = currentTime;
    }

    const elapsed = currentTime - startTimeRef.current;
    const progress = Math.min(elapsed / duration, 1);

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Update and draw particles
    let activeParticles = 0;
    
    particlesRef.current.forEach((particle, index) => {
      // Update particle
      particle.life += 16; // Assume 60fps
      particle.x += particle.vx;
      particle.y += particle.vy;
      
      // Calculate opacity based on life and global progress
      const lifeProgress = particle.life / particle.maxLife;
      const fadeIn = Math.min(lifeProgress * 4, 1); // Quick fade in
      const fadeOut = progress > 0.7 ? 1 - ((progress - 0.7) / 0.3) : 1; // Fade out in last 30%
      particle.opacity = fadeIn * fadeOut * 0.8;

      // Only draw if visible and within bounds
      if (particle.opacity > 0.01 && 
          particle.x > -10 && particle.x < canvas.width + 10 && 
          particle.y > -10 && particle.y < canvas.height + 10) {
        
        ctx.globalAlpha = particle.opacity;
        ctx.fillStyle = `rgb(${rgbColor[0]}, ${rgbColor[1]}, ${rgbColor[2]})`;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
        
        activeParticles++;
      }
    });

    ctx.globalAlpha = 1;

    // Continue animation if not complete
    if (progress < 1 && activeParticles > 0) {
      animationIdRef.current = requestAnimationFrame((time) => render(ctx, canvas, time));
    } else {
      // Animation complete
      isRunningRef.current = false;
      if (onComplete) {
        onComplete();
      }
    }
  }, [duration, rgbColor, onComplete]);

  // Start animation
  const startAnimation = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || isRunningRef.current) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Initialize particles
    particlesRef.current = initializeParticles(canvas);
    startTimeRef.current = 0;
    isRunningRef.current = true;

    // Start render loop
    animationIdRef.current = requestAnimationFrame((time) => render(ctx, canvas, time));
  }, [initializeParticles, render]);

  // Auto-start effect
  useEffect(() => {
    startAnimation();

    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      isRunningRef.current = false;
    };
  }, [startAnimation]);

  return (
    <canvas
      ref={canvasRef}
      className={cn('absolute inset-0 w-full h-full pointer-events-none', className)}
      style={{ width: '100%', height: '100%' }}
    />
  );
};

export default OptimizedParticles;
