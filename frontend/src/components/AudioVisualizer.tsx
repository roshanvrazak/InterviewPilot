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
    let startTime = Date.now();

    const draw = () => {
      animationFrameId = requestAnimationFrame(draw);
      const now = Date.now();
      
      if (analyser) {
        analyser.getByteFrequencyData(dataArray);
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Determine base color from state
      let baseColor = color || '#3b82f6'; // Default blue
      if (isInterrupted) {
        baseColor = '#f97316'; // Orange
      } else if (state === 'Listening') {
        baseColor = '#10b981'; // Green
      } else if (state === 'Connecting') {
        baseColor = '#9ca3af'; // Gray
      }

      // Pulse effect for connecting
      if (state === 'Connecting') {
        const pulse = 0.5 + 0.5 * Math.sin((now - startTime) / 200);
        ctx.globalAlpha = pulse;
      } else {
        ctx.globalAlpha = 1.0;
      }

      if (analyser && dataArray.length > 0) {
        const barWidth = (canvas.width / dataArray.length) * 2.5;
        let x = 0;

        for (let i = 0; i < dataArray.length; i++) {
          const barHeight = dataArray[i] / 2;
          ctx.fillStyle = baseColor;
          ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
          x += barWidth + 1;
        }
      } else {
        // Draw a flat line if no analyser or data
        ctx.strokeStyle = baseColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, canvas.height / 2);
        ctx.lineTo(canvas.width, canvas.height / 2);
        ctx.stroke();
      }
    };

    draw();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [analyser, color, state, isInterrupted]);

  return <canvas ref={canvasRef} width={200} height={100} className="rounded" />;
};
