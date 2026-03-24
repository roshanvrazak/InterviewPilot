// frontend/src/components/AudioVisualizer.tsx
import React, { useEffect, useRef, useState } from 'react';

export type VisualizerState = 'Speaking' | 'Listening' | 'Interrupted' | 'Connecting' | 'Idle';

interface AudioVisualizerProps {
  analyser: AnalyserNode | null;
  state?: VisualizerState;
  color?: string; // Optional override
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ analyser, state = 'Idle', color }) => {
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

    const SIZE = 180;
    const CENTER_X = SIZE / 2;
    const CENTER_Y = SIZE / 2;
    const BASE_RADIUS = 50;
    const MAX_SPIKE = 28;

    const getColors = (): { primary: string; glow: string } => {
      if (color) return { primary: color, glow: color };

      const isDark = document.documentElement.classList.contains('dark');

      if (isInterrupted) {
        return {
          primary: isDark ? '#FBBF24' : '#D97706',
          glow: isDark ? 'rgba(251, 191, 36, 0.3)' : 'rgba(217, 119, 6, 0.25)',
        };
      }

      switch (state) {
        case 'Speaking':
          return {
            primary: isDark ? '#FF6B2C' : '#FF5701',
            glow: isDark ? 'rgba(255, 107, 44, 0.35)' : 'rgba(255, 87, 1, 0.25)',
          };
        case 'Listening':
          return {
            primary: isDark ? '#34D399' : '#10B981',
            glow: isDark ? 'rgba(52, 211, 153, 0.35)' : 'rgba(16, 185, 129, 0.25)',
          };
        case 'Connecting':
          return {
            primary: '#6B7280',
            glow: 'rgba(107, 114, 128, 0.2)',
          };
        case 'Interrupted':
          return {
            primary: isDark ? '#FBBF24' : '#D97706',
            glow: isDark ? 'rgba(251, 191, 36, 0.3)' : 'rgba(217, 119, 6, 0.25)',
          };
        default:
          return {
            primary: isDark ? '#FF7A3D' : '#FF5701',
            glow: isDark ? 'rgba(255, 122, 61, 0.2)' : 'rgba(255, 87, 1, 0.15)',
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

      ctx.clearRect(0, 0, SIZE, SIZE);

      const { primary, glow } = getColors();

      // Global alpha for connecting pulse
      let globalAlpha = 1.0;
      if (state === 'Connecting') {
        globalAlpha = 0.4 + 0.4 * Math.sin(elapsed * 3);
      }

      const hasData = analyser && dataArray.length > 0 && dataArray.some((v) => v > 5);

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
        const pulseScale = 1 + 0.03 * Math.sin(elapsed * 1.5);
        const pulseAlpha = 0.25 + 0.1 * Math.sin(elapsed * 1.5);

        ctx.save();
        ctx.globalAlpha = (state === 'Connecting' ? globalAlpha : 1) * pulseAlpha;
        ctx.strokeStyle = primary;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(CENTER_X, CENTER_Y, BASE_RADIUS * pulseScale, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        // Second ring for depth
        const pulseScale2 = 1 + 0.05 * Math.sin(elapsed * 1.5 + 1);
        ctx.save();
        ctx.globalAlpha = (state === 'Connecting' ? globalAlpha : 1) * pulseAlpha * 0.4;
        ctx.strokeStyle = primary;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(CENTER_X, CENTER_Y, (BASE_RADIUS + 10) * pulseScale2, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
    };

    draw();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [analyser, color, state, isInterrupted]);

  return <canvas ref={canvasRef} width={180} height={180} className="rounded" />;
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
