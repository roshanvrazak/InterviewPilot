import React from 'react';
import { RoleCard } from '../components/RoleCard';

const roles = [
  { id: 'software_engineer', name: 'Software Engineer', description: 'General technical interview focusing on coding and system design.', type: 'Mixed' },
  { id: 'frontend_developer', name: 'Frontend Developer', description: 'Interview focusing on React, CSS, and web performance.', type: 'Technical' },
  { id: 'product_manager', name: 'Product Manager', description: 'Interview focusing on product strategy and execution.', type: 'Behavioral' },
  { id: 'devops_engineer', name: 'DevOps Engineer', description: 'Interview focusing on infrastructure and automation.', type: 'Technical' }
];

interface HomePageProps {
  onSelectRole: (id: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onSelectRole }) => (
  <div className="max-w-4xl mx-auto py-12 px-4">
    <h1 className="text-4xl font-bold mb-8 text-center">Select Your Mock Interview Role</h1>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {roles.map(role => (
        <RoleCard key={role.id} {...role} onSelect={onSelectRole} />
      ))}
    </div>
  </div>
);
