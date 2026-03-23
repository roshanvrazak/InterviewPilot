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
          fetch('http://localhost:8000/api/dashboard/analytics', {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch('http://localhost:8000/api/dashboard/history', {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (!analyticsRes.ok || !historyRes.ok) {
          throw new Error('Failed to fetch dashboard data.');
        }

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

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
          <span className="text-3xl">👤</span>
        </div>
        <h2 className="text-2xl font-bold mb-4 text-slate-900 dark:text-slate-100">Your Dashboard</h2>
        <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-md">
          Sign in to view your interview history, analytics, and track your progress over time.
        </p>
        <button 
          onClick={onLoginPrompt} 
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/20 transition-all active:scale-95"
        >
          Login to Continue
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-8">
      <header className="mb-12">
        <h2 className="text-4xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">Dashboard</h2>
        <p className="text-slate-600 dark:text-slate-400 mt-2 text-lg">Track your performance and interview history.</p>
      </header>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl mb-8 border border-red-100 dark:border-red-900/30">
          <div className="flex items-center gap-3">
            <span>⚠️</span>
            <p className="font-medium">{error}</p>
          </div>
        </div>
      )}
      
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-12 h-12 border-4 border-slate-200 dark:border-slate-800 border-t-blue-600 rounded-full animate-spin mb-4"></div>
          <p className="text-slate-500 dark:text-slate-400 font-medium tracking-wide">Gathering your metrics...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <div className="group relative bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800 rounded-2xl shadow-sm hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 p-8 border border-slate-200 dark:border-slate-800">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Interviews</h3>
                <span className="text-2xl">📊</span>
              </div>
              <p className="text-6xl font-black text-slate-900 dark:text-white transition-transform group-hover:scale-105 origin-left duration-300">
                {analytics?.total_interviews || 0}
              </p>
              <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-600/10 group-hover:bg-blue-600/30 transition-colors rounded-b-2xl"></div>
            </div>
            
            <div className="group relative bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800 rounded-2xl shadow-sm hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-300 p-8 border border-slate-200 dark:border-slate-800">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Average Score</h3>
                <span className="text-2xl">🎯</span>
              </div>
              <p className="text-6xl font-black text-slate-900 dark:text-white transition-transform group-hover:scale-105 origin-left duration-300">
                {analytics?.average_score != null ? Number(analytics.average_score).toFixed(1) : '0.0'}
                <span className="text-2xl font-bold text-slate-400 dark:text-slate-600 ml-1">/100</span>
              </p>
              <div className="absolute bottom-0 left-0 w-full h-1 bg-emerald-600/10 group-hover:bg-emerald-600/30 transition-colors rounded-b-2xl"></div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Interview History</h3>
              <span className="text-slate-500 dark:text-slate-400 text-sm font-medium">{history.length} Session{history.length !== 1 ? 's' : ''}</span>
            </div>

            {history.length === 0 ? (
              <div className="bg-white dark:bg-slate-900/50 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-16 text-center">
                <div className="text-6xl mb-6 opacity-20">📭</div>
                <h4 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">No interviews yet</h4>
                <p className="text-slate-500 dark:text-slate-400 max-w-xs mx-auto mb-8">
                  Start your first mock interview to see your progress and metrics here.
                </p>
                <button 
                  onClick={onGoToHome}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold rounded-xl hover:opacity-90 transition-opacity"
                >
                  <span>Start Interview</span>
                  <span>🚀</span>
                </button>
              </div>
            ) : (
              <div className="grid gap-4">
                {history.map((item) => (
                  <div 
                    key={item.id} 
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-blue-500/50 dark:hover:border-blue-500/50 transition-all group"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {item.role}
                        </h4>
                        <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-md">
                          {item.type}
                        </span>
                      </div>
                      <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                        {new Date(item.started_at).toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    
                    <div className="mt-4 sm:mt-0 flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter mb-0.5">Score</p>
                        <p className={`text-2xl font-black ${
                          item.score >= 80 ? 'text-emerald-500' : 
                          item.score >= 60 ? 'text-amber-500' : 
                          'text-rose-500'
                        }`}>
                          {item.score}<span className="text-xs opacity-50 ml-0.5">%</span>
                        </p>
                      </div>
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold border-4 ${
                        item.score >= 80 ? 'border-emerald-500/20 text-emerald-500 bg-emerald-500/5' : 
                        item.score >= 60 ? 'border-amber-500/20 text-amber-500 bg-amber-500/5' : 
                        'border-rose-500/20 text-rose-500 bg-rose-500/5'
                      }`}>
                        {item.score >= 80 ? 'A' : item.score >= 60 ? 'B' : 'C'}
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
