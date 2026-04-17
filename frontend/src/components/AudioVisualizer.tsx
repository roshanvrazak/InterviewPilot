import React, { useEffect, useRef, useState } from 'react';

export type VisualizerState = 'Speaking' | 'Listening' | 'Interrupted' | 'Connecting' | 'Thinking' | 'Idle';

interface AudioVisualizerProps {
  analyser: AnalyserNode | null;
  state?: VisualizerState;
  color?: string; // Optional override
  size?: number;
  theme?: 'light' | 'dark';
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ 
  analyser, 
  state = 'Idle', 
  color, 
  size = 180,
  theme = 'dark'
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isInterrupted, setIsInterrupted] = useState(false);

  useEffect(() => {
    if (state === 'Interrupted') {
      setIsInterrupted(true);
      const timer = setTimeout(() => setIsInterrupted(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [state]);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { alpha: true })!;
    const dataArray = analyser ? new Uint8Array(analyser.frequencyBinCount) : new Uint8Array(0);

    let animationFrameId: number;
    const startTime = Date.now();

    const CANVAS_SIZE = size;
    const CENTER_X = CANVAS_SIZE / 2;
    const CENTER_Y = CANVAS_SIZE / 2;
    const BASE_RADIUS = CANVAS_SIZE * 0.28;
    const MAX_SPIKE = CANVAS_SIZE * 0.15;

    const getColors = (elapsed: number): { primary: string; glow: string } => {
      if (color) return { primary: color, glow: color };

      const isDark = theme === 'dark';

      if (isInterrupted) {
        return {
          primary: isDark ? '#FBBF24' : '#D97706',
          glow: isDark ? 'rgba(251, 191, 36, 0.3)' : 'rgba(217, 119, 6, 0.25)',
        };
      }

      switch (state) {
        case 'Thinking':
          const hue = (elapsed * 60) % 360;
          return {
            primary: `hsla(${hue}, 80%, 60%, 1)`,
            glow: `hsla(${hue}, 80%, 60%, 0.3)`,
          };
        case 'Speaking':
          return {
            primary: isDark ? '#FF6B2C' : '#FF5701',
            glow: isDark ? 'rgba(255, 107, 44, 0.45)' : 'rgba(255, 87, 1, 0.35)',
          };
        case 'Listening':
          return {
            primary: isDark ? '#34D399' : '#10B981',
            glow: isDark ? 'rgba(52, 211, 153, 0.45)' : 'rgba(16, 185, 129, 0.35)',
          };
        case 'Connecting':
          return {
            primary: isDark ? '#52525B' : '#94A3B8',
            glow: 'rgba(148, 163, 184, 0.2)',
          };
        default:
          return {
            primary: isDark ? '#FF6B2C' : '#FF5701',
            glow: isDark ? 'rgba(255, 107, 44, 0.2)' : 'rgba(255, 87, 1, 0.15)',
          };
      }
    };

    const draw = () => {
      animationFrameId = requestAnimationFrame(draw);
      const now = Date.now();
      const elapsed = (now - startTime) / 1000;

      if (analyser) {
        analyser.getByteFrequencyData(dataArray);
      }

      ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

      const { primary, glow } = getColors(elapsed);

      let globalAlpha = 1.0;
      if (state === 'Connecting') {
        globalAlpha = 0.4 + 0.3 * Math.sin(elapsed * 4);
      }

      const hasData = analyser && dataArray.length > 0 && dataArray.some((v) => v > 5);

      if (hasData) {
        // --- Layered Aura Effects ---
        
        // 1. Far outer glow (soft)
        ctx.save();
        ctx.globalAlpha = globalAlpha * 0.15;
        ctx.shadowColor = glow;
        ctx.shadowBlur = CANVAS_SIZE * 0.3;
        ctx.strokeStyle = primary;
        ctx.lineWidth = 2;
        drawRadialWaveform(ctx, dataArray, CENTER_X, CENTER_Y, BASE_RADIUS * 1.1, MAX_SPIKE * 1.2, elapsed);
        ctx.restore();

        // 2. Mid glow
        ctx.save();
        ctx.globalAlpha = globalAlpha * 0.3;
        ctx.shadowColor = glow;
        ctx.shadowBlur = CANVAS_SIZE * 0.1;
        ctx.strokeStyle = primary;
        ctx.lineWidth = 3;
        drawRadialWaveform(ctx, dataArray, CENTER_X, CENTER_Y, BASE_RADIUS, MAX_SPIKE, elapsed);
        ctx.restore();

        // 3. Sharp inner line
        ctx.save();
        ctx.globalAlpha = globalAlpha * 0.8;
        ctx.strokeStyle = primary;
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        drawRadialWaveform(ctx, dataArray, CENTER_X, CENTER_Y, BASE_RADIUS, MAX_SPIKE, elapsed);
        ctx.restore();

        // 4. Particle texture
        ctx.save();
        ctx.globalAlpha = globalAlpha * 0.4;
        ctx.fillStyle = primary;
        const dotCount = 48;
        for (let i = 0; i < dotCount; i++) {
          const angle = (i / dotCount) * Math.PI * 2 - Math.PI / 2 + (elapsed * 0.1);
          const sampleIndex = Math.floor((i / dotCount) * dataArray.length);
          const value = dataArray[sampleIndex] / 255;
          const r = BASE_RADIUS - 8 - value * (MAX_SPIKE * 0.5);
          const x = CENTER_X + Math.cos(angle) * r;
          const y = CENTER_Y + Math.sin(angle) * r;
          const dotSize = 0.8 + value * 2;
          ctx.beginPath();
          ctx.arc(x, y, dotSize, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      } else {
        // --- Idle Aura (Nebula style) ---
        const pulse = Math.sin(elapsed * 2);
        const pulseScale = 1 + 0.05 * pulse;
        
        // Outer faint ring
        ctx.save();
        ctx.globalAlpha = (state === 'Connecting' ? globalAlpha : 0.15) * (0.6 + 0.2 * pulse);
        ctx.strokeStyle = primary;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(CENTER_X, CENTER_Y, BASE_RADIUS * pulseScale * 1.2, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        // Main pulsing ring
        ctx.save();
        ctx.globalAlpha = (state === 'Connecting' ? globalAlpha : 0.3) * (0.7 + 0.3 * pulse);
        ctx.strokeStyle = primary;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(CENTER_X, CENTER_Y, BASE_RADIUS * pulseScale, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
    };

    draw();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [analyser, color, state, isInterrupted, size, theme]);

  return (
    <canvas 
      ref={canvasRef} 
      width={size} 
      height={size} 
      className="rounded-full transition-opacity duration-700"
    />
  );
};

function drawRadialWaveform(
  ctx: CanvasRenderingContext2D,
  dataArray: Uint8Array,
  cx: number,
  cy: number,
  baseRadius: number,
  maxSpike: number,
  _elapsed: number,
) {
  const points = 128;
  const coords: { x: number; y: number }[] = [];

  for (let i = 0; i < points; i++) {
    const angle = (i / points) * Math.PI * 2 - Math.PI / 2;
    const sampleIndex = Math.floor((i / points) * dataArray.length);
    const value = dataArray[sampleIndex] / 255;
    const r = baseRadius + value * maxSpike;
    coords.push({
      x: cx + Math.cos(angle) * r,
      y: cy + Math.sin(angle) * r,
    });
  }

  ctx.beginPath();
  const first = coords[0];
  const last = coords[coords.length - 1];

  ctx.moveTo((last.x + first.x) / 2, (last.y + first.y) / 2);

  for (let i = 0; i < coords.length; i++) {
    const current = coords[i];
    const next = coords[(i + 1) % coords.length];
    const midX = (current.x + next.x) / 2;
    const midY = (current.y + next.y) / 2;
    ctx.quadraticCurveTo(current.x, current.y, midX, midY);
  }

  ctx.closePath();
  ctx.stroke();
}
