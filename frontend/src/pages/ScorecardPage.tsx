// frontend/src/pages/ScorecardPage.tsx
import React from 'react';

interface ScorecardPageProps {
  scorecard: any;
  onRestart: () => void;
}

export const ScorecardPage: React.FC<ScorecardPageProps> = ({ scorecard, onRestart }) => {
  if (!scorecard) return null;

  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-gray-100 text-center">
        <div className="text-sm font-bold text-blue-500 uppercase mb-2">Overall Performance</div>
        <div className="text-6xl font-black text-gray-900 mb-4">{scorecard.overall_score}/10</div>
        <p className="text-gray-600 leading-relaxed max-w-lg mx-auto">{scorecard.summary}</p>
      </div>

      {scorecard.categories && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {Object.entries(scorecard.categories).map(([key, value]: [string, any]) => (
            <div key={key} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-gray-800 capitalize">{key.replace('_', ' ')}</h3>
                <span className="text-blue-600 font-bold">{value.score}/10</span>
              </div>
              <p className="text-sm text-gray-600">{value.feedback}</p>
            </div>
          ))}
        </div>
      )}

      <button 
        onClick={onRestart}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold text-lg transition-colors shadow-lg shadow-blue-200"
      >
        Try Another Mock Interview
      </button>
    </div>
  );
};
