import React, { useState } from 'react';
import { RoleCard } from '../components/RoleCard';
import { JDInput } from '../components/JDInput';

const roles = [
  { id: 'software_engineer', name: 'Software Engineer', description: 'General technical interview focusing on coding and system design.', type: 'Mixed', icon: '01' },
  { id: 'frontend_developer', name: 'Frontend Developer', description: 'Interview focusing on React, CSS, and web performance.', type: 'Technical', icon: '02' },
  { id: 'product_manager', name: 'Product Manager', description: 'Interview focusing on product strategy and execution.', type: 'Behavioral', icon: '03' },
  { id: 'devops_engineer', name: 'DevOps Engineer', description: 'Interview focusing on infrastructure and automation.', type: 'Technical', icon: '04' }
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
    <div>
      {/* Hero */}
      <div className="pt-16 sm:pt-20 md:pt-28 pb-12 sm:pb-16 px-4 sm:px-6 max-w-3xl mx-auto text-center">
        <div className="animate-fade-in-up">
          <span
            className="badge mb-5"
            style={{ backgroundColor: 'var(--accent-surface)', color: 'var(--accent-primary)' }}
          >
            AI-Powered Interview Prep
          </span>
        </div>

        <h1
          className="text-[2rem] sm:text-[2.75rem] md:text-[3.25rem] font-extrabold tracking-tight leading-[1.1] mb-4 animate-fade-in-up delay-1"
          style={{ color: 'var(--text-primary)' }}
        >
          Ace your next{' '}
          <span className="text-gradient">interview</span>
        </h1>

        <p
          className="text-[15px] sm:text-base max-w-lg mx-auto animate-fade-in-up delay-2 leading-relaxed"
          style={{ color: 'var(--text-secondary)' }}
        >
          Practice with an AI interviewer that adapts to your role, difficulty, and job description.
        </p>
      </div>

      {/* Config Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 animate-fade-in-up delay-3">
          {/* Difficulty */}
          <div className="surface-elevated rounded-2xl p-5">
            <label className="text-[13px] font-semibold mb-3 block tracking-wide" style={{ color: 'var(--text-muted)' }}>
              DIFFICULTY
            </label>
            <div className="flex rounded-xl p-1 gap-1" style={{ backgroundColor: 'var(--bg-secondary)' }}>
              {difficulties.map((diff) => (
                <button
                  key={diff}
                  onClick={() => setDifficulty(diff)}
                  className="flex-1 py-2 text-[13px] font-semibold rounded-lg transition-all cursor-pointer min-h-[40px]"
                  style={
                    difficulty === diff
                      ? { backgroundColor: 'var(--accent-primary)', color: '#fff', boxShadow: '0 2px 8px var(--accent-glow)' }
                      : { color: 'var(--text-muted)', backgroundColor: 'transparent' }
                  }
                  aria-pressed={difficulty === diff}
                >
                  {diff}
                </button>
              ))}
            </div>
          </div>

          {/* Voice */}
          <div className="surface-elevated rounded-2xl p-5">
            <label className="text-[13px] font-semibold mb-3 block tracking-wide" style={{ color: 'var(--text-muted)' }}>
              INTERVIEWER VOICE
            </label>
            <div className="grid grid-cols-2 gap-2">
              {voices.map((voice) => (
                <button
                  key={voice.id}
                  onClick={() => setSelectedVoice(voice.id)}
                  className="text-left rounded-xl px-3 py-2.5 transition-all cursor-pointer min-h-[44px]"
                  style={
                    selectedVoice === voice.id
                      ? { backgroundColor: 'var(--accent-surface)', border: '1.5px solid var(--accent-primary)' }
                      : { backgroundColor: 'var(--bg-secondary)', border: '1.5px solid transparent' }
                  }
                  aria-pressed={selectedVoice === voice.id}
                >
                  <div className="font-semibold text-[13px]" style={{ color: selectedVoice === voice.id ? 'var(--accent-primary)' : 'var(--text-primary)' }}>
                    {voice.name}
                  </div>
                  <div className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    {voice.description}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* JD Input */}
        <div className="mb-10 animate-fade-in-up delay-4">
          <JDInput onJDChange={setJobDescription} />
        </div>

        {/* Role Selection */}
        <div className="mb-16 sm:mb-24 animate-fade-in-up delay-5">
          <div className="flex items-center gap-4 mb-5">
            <h2 className="text-lg sm:text-xl font-bold tracking-tight whitespace-nowrap" style={{ color: 'var(--text-primary)' }}>
              Choose a role
            </h2>
            <div className="h-px flex-1" style={{ backgroundColor: 'var(--border-primary)' }} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {roles.map(role => (
              <RoleCard key={role.id} {...role} onSelect={(id) => onSelectRole(id, difficulty, jobDescription)} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
