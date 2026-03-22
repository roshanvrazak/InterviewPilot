import React, { useState } from 'react';
import { InterviewPage } from './pages/InterviewPage';
import { ScorecardPage } from './pages/ScorecardPage';

function App() {
  const [page, setPage] = useState<'interview' | 'scorecard'>('interview');
  const [scorecard, setScorecard] = useState<any>(null);

  const handleScorecard = (data: any) => {
    setScorecard(data);
    setPage('scorecard');
  };

  return (
    <div className="App">
      {page === 'interview' ? (
        <InterviewPage onScorecard={handleScorecard} />
      ) : (
        <ScorecardPage scorecard={scorecard} onRestart={() => setPage('interview')} />
      )}
    </div>
  );
}

export default App;
