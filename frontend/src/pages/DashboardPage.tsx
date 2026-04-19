import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { Clock, History as HistoryIcon } from 'lucide-react';

interface Analytics {
  total_interviews: number;
  average_score: number;
}

interface HistoryItem {
  id: string;
  role: string;
  type: string;
  score: number;
  started_at: string;
}

export const DashboardPage: React.FC<{ onLoginPrompt: () => void, onGoToHome: () => void }> = ({ onLoginPrompt, onGoToHome }) => {
  const { isAuthenticated, token } = useAuth();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const groupedHistory = useMemo(() => {
    return history.reduce((acc, item) => {
      const date = new Date(item.started_at);
      const monthYear = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      if (!acc[monthYear]) acc[monthYear] = [];
      acc[monthYear].push(item);
      return acc;
    }, {} as Record<string, HistoryItem[]>);
  }, [history]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const fetchDashboardData = async () => {
      setLoading(true);
      setError('');
      try {
        const [analyticsRes, historyRes] = await Promise.all([
          fetch('http://localhost:8000/api/dashboard/analytics', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('http://localhost:8000/api/dashboard/history', { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        if (!analyticsRes.ok || !historyRes.ok) throw new Error('Failed to fetch dashboard data.');
        const analyticsData = await analyticsRes.json();
        const historyData = await historyRes.json();
        setAnalytics(analyticsData);
        setHistory(historyData);
      } catch (err: any) {
        setError(err.message || 'An error occurred.');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [isAuthenticated, token]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'var(--success)';
    if (score >= 60) return 'var(--warning)';
    return 'var(--danger)';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'var(--success-surface)';
    if (score >= 60) return 'var(--warning-surface)';
    return 'var(--danger-surface)';
  };

  const getLetterGrade = (score: number) => {
    if (score >= 80) return 'A';
    if (score >= 60) return 'B';
    return 'C';
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-[60dvh] flex items-center justify-center px-4 animate-fade-in-up">
        <div className="surface-elevated rounded-2xl p-8 text-center max-w-sm w-full">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--accent-surface)' }} aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <h2 className="text-xl font-bold tracking-tight mb-2" style={{ color: 'var(--text-primary)' }}>Dashboard</h2>
          <p className="mb-6 text-[13px]" style={{ color: 'var(--text-secondary)' }}>Sign in to view your interview history and analytics.</p>
          <button onClick={onLoginPrompt} className="btn-primary px-6 py-2.5 text-[14px] cursor-pointer">Sign in</button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 md:p-8 animate-fade-in-up">
      <header className="mb-8 sm:mb-12">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)]">Dashboard</h2>
        <p className="mt-2 text-[14px] text-[var(--text-secondary)]">Track your performance and interview history in real-time.</p>
      </header>

      {error && (
        <div className="rounded-xl p-3.5 mb-5" style={{ background: 'var(--danger-surface)', border: '1px solid var(--danger)' }} role="alert">
          <p className="font-medium text-[13px]" style={{ color: 'var(--danger)' }}>{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 animate-fade-in">
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-2 border-[var(--accent-primary)] opacity-20" />
            <div className="absolute inset-0 w-12 h-12 rounded-full border-2 border-[var(--accent-primary)] animate-ping opacity-40" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-[var(--accent-primary)] animate-pulse" />
            </div>
          </div>
          <p className="mt-8 text-[11px] font-bold uppercase tracking-[0.3em] text-[var(--text-muted)] animate-pulse">Syncing Data</p>
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10 sm:mb-12">
            <div className="p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-primary)] relative overflow-hidden group animate-fade-in-up delay-1">
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-[var(--accent-primary)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-muted)]">Total Interviews</span>
              <p className="text-4xl font-bold mt-2 text-[var(--text-primary)]">{analytics?.total_interviews || 0}</p>
            </div>
            <div className="p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-primary)] relative overflow-hidden group animate-fade-in-up delay-2">
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-[var(--accent-primary)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-muted)]">Average Score</span>
              <p className="text-4xl font-bold mt-2 text-[var(--text-primary)]">
                {analytics?.average_score != null ? Number(analytics.average_score).toFixed(1) : '0.0'}
                <span className="text-lg font-medium ml-1 text-[var(--text-muted)]">/100</span>
              </p>
            </div>
          </div>

          {/* History */}
          <div className="animate-fade-in-up delay-3">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--text-muted)]">Interview History</h3>
                <div className="h-0.5 w-4 bg-[var(--accent-primary)] mt-1 rounded-full" />
              </div>
              <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-[var(--accent-surface)] text-[var(--accent-primary)] border border-[var(--accent-primary)] border-opacity-10">
                {history.length} session{history.length !== 1 ? 's' : ''}
              </span>
            </div>

            {history.length === 0 ? (
              <div className="relative overflow-hidden rounded-[2.5rem] p-12 sm:p-20 text-center border border-[var(--border-primary)] bg-[var(--bg-surface)] shadow-2xl animate-fade-in-up">
                <div className="nebula-bg opacity-40" />
                <div className="nebula-blob nebula-blob-1 opacity-20" />
                <div className="nebula-blob nebula-blob-2 opacity-20" />
                
                <div className="relative z-10">
                  <div className="w-16 h-16 rounded-2xl bg-[var(--accent-surface)] border border-[var(--accent-glow)] flex items-center justify-center mx-auto mb-8 animate-float shadow-lg shadow-orange-500/10">
                    <HistoryIcon size={32} className="text-[var(--accent-primary)]" />
                  </div>
                  <h3 className="text-2xl font-bold tracking-tight mb-3 text-[var(--text-primary)]">Your Journey Awaits</h3>
                  <p className="text-[15px] mb-10 text-[var(--text-secondary)] max-w-sm mx-auto leading-relaxed">
                    You haven't completed any interviews yet. Start your first session to unlock personalized analytics and performance tracking.
                  </p>
                  <button onClick={onGoToHome} className="btn-primary text-[15px] px-8 py-3.5 shadow-xl shadow-orange-500/20 cursor-pointer">
                    Start First Interview
                  </button>
                </div>
              </div>
            ) : (
              <div className="relative pl-8 sm:pl-10 ml-2">
                {/* Vertical Timeline Line */}
                <div className="absolute left-0 top-2 bottom-0 w-px bg-[var(--border-primary)]" />
                
                {Object.entries(groupedHistory).map(([monthYear, items]) => (
                  <div key={monthYear} className="mb-12 last:mb-0">
                    {/* Date Sub-header */}
                    <h4 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--text-muted)] mb-6 flex items-center">
                      <span className="bg-[var(--bg-primary)] pr-4 relative z-10">{monthYear}</span>
                    </h4>
                    
                    <div className="space-y-6">
                      {items.map((item) => (
                        <div key={item.id} className="relative group/item">
                          {/* Timeline Marker */}
                          <div className="absolute -left-[32px] sm:-left-[40px] top-6 w-2 h-2 rounded-full border border-[var(--border-primary)] bg-[var(--bg-primary)] z-10 group-hover/item:border-[var(--accent-primary)] group-hover/item:scale-125 transition-all duration-300" />
                          
                          <div
                            className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-primary)] hover:border-[var(--accent-glow)] hover:bg-[var(--bg-surface-hover)] hover:shadow-medium transition-all duration-300 backdrop-blur-sm group/card"
                          >
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1.5">
                                  <h4 className="font-bold text-[15px] text-[var(--text-primary)]">{item.role}</h4>
                                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[var(--accent-surface)] text-[var(--accent-primary)] border border-[var(--accent-primary)] border-opacity-10">
                                    {item.type}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-[12px] text-[var(--text-muted)]">
                                  <Clock size={12} className="text-[var(--text-muted)]" />
                                  {new Date(item.started_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="text-right hidden sm:block">
                                  <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-1">Score</div>
                                  <div className="text-xl font-mono font-bold" style={{ color: getScoreColor(item.score) }}>
                                    {item.score}%
                                  </div>
                                </div>
                                <div
                                  className="w-12 h-12 rounded-xl flex items-center justify-center font-mono font-bold text-lg transition-transform group-hover/card:scale-110"
                                  style={{ border: `1px solid ${getScoreColor(item.score)}`, color: getScoreColor(item.score), background: getScoreBg(item.score) }}
                                >
                                  {getLetterGrade(item.score)}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
