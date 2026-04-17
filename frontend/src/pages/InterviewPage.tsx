import React, { useEffect, useState, useCallback, useRef } from 'react';
import { MessageSquare, Layout } from 'lucide-react';
import { useWebSocket } from '../hooks/useWebSocket';
import { useAudioCapture } from '../hooks/useAudioCapture';
import { useAudioPlayback } from '../hooks/useAudioPlayback';
import { useMediaRecorder } from '../hooks/useMediaRecorder';
import { AudioVisualizer, VisualizerState } from '../components/AudioVisualizer';
import { ControlDock } from '../components/ControlDock';
import { TranscriptDrawer } from '../components/TranscriptDrawer';
import { useAuth } from '../context/AuthContext';

interface InterviewPageProps {
  roleId: string;
  difficulty: string;
  jobDescription: string;
  onScorecard: (data: any) => void;
  selectedVoice: string;
}

export const InterviewPage: React.FC<InterviewPageProps> = ({ roleId, difficulty, jobDescription, onScorecard, selectedVoice }) => {
  const { token } = useAuth();
  const [transcripts, setTranscripts] = useState<any[]>([]);
  const [status, setStatus] = useState<'idle' | 'connecting' | 'active' | 'ending'>('idle');
  const [isMuted, setIsMuted] = useState(false);
  const [isInterrupted, _setIsInterrupted] = useState(false); // Kept for future use
  const [isTranscriptOpen, setIsTranscriptOpen] = useState(false);
  
  const { init: initPlayback, playChunk, stop, stopAll, analyser: playbackAnalyser } = useAudioPlayback();
  const { start: startRecording, stop: stopRecording, audioBlob } = useMediaRecorder();

  const [segments, setSegments] = useState<{start: number, end: number}[]>([]);
  const interviewStartTimeRef = useRef<number>(0);
  const currentSegmentRef = useRef<{start: number} | null>(null);
  const scorecardRef = useRef<any>(null);
  const [hasReportedScorecard, setHasReportedScorecard] = useState(false);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcripts]);

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
      connect('ws://localhost:8000/ws/interview');
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
    return () => { 
      stopCapture(); 
      stop(); 
      disconnect(); 
    };
  }, [stopCapture, stop, disconnect]);

  const getAIState = (): VisualizerState => {
    if (status === 'connecting') return 'Connecting';
    if (isInterrupted) return 'Interrupted';
    if (status === 'active') return 'Speaking';
    return 'Idle';
  };

  const getUserState = (): VisualizerState => {
    if (status === 'connecting') return 'Connecting';
    if (status === 'active') return isMuted ? 'Idle' : 'Listening';
    return 'Idle';
  };

  const getActiveAnalyser = () => {
    if (getAIState() === 'Speaking') return playbackAnalyser;
    if (getUserState() === 'Listening') return captureAnalyser;
    return null;
  };

  const getGlobalState = (): VisualizerState => {
    if (status === 'connecting') return 'Connecting';
    if (status === 'ending') return 'Idle';
    if (isInterrupted) return 'Interrupted';
    if (getAIState() === 'Speaking') return 'Speaking';
    if (getUserState() === 'Listening') return 'Listening';
    return 'Idle';
  };

  if (status === 'idle') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 animate-fade-in">
        <div className="text-center mb-10 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 text-orange-500 border border-orange-500/20 mb-6">
            <Layout size={14} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Spatial Stage</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-4 text-[var(--text-primary)]">
            Interview Studio
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-lg">
            Ready to begin your mock interview with Alex? 
            We'll use your camera and microphone for a realistic experience.
          </p>
        </div>

        <button 
          onClick={handleStart} 
          className="group relative flex items-center gap-3 px-8 py-4 bg-orange-500 text-white rounded-full font-bold text-lg hover:bg-orange-600 transition-all shadow-xl shadow-orange-500/20 active:scale-95"
        >
          <div className="absolute inset-0 bg-white/20 rounded-full scale-0 group-hover:scale-100 transition-transform duration-500" />
          <span>Begin Session</span>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-[var(--bg-primary)] flex flex-col overflow-hidden">
      {/* Background Accent */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-500/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/5 blur-[120px] rounded-full" />
      </div>

      {/* Header */}
      <header className="relative z-40 p-6 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${status === 'active' ? 'bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-zinc-500'}`} />
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
            {status === 'connecting' ? 'Establishing Connection' : status === 'active' ? 'Live Session' : 'Session Ended'}
          </span>
        </div>
        
        <button
          onClick={() => setIsTranscriptOpen(true)}
          className="p-2.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors text-zinc-500 group relative"
          title="Open Transcript"
        >
          <MessageSquare size={20} />
          {transcripts.length > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-orange-500 rounded-full border-2 border-[var(--bg-primary)]" />
          )}
        </button>
      </header>

      {/* Main Stage */}
      <main className="flex-1 flex flex-col items-center justify-center relative z-10 px-6">
        <div className="relative">
          <div className="absolute inset-0 bg-orange-500/5 blur-[100px] rounded-full scale-150 animate-pulse" />
          
          <AudioVisualizer
            analyser={getActiveAnalyser()}
            state={getGlobalState()}
            size={400}
          />
          
          {/* Label */}
          <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 text-center w-full">
            <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-zinc-400 dark:text-zinc-500 mb-1">
              {getGlobalState() === 'Speaking' ? 'Alex is speaking' : getGlobalState() === 'Listening' ? 'Alex is listening' : 'Alex · AI Interviewer'}
            </p>
            <div className="h-0.5 w-8 bg-orange-500/30 mx-auto rounded-full" />
          </div>
        </div>
      </main>

      {/* Controls */}
      <ControlDock
        isMuted={isMuted}
        onToggleMute={toggleMute}
        onFinish={handleFinishAnswer}
        onEnd={handleEnd}
        status={status === 'connecting' ? 'Connecting' : undefined}
      />

      {/* Sidebar */}
      <TranscriptDrawer
        isOpen={isTranscriptOpen}
        onClose={() => setIsTranscriptOpen(false)}
        transcripts={transcripts}
      />
    </div>
  );
};
