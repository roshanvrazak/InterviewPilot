import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { Terminal, Cpu, Activity } from 'lucide-react';
import { useWebSocket } from '../hooks/useWebSocket';
import { useAudioCapture } from '../hooks/useAudioCapture';
import { useAudioPlayback } from '../hooks/useAudioPlayback';
import { useMediaRecorder } from '../hooks/useMediaRecorder';
import { AudioVisualizer, VisualizerState } from '../components/AudioVisualizer';
import { ControlDock } from '../components/ControlDock';
import { TranscriptDrawer } from '../components/TranscriptDrawer';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

interface InterviewPageProps {
  roleId: string;
  difficulty: string;
  jobDescription: string;
  onScorecard: (data: any) => void;
  selectedVoice: string;
}

export const InterviewPage: React.FC<InterviewPageProps> = ({ roleId, difficulty, jobDescription, onScorecard, selectedVoice }) => {
  const { token } = useAuth();
  const { theme } = useTheme();
  const [transcripts, setTranscripts] = useState<any[]>([]);
  const [status, setStatus] = useState<'idle' | 'connecting' | 'active' | 'ending'>('idle');
  const [isMuted, setIsMuted] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  
  const { init: initPlayback, playChunk, stop: stopPlayback, stopAll, analyser: playbackAnalyser } = useAudioPlayback();
  const { start: startRecording, stop: stopRecording, audioBlob } = useMediaRecorder();

  const [segments, setSegments] = useState<{start: number, end: number}[]>([]);
  const interviewStartTimeRef = useRef<number>(0);
  const currentSegmentRef = useRef<{start: number} | null>(null);
  const scorecardRef = useRef<any>(null);
  const [hasReportedScorecard, setHasReportedScorecard] = useState(false);
  
  // Track window size for responsive visualizer
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const visualizerSize = useMemo(() => {
    if (windowWidth < 640) return 280;
    if (windowWidth < 1024) return 340;
    return 400;
  }, [windowWidth]);

  const onAudio = useCallback((data: ArrayBuffer) => { playChunk(data); }, [playChunk]);

  const onJson = useCallback((msg: any) => {
    if (msg.type === 'transcript') {
      setStatus('active');
      setTranscripts(prev => {
        if (prev.length > 0 && prev[prev.length - 1].speaker === msg.speaker) {
          const last = prev[prev.length - 1];
          const newText = last.text.endsWith(' ') || msg.text.startsWith(' ') ? last.text + msg.text : last.text + " " + msg.text;
          return [...prev.slice(0, -1), { ...last, text: newText }];
        }
        const now = performance.now() - interviewStartTimeRef.current;
        if (currentSegmentRef.current) {
          const start = currentSegmentRef.current.start;
          setSegments(s => [...s, { start, end: now }]);
        }
        currentSegmentRef.current = { start: now };
        return [...prev, { ...msg, timestamp: Date.now() }];
      });
    } else if (msg.type === 'history') {
      setTranscripts(msg.history);
      setStatus('active');
    } else if (msg.type === 'session_id') {
      setStatus('active');
    } else if (msg.type === 'scorecard') {
      scorecardRef.current = msg.data;
    }
  }, [setStatus]);

  useEffect(() => {
    if (audioBlob && scorecardRef.current && !hasReportedScorecard) {
      setHasReportedScorecard(true);
      onScorecard({ ...scorecardRef.current, audioBlob, segments });
    }
  }, [audioBlob, segments, onScorecard, hasReportedScorecard]);

  const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws/interview';
  const { connect, send, connected, disconnect } = useWebSocket(onAudio, onJson);
  
  const { start: startCapture, stop: stopCapture, analyser: captureAnalyser, stream } = useAudioCapture((audioData) => {
    if (!isMuted) send(audioData);
  });

  const toggleMute = () => setIsMuted(!isMuted);

  const handleFinishAnswer = () => {
    stopAll();
    send({ type: 'client_turn_complete' });
  };

  const handleStart = async () => {
    try {
      setStatus('connecting');
      await initPlayback();
      await startCapture();
      connect(wsUrl);
    } catch (error) {
      console.error("Failed to start interview:", error);
      setStatus('idle');
      alert("Could not access microphone. Please check permissions.");
    }
  };

  const handleEnd = () => {
    if (window.confirm("Are you sure you want to end the interview?")) {
      setStatus('ending');
      stopRecording();
      if (currentSegmentRef.current) {
        const endTime = performance.now() - interviewStartTimeRef.current;
        setSegments(prev => [...prev, { ...currentSegmentRef.current!, end: endTime }]);
        currentSegmentRef.current = null;
      }
      if (connected) {
        send({ type: 'end' });
      } else {
        setStatus('idle');
        disconnect();
      }
    }
  };

  useEffect(() => {
    if (connected && stream && status === 'connecting') {
      interviewStartTimeRef.current = performance.now();
      startRecording(stream);
      send({ type: 'start', role_id: roleId, difficulty, job_description: jobDescription, token, voice_name: selectedVoice });
    }
  }, [connected, stream, status, startRecording, send, roleId, difficulty, jobDescription, token, selectedVoice]);

  useEffect(() => {
    return () => { stopCapture(); stopPlayback(); disconnect(); };
  }, [stopCapture, stopPlayback, disconnect]);

  const getGlobalState = (): VisualizerState => {
    if (status === 'connecting' || status === 'idle') return 'Connecting';
    if (status === 'ending') return 'Thinking';
    const isAISpeaking = playbackAnalyser && status === 'active'; 
    if (isAISpeaking) return 'Speaking';
    return isMuted ? 'Idle' : 'Listening';
  };

  const getActiveAnalyser = () => {
    const state = getGlobalState();
    if (state === 'Speaking') return playbackAnalyser;
    return captureAnalyser;
  };

  if (status === 'idle') {
    return (
      <div className="relative min-h-[calc(100dvh-56px)] flex flex-col items-center justify-center p-6 bg-black font-mono">
        {/* Grid Background */}
        <div className="absolute inset-0 opacity-10 pointer-events-none" 
          style={{ backgroundImage: 'linear-gradient(var(--border-primary) 1px, transparent 1px), linear-gradient(90deg, var(--border-primary) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        
        <div className="relative z-10 text-center max-w-2xl animate-fade-in border border-[var(--border-primary)] p-12 bg-black">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[var(--accent-surface)] border border-[var(--border-primary)] mb-8">
            <Terminal size={14} className="text-[var(--accent-primary)]" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--accent-primary)]">Industrial Mainframe v1.0</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tighter mb-6 text-white uppercase">
            Initialize_Session?
          </h1>
          <p className="text-[var(--text-secondary)] text-sm mb-12 max-w-md mx-auto leading-relaxed border-l-2 border-[var(--border-primary)] pl-6 text-left">
            {">"} Establishing high-precision voice-link.<br/>
            {">"} Calibrating acoustic sensors.<br/>
            {">"} Ready for input.
          </p>
          <button 
            onClick={handleStart} 
            className="btn-primary flex items-center gap-3 px-12 py-4 text-sm font-bold tracking-[0.2em] cursor-pointer w-full justify-center"
          >
            [ EXECUTE: START_INTERVIEW ]
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-[calc(100dvh-56px)] bg-black flex flex-col font-mono overflow-hidden">
      {/* Grid Background */}
      <div className="absolute inset-0 opacity-5 pointer-events-none" 
        style={{ backgroundImage: 'linear-gradient(var(--border-primary) 1px, transparent 1px), linear-gradient(90deg, var(--border-primary) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

      {/* System Status Bar (Header) */}
      <header className="relative z-20 flex items-center justify-between px-6 py-3 border-b border-[var(--border-primary)] bg-[var(--bg-secondary)]">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Cpu size={16} className="text-[var(--border-primary)]" />
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--text-muted)]">SYSTEM_ID: {roleId.toUpperCase()}</span>
          </div>
          <div className="hidden md:flex items-center gap-2">
            <Activity size={16} className="text-[var(--border-primary)]" />
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--text-muted)]">DIFF_LVL: {difficulty.toUpperCase()}</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1 border border-[var(--border-primary)] bg-black/50">
            <div className={`w-1.5 h-1.5 ${status === 'active' ? 'bg-[var(--success)] animate-pulse' : 'bg-zinc-600'}`} />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--border-primary)]">
              {status.toUpperCase()}
            </span>
          </div>
          <button 
            onClick={() => setIsDrawerOpen(true)}
            className="flex items-center gap-2 px-3 py-1 border border-[var(--border-primary)] text-[var(--border-primary)] hover:bg-[var(--border-primary)] hover:text-black transition-all cursor-pointer"
          >
            <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Open_Log</span>
          </button>
        </div>
      </header>

      {/* Main Console Stage */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center p-4">
        <div className="relative p-8">
            <AudioVisualizer 
                analyser={getActiveAnalyser()} 
                state={getGlobalState()} 
                size={visualizerSize}
                theme={theme}
            />
            
            {/* Scanline Overlay effect */}
            <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.02),rgba(0,255,0,0.01),rgba(0,0,255,0.02))] bg-[length:100%_2px,3px_100%]" />
        </div>
        
        {/* Active Metadata Readout */}
        <div className="mt-8 grid grid-cols-2 gap-x-12 gap-y-2 border-t border-[var(--border-subtle)] pt-6 opacity-60">
           <div className="flex flex-col">
              <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Active_Interviewer</span>
              <span className="text-[12px] text-white font-bold">{selectedVoice.toUpperCase()}</span>
           </div>
           <div className="flex flex-col">
              <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Acoustic_Feed</span>
              <span className="text-[12px] text-white font-bold">{status === 'active' ? 'STREAMING' : 'READY'}</span>
           </div>
        </div>
      </main>

      {/* Industrial Command Bar */}
      <ControlDock 
        isMuted={isMuted}
        onToggleMute={toggleMute}
        onFinish={handleFinishAnswer}
        onEnd={handleEnd}
        status={status}
      />

      {/* Log Feed */}
      <TranscriptDrawer 
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        transcripts={transcripts}
      />
    </div>
  );
};
