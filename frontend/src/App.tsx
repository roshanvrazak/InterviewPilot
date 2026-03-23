import React, { useState } from 'react';
import { HomePage } from './pages/HomePage';
import { InterviewPage } from './pages/InterviewPage';
import { ScorecardPage } from './pages/ScorecardPage';
import { AuthPage } from './pages/AuthPage';
import { AuthProvider, useAuth } from './context/AuthContext';

function MainApp() {
  const [page, setPage] = useState<'home' | 'interview' | 'scorecard' | 'auth' | 'dashboard'>('home');
  const [roleId, setRoleId] = useState<string>('');
  const [difficulty, setDifficulty] = useState<string>('Medium');
  const [jobDescription, setJobDescription] = useState<string>('');
  const [scorecard, setScorecard] = useState<any>(null);
  const { isAuthenticated, logout } = useAuth();

  const handleSelectRole = (id: string, diff: string, jd: string) => {
    setRoleId(id);
    setDifficulty(diff);
    setJobDescription(jd);
    setPage('interview');
  };

  const handleScorecard = (data: any) => {
    setScorecard(data);
    setPage('scorecard');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm p-4 flex justify-between items-center">
        <div className="text-xl font-bold cursor-pointer" onClick={() => setPage('home')}>
          AI Mock Interviewer
        </div>
        <div className="flex gap-4">
          <button onClick={() => setPage('home')} className="text-gray-600 hover:text-blue-600">Home</button>
          <button onClick={() => setPage('dashboard')} className="text-gray-600 hover:text-blue-600">Dashboard</button>
          {isAuthenticated ? (
            <button onClick={() => { logout(); setPage('home'); }} className="text-gray-600 hover:text-blue-600">Logout</button>
          ) : (
            <button onClick={() => setPage('auth')} className="text-gray-600 hover:text-blue-600">Login</button>
          )}
        </div>
      </nav>

      <main>
        {page === 'home' && <HomePage onSelectRole={handleSelectRole} />}
        {page === 'interview' && (
          <InterviewPage 
            roleId={roleId} 
            difficulty={difficulty} 
            jobDescription={jobDescription}
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
          <div className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Dashboard</h2>
            {isAuthenticated ? (
              <p>Welcome to your dashboard! Features coming soon.</p>
            ) : (
              <p>Please <button onClick={() => setPage('auth')} className="text-blue-500 underline">login</button> to view your dashboard.</p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

export default App;
