import React, { useState } from 'react';
import { RoleCard } from '../components/RoleCard';
import { JDInput } from '../components/JDInput';

const roles = [
  { id: 'software_engineer', name: 'Software Engineer', description: 'General technical interview focusing on coding and system design.', type: 'Mixed' },
  { id: 'frontend_developer', name: 'Frontend Developer', description: 'Interview focusing on React, CSS, and web performance.', type: 'Technical' },
  { id: 'product_manager', name: 'Product Manager', description: 'Interview focusing on product strategy and execution.', type: 'Behavioral' },
  { id: 'devops_engineer', name: 'DevOps Engineer', description: 'Interview focusing on infrastructure and automation.', type: 'Technical' }
];

const difficulties = ['Easy', 'Medium', 'Hard'];

interface HomePageProps {
  onSelectRole: (id: string, difficulty: string, jd: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onSelectRole }) => {
  const [difficulty, setDifficulty] = useState('Medium');
  const [jobDescription, setJobDescription] = useState('');

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <h1 className="text-4xl font-bold mb-8 text-center text-gray-900">AI Mock Interviewer</h1>
      
      <div className="mb-12 text-center">
        <p className="text-lg text-gray-600 mb-4">Choose your difficulty level:</p>
        <div className="inline-flex rounded-md shadow-sm" role="group">
          {difficulties.map((diff) => (
            <button
              key={diff}
              type="button"
              onClick={() => setDifficulty(diff)}
              className={`px-6 py-2 text-sm font-medium border ${
                difficulty === diff
                  ? 'bg-blue-600 text-white border-blue-600 z-10'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
              } ${diff === 'Easy' ? 'rounded-l-lg' : ''} ${
                diff === 'Hard' ? 'rounded-r-lg' : ''
              }`}
            >
              {diff}
            </button>
          ))}
        </div>
      </div>

      <JDInput onJDChange={setJobDescription} />

      <h2 className="text-2xl font-semibold mb-6 text-center text-gray-800">Select Your Role</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {roles.map(role => (
          <RoleCard 
            key={role.id} 
            {...role} 
            onSelect={(id) => onSelectRole(id, difficulty, jobDescription)} 
          />
        ))}
      </div>
    </div>
  );
};
