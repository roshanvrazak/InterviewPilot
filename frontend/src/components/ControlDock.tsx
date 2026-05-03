import React from 'react';
import { Mic, MicOff, Check, X, Terminal } from 'lucide-react';

interface ControlDockProps {
  isMuted: boolean;
  onToggleMute: () => void;
  onFinish: () => void;
  onEnd: () => void;
  status?: string;
}

export const ControlDock: React.FC<ControlDockProps> = ({
  isMuted,
  onToggleMute,
  onFinish,
  onEnd,
  status = 'READY'
}) => {
  return (
    <div className="fixed bottom-0 left-0 w-full bg-black border-t border-[var(--border-primary)] z-50 flex items-center justify-between px-6 py-4 font-mono">
      {/* Left: Session Info */}
      <div className="flex items-center gap-4 text-[var(--border-primary)] opacity-80">
        <Terminal size={16} />
        <div className="flex flex-col">
          <span className="text-[10px] font-bold uppercase tracking-widest">Session Status</span>
          <span className="text-[12px] font-bold">[{status.toUpperCase()}]</span>
        </div>
      </div>

      {/* Center: Main Actions */}
      <div className="flex items-center gap-6">
        {/* Mic Toggle */}
        <button
          onClick={onToggleMute}
          className={`flex items-center gap-3 px-4 py-2 transition-all duration-200 border ${
            isMuted 
              ? 'border-[var(--danger)] text-[var(--danger)] hover:bg-[var(--danger)] hover:text-black' 
              : 'border-[var(--border-primary)] text-[var(--border-primary)] hover:bg-[var(--border-primary)] hover:text-black'
          }`}
          aria-label={isMuted ? "Unmute microphone" : "Mute microphone"}
        >
          {isMuted ? <MicOff size={16} /> : <Mic size={16} />}
          <span className="text-[11px] font-bold uppercase tracking-tighter">
            {isMuted ? '[ MIC: MUTED ]' : '[ MIC: ACTIVE ]'}
          </span>
        </button>

        {/* Finish Answer */}
        <button
          onClick={onFinish}
          className="flex items-center gap-3 px-6 py-2 bg-[var(--border-primary)] text-black hover:bg-white transition-all duration-200"
          aria-label="Finish current answer"
        >
          <Check size={18} strokeWidth={3} />
          <span className="text-[11px] font-bold uppercase tracking-tighter">
            COMMIT_ANSWER
          </span>
        </button>
      </div>

      {/* Right: Danger Action */}
      <button
        onClick={onEnd}
        className="flex items-center gap-2 px-4 py-2 text-[var(--text-muted)] hover:text-[var(--danger)] hover:border-[var(--danger)] border border-transparent transition-all duration-200"
        aria-label="End interview"
      >
        <X size={16} />
        <span className="text-[11px] font-bold uppercase tracking-tighter">
          [ ABORT_SESSION ]
        </span>
      </button>

      {/* Decorative Scanline effect for the bar */}
      <div className="absolute top-0 left-0 w-full h-[1px] bg-white opacity-10 pointer-events-none" />
    </div>
  );
};

export default ControlDock;
