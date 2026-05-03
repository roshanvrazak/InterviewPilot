import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Terminal, Database, Clock, Activity } from 'lucide-react';

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

  const getLetterGrade = (score: number) => {
    if (score >= 80) return 'A';
    if (score >= 60) return 'B';
    return 'C';
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-[60dvh] flex items-center justify-center px-4 font-mono">
        <div className="border border-[var(--border-primary)] bg-black p-12 text-center max-w-md w-full relative">
          <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-[var(--border-primary)]" />
          <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-[var(--border-primary)]" />
          <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-[var(--border-primary)]" />
          <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-[var(--border-primary)]" />
          
          <Terminal size={32} className="mx-auto mb-6 text-[var(--border-primary)]" />
          <h2 className="text-xl font-bold tracking-tight mb-4 uppercase">Access_Denied</h2>
          <p className="mb-8 text-xs text-[var(--text-secondary)] leading-relaxed uppercase tracking-widest">Authentication required to access encrypted session data.</p>
          <button onClick={onLoginPrompt} className="btn-primary w-full py-3 cursor-pointer">
            [ LOGIN_TO_SYSTEM ]
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 md:p-8 font-mono">
      <header className="mb-12 flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[var(--border-subtle)] pb-6">
        <div>
           <div className="flex items-center gap-2 text-[var(--border-primary)] mb-1">
              <Database size={18} />
              <span className="text-[10px] font-bold uppercase tracking-[0.3em]">System Command Center</span>
           </div>
           <h2 className="text-3xl font-bold tracking-tighter text-white uppercase">Personnel_Dashboard</h2>
        </div>
        <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest text-right">
           LAST_SYNC: {new Date().toLocaleTimeString()}
        </div>
      </header>

      {error && (
        <div className="border border-[var(--danger)] bg-black p-4 mb-8">
          <p className="text-xs font-bold text-[var(--danger)] uppercase tracking-widest">! CRITICAL_ERROR: {error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24">
          <div className="w-12 h-12 border border-[var(--border-primary)] border-t-transparent animate-spin mb-6" />
          <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-[var(--border-primary)] animate-pulse">Syncing_Mainframe_Data...</p>
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            <div className="border border-[var(--border-subtle)] bg-black p-6 group hover:border-[var(--border-primary)] transition-colors relative overflow-hidden">
              <div className="absolute bottom-0 left-0 w-full h-[1px] bg-[var(--border-primary)] opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-muted)]">Interviews_Completed</span>
              <p className="text-5xl font-bold mt-3 text-white">{analytics?.total_interviews || 0}</p>
            </div>
            
            <div className="border border-[var(--border-subtle)] bg-black p-6 group hover:border-[var(--border-primary)] transition-colors relative overflow-hidden">
              <div className="absolute bottom-0 left-0 w-full h-[1px] bg-[var(--border-primary)] opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-muted)]">Aggregated_Performance</span>
              <p className="text-5xl font-bold mt-3 text-white">
                {analytics?.average_score != null ? Number(analytics.average_score).toFixed(1) : '0.0'}
                <span className="text-lg opacity-30 ml-2">/100</span>
              </p>
            </div>

            <div className="hidden lg:block border border-[var(--border-subtle)] bg-black p-6 group hover:border-[var(--border-primary)] transition-colors relative overflow-hidden">
               <div className="absolute bottom-0 left-0 w-full h-[1px] bg-[var(--border-primary)] opacity-0 group-hover:opacity-100 transition-opacity" />
               <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-muted)]">System_Status</span>
               <div className="mt-4 flex items-center gap-2">
                  <div className="w-2 h-2 bg-[var(--success)] animate-pulse" />
                  <span className="text-xl font-bold text-[var(--success)]">OPTIMAL</span>
               </div>
            </div>
          </div>

          {/* History / Process Log */}
          <div>
            <div className="flex items-center justify-between mb-6 border-b border-[var(--border-subtle)] pb-2">
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-[var(--border-primary)]" />
                <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--text-primary)]">Process_Log_History</h3>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 border border-[var(--border-primary)] text-[var(--border-primary)]">
                {history.length} RECORDS_FOUND
              </span>
            </div>

            {history.length === 0 ? (
              <div className="border border-[var(--border-subtle)] border-dashed py-24 text-center">
                <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-[var(--text-muted)] mb-8">No Session Data Found In Local Cache</p>
                <button onClick={onGoToHome} className="btn-primary px-10 py-3 cursor-pointer">
                  [ EXECUTE: INITIAL_SESSION ]
                </button>
              </div>
            ) : (
              <div className="space-y-0 border border-[var(--border-subtle)]">
                {history.map((item, idx) => (
                  <div
                    key={item.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 border-b border-[var(--border-subtle)] last:border-0 hover:bg-[var(--border-primary)] group transition-all cursor-default"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-4 mb-2">
                        <span className="text-[10px] font-bold text-[var(--text-muted)] group-hover:text-black">0{idx + 1}</span>
                        <h4 className="font-bold text-[14px] text-white group-hover:text-black uppercase tracking-tight">{item.role}</h4>
                        <span className="text-[10px] font-bold px-2 py-0.5 border border-white/20 text-[var(--text-muted)] group-hover:text-black group-hover:border-black/20 uppercase tracking-widest">{item.type}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-[var(--text-muted)] group-hover:text-black/70">
                        <Activity size={10} />
                        <span>TIMESTAMP: {new Date(item.started_at).toLocaleString().toUpperCase()}</span>
                      </div>
                    </div>
                    
                    <div className="mt-4 sm:mt-0 flex items-center gap-8">
                       <div className="flex flex-col items-end">
                          <span className="text-[9px] font-bold text-[var(--text-muted)] group-hover:text-black uppercase tracking-widest">Score_Index</span>
                          <span className="text-xl font-bold font-mono" style={{ color: getScoreColor(item.score) }}>
                            {item.score}%
                          </span>
                       </div>
                       <div
                        className="w-10 h-10 border flex items-center justify-center font-bold text-lg"
                        style={{ borderColor: getScoreColor(item.score), color: getScoreColor(item.score) }}
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
      
      {/* Footer System Info */}
      <footer className="mt-20 pt-8 border-t border-[var(--border-subtle)] flex justify-between text-[9px] text-[var(--text-muted)] uppercase tracking-[0.4em]">
         <span>System: Mainframe_Dashboard</span>
         <span>Version: 1.0.4-LTS</span>
      </footer>
    </div>
  );
};
