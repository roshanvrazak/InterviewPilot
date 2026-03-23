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
      let baseColor = color || '#6366f1'; // Default Indigo 500
      if (isInterrupted) {
        baseColor = '#f59e0b'; // Amber 500
      } else if (state === 'Listening') {
        baseColor = '#10b981'; // Emerald 500
      } else if (state === 'Connecting') {
        baseColor = '#64748b'; // Slate 500
      }

      // Pulse effect for connecting
      if (state === 'Connecting') {
        const pulse = 0.4 + 0.3 * Math.sin((now - startTime) / 200);
        ctx.globalAlpha = pulse;
      } else {
        ctx.globalAlpha = 1.0;
      }

      const isDarkMode = document.documentElement.classList.contains('dark');
      
      if (analyser && dataArray.length > 0) {
        const barWidth = (canvas.width / dataArray.length) * 2.5;
        let x = 0;

        for (let i = 0; i < dataArray.length; i++) {
          const barHeight = (dataArray[i] / 255) * canvas.height;
          
          // Use gradient for bars
          const gradient = ctx.createLinearGradient(0, canvas.height, 0, canvas.height - barHeight);
          gradient.addColorStop(0, baseColor);
          gradient.addColorStop(1, isDarkMode ? `${baseColor}99` : `${baseColor}cc`); // Semi-transparent top

          ctx.fillStyle = gradient;
          
          // Draw rounded bars
          const radius = 2;
          const bx = x;
          const by = canvas.height - barHeight;
          const bw = barWidth;
          const bh = barHeight;
          
          if (bh > radius) {
            ctx.beginPath();
            ctx.moveTo(bx, canvas.height);
            ctx.lineTo(bx, by + radius);
            ctx.quadraticCurveTo(bx, by, bx + radius, by);
            ctx.lineTo(bx + bw - radius, by);
            ctx.quadraticCurveTo(bx + bw, by, bx + bw, by + radius);
            ctx.lineTo(bx + bw, canvas.height);
            ctx.closePath();
            ctx.fill();
          } else {
            ctx.fillRect(bx, canvas.height - 1, bw, 1);
          }
          
          x += barWidth + 2;
        }
      } else {
        // Draw a refined flat line if no analyser or data
        ctx.strokeStyle = baseColor;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.moveTo(10, canvas.height / 2);
        ctx.lineTo(canvas.width - 10, canvas.height / 2);
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
