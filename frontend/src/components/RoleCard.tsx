import React from 'react';
import { Terminal } from 'lucide-react';

interface RoleCardProps {
  id: string;
  name: string;
  description: string;
  type: string;
  icon?: string;
  onSelect: (id: string) => void;
}

export const RoleCard: React.FC<RoleCardProps> = ({ id, name, description, type, icon, onSelect }) => (
  <button
    onClick={() => onSelect(id)}
    className="group border border-[var(--border-subtle)] bg-black text-left p-6 cursor-pointer min-h-[44px] w-full hover:border-[var(--border-primary)] transition-all relative overflow-hidden font-mono"
  >
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-[10px] font-bold px-2 py-0.5 border border-[var(--border-primary)] text-[var(--border-primary)] uppercase tracking-widest">
            {type}
          </span>
          {icon && (
            <span className="text-[10px] font-bold text-[var(--text-muted)] opacity-50">
              MOD_{icon}
            </span>
          )}
        </div>
        <h3 className="font-bold text-[15px] mb-2 tracking-tighter text-white uppercase">
          {name}
        </h3>
        <p className="text-[12px] leading-relaxed text-[var(--text-secondary)]">
          {description}
        </p>
      </div>
      <div className="flex-shrink-0 mt-1 text-[var(--border-primary)] opacity-30 group-hover:opacity-100 transition-opacity">
        <Terminal size={18} />
      </div>
    </div>

    {/* Selection indicator */}
    <div className="mt-6 flex items-center justify-between">
       <span className="text-[9px] font-bold text-[var(--text-muted)] group-hover:text-[var(--border-primary)] transition-colors uppercase tracking-[0.2em]">
          [ READY_FOR_INITIALIZATION ]
       </span>
       <div className="w-1.5 h-1.5 bg-[var(--border-primary)] opacity-0 group-hover:opacity-100 animate-pulse" />
    </div>
    
    {/* Decorative corner accent */}
    <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-[var(--border-primary)] opacity-0 group-hover:opacity-100" />
  </button>
);
