// frontend/src/pages/ScorecardPage.tsx
import React from 'react';

interface ScorecardPageProps {
  scorecard: any;
  onRestart: () => void;
}

export const ScorecardPage: React.FC<ScorecardPageProps> = ({ scorecard, onRestart }) => {
  if (!scorecard) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4 text-red-600">Error: No scorecard data</h1>
        <button onClick={onRestart} className="bg-blue-500 text-white px-4 py-2 rounded">
          Back to Interview
        </button>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Interview Scorecard</h1>
      <div className="bg-white shadow p-6 rounded-lg">
        <div className="text-4xl font-bold text-blue-600 mb-2">
          {scorecard.overall_score}/100
        </div>
        <p className="text-gray-700 mb-6">{scorecard.summary}</p>
        
        <h2 className="text-xl font-semibold mb-3">Category Breakdown</h2>
        <div className="space-y-4 mb-6">
          {Object.entries(scorecard.category_scores).map(([category, score]: [string, any]) => (
            <div key={category}>
              <div className="flex justify-between mb-1">
                <span className="capitalize">{category}</span>
                <span>{score}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full" 
                  style={{ width: `${score}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
        <button onClick={onRestart} className="bg-blue-500 text-white px-4 py-2 rounded">
          Start New Interview
        </button>
      </div>
    </div>
  );
};
