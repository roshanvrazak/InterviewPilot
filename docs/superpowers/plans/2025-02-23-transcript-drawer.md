# Transcript Drawer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a collapsible, slide-out transcript drawer for the Spatial Stage interview experience.

**Architecture:** A React functional component that uses absolute positioning and CSS transitions for a slide-out effect. It renders a list of transcripts grouped by speaker.

**Tech Stack:** React, TypeScript, Tailwind CSS, Lucide React.

---

### Task 1: Create TranscriptDrawer Component Structure

**Files:**
- Create: `frontend/src/components/TranscriptDrawer.tsx`

- [ ] **Step 1: Implement basic component structure and props**

```tsx
import React from 'react';
import { X } from 'lucide-react';

interface TranscriptItem {
  speaker: string;
  text: string;
  timestamp?: string;
}

interface TranscriptDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  transcripts: TranscriptItem[];
}

export const TranscriptDrawer: React.FC<TranscriptDrawerProps> = ({ isOpen, onClose, transcripts }) => {
  return (
    <div 
      className={`fixed right-0 top-0 h-screen w-80 md:w-96 glass-panel border-l border-[var(--border-primary)] z-50 transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--border-subtle)]">
          <h2 className="text-lg font-bold text-[var(--text-primary)]">Transcript</h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-[var(--bg-surface-hover)] rounded-full transition-colors"
            aria-label="Close transcript"
          >
            <X size={20} className="text-[var(--text-secondary)]" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {transcripts.length === 0 ? (
            <div className="text-center text-[var(--text-muted)] mt-10">
              No transcript available yet.
            </div>
          ) : (
            transcripts.map((item, index) => (
              <div key={index} className="flex flex-col gap-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  {item.speaker}
                </span>
                <div className={`p-3 rounded-2xl text-sm ${
                  item.speaker.toLowerCase() === 'interviewer' 
                    ? 'bg-[var(--accent-surface)] text-[var(--text-primary)] rounded-tl-none' 
                    : 'bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded-tr-none'
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
```

- [ ] **Step 2: Commit initial component**

```bash
git add frontend/src/components/TranscriptDrawer.tsx
git commit -m "feat: add collapsible TranscriptDrawer component"
```

