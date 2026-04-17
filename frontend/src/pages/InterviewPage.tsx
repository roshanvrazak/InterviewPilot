import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { MessageSquare, Layout } from 'lucide-react';
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
        return [...prev, msg];
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

  // Determine the global state for the single Aura visualizer
  const getGlobalState = (): VisualizerState => {
    if (status === 'connecting' || status === 'idle') return 'Connecting';
    if (status === 'ending') return 'Thinking';
    
    // If AI is playing back, it's 'Speaking'
    const isAISpeaking = playbackAnalyser && status === 'active'; // In real app, check if audio is actually playing
    if (isAISpeaking) return 'Speaking';
    
    // Default to 'Listening' when active
    return isMuted ? 'Idle' : 'Listening';
  };

  const getActiveAnalyser = () => {
    const state = getGlobalState();
    if (state === 'Speaking') return playbackAnalyser;
    return captureAnalyser;
  };

  if (status === 'idle') {
    return (
      <div className="relative min-h-[calc(100dvh-56px)] flex flex-col items-center justify-center p-6 overflow-hidden">
        <div className="nebula-bg" />
        <div className="nebula-blob nebula-blob-1" />
        <div className="nebula-blob nebula-blob-2" />
        
        <div className="relative z-10 text-center max-w-2xl animate-fade-in">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--accent-surface)] border border-[var(--accent-glow)] mb-6 animate-fade-in-up delay-1">
            <Layout size={14} className="text-[var(--accent-primary)]" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--accent-primary)]">Spatial Stage</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight mb-6 animate-fade-in-up delay-2">
            Ready to <span className="text-gradient">Begin?</span>
          </h1>
          <p className="text-[var(--text-secondary)] text-lg mb-10 animate-fade-in-up delay-3 max-w-md mx-auto">
            Step into an immersive, voice-first interview experience. Position yourself comfortably and ensure your microphone is clear.
          </p>
          <button 
            onClick={handleStart} 
            className="btn-primary flex items-center gap-3 px-10 py-4 text-base shadow-xl shadow-orange-500/20 animate-fade-in-up delay-4 cursor-pointer"
          >
            Enter Studio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-[calc(100dvh-56px)] bg-black overflow-hidden flex flex-col">
      {/* Immersive Background */}
      <div className="nebula-bg" />
      <div className="nebula-blob nebula-blob-1" />
      <div className="nebula-blob nebula-blob-2" />
      <div className="nebula-blob nebula-blob-3" />

      {/* Header */}
      <header className="relative z-20 flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
            <div className={`w-1.5 h-1.5 rounded-full ${status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-500'}`} />
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
              {status === 'connecting' ? 'Establishing Connection' : 'Live Session'}
            </span>
          </div>
        </div>

        <button 
          onClick={() => setIsDrawerOpen(true)}
          className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer backdrop-blur-md"
          aria-label="Open transcript"
        >
          <MessageSquare size={20} />
        </button>
      </header>

      {/* Center Stage: The Aura */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center p-4">
        <div className="relative">
          {/* Subtle ring around the visualizer */}
          <div 
            className="absolute inset-0 rounded-full border border-white/5 animate-nebula" 
            style={{ width: visualizerSize + 80, height: visualizerSize + 80, left: -40, top: -40 }} 
          />
          <AudioVisualizer 
            analyser={getActiveAnalyser()} 
            state={getGlobalState()} 
            size={visualizerSize}
            theme={theme}
          />
        </div>
        
        {/* Role Hint */}
        <div className="mt-12 text-center animate-fade-in delay-5">
          <h2 className="text-zinc-500 text-[11px] font-bold uppercase tracking-[0.2em] mb-1">Current Interview</h2>
          <p className="text-white text-lg font-medium">{roleId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
        </div>
      </main>

      {/* Floating Control Dock */}
      <ControlDock 
        isMuted={isMuted}
        onToggleMute={toggleMute}
        onFinish={handleFinishAnswer}
        onEnd={handleEnd}
        status={status}
      />

      {/* Transcript Drawer */}
      <TranscriptDrawer 
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        transcripts={transcripts}
      />
    </div>
  );
};
