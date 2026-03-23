import React, { useRef, useMemo } from 'react';

interface ScorecardPageProps {
  scorecard: any;
  onRestart: () => void;
}

export const ScorecardPage: React.FC<ScorecardPageProps> = ({ scorecard, onRestart }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrl = useMemo(() => {
    if (scorecard?.audioBlob) {
      return URL.createObjectURL(scorecard.audioBlob);
    }
    return null;
  }, [scorecard?.audioBlob]);

  if (!scorecard) return null;

  const playSegment = (start: number, end: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = start / 1000;
    audioRef.current.play();
    const duration = end - start;
    setTimeout(() => {
      if (audioRef.current && Math.abs(audioRef.current.currentTime * 1000 - end) < 500) {
        audioRef.current.pause();
      }
    }, duration);
  };

  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-gray-100 text-center">
        <div className="text-sm font-bold text-blue-500 uppercase mb-2">Overall Performance</div>
        <div className="text-6xl font-black text-gray-900 mb-4">{scorecard.overall_score}/10</div>
        <p className="text-gray-600 leading-relaxed max-w-lg mx-auto mb-6">{scorecard.summary}</p>
        
        {audioUrl && (
          <div className="mt-6 p-4 bg-gray-50 rounded-xl">
            <h3 className="text-sm font-bold text-gray-700 uppercase mb-3">Full Interview Replay</h3>
            <audio ref={audioRef} controls src={audioUrl} className="w-full" />
          </div>
        )}
      </div>

      {scorecard.categories && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {Object.entries(scorecard.categories).map(([key, value]: [string, any], index) => (
            <div key={key} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-bold text-gray-800 capitalize">{key.replace('_', ' ')}</h3>
                  <span className="text-blue-600 font-bold">{value.score}/10</span>
                </div>
                <p className="text-sm text-gray-600 mb-4">{value.feedback}</p>
              </div>
              
              {scorecard.segments && scorecard.segments[index] && (
                <button
                  onClick={() => playSegment(scorecard.segments[index].start, scorecard.segments[index].end)}
                  className="mt-2 text-sm bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                  <span>Play My Answer</span>
                </button>
              )}
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
