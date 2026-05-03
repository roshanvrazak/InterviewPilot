import React, { useRef, useMemo, useState } from 'react';
import { Terminal, Download, RotateCcw, ShieldCheck, AlertTriangle, Info } from 'lucide-react';

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
      a.download = 'performance_diagnostic_report.pdf';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Download error:", error);
      alert("Failed to download diagnostic report.");
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

  const renderTechnicalBar = (value: number, max: number, color: string) => {
    const segments = 20;
    const filled = Math.round((value / max) * segments);
    return (
      <div className="flex gap-1 h-3 mt-2">
        {Array.from({ length: segments }).map((_, i) => (
          <div 
            key={i} 
            className={`flex-1 ${i < filled ? '' : 'opacity-10'}`} 
            style={{ backgroundColor: i < filled ? color : 'var(--border-primary)' }} 
          />
        ))}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 font-mono">
      {/* Report Header */}
      <div className="border border-[var(--border-primary)] bg-black p-8 sm:p-12 relative overflow-hidden mb-8">
        <div className="flex items-center gap-3 text-[var(--border-primary)] mb-8">
          <Terminal size={20} />
          <h1 className="text-sm font-bold uppercase tracking-[0.4em]">Diagnostic_Performance_Report</h1>
          <div className="flex-grow h-[1px] bg-[var(--border-subtle)]" />
          <span className="text-[10px] opacity-50">REF_ID: {Math.random().toString(16).slice(2, 10).toUpperCase()}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-10">
           {/* Aggregated Score */}
           <div>
              <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Aggregated_Score_Index</span>
              <div className="flex items-baseline gap-4 mt-2">
                 <span className="text-7xl font-bold text-white tracking-tighter">{scorecard.overall_score}</span>
                 <span className="text-xl text-[var(--text-muted)]">/ 10.0</span>
              </div>
              {renderTechnicalBar(scorecard.overall_score, 10, 'var(--accent-primary)')}
           </div>

           {/* JD Match Score */}
           {scorecard.jd_match_score !== undefined && (
             <div>
                <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">JD_Requirement_Match</span>
                <div className="flex items-baseline gap-4 mt-2">
                   <span className="text-7xl font-bold text-[var(--success)] tracking-tighter">{scorecard.jd_match_score}%</span>
                </div>
                {renderTechnicalBar(scorecard.jd_match_score, 100, 'var(--success)')}
             </div>
           )}
        </div>

        <div className="border-t border-[var(--border-subtle)] pt-8">
          <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-3 block">Executive_Summary</span>
          <p className="text-sm leading-relaxed text-white border-l-2 border-[var(--border-primary)] pl-6 py-2">
            {scorecard.summary}
          </p>
        </div>

        {/* Audio Interface */}
        {audioUrl && (
          <div className="mt-10 p-6 border border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
            <div className="flex items-center gap-2 mb-4 text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
              <ShieldCheck size={14} className="text-[var(--border-primary)]" />
              Audio_Verification_Stream
            </div>
            <audio ref={audioRef} controls src={audioUrl} className="w-full h-8 opacity-60" />
          </div>
        )}
      </div>

      {/* Category Diagnostics */}
      {scorecard.categories && (
        <div className="mb-12">
          <h3 className="text-[11px] font-bold uppercase tracking-[0.25em] mb-6 flex items-center gap-4">
            <Info size={14} className="text-[var(--border-primary)]" />
            Evaluation_Matrix
          </h3>
          <div className="space-y-4">
            {Object.entries(scorecard.categories).map(([key, value]: [string, any], index) => (
              <div key={key} className="border border-[var(--border-subtle)] bg-black p-6 group hover:border-[var(--border-primary)] transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                  <div className="flex items-center gap-4">
                    <span className="text-[10px] text-[var(--text-muted)]">0{index + 1}</span>
                    <h4 className="capitalize text-sm font-bold text-white tracking-widest">{key.replace('_', ' ')}</h4>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                       <span className="text-xl font-bold text-[var(--accent-primary)]">{value.score}</span>
                       <span className="text-[10px] text-[var(--text-muted)] ml-1">/ 10</span>
                    </div>
                    {scorecard.segments && scorecard.segments[index] && (
                      <button
                        onClick={() => playSegment(scorecard.segments[index].start, scorecard.segments[index].end)}
                        className="px-3 py-1 border border-[var(--border-primary)] text-[10px] font-bold uppercase tracking-widest text-[var(--border-primary)] hover:bg-[var(--border-primary)] hover:text-black transition-all cursor-pointer"
                      >
                        [ PLAY_SEGMENT ]
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
                  {value.feedback}
                </p>
                <div className="mt-4 opacity-30">
                   {renderTechnicalBar(value.score, 10, 'var(--accent-primary)')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Improvement & Tips */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        {scorecard.gap_analysis && (
          <div className="border border-[var(--danger)] bg-black p-6">
            <h3 className="font-bold mb-6 flex items-center gap-3 text-[11px] text-[var(--danger)] uppercase tracking-widest">
              <AlertTriangle size={16} />
              Areas_To_Improve
            </h3>
            <ul className="space-y-4">
              {scorecard.gap_analysis.map((gap: string, i: number) => (
                <li key={i} className="flex gap-4 text-xs leading-relaxed text-[var(--text-secondary)]">
                  <span className="text-[var(--danger)] shrink-0 mt-0.5">!</span>
                  {gap}
                </li>
              ))}
            </ul>
          </div>
        )}

        {scorecard.tailored_tips && (
          <div className="border border-[var(--success)] bg-black p-6">
            <h3 className="font-bold mb-6 flex items-center gap-3 text-[11px] text-[var(--success)] uppercase tracking-widest">
              <ShieldCheck size={16} />
              Recommended_Optimizations
            </h3>
            <ul className="space-y-4">
              {scorecard.tailored_tips.map((tip: string, i: number) => (
                <li key={i} className="flex gap-4 text-xs leading-relaxed text-[var(--text-secondary)]">
                  <span className="text-[var(--success)] shrink-0 mt-0.5">+</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Global Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          onClick={handleDownloadPDF}
          disabled={isDownloading}
          className="flex items-center justify-center gap-3 py-4 border border-[var(--border-primary)] text-sm font-bold uppercase tracking-[0.2em] text-[var(--border-primary)] hover:bg-[var(--border-primary)] hover:text-black disabled:opacity-50 transition-all cursor-pointer"
        >
          {isDownloading ? (
             <span>[ ENCRYPTING_EXPORT... ]</span>
          ) : (
            <>
              <Download size={18} />
              <span>[ EXPORT_DIAGNOSTICS_PDF ]</span>
            </>
          )}
        </button>
        <button 
           onClick={onRestart} 
           className="flex items-center justify-center gap-3 py-4 bg-[var(--border-primary)] text-black text-sm font-bold uppercase tracking-[0.2em] hover:bg-white transition-all cursor-pointer"
        >
          <RotateCcw size={18} />
          <span>[ INITIALIZE_NEW_SESSION ]</span>
        </button>
      </div>
    </div>
  );
};
