import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, Lock, Terminal } from 'lucide-react';

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
          setError('REGISTRATION_SUCCESSFUL. PLEASE_LOGIN.');
      }
    } catch (err: any) {
      setError(err.message.toUpperCase());
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100dvh-3.5rem)] px-4 font-mono bg-black relative">
       {/* Subtle grid background */}
       <div className="absolute inset-0 opacity-5 pointer-events-none" 
          style={{ backgroundImage: 'linear-gradient(var(--border-primary) 1px, transparent 1px), linear-gradient(90deg, var(--border-primary) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      <div className="border border-[var(--border-primary)] bg-black w-full max-w-md p-8 sm:p-12 relative animate-fade-in z-10">
        {/* Decorative corner accents */}
        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[var(--border-primary)]" />
        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-[var(--border-primary)]" />

        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 border border-[var(--border-primary)] bg-[var(--bg-secondary)] mb-6">
             {isLogin ? <Lock size={24} className="text-[var(--border-primary)]" /> : <Shield size={24} className="text-[var(--border-primary)]" />}
          </div>
          <h2 className="text-xl font-bold tracking-[0.2em] text-white uppercase mb-2">
            {isLogin ? 'Secure_Gateway' : 'Personnel_Enrollment'}
          </h2>
          <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest">
            {isLogin ? 'Authorization_Required' : 'Initialize_New_Credentials'}
          </p>
        </div>

        {error && (
          <div className="mb-8 border border-[var(--danger)] p-4 bg-black animate-fade-in">
             <p className="text-[10px] font-bold text-[var(--danger)] uppercase tracking-widest">! ALERT: {error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="auth-username" className="block text-[10px] font-bold mb-2 tracking-[0.2em] text-[var(--text-muted)] uppercase">
              [ IDENTIFIER / EMAIL ]
            </label>
            <input
              id="auth-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="USER@MAINFRAME.LOCAL"
              autoComplete="username"
              className="w-full bg-[var(--bg-secondary)] border border-[var(--border-subtle)] p-3 text-sm text-white focus:border-[var(--border-primary)] focus:bg-black outline-none transition-all placeholder:opacity-20"
              required
            />
          </div>

          <div>
            <label htmlFor="auth-password" className="block text-[10px] font-bold mb-2 tracking-[0.2em] text-[var(--text-muted)] uppercase">
              [ ACCESS_CODE ]
            </label>
            <input
              id="auth-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="********"
              autoComplete={isLogin ? 'current-password' : 'new-password'}
              className="w-full bg-[var(--bg-secondary)] border border-[var(--border-subtle)] p-3 text-sm text-white focus:border-[var(--border-primary)] focus:bg-black outline-none transition-all placeholder:opacity-20"
              required
            />
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-4 text-sm font-bold tracking-[0.3em] flex items-center justify-center gap-3 disabled:opacity-30 cursor-pointer"
            >
              {loading ? (
                <span>[ AUTHENTICATING... ]</span>
              ) : (
                <>
                  <Terminal size={16} />
                  <span>{isLogin ? '[ EXECUTE: SIGN_IN ]' : '[ EXECUTE: REGISTER ]'}</span>
                </>
              )}
            </button>
          </div>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] hover:text-[var(--border-primary)] transition-colors cursor-pointer"
            >
              {isLogin ? (
                <span>>> REGISTER_NEW_ACCOUNT</span>
              ) : (
                <span>>> RETURN_TO_LOGIN_GATEWAY</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AuthPage;
