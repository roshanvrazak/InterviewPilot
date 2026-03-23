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

export const DashboardPage: React.FC<{ onLoginPrompt: () => void }> = ({ onLoginPrompt }) => {
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
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Dashboard</h2>
        <p>
          Please{' '}
          <button onClick={onLoginPrompt} className="text-blue-500 underline">
            login
          </button>{' '}
          to view your dashboard.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-8">
      <h2 className="text-3xl font-bold text-gray-800 mb-8">Your Dashboard</h2>

      {error && <div className="bg-red-50 text-red-600 p-4 rounded mb-6">{error}</div>}
      
      {loading ? (
        <div className="text-center text-gray-600 py-8">Loading dashboard data...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-600 mb-2">Total Interviews</h3>
              <p className="text-4xl font-bold text-blue-600">{analytics?.total_interviews || 0}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-600 mb-2">Average Score</h3>
              <p className="text-4xl font-bold text-green-600">
                {analytics?.average_score != null ? Number(analytics.average_score).toFixed(1) : 'N/A'}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <h3 className="text-xl font-bold text-gray-800 p-6 border-b border-gray-100">Interview History</h3>
            {history.length === 0 ? (
              <p className="p-6 text-gray-500 text-center">No interview history found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-gray-600 border-b border-gray-100">
                      <th className="p-4 font-semibold">Date</th>
                      <th className="p-4 font-semibold">Role</th>
                      <th className="p-4 font-semibold">Type</th>
                      <th className="p-4 font-semibold">Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((item) => (
                      <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="p-4 text-gray-700">
                          {new Date(item.started_at).toLocaleString()}
                        </td>
                        <td className="p-4 text-gray-800 font-medium">{item.role}</td>
                        <td className="p-4 text-gray-600 capitalize">{item.type}</td>
                        <td className="p-4">
                          <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                            item.score >= 80 ? 'bg-green-100 text-green-700' : 
                            item.score >= 60 ? 'bg-yellow-100 text-yellow-700' : 
                            'bg-red-100 text-red-700'
                          }`}>
                            {item.score}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
