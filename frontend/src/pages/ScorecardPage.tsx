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

  React.useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

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
    <div className="max-w-4xl mx-auto py-12 px-6 transition-colors duration-300">
      {/* Header & Overall Score */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl p-10 mb-10 border border-slate-100 dark:border-slate-800 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500"></div>
        
        <div className="text-xs font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-[0.2em] mb-8">Performance Analysis</div>
        
        <div className="flex flex-col md:flex-row justify-center items-center gap-12 mb-10">
          <div className="relative group">
            <svg className="w-40 h-40 transform -rotate-90">
              <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-100 dark:text-slate-800" />
              <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="8" fill="transparent" 
                strokeDasharray={440} 
                strokeDashoffset={440 - (440 * scorecard.overall_score) / 10} 
                strokeLinecap="round"
                className="text-indigo-600 dark:text-indigo-500 transition-all duration-1000 ease-out" 
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-5xl font-black text-slate-900 dark:text-white">{scorecard.overall_score}</span>
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Overall / 10</span>
            </div>
          </div>

          {scorecard.jd_match_score !== undefined && (
            <div className="relative group">
              <svg className="w-40 h-40 transform -rotate-90">
                <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-100 dark:text-slate-800" />
                <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="8" fill="transparent" 
                  strokeDasharray={440} 
                  strokeDashoffset={440 - (440 * scorecard.jd_match_score) / 100} 
                  strokeLinecap="round"
                  className="text-emerald-500 dark:text-emerald-400 transition-all duration-1000 ease-out" 
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-5xl font-black text-slate-900 dark:text-white">{scorecard.jd_match_score}%</span>
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">JD Match</span>
              </div>
            </div>
          )}
        </div>

        <div className="max-w-2xl mx-auto">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">Executive Summary</h2>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed italic">" {scorecard.summary} "</p>
        </div>
        
        {audioUrl && (
          <div className="mt-10 p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700/50">
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4 flex items-center justify-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 14.868a1 1 0 01-1.414 0A6.488 6.488 0 0015 10a6.488 6.488 0 00-1.757-4.868 1 1 0 011.414-1.414A8.483 8.483 0 0117 10a8.483 8.483 0 01-2.343 4.868zM11.828 12.04a1 1 0 01-1.414 0A2.485 2.485 0 0011 10c0-.69-.28-1.314-.728-1.768a1 1 0 111.414-1.414A4.482 4.482 0 0113 10c0 1.242-.503 2.367-1.172 2.04z" clipRule="evenodd" />
              </svg>
              Interview Replay
            </h3>
            <audio ref={audioRef} controls src={audioUrl} className="w-full h-10" />
          </div>
        )}
      </div>

      {/* Categories Breakdown */}
      <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-6 flex items-center gap-2">
        <span className="w-8 h-8 flex items-center justify-center bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        </span>
        Detailed Assessment
      </h3>
      
      {scorecard.categories && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {Object.entries(scorecard.categories).map(([key, value]: [string, any], index) => (
            <div key={key} className="group bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col h-full">
              <div className="flex justify-between items-start mb-4">
                <h4 className="font-bold text-slate-800 dark:text-slate-100 capitalize text-lg">{key.replace('_', ' ')}</h4>
                <div className="flex flex-col items-end">
                  <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{value.score}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Score</span>
                </div>
              </div>
              
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-8 flex-grow">
                {value.feedback}
              </p>
              
              {scorecard.segments && scorecard.segments[index] && (
                <button
                  onClick={() => playSegment(scorecard.segments[index].start, scorecard.segments[index].end)}
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 text-slate-600 dark:text-slate-300 font-bold py-3 px-4 rounded-xl transition-all flex items-center justify-center space-x-2 border border-slate-100 dark:border-slate-700 group-hover:border-indigo-500"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                  <span>REVIEW THIS RESPONSE</span>
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Analysis Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        {scorecard.gap_analysis && (
          <div className="bg-rose-50/50 dark:bg-rose-900/10 p-8 rounded-3xl border border-rose-100 dark:border-rose-900/20">
            <h3 className="text-rose-800 dark:text-rose-400 font-bold mb-6 flex items-center gap-3">
              <span className="p-2 bg-rose-100 dark:bg-rose-900/30 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </span>
              Improvement Areas
            </h3>
            <ul className="space-y-4">
              {scorecard.gap_analysis.map((gap: string, i: number) => (
                <li key={i} className="flex gap-3 text-sm text-rose-700 dark:text-rose-300/80 leading-relaxed">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-rose-400 flex-shrink-0"></span>
                  {gap}
                </li>
              ))}
            </ul>
          </div>
        )}

        {scorecard.tailored_tips && (
          <div className="bg-emerald-50/50 dark:bg-emerald-900/10 p-8 rounded-3xl border border-emerald-100 dark:border-emerald-900/20">
            <h3 className="text-emerald-800 dark:text-emerald-400 font-bold mb-6 flex items-center gap-3">
              <span className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.477.859h4.000z" />
                </svg>
              </span>
              Actionable Tips
            </h3>
            <ul className="space-y-4">
              {scorecard.tailored_tips.map((tip: string, i: number) => (
                <li key={i} className="flex gap-3 text-sm text-emerald-700 dark:text-emerald-300/80 leading-relaxed">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0"></span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-6 mt-12">
        <button 
          onClick={handleDownloadPDF}
          disabled={isDownloading}
          className="flex-1 bg-white dark:bg-slate-900 text-slate-800 dark:text-white border-2 border-slate-200 dark:border-slate-800 py-5 rounded-2xl font-bold text-lg transition-all hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center gap-3 shadow-sm disabled:opacity-50"
        >
          {isDownloading ? (
            'Preparing PDF...'
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download Report
            </>
          )}
        </button>
        <button 
          onClick={onRestart}
          className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-5 rounded-2xl font-bold text-lg transition-all shadow-xl shadow-indigo-200 dark:shadow-none flex items-center justify-center gap-3"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.586L15 4.414V19l-7-7H4v5a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6" />
          </svg>
          Try Another Round
        </button>
      </div>
    </div>
  );
};
