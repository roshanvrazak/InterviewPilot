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

const voices = [
  { id: 'Kore', name: 'Kore', description: 'Professional & Youthful' },
  { id: 'Aoife', name: 'Aoife', description: 'Warm & Professional' },
  { id: 'Charli', name: 'Charli', description: 'Clear & Calm' },
  { id: 'Fenris', name: 'Fenris', description: 'Deep & Authoritative' }
];

interface HomePageProps {
  onSelectRole: (id: string, difficulty: string, jd: string) => void;
  selectedVoice: string;
  setSelectedVoice: (voice: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onSelectRole, selectedVoice, setSelectedVoice }) => {
  const [difficulty, setDifficulty] = useState('Medium');
  const [jobDescription, setJobDescription] = useState('');

  return (
    <div className="max-w-4xl mx-auto py-16 px-6">
      <div className="text-center mb-16">
        <h1 className="text-5xl font-extrabold mb-4 text-slate-900 dark:text-white tracking-tight">AI Mock Interviewer</h1>
        <p className="text-slate-500 dark:text-slate-400 text-lg max-w-2xl mx-auto">Prepare for your next career move with personalized, AI-driven mock interviews.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-16">
        <div className="bg-slate-50 dark:bg-slate-800/50 p-8 rounded-3xl border border-slate-100 dark:border-slate-700">
          <p className="text-sm font-semibold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
            Difficulty Level
          </p>
          <div className="grid grid-cols-3 gap-2 bg-slate-200/50 dark:bg-slate-900/50 p-1.5 rounded-2xl">
            {difficulties.map((diff) => (
              <button
                key={diff}
                type="button"
                onClick={() => setDifficulty(diff)}
                className={`py-2.5 text-sm font-bold rounded-xl transition-all ${
                  difficulty === diff
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                {diff}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/50 p-8 rounded-3xl border border-slate-100 dark:border-slate-700">
          <p className="text-sm font-semibold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
            Interviewer Voice
          </p>
          <div className="grid grid-cols-2 gap-3">
            {voices.map((voice) => (
              <button
                key={voice.id}
                type="button"
                onClick={() => setSelectedVoice(voice.id)}
                className={`px-4 py-3 text-left border rounded-2xl transition-all ${
                  selectedVoice === voice.id
                    ? 'bg-white dark:bg-slate-700 border-blue-500 dark:border-blue-400 shadow-md ring-1 ring-blue-500 dark:ring-blue-400'
                    : 'bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 hover:border-blue-200 dark:hover:border-blue-800'
                }`}
              >
                <div className={`font-bold text-sm ${selectedVoice === voice.id ? 'text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-slate-200'}`}>{voice.name}</div>
                <div className={`text-[10px] leading-tight ${selectedVoice === voice.id ? 'text-blue-500/70 dark:text-blue-300/70' : 'text-slate-400'}`}>
                  {voice.description}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <JDInput onJDChange={setJobDescription} />

      <div className="mt-16">
        <div className="flex items-center gap-4 mb-8">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Select Your Role</h2>
          <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {roles.map(role => (
            <RoleCard 
              key={role.id} 
              {...role} 
              onSelect={(id) => onSelectRole(id, difficulty, jobDescription)} 
            />
          ))}
        </div>
      </div>
    </div>
  );
};
