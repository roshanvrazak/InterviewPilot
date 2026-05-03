import React, { useRef, useEffect } from 'react';
import { X, Terminal as TerminalIcon } from 'lucide-react';

interface TranscriptItem {
  speaker: string;
  text: string;
  timestamp?: number;
}

interface TranscriptDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  transcripts: TranscriptItem[];
}

export const TranscriptDrawer: React.FC<TranscriptDrawerProps> = ({ isOpen, onClose, transcripts }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcripts, isOpen]);

  const formatTimestamp = (ts?: number) => {
    const date = ts ? new Date(ts) : new Date();
    return date.toTimeString().split(' ')[0];
  };

  return (
    <div 
      className={`fixed right-0 top-0 h-screen w-full sm:w-80 md:w-[30rem] bg-black border-l border-[var(--border-primary)] z-50 transition-transform duration-300 ease-in-out font-mono ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--border-primary)] bg-[var(--bg-secondary)]">
          <div className="flex items-center gap-2 text-[var(--border-primary)]">
            <TerminalIcon size={18} />
            <h2 className="text-sm font-bold uppercase tracking-[0.2em]">System_Log</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-[var(--border-primary)] hover:text-black transition-colors cursor-pointer border border-[var(--border-primary)] text-[var(--border-primary)]"
            aria-label="Close log"
          >
            <X size={16} />
          </button>
        </div>

        {/* Log Content */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-1 text-[13px] scrollbar-hide">
          {transcripts.length === 0 ? (
            <div className="flex items-center gap-2 text-[var(--text-muted)] opacity-50">
              <span className="animate-pulse">_</span>
              <span>WAITING_FOR_INPUT...</span>
            </div>
          ) : (
            transcripts.map((item, index) => (
              <div key={index} className="flex gap-3 py-1 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors group">
                <span className="text-[var(--text-muted)] shrink-0">
                  [{formatTimestamp(item.timestamp)}]
                </span>
                <div className="flex flex-col">
                  <span className={`font-bold uppercase tracking-widest ${
                    item.speaker.toLowerCase() === 'interviewer'
                      ? 'text-[var(--border-primary)]'
                      : 'text-[var(--success)]'
                  }`}>
                    {item.speaker === 'interviewer' ? 'AI_CORE' : 'CANDIDATE'}:
                  </span>
                  <p className="text-[var(--text-primary)] leading-relaxed mt-1">
                    {item.text}
                  </p>
                </div>
              </div>
            ))
          )}
          {transcripts.length > 0 && (
             <div className="flex items-center gap-2 text-[var(--border-primary)] animate-pulse pt-2">
                <span>_</span>
             </div>
          )}
        </div>

        {/* Footer info */}
        <div className="p-2 border-t border-[var(--border-primary)] bg-[var(--bg-secondary)] text-[10px] text-[var(--text-muted)] flex justify-between uppercase tracking-widest">
          <span>LOG_STREAM: ACTIVE</span>
          <span>ENCRYPTION: AES-256</span>
        </div>
      </div>
    </div>
  );
};
