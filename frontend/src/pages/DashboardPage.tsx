import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

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
      <header className="mb-6 sm:mb-8">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>Dashboard</h2>
        <p className="mt-1 text-[13px]" style={{ color: 'var(--text-secondary)' }}>Track your performance and history.</p>
      </header>

      {error && (
        <div className="rounded-xl p-3.5 mb-5" style={{ background: 'var(--danger-surface)', border: '1px solid var(--danger)' }} role="alert">
          <p className="font-medium text-[13px]" style={{ color: 'var(--danger)' }}>{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-10 h-10 rounded-full animate-spin mb-3" style={{ border: '3px solid var(--border-primary)', borderTopColor: 'var(--accent-primary)' }} role="status" aria-label="Loading" />
          <p className="text-[13px] font-medium" style={{ color: 'var(--text-muted)' }}>Loading...</p>
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6 sm:mb-8">
            <div className="surface-elevated rounded-2xl p-5 animate-fade-in-up delay-1">
              <span className="text-[12px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Interviews</span>
              <p className="font-mono text-3xl sm:text-4xl font-bold mt-1" style={{ color: 'var(--text-primary)' }}>{analytics?.total_interviews || 0}</p>
            </div>
            <div className="surface-elevated rounded-2xl p-5 animate-fade-in-up delay-2">
              <span className="text-[12px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Avg Score</span>
              <p className="font-mono text-3xl sm:text-4xl font-bold mt-1" style={{ color: 'var(--text-primary)' }}>
                {analytics?.average_score != null ? Number(analytics.average_score).toFixed(1) : '0.0'}
                <span className="text-base font-medium ml-0.5" style={{ color: 'var(--text-muted)' }}>/100</span>
              </p>
            </div>
          </div>

          {/* History */}
          <div className="animate-fade-in-up delay-3">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[15px] font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>History</h3>
              <span className="badge" style={{ color: 'var(--accent-primary)', background: 'var(--accent-surface)' }}>
                {history.length} session{history.length !== 1 ? 's' : ''}
              </span>
            </div>

            {history.length === 0 ? (
              <div className="rounded-2xl p-10 sm:p-14 text-center" style={{ border: '2px dashed var(--border-primary)' }}>
                <p className="text-[15px] font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>No interviews yet</p>
                <p className="text-[13px] mb-5" style={{ color: 'var(--text-muted)' }}>Start your first mock interview to see your progress.</p>
                <button onClick={onGoToHome} className="btn-primary text-[14px] px-5 py-2.5 cursor-pointer">Start Interview</button>
              </div>
            ) : (
              <div className="space-y-2">
                {history.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl transition-all duration-150"
                    style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent-primary)'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--card-border)'; }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h4 className="font-semibold text-[14px]" style={{ color: 'var(--text-primary)' }}>{item.role}</h4>
                        <span className="badge" style={{ background: 'var(--accent-surface)', color: 'var(--accent-primary)' }}>{item.type}</span>
                      </div>
                      <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
                        {new Date(item.started_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div className="mt-2 sm:mt-0 flex items-center gap-3">
                      <span className="font-mono text-[15px] font-bold" style={{ color: getScoreColor(item.score) }}>
                        {item.score}%
                      </span>
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center font-mono font-bold text-[12px]"
                        style={{ border: `2px solid ${getScoreColor(item.score)}`, color: getScoreColor(item.score), background: getScoreBg(item.score) }}
                        aria-label={`Grade: ${getLetterGrade(item.score)}`}
                      >
                        {getLetterGrade(item.score)}
                      </div>
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
