import React, { useState } from 'react';
import { RoleCard } from '../components/RoleCard';
import { JDInput } from '../components/JDInput';
import { Terminal, Settings, Shield } from 'lucide-react';

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
    <div className="font-mono bg-black min-h-screen">
      {/* Hero / System Header */}
      <div className="pt-20 pb-16 px-4 sm:px-6 max-w-4xl mx-auto text-center border-b border-[var(--border-subtle)] relative overflow-hidden">
        {/* Subtle grid in hero */}
        <div className="absolute inset-0 opacity-10 pointer-events-none" 
          style={{ backgroundImage: 'linear-gradient(var(--border-primary) 1px, transparent 1px), linear-gradient(90deg, var(--border-primary) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

        <div className="relative z-10 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[var(--accent-surface)] border border-[var(--border-primary)] mb-8">
            <Shield size={14} className="text-[var(--border-primary)]" />
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--border-primary)]">Security_Cleared: PERSONNEL_01</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-bold tracking-tighter leading-none mb-6 text-white uppercase">
            Initialize_VoiceAI <span className="text-[var(--border-primary)]">v2.0</span>
          </h1>

          <p className="text-[13px] sm:text-sm max-w-xl mx-auto leading-relaxed text-[var(--text-secondary)] uppercase tracking-[0.1em]">
            Practice high-fidelity acoustic interactions with an adaptive AI core trained for technical and behavioral evaluation.
          </p>
        </div>
      </div>

      {/* Config Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-12">
        <div className="flex items-center gap-3 text-[var(--border-primary)] mb-8">
           <Settings size={18} />
           <h2 className="text-[11px] font-bold uppercase tracking-[0.3em]">Module_Configuration</h2>
           <div className="flex-grow h-[1px] bg-[var(--border-subtle)]" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {/* Difficulty */}
          <div className="border border-[var(--border-subtle)] bg-black p-6 relative">
            <label className="text-[10px] font-bold mb-4 block tracking-[0.2em] text-[var(--text-muted)] uppercase">
              [ SET_DIFFICULTY_LEVEL ]
            </label>
            <div className="flex border border-[var(--border-subtle)] p-1 gap-1 bg-[var(--bg-secondary)]">
              {difficulties.map((diff) => (
                <button
                  key={diff}
                  onClick={() => setDifficulty(diff)}
                  className={`flex-1 py-2 text-[11px] font-bold transition-all cursor-pointer uppercase tracking-widest ${
                    difficulty === diff
                      ? 'bg-[var(--border-primary)] text-black'
                      : 'text-[var(--text-muted)] hover:text-white'
                  }`}
                  aria-pressed={difficulty === diff}
                >
                  {diff}
                </button>
              ))}
            </div>
            {/* Corner accent */}
            <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-[var(--border-primary)]" />
          </div>

          {/* Voice */}
          <div className="border border-[var(--border-subtle)] bg-black p-6 relative">
            <label className="text-[10px] font-bold mb-4 block tracking-[0.2em] text-[var(--text-muted)] uppercase">
              [ SELECT_ACOUSTIC_PROFILE ]
            </label>
            <div className="grid grid-cols-2 gap-2">
              {voices.map((voice) => (
                <button
                  key={voice.id}
                  onClick={() => setSelectedVoice(voice.id)}
                  className={`text-left p-3 border transition-all cursor-pointer ${
                    selectedVoice === voice.id
                      ? 'border-[var(--border-primary)] bg-[var(--accent-surface)]'
                      : 'border-[var(--border-subtle)] bg-[var(--bg-secondary)] hover:border-[var(--text-muted)]'
                  }`}
                  aria-pressed={selectedVoice === voice.id}
                >
                  <div className={`font-bold text-[12px] uppercase ${selectedVoice === voice.id ? 'text-[var(--border-primary)]' : 'text-white'}`}>
                    {voice.name}
                  </div>
                  <div className="text-[9px] mt-1 text-[var(--text-muted)] uppercase">
                    {voice.description}
                  </div>
                </button>
              ))}
            </div>
            {/* Corner accent */}
            <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-[var(--border-primary)]" />
          </div>
        </div>

        {/* JD Input */}
        <div className="mb-16 border-b border-[var(--border-subtle)] pb-16">
          <JDInput onJDChange={setJobDescription} />
        </div>

        {/* Role Selection */}
        <div className="mb-24">
          <div className="flex items-center gap-4 mb-8">
            <Terminal size={18} className="text-[var(--border-primary)]" />
            <h2 className="text-[11px] font-bold uppercase tracking-[0.3em] text-white">
              Execute_Role_Module
            </h2>
            <div className="h-[1px] flex-1 bg-[var(--border-subtle)]" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {roles.map(role => (
              <RoleCard key={role.id} {...role} onSelect={(id) => onSelectRole(id, difficulty, jobDescription)} />
            ))}
          </div>
        </div>
      </div>
      
      {/* Page Footer Readout */}
      <footer className="p-8 border-t border-[var(--border-subtle)] flex justify-between text-[10px] text-[var(--text-muted)] uppercase tracking-[0.4em]">
         <span>System_State: IDLE</span>
         <span>Security_Protocol: ENABLED</span>
         <span>Latency: 24ms</span>
      </footer>
    </div>
  );
};
