// frontend/src/components/AudioVisualizer.tsx
import React, { useEffect, useRef, useState } from 'react';

export type VisualizerState = 'Speaking' | 'Listening' | 'Interrupted' | 'Connecting' | 'Idle' | 'Thinking';

interface AudioVisualizerProps {
  analyser: AnalyserNode | null;
  state?: VisualizerState;
  color?: string; // Optional override
  size?: number;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ analyser, state = 'Idle', color, size = 180 }) => {
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
    const ctx = canvas.getContext('2d')!;
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

      const isDark = document.documentElement.classList.contains('dark');

      if (state === 'Thinking') {
        const hue = (elapsed * 60) % 360;
        return {
          primary: `hsla(${hue}, 80%, 60%, 1)`,
          glow: `hsla(${hue}, 80%, 60%, 0.5)`,
        };
      }

      if (isInterrupted) {
        return {
          primary: isDark ? '#FBBF24' : '#D97706',
          glow: isDark ? 'rgba(251, 191, 36, 0.4)' : 'rgba(217, 119, 6, 0.3)',
        };
      }

      switch (state) {
        case 'Speaking':
          return {
            primary: isDark ? '#FF6B2C' : '#FF5701',
            glow: isDark ? 'rgba(255, 107, 44, 0.5)' : 'rgba(255, 87, 1, 0.4)',
          };
        case 'Listening':
          return {
            primary: isDark ? '#34D399' : '#10B981',
            glow: isDark ? 'rgba(52, 211, 153, 0.5)' : 'rgba(16, 185, 129, 0.4)',
          };
        case 'Connecting':
          return {
            primary: '#6B7280',
            glow: 'rgba(107, 114, 128, 0.3)',
          };
        case 'Interrupted':
          return {
            primary: isDark ? '#FBBF24' : '#D97706',
            glow: isDark ? 'rgba(251, 191, 36, 0.4)' : 'rgba(217, 119, 6, 0.3)',
          };
        default:
          return {
            primary: isDark ? '#FF7A3D' : '#FF5701',
            glow: isDark ? 'rgba(255, 122, 61, 0.3)' : 'rgba(255, 87, 1, 0.2)',
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

      // Global alpha for connecting pulse
      let globalAlpha = 1.0;
      if (state === 'Connecting') {
        globalAlpha = 0.4 + 0.4 * Math.sin(elapsed * 3);
      }

      const hasData = analyser && dataArray.length > 0 && dataArray.some((v) => v > 5);
      const avgValue = hasData ? dataArray.reduce((a, b) => a + b, 0) / dataArray.length / 255 : 0;

      // -- Spatial Aura / Nebula layer --
      ctx.save();
      const ringCount = 4;
      for (let i = 0; i < ringCount; i++) {
        ctx.beginPath();
        const blur = 15 + i * 12 + (hasData ? avgValue * 30 : 0);
        const scale = 0.8 + i * 0.25 + (hasData ? avgValue * 0.2 : 0);
        const alpha = (0.2 / (i + 1)) * globalAlpha;
        
        ctx.shadowBlur = blur;
        ctx.shadowColor = glow;
        ctx.strokeStyle = primary;
        ctx.globalAlpha = alpha;
        ctx.lineWidth = 4;

        const r = BASE_RADIUS * scale + Math.sin(elapsed * 1.5 + i) * 8;
        ctx.arc(CENTER_X, CENTER_Y, r, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();

      if (hasData) {
        // -- Glow layer --
        ctx.save();
        ctx.globalAlpha = globalAlpha * 0.6;
        ctx.shadowColor = glow;
        ctx.shadowBlur = 24;
        ctx.strokeStyle = primary;
        ctx.lineWidth = 3;

        drawRadialWaveform(ctx, dataArray, CENTER_X, CENTER_Y, BASE_RADIUS, MAX_SPIKE, elapsed);
        ctx.restore();

        // -- Main waveform layer --
        ctx.save();
        ctx.globalAlpha = globalAlpha;
        ctx.strokeStyle = primary;
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        drawRadialWaveform(ctx, dataArray, CENTER_X, CENTER_Y, BASE_RADIUS, MAX_SPIKE, elapsed);
        ctx.restore();

        // -- Inner dots for texture --
        ctx.save();
        ctx.globalAlpha = globalAlpha * 0.5;
        ctx.fillStyle = primary;
        const dotCount = 36;
        for (let i = 0; i < dotCount; i++) {
          const angle = (i / dotCount) * Math.PI * 2 - Math.PI / 2;
          const sampleIndex = Math.floor((i / dotCount) * dataArray.length);
          const value = dataArray[sampleIndex] / 255;
          const r = BASE_RADIUS - 6 - value * 8;
          const x = CENTER_X + Math.cos(angle) * r;
          const y = CENTER_Y + Math.sin(angle) * r;
          const dotSize = 0.5 + value * 1.5;
          ctx.beginPath();
          ctx.arc(x, y, dotSize, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      } else {
        // -- Idle: subtle pulsing circle outline --
        const pulseScale = 1 + 0.04 * Math.sin(elapsed * 1.2);
        const pulseAlpha = 0.3 + 0.15 * Math.sin(elapsed * 1.2);

        ctx.save();
        ctx.globalAlpha = (state === 'Connecting' ? globalAlpha : 1) * pulseAlpha;
        ctx.strokeStyle = primary;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(CENTER_X, CENTER_Y, BASE_RADIUS * pulseScale, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        // Second ring for depth
        const pulseScale2 = 1 + 0.06 * Math.sin(elapsed * 1.2 + 1);
        ctx.save();
        ctx.globalAlpha = (state === 'Connecting' ? globalAlpha : 1) * pulseAlpha * 0.5;
        ctx.strokeStyle = primary;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(CENTER_X, CENTER_Y, (BASE_RADIUS + 15) * pulseScale2, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
    };

    draw();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [analyser, color, state, isInterrupted, size]);

  return <canvas ref={canvasRef} width={size} height={size} className="rounded-full" />;
};

/**
 * Draws frequency data as a closed radial waveform around a circle.
 */
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
