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
    if (scorecard?.audioBlob) return URL.createObjectURL(scorecard.audioBlob);
    return null;
  }, [scorecard?.audioBlob]);

  React.useEffect(() => {
    return () => { if (audioUrl) URL.revokeObjectURL(audioUrl); };
  }, [audioUrl]);

  if (!scorecard) return null;

  const playSegment = (start: number, end: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = start / 1000;
    audioRef.current.play();
    const duration = end - start;
    setTimeout(() => {
      if (audioRef.current && Math.abs(audioRef.current.currentTime * 1000 - end) < 500) audioRef.current.pause();
    }, duration);
  };

  return (
    <div className="max-w-3xl mx-auto py-8 sm:py-12 px-4 sm:px-6">
      {/* Score Header */}
      <div className="surface-elevated rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden animate-fade-in-up mb-8 border border-[var(--border-subtle)]">
        {/* Cinematic Aura Background */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden" aria-hidden="true">
          <div className="absolute w-[300px] h-[300px] rounded-full opacity-20 blur-[100px] animate-pulse" 
            style={{ background: 'var(--accent-primary)', top: '10%', left: '20%' }} />
          <div className="absolute w-[250px] h-[250px] rounded-full opacity-10 blur-[80px] animate-pulse" 
            style={{ background: 'var(--accent-secondary)', bottom: '10%', right: '20%', animationDelay: '1s' }} />
        </div>

        <div className="relative z-10">
          <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.3em] mb-10 opacity-70" style={{ color: 'var(--accent-primary)' }}>
            Performance Report
          </div>

          {/* Centered Large Radial Score */}
          <div className="flex flex-col items-center justify-center mb-10">
            <div className="relative inline-flex items-center justify-center group" role="img" aria-label={`Overall score: ${scorecard.overall_score} out of 10`}>
              {/* Outer Glow Ring */}
              <div className="absolute inset-0 rounded-full blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-700"
                style={{ background: 'var(--accent-primary)' }} />
              
              <svg className="w-48 h-48 sm:w-56 sm:h-56 transform -rotate-90 relative z-10">
                <circle cx="50%" cy="50%" r="45%" strokeWidth="1" fill="transparent" style={{ stroke: 'var(--border-subtle)' }} strokeDasharray="4 4" />
                <circle cx="50%" cy="50%" r="45%" strokeWidth="8" fill="transparent"
                  strokeDasharray={565} strokeDashoffset={565 - (565 * scorecard.overall_score) / 10}
                  strokeLinecap="round" style={{ stroke: 'var(--accent-primary)', transition: 'stroke-dashoffset 1.5s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
                />
              </svg>
              
              <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
                <span className="text-6xl sm:text-7xl font-black tracking-tighter" style={{ color: 'var(--text-primary)' }}>{scorecard.overall_score}</span>
                <span className="text-[12px] font-bold uppercase tracking-[0.2em] mt-1 opacity-50" style={{ color: 'var(--text-muted)' }}>Score</span>
              </div>
            </div>

            {/* Secondary Minimalist JD Match Gauge */}
            {scorecard.jd_match_score !== undefined && (
              <div className="mt-8 flex items-center gap-4 px-6 py-2 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-secondary)]/50 backdrop-blur-sm"
                   role="img" aria-label={`JD match score: ${scorecard.jd_match_score} percent`}>
                <div className="relative w-12 h-12 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="50%" cy="50%" r="40%" strokeWidth="2" fill="transparent" style={{ stroke: 'var(--border-subtle)' }} />
                    <circle cx="50%" cy="50%" r="40%" strokeWidth="2" fill="transparent"
                      strokeDasharray={100} strokeDashoffset={100 - (scorecard.jd_match_score)}
                      strokeLinecap="round" style={{ stroke: 'var(--success)', transition: 'stroke-dashoffset 1s ease-out' }}
                    />
                  </svg>
                  <span className="absolute text-[10px] font-bold" style={{ color: 'var(--text-primary)' }}>{scorecard.jd_match_score}%</span>
                </div>
                <div className="text-left">
                  <div className="text-[10px] font-bold uppercase tracking-wider opacity-50">JD Match</div>
                  <div className="text-[12px] font-semibold" style={{ color: 'var(--success)' }}>High Relevance</div>
                </div>
              </div>
            )}
          </div>

          {/* Summary */}
          <div className="max-w-xl mx-auto">
            <p className="text-[15px] leading-relaxed font-medium" style={{ color: 'var(--text-secondary)' }}>
              {scorecard.summary}
            </p>
          </div>
        </div>

        {/* Audio */}
        {audioUrl && (
          <div className="mt-10 p-5 rounded-2xl relative z-10 border border-[var(--border-subtle)] bg-[var(--bg-secondary)]/30 backdrop-blur-md">
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] mb-4 flex items-center justify-center gap-2 opacity-50">
              <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)] animate-pulse" />
              Recording Session
            </div>
            <audio ref={audioRef} controls src={audioUrl} className="w-full h-10 opacity-80 hover:opacity-100 transition-opacity" />
          </div>
        )}
      </div>

      {/* Categories */}
      {scorecard.categories && (
        <div className="animate-fade-in-up delay-1 mb-12">
          <div className="flex items-center justify-between mb-6 px-1">
            <h3 className="text-[12px] font-bold uppercase tracking-[0.25em] opacity-40" style={{ color: 'var(--text-primary)' }}>
              Evaluation Breakdown
            </h3>
            <div className="h-[1px] flex-grow mx-4 bg-[var(--border-primary)] opacity-20" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {Object.entries(scorecard.categories).map(([key, value]: [string, any], index) => {
              // More dynamic bento sizing logic for a 12-column grid
              const spanClass = index % 5 === 0 ? 'md:col-span-8' : 
                                index % 5 === 1 ? 'md:col-span-4' : 
                                index % 5 === 2 ? 'md:col-span-4' :
                                index % 5 === 3 ? 'md:col-span-4' :
                                'md:col-span-4';
              
              return (
                <div 
                  key={key} 
                  className={`${spanClass} bg-[var(--bg-elevated)] border border-[var(--border-primary)] rounded-[2rem] p-8 flex flex-col h-full bg-gradient-to-br from-[var(--bg-elevated)] via-[var(--bg-elevated)] to-[var(--bg-secondary)]/30 transition-all duration-500 hover:border-[var(--accent-primary)]/30 hover:shadow-[0_20px_40px_rgba(0,0,0,0.03)] group relative overflow-hidden`}
                >
                  <div className="flex justify-between items-start mb-6 relative z-10">
                    <div>
                      <h4 className="capitalize text-[15px] font-bold tracking-tight mb-1" style={{ color: 'var(--text-primary)' }}>
                        {key.replace('_', ' ')}
                      </h4>
                      <div className="h-1 w-6 rounded-full bg-gradient-to-r from-[var(--accent-primary)] to-transparent opacity-40 group-hover:w-10 transition-all duration-500" />
                    </div>
                    <div className="flex flex-col items-end">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black font-mono leading-none tracking-tighter" style={{ color: 'var(--accent-primary)' }}>
                          {value.score}
                        </span>
                        <span className="text-[10px] font-bold uppercase opacity-20">/ 10</span>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-[14px] leading-relaxed mb-8 flex-grow font-medium opacity-80" style={{ color: 'var(--text-secondary)' }}>
                    {value.feedback}
                  </p>
                  
                  {scorecard.segments && scorecard.segments[index] && (
                    <button
                      onClick={() => playSegment(scorecard.segments[index].start, scorecard.segments[index].end)}
                      className="mt-auto group/btn flex items-center gap-3 self-start py-2 px-1 rounded-full text-[11px] font-bold uppercase tracking-[0.15em] text-[var(--text-muted)] hover:text-[var(--accent-primary)] transition-all duration-300 cursor-pointer"
                      aria-label={`Replay your response for ${key.replace('_', ' ')}`}
                    >
                      <div className="w-8 h-8 rounded-full border border-[var(--border-primary)] flex items-center justify-center group-hover/btn:border-[var(--accent-primary)] group-hover/btn:bg-[var(--accent-surface)] transition-all duration-300">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 fill-current" viewBox="0 0 20 20">
                          <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                        </svg>
                      </div>
                      <span>Replay</span>
                    </button>
                  )}
                  
                  {/* Decorative background element */}
                  <div className="absolute -bottom-6 -right-6 w-24 h-24 rounded-full bg-[var(--accent-primary)]/5 blur-3xl group-hover:bg-[var(--accent-primary)]/10 transition-colors duration-500" />
                </div>
              );
            })}
          </div>
        </div>
      )}


      {/* Gap Analysis + Tips */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6 animate-fade-in-up delay-2">
        {scorecard.gap_analysis && (
          <div className="rounded-2xl p-5" style={{ backgroundColor: 'var(--danger-surface)', border: '1px solid var(--danger-surface)' }}>
            <h3 className="font-semibold mb-3 flex items-center gap-2 text-[13px]" style={{ color: 'var(--danger)' }}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Areas to Improve
            </h3>
            <ul className="space-y-2.5">
              {scorecard.gap_analysis.map((gap: string, i: number) => (
                <li key={i} className="flex gap-2.5 text-[13px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  <span className="mt-1.5 w-1 h-1 rounded-full flex-shrink-0" style={{ background: 'var(--danger)' }} aria-hidden="true" />
                  {gap}
                </li>
              ))}
            </ul>
          </div>
        )}

        {scorecard.tailored_tips && (
          <div className="rounded-2xl p-5" style={{ backgroundColor: 'var(--success-surface)', border: '1px solid var(--success-surface)' }}>
            <h3 className="font-semibold mb-3 flex items-center gap-2 text-[13px]" style={{ color: 'var(--success)' }}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.477.859h4.000z" />
              </svg>
              Tips
            </h3>
            <ul className="space-y-2.5">
              {scorecard.tailored_tips.map((tip: string, i: number) => (
                <li key={i} className="flex gap-2.5 text-[13px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  <span className="mt-1.5 w-1 h-1 rounded-full flex-shrink-0" style={{ background: 'var(--success)' }} aria-hidden="true" />
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 animate-fade-in-up delay-3">
        <button
          onClick={handleDownloadPDF}
          disabled={isDownloading}
          className="btn-secondary flex-1 py-3.5 rounded-xl text-[14px] flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
        >
          {isDownloading ? (
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                <div className="w-1 h-1 rounded-full bg-[var(--accent-primary)] animate-pulse" />
                <div className="w-1 h-1 rounded-full bg-[var(--accent-primary)] animate-pulse [animation-delay:0.2s]" />
                <div className="w-1 h-1 rounded-full bg-[var(--accent-primary)] animate-pulse [animation-delay:0.4s]" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-widest opacity-70">Exporting</span>
            </div>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download PDF
            </>
          )}
        </button>
        <button onClick={onRestart} className="btn-primary flex-1 py-3.5 rounded-xl text-[14px] flex items-center justify-center gap-2 cursor-pointer">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Try Again
        </button>
      </div>
    </div>
  );
};
