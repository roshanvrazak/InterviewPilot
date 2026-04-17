import React, { useRef, useEffect } from 'react';
import { X } from 'lucide-react';

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

  return (
    <div 
      className={`fixed right-0 top-0 h-screen w-full sm:w-80 md:w-96 glass-panel border-l border-[var(--border-primary)] z-50 transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--border-subtle)]">
          <h2 className="text-lg font-bold text-[var(--text-primary)]">Transcript</h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-[var(--bg-surface-hover)] rounded-full transition-colors cursor-pointer"
            aria-label="Close transcript"
          >
            <X size={20} className="text-[var(--text-secondary)]" />
          </button>
        </div>

        {/* Content */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide">
          {transcripts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-[var(--text-muted)] opacity-50">
              <span className="text-sm">No messages yet</span>
            </div>
          ) : (
            transcripts.map((item, index) => (
              <div key={index} className="flex flex-col gap-1 animate-fade-in">
                <span className={`text-[10px] font-bold uppercase tracking-widest ${
                  item.speaker.toLowerCase() === 'interviewer' || item.speaker.toLowerCase() === 'candidate'
                    ? 'text-[var(--text-muted)]'
                    : 'text-[var(--accent-primary)]'
                }`}>
                  {item.speaker === 'interviewer' ? 'Alex' : 'You'}
                </span>
                <div className={`p-3.5 rounded-2xl text-sm leading-relaxed ${
                  item.speaker.toLowerCase() === 'interviewer' 
                    ? 'bg-[var(--bg-elevated)] border border-[var(--border-primary)] text-[var(--text-primary)] rounded-tl-sm' 
                    : 'bg-[var(--accent-primary)] text-white rounded-tr-sm shadow-lg shadow-orange-500/10'
                }`}>
                  {item.text}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
