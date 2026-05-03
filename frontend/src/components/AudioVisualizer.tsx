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
  size = 320,
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

    const CANVAS_WIDTH = size;
    const CANVAS_HEIGHT = size * 0.6; // Wider than tall for the matrix
    
    const ROWS = 10;
    const COLS = 16;
    const GAP = 4;
    const BLOCK_SIZE = (CANVAS_WIDTH - (COLS + 1) * GAP) / COLS;

    const getColors = (): { primary: string; secondary: string } => {
      if (color) return { primary: color, secondary: color };

      if (isInterrupted) return { primary: '#FBBF24', secondary: 'rgba(251, 191, 36, 0.1)' };

      switch (state) {
        case 'Thinking': return { primary: '#3B82F6', secondary: 'rgba(59, 130, 246, 0.05)' };
        case 'Speaking': return { primary: '#3B82F6', secondary: 'rgba(59, 130, 246, 0.1)' };
        case 'Listening': return { primary: '#3B82F6', secondary: 'rgba(59, 130, 246, 0.15)' };
        case 'Connecting': return { primary: '#52525B', secondary: 'rgba(82, 82, 91, 0.05)' };
        default: return { primary: '#3B82F6', secondary: 'rgba(59, 130, 246, 0.05)' };
      }
    };

    const draw = () => {
      animationFrameId = requestAnimationFrame(draw);
      const now = Date.now();
      const elapsed = (now - startTime) / 1000;

      if (analyser) {
        analyser.getByteFrequencyData(dataArray);
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const { primary, secondary } = getColors();
      
      let globalAlpha = 1.0;
      if (state === 'Connecting') {
        globalAlpha = 0.4 + 0.3 * Math.sin(elapsed * 4);
      }

      // Draw Grid Matrix
      for (let c = 0; c < COLS; c++) {
        // Frequency data mapping
        const sampleIdx = Math.floor((c / COLS) * (dataArray.length / 2));
        const intensity = dataArray[sampleIdx] / 255;
        const activeRows = Math.ceil(intensity * ROWS);

        for (let r = 0; r < ROWS; r++) {
          const x = GAP + c * (BLOCK_SIZE + GAP);
          const y = canvas.height - (GAP + (r + 1) * (BLOCK_SIZE + GAP));
          
          const isActive = r < activeRows && intensity > 0.05;
          
          ctx.globalAlpha = globalAlpha;
          if (isActive) {
            ctx.fillStyle = primary;
            // Add a small sharp glow for active blocks
            ctx.shadowColor = primary;
            ctx.shadowBlur = 4;
          } else {
            ctx.fillStyle = secondary;
            ctx.shadowBlur = 0;
          }

          ctx.fillRect(x, y, BLOCK_SIZE, BLOCK_SIZE);
        }
      }
    };

    draw();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [analyser, color, state, isInterrupted, size, theme]);

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Technical Labels Top */}
      <div className="w-full flex justify-between px-1 font-mono text-[10px] text-[var(--border-primary)] opacity-50 uppercase tracking-widest">
        <span>[FREQ_SCAN: {state.toUpperCase()}]</span>
        <span>[BUFFER: 1024ms]</span>
      </div>

      <div className="relative p-4 border border-[var(--border-subtle)] bg-black">
        <canvas 
          ref={canvasRef} 
          width={size} 
          height={size * 0.6} 
          className="transition-opacity duration-700"
        />
        
        {/* Decorative corner accents */}
        <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-[var(--border-primary)]" />
        <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-[var(--border-primary)]" />
        <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-[var(--border-primary)]" />
        <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-[var(--border-primary)]" />
      </div>

      {/* Technical Labels Bottom */}
      <div className="w-full flex justify-between px-1 font-mono text-[10px] text-[var(--border-primary)] opacity-50 uppercase tracking-widest">
        <span>SIGNAL_STRENGTH: 98%</span>
        <span>CHANNEL: 01</span>
      </div>
    </div>
  );
};
