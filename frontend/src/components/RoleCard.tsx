import React from 'react';

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
    className="group card-gradient-border text-left p-5 cursor-pointer min-h-[44px] w-full"
  >
    <div className="flex items-start justify-between gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2">
          <span
            className="badge"
            style={{ backgroundColor: 'var(--accent-surface)', color: 'var(--accent-primary)' }}
          >
            {type}
          </span>
          {icon && (
            <span className="font-mono text-[11px] font-semibold" style={{ color: 'var(--text-muted)' }}>
              {icon}
            </span>
          )}
        </div>
        <h3 className="font-bold text-[15px] mb-1 tracking-tight" style={{ color: 'var(--text-primary)' }}>
          {name}
        </h3>
        <p className="text-[13px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          {description}
        </p>
      </div>
      <div
        className="flex-shrink-0 mt-1 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200"
        style={{ color: 'var(--accent-primary)' }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M5 12h14M12 5l7 7-7 7"/>
        </svg>
      </div>
    </div>
  </button>
);
