import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

interface AuthPageProps {
  onLoginSuccess: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onLoginSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    const body = isLogin
      ? new URLSearchParams({ username, password })
      : JSON.stringify({ email: username, password });

    const headers: Record<string, string> = {};
    if (!isLogin) {
        headers['Content-Type'] = 'application/json';
    } else {
        headers['Content-Type'] = 'application/x-www-form-urlencoded';
    }

    try {
      const response = await fetch(`http://localhost:8000${endpoint}`, {
        method: 'POST',
        headers,
        body,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Authentication failed');
      }

      const data = await response.json();
      if (isLogin) {
          login(data.access_token);
          onLoginSuccess();
      } else {
          setIsLogin(true);
          setError('Registration successful. Please login.');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100dvh-3.5rem)] px-4">
      <div className="surface-elevated w-full max-w-sm rounded-2xl p-6 sm:p-8 animate-fade-in-up">
        <div className="text-center mb-6 animate-fade-in-up delay-1">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            {isLogin ? 'Welcome back' : 'Create account'}
          </h2>
          <p className="mt-1.5 text-[13px]" style={{ color: 'var(--text-secondary)' }}>
            {isLogin ? 'Sign in to continue' : 'Get started with AI interview prep'}
          </p>
        </div>

        {error && (
          <div
            className="mb-5 px-3.5 py-2.5 rounded-xl text-[13px] font-medium animate-fade-in"
            style={{
              backgroundColor: error.includes('successful') ? 'var(--success-surface)' : 'var(--danger-surface)',
              color: error.includes('successful') ? 'var(--success)' : 'var(--danger)',
            }}
            role="alert"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="animate-fade-in-up delay-2">
            <label htmlFor="auth-username" className="block text-[12px] font-semibold mb-1.5 tracking-wide" style={{ color: 'var(--text-muted)' }}>
              EMAIL
            </label>
            <input
              id="auth-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="you@example.com"
              autoComplete="username"
              className="w-full px-3.5 py-2.5 rounded-xl outline-none transition-all text-[14px]"
              style={{ backgroundColor: 'var(--bg-secondary)', border: '1.5px solid var(--border-primary)', color: 'var(--text-primary)' }}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent-primary)'; e.currentTarget.style.boxShadow = '0 0 0 3px var(--accent-glow)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border-primary)'; e.currentTarget.style.boxShadow = 'none'; }}
              required
            />
          </div>

          <div className="animate-fade-in-up delay-3">
            <label htmlFor="auth-password" className="block text-[12px] font-semibold mb-1.5 tracking-wide" style={{ color: 'var(--text-muted)' }}>
              PASSWORD
            </label>
            <input
              id="auth-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete={isLogin ? 'current-password' : 'new-password'}
              className="w-full px-3.5 py-2.5 rounded-xl outline-none transition-all text-[14px]"
              style={{ backgroundColor: 'var(--bg-secondary)', border: '1.5px solid var(--border-primary)', color: 'var(--text-primary)' }}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent-primary)'; e.currentTarget.style.boxShadow = '0 0 0 3px var(--accent-glow)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border-primary)'; e.currentTarget.style.boxShadow = 'none'; }}
              required
            />
          </div>

          <div className="animate-fade-in-up delay-4 pt-1">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 text-[14px] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading && (
                <div className="w-4 h-4 rounded-full animate-spin" style={{ border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white' }} aria-hidden="true" />
              )}
              {isLogin ? 'Sign in' : 'Create account'}
            </button>
          </div>

          <div className="text-center animate-fade-in-up delay-5">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-[13px] font-medium transition-colors cursor-pointer min-h-[44px] inline-flex items-center"
              style={{ color: 'var(--text-muted)' }}
            >
              {isLogin ? (
                <>No account? <span className="ml-1 font-semibold" style={{ color: 'var(--accent-primary)' }}>Sign up</span></>
              ) : (
                <>Have an account? <span className="ml-1 font-semibold" style={{ color: 'var(--accent-primary)' }}>Sign in</span></>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AuthPage;
