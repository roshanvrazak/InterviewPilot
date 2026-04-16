import React from 'react';
import { Mic, MicOff, Check, X } from 'lucide-react';

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
  status
}) => {
  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 px-6 py-4 glass-panel rounded-full shadow-2xl z-50 animate-fade-in-up">
      {/* Status indicator if provided */}
      {status && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-black/5 dark:bg-white/5 rounded-full border border-black/5 dark:border-white/10 mr-1">
          <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
          <span className="text-[10px] font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-widest">{status}</span>
        </div>
      )}

      {/* Mic Toggle */}
      <button
        onClick={onToggleMute}
        className={`p-3 rounded-full transition-all duration-200 ${
          isMuted 
            ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20' 
            : 'bg-black/5 dark:bg-white/10 text-zinc-700 dark:text-white hover:bg-black/10 dark:hover:bg-white/20'
        }`}
        title={isMuted ? "Unmute" : "Mute"}
        aria-label={isMuted ? "Unmute microphone" : "Mute microphone"}
      >
        {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
      </button>

      {/* Finish Answer - Primary Action */}
      <button
        onClick={onFinish}
        className="p-3 rounded-full bg-orange-500 text-white hover:bg-orange-600 transition-all duration-200 shadow-lg shadow-orange-500/25 flex items-center justify-center"
        title="Finish Answer"
        aria-label="Finish current answer"
      >
        <Check size={20} strokeWidth={3} />
      </button>

      {/* End Interview */}
      <button
        onClick={onEnd}
        className="p-3 rounded-full bg-black/5 dark:bg-white/10 text-zinc-700 dark:text-white hover:bg-red-500 hover:text-white transition-all duration-200"
        title="End Interview"
        aria-label="End interview"
      >
        <X size={20} />
      </button>
    </div>
  );
};

export default ControlDock;
