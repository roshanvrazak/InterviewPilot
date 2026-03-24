import React, { useState } from 'react';
import { HomePage } from './pages/HomePage';
import { InterviewPage } from './pages/InterviewPage';
import { MicCheckPage } from './pages/MicCheckPage';
import { ScorecardPage } from './pages/ScorecardPage';
import { AuthPage } from './pages/AuthPage';
import { DashboardPage } from './pages/DashboardPage';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';

function MainApp() {
  const [page, setPage] = useState<'home' | 'interview' | 'mic-check' | 'scorecard' | 'auth' | 'dashboard'>('home');
  const [roleId, setRoleId] = useState<string>('');
  const [difficulty, setDifficulty] = useState<string>('Medium');
  const [jobDescription, setJobDescription] = useState<string>('');
  const [selectedVoice, setSelectedVoice] = useState<string>('Kore');
  const [scorecard, setScorecard] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const handleSelectRole = (id: string, diff: string, jd: string) => {
    setRoleId(id);
    setDifficulty(diff);
    setJobDescription(jd);
    setPage('mic-check');
  };

  const handleStartInterview = () => setPage('interview');

  const handleScorecard = (data: any) => {
    setScorecard(data);
    setPage('scorecard');
  };

  const navigateTo = (p: typeof page) => {
    setPage(p);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-dvh" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      {/* Navigation */}
      <nav className="glass sticky top-0 z-50" style={{ borderBottom: '1px solid var(--border-primary)' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          {/* Logo */}
          <button
            onClick={() => navigateTo('home')}
            className="flex items-center gap-2.5 group cursor-pointer"
            aria-label="Go to home page"
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: 'var(--accent-primary)' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                <line x1="12" y1="19" x2="12" y2="23"/>
              </svg>
            </div>
            <span className="font-bold text-[15px] tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Voxel
            </span>
          </button>

          {/* Desktop Nav */}
          <div className="hidden sm:flex items-center gap-1">
            {[
              { key: 'home' as const, label: 'Home' },
              { key: 'dashboard' as const, label: 'Dashboard' },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => navigateTo(key)}
                className="px-3.5 py-1.5 rounded-lg text-[13px] font-medium transition-all cursor-pointer min-h-[36px] flex items-center"
                style={{
                  color: page === key ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  backgroundColor: page === key ? 'var(--accent-surface)' : 'transparent',
                }}
              >
                {label}
              </button>
            ))}

            {isAuthenticated ? (
              <button
                onClick={() => { logout(); navigateTo('home'); }}
                className="px-3.5 py-1.5 rounded-lg text-[13px] font-medium transition-all cursor-pointer min-h-[36px] flex items-center"
                style={{ color: 'var(--text-secondary)' }}
              >
                Logout
              </button>
            ) : (
              <button
                onClick={() => navigateTo('auth')}
                className="px-3.5 py-1.5 rounded-lg text-[13px] font-medium transition-all cursor-pointer min-h-[36px] flex items-center"
                style={{ color: 'var(--text-secondary)' }}
              >
                Login
              </button>
            )}

            <div className="w-px h-4 mx-1.5" style={{ backgroundColor: 'var(--border-primary)' }} />

            <button
              onClick={toggleTheme}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer"
              style={{ color: 'var(--text-muted)' }}
              aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
            >
              {theme === 'light' ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="5"/>
                  <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                  <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                </svg>
              )}
            </button>
          </div>

          {/* Mobile Controls */}
          <div className="flex sm:hidden items-center gap-1.5">
            <button
              onClick={toggleTheme}
              className="w-9 h-9 rounded-lg flex items-center justify-center cursor-pointer"
              style={{ color: 'var(--text-muted)' }}
              aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
            >
              {theme === 'light' ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="5"/>
                  <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                  <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                </svg>
              )}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="w-9 h-9 rounded-lg flex items-center justify-center cursor-pointer"
              style={{ color: 'var(--text-muted)' }}
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  <line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="17" x2="20" y2="17"/>
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="sm:hidden animate-fade-in" style={{ borderTop: '1px solid var(--border-primary)', backgroundColor: 'var(--bg-surface)' }}>
            <div className="px-3 py-2 space-y-0.5">
              {[
                { key: 'home' as const, label: 'Home' },
                { key: 'dashboard' as const, label: 'Dashboard' },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => navigateTo(key)}
                  className="w-full text-left px-3 py-2.5 rounded-lg text-[14px] font-medium cursor-pointer min-h-[44px]"
                  style={{
                    color: page === key ? 'var(--accent-primary)' : 'var(--text-secondary)',
                    backgroundColor: page === key ? 'var(--accent-surface)' : 'transparent',
                  }}
                >
                  {label}
                </button>
              ))}
              {isAuthenticated ? (
                <button
                  onClick={() => { logout(); navigateTo('home'); }}
                  className="w-full text-left px-3 py-2.5 rounded-lg text-[14px] font-medium cursor-pointer min-h-[44px]"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Logout
                </button>
              ) : (
                <button
                  onClick={() => navigateTo('auth')}
                  className="w-full text-left px-3 py-2.5 rounded-lg text-[14px] font-medium cursor-pointer min-h-[44px]"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Login
                </button>
              )}
            </div>
          </div>
        )}
      </nav>

      <main>
        {page === 'home' && <HomePage onSelectRole={handleSelectRole} selectedVoice={selectedVoice} setSelectedVoice={setSelectedVoice} />}
        {page === 'mic-check' && <MicCheckPage roleId={roleId} selectedVoice={selectedVoice} onStartInterview={handleStartInterview} onBack={() => setPage('home')} />}
        {page === 'interview' && <InterviewPage roleId={roleId} difficulty={difficulty} jobDescription={jobDescription} selectedVoice={selectedVoice} onScorecard={handleScorecard} />}
        {page === 'scorecard' && <ScorecardPage scorecard={scorecard} onRestart={() => setPage('home')} />}
        {page === 'auth' && <AuthPage onLoginSuccess={() => setPage('home')} />}
        {page === 'dashboard' && <DashboardPage onLoginPrompt={() => setPage('auth')} onGoToHome={() => setPage('home')} />}
      </main>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
