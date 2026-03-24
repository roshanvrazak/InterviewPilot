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
      <div className="surface-elevated rounded-2xl p-6 sm:p-8 text-center relative overflow-hidden animate-fade-in-up mb-6">
        <div className="absolute top-0 left-0 w-full h-[3px]" style={{ background: 'linear-gradient(90deg, var(--accent-primary), var(--accent-secondary))' }} aria-hidden="true" />

        <div className="text-[12px] font-semibold uppercase tracking-wider mb-6" style={{ color: 'var(--accent-primary)' }}>
          Performance Report
        </div>

        {/* Scores */}
        <div className="flex flex-col sm:flex-row justify-center items-center gap-8 sm:gap-10 mb-6">
          <div className="relative" role="img" aria-label={`Overall score: ${scorecard.overall_score} out of 10`}>
            <svg className="w-28 h-28 sm:w-36 sm:h-36 transform -rotate-90">
              <circle cx="50%" cy="50%" r="42%" strokeWidth="6" fill="transparent" style={{ stroke: 'var(--border-subtle)' }} />
              <circle cx="50%" cy="50%" r="42%" strokeWidth="6" fill="transparent"
                strokeDasharray={440} strokeDashoffset={440 - (440 * scorecard.overall_score) / 10}
                strokeLinecap="round" style={{ stroke: 'var(--accent-primary)', transition: 'stroke-dashoffset 1s ease-out' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl sm:text-4xl font-extrabold font-mono" style={{ color: 'var(--text-primary)' }}>{scorecard.overall_score}</span>
              <span className="text-[11px] font-semibold uppercase tracking-wider mt-0.5" style={{ color: 'var(--text-muted)' }}>/ 10</span>
            </div>
          </div>

          {scorecard.jd_match_score !== undefined && (
            <div className="relative" role="img" aria-label={`JD match score: ${scorecard.jd_match_score} percent`}>
              <svg className="w-28 h-28 sm:w-36 sm:h-36 transform -rotate-90">
                <circle cx="50%" cy="50%" r="42%" strokeWidth="6" fill="transparent" style={{ stroke: 'var(--border-subtle)' }} />
                <circle cx="50%" cy="50%" r="42%" strokeWidth="6" fill="transparent"
                  strokeDasharray={440} strokeDashoffset={440 - (440 * scorecard.jd_match_score) / 100}
                  strokeLinecap="round" style={{ stroke: 'var(--success)', transition: 'stroke-dashoffset 1s ease-out' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl sm:text-4xl font-extrabold font-mono" style={{ color: 'var(--text-primary)' }}>{scorecard.jd_match_score}%</span>
                <span className="text-[11px] font-semibold uppercase tracking-wider mt-0.5" style={{ color: 'var(--text-muted)' }}>JD Match</span>
              </div>
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="max-w-xl mx-auto">
          <p className="text-[14px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            {scorecard.summary}
          </p>
        </div>

        {/* Audio */}
        {audioUrl && (
          <div className="mt-6 p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-primary)' }}>
            <div className="text-[11px] font-semibold uppercase tracking-wider mb-3 flex items-center justify-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 14.868a1 1 0 01-1.414 0A6.488 6.488 0 0015 10a6.488 6.488 0 00-1.757-4.868 1 1 0 011.414-1.414A8.483 8.483 0 0117 10a8.483 8.483 0 01-2.343 4.868z" clipRule="evenodd" />
              </svg>
              Replay
            </div>
            <audio ref={audioRef} controls src={audioUrl} className="w-full h-10" aria-label="Interview audio recording" />
          </div>
        )}
      </div>

      {/* Categories */}
      {scorecard.categories && (
        <div className="animate-fade-in-up delay-1 mb-6">
          <h3 className="text-[15px] font-bold tracking-tight mb-3" style={{ color: 'var(--text-primary)' }}>
            Detailed Assessment
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Object.entries(scorecard.categories).map(([key, value]: [string, any], index) => (
              <div key={key} className="surface-elevated rounded-2xl p-4 sm:p-5 flex flex-col h-full">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="capitalize text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {key.replace('_', ' ')}
                  </h4>
                  <span className="text-lg font-bold font-mono" style={{ color: 'var(--accent-primary)' }}>
                    {value.score}
                  </span>
                </div>
                <p className="text-[13px] leading-relaxed mb-3 flex-grow" style={{ color: 'var(--text-secondary)' }}>
                  {value.feedback}
                </p>
                {scorecard.segments && scorecard.segments[index] && (
                  <button
                    onClick={() => playSegment(scorecard.segments[index].start, scorecard.segments[index].end)}
                    className="btn-secondary w-full text-[12px] py-2 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer min-h-[40px]"
                    aria-label={`Review your response for ${key.replace('_', ' ')}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                    </svg>
                    Replay
                  </button>
                )}
              </div>
            ))}
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
            <>
              <div className="w-4 h-4 rounded-full animate-spin" style={{ border: '2px solid var(--border-primary)', borderTopColor: 'var(--accent-primary)' }} aria-hidden="true" />
              Preparing...
            </>
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
