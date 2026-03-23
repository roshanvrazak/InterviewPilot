import React, { useState } from 'react';
import { HomePage } from './pages/HomePage';
import { InterviewPage } from './pages/InterviewPage';
import { ScorecardPage } from './pages/ScorecardPage';

function App() {
  const [page, setPage] = useState<'home' | 'interview' | 'scorecard'>('home');
  const [roleId, setRoleId] = useState<string>('');
  const [difficulty, setDifficulty] = useState<string>('Medium');
  const [scorecard, setScorecard] = useState<any>(null);

  const handleSelectRole = (id: string, diff: string) => {
    setRoleId(id);
    setDifficulty(diff);
    setPage('interview');
  };

  const handleScorecard = (data: any) => {
    setScorecard(data);
    setPage('scorecard');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {page === 'home' && <HomePage onSelectRole={handleSelectRole} />}
      {page === 'interview' && (
        <InterviewPage 
          roleId={roleId} 
          difficulty={difficulty} 
          onScorecard={handleScorecard} 
        />
      )}
      {page === 'scorecard' && (
        <ScorecardPage 
          scorecard={scorecard} 
          onRestart={() => setPage('home')} 
        />
      )}
    </div>
  );
}

export default App;
