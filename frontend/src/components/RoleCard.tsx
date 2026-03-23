import React from 'react';

interface RoleCardProps {
  id: string;
  name: string;
  description: string;
  type: string;
  onSelect: (id: string) => void;
}

export const RoleCard: React.FC<RoleCardProps> = ({ id, name, description, type, onSelect }) => (
  <div 
    onClick={() => onSelect(id)}
    className="group border border-slate-200 dark:border-slate-700 rounded-2xl p-6 hover:shadow-xl hover:scale-[1.02] cursor-pointer transition-all bg-white dark:bg-slate-800 dark:hover:bg-slate-700/50"
  >
    <div className="flex justify-between items-start mb-4">
      <div className="text-xs font-bold px-2 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg uppercase tracking-wider">{type}</div>
    </div>
    <h3 className="text-xl font-bold mb-2 text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{name}</h3>
    <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{description}</p>
  </div>
);
