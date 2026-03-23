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
    className="border rounded-lg p-6 hover:shadow-lg cursor-pointer transition-shadow bg-white"
  >
    <div className="text-sm text-blue-500 font-bold mb-2 uppercase">{type}</div>
    <h3 className="text-xl font-bold mb-2">{name}</h3>
    <p className="text-gray-600 text-sm">{description}</p>
  </div>
);
