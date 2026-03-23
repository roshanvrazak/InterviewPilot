import React, { useState } from 'react';
import { HomePage } from './pages/HomePage';
import { InterviewPage } from './pages/InterviewPage';
import { MicCheckPage } from './pages/MicCheckPage';
import { ScorecardPage } from './pages/ScorecardPage';
import { AuthPage } from './pages/AuthPage';
import { DashboardPage } from './pages/DashboardPage';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';

function MainApp() {
  const [page, setPage] = useState<'home' | 'interview' | 'mic-check' | 'scorecard' | 'auth' | 'dashboard'>('home');
  const [roleId, setRoleId] = useState<string>('');
  const [difficulty, setDifficulty] = useState<string>('Medium');
  const [jobDescription, setJobDescription] = useState<string>('');
  const [selectedVoice, setSelectedVoice] = useState<string>('Kore');
  const [scorecard, setScorecard] = useState<any>(null);
  const { isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const handleSelectRole = (id: string, diff: string, jd: string) => {
    setRoleId(id);
    setDifficulty(diff);
    setJobDescription(jd);
    setPage('mic-check');
  };

  const handleStartInterview = () => {
    setPage('interview');
  };

  const handleScorecard = (data: any) => {
    setScorecard(data);
    setPage('scorecard');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      <nav className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 flex justify-between items-center">
        <div className="text-xl font-bold cursor-pointer" onClick={() => setPage('home')}>
          AI Mock Interviewer
        </div>
        <div className="flex items-center gap-6">
          <div className="flex gap-4">
            <button onClick={() => setPage('home')} className="text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400">Home</button>
            <button onClick={() => setPage('dashboard')} className="text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400">Dashboard</button>
            {isAuthenticated ? (
              <button onClick={() => { logout(); setPage('home'); }} className="text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400">Logout</button>
            ) : (
              <button onClick={() => setPage('auth')} className="text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400">Login</button>
            )}
          </div>
          <button 
            onClick={toggleTheme} 
            className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
        </div>
      </nav>

      <main>
        {page === 'home' && (
          <HomePage 
            onSelectRole={handleSelectRole} 
            selectedVoice={selectedVoice} 
            setSelectedVoice={setSelectedVoice} 
          />
        )}
        {page === 'mic-check' && (
          <MicCheckPage
            roleId={roleId}
            selectedVoice={selectedVoice}
            onStartInterview={handleStartInterview}
            onBack={() => setPage('home')}
          />
        )}
        {page === 'interview' && (
          <InterviewPage 
            roleId={roleId} 
            difficulty={difficulty} 
            jobDescription={jobDescription}
            selectedVoice={selectedVoice}
            onScorecard={handleScorecard} 
          />
        )}
        {page === 'scorecard' && (
          <ScorecardPage 
            scorecard={scorecard} 
            onRestart={() => setPage('home')} 
          />
        )}
        {page === 'auth' && (
          <AuthPage onLoginSuccess={() => setPage('home')} />
        )}
        {page === 'dashboard' && (
          <DashboardPage 
            onLoginPrompt={() => setPage('auth')} 
            onGoToHome={() => setPage('home')}
          />
        )}
      </main>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
