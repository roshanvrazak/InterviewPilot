import React, { useRef, useMemo, useState } from 'react';

interface ScorecardPageProps {
  scorecard: any;
  onRestart: () => void;
}

export const ScorecardPage: React.FC<ScorecardPageProps> = ({ scorecard, onRestart }) => {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadPDF = async () => {
    setIsDownloading(true);
    try {
      const response = await fetch('http://localhost:8000/api/export-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scorecard })
      });
      
      if (!response.ok) throw new Error("Failed to generate PDF");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'mock_interview_scorecard.pdf';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Download error:", error);
      alert("Failed to download PDF.");
    } finally {
      setIsDownloading(false);
    }
  };

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
        <div className="flex justify-center items-end space-x-6 mb-4">
          <div className="text-center">
            <div className="text-6xl font-black text-gray-900">{scorecard.overall_score}/10</div>
            <div className="text-xs text-gray-400 font-bold uppercase mt-1">Overall</div>
          </div>
          {scorecard.jd_match_score !== undefined && (
            <div className="text-center border-l border-gray-100 pl-6">
              <div className="text-6xl font-black text-green-600">{scorecard.jd_match_score}%</div>
              <div className="text-xs text-gray-400 font-bold uppercase mt-1">JD Match</div>
            </div>
          )}
        </div>
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

      {(scorecard.gap_analysis || scorecard.tailored_tips) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {scorecard.gap_analysis && (
            <div className="bg-red-50 p-6 rounded-xl border border-red-100">
              <h3 className="text-red-800 font-bold mb-3 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                JD Gap Analysis
              </h3>
              <ul className="list-disc list-inside space-y-2 text-sm text-red-700">
                {scorecard.gap_analysis.map((gap: string, i: number) => (
                  <li key={i}>{gap}</li>
                ))}
              </ul>
            </div>
          )}

          {scorecard.tailored_tips && (
            <div className="bg-green-50 p-6 rounded-xl border border-green-100">
              <h3 className="text-green-800 font-bold mb-3 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.477.859h4.000z" />
                </svg>
                Tailored Tips
              </h3>
              <ul className="list-disc list-inside space-y-2 text-sm text-green-700">
                {scorecard.tailored_tips.map((tip: string, i: number) => (
                  <li key={i}>{tip}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4 mt-8">
        <button 
          onClick={handleDownloadPDF}
          disabled={isDownloading}
          className="flex-1 bg-green-600 hover:bg-green-700 text-white py-4 rounded-xl font-bold text-lg transition-colors shadow-lg shadow-green-200 disabled:opacity-50"
        >
          {isDownloading ? 'Generating PDF...' : 'Download PDF Report'}
        </button>
        <button 
          onClick={onRestart}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold text-lg transition-colors shadow-lg shadow-blue-200"
        >
          Try Another Mock Interview
        </button>
      </div>
    </div>
  );
};
