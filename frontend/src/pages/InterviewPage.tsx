import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import { useAudioCapture } from '../hooks/useAudioCapture';
import { useAudioPlayback } from '../hooks/useAudioPlayback';
import { useMediaRecorder } from '../hooks/useMediaRecorder';
import { AudioVisualizer, VisualizerState } from '../components/AudioVisualizer';
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
  const [isInterrupted, setIsInterrupted] = useState(false);
  const { init: initPlayback, playChunk, stop: stopPlayback, stopAll, analyser: playbackAnalyser } = useAudioPlayback();
  const { start: startRecording, stop: stopRecording, audioBlob } = useMediaRecorder();

  const [segments, setSegments] = useState<{start: number, end: number}[]>([]);
  const interviewStartTimeRef = useRef<number>(0);
  const currentSegmentRef = useRef<{start: number} | null>(null);
  const scorecardRef = useRef<any>(null);
  const [hasReportedScorecard, setHasReportedScorecard] = useState(false);
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const lastInterruptionRef = useRef<number>(0);

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
    return () => { stopCapture(); stopPlayback(); disconnect(); };
  }, [stopCapture, stopPlayback, disconnect]);

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

  const isActive = status !== 'idle';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {/* Idle Header */}
      {status === 'idle' && (
        <div className="text-center mb-8 sm:mb-10 animate-fade-in-up">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2" style={{ color: 'var(--text-primary)' }}>
            Interview Studio
          </h1>
          <p className="text-[14px]" style={{ color: 'var(--text-secondary)' }}>
            Your AI mock interview experience
          </p>
        </div>
      )}

      {/* Visualizers */}
      {isActive && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 animate-fade-in">
          {[
            { label: 'You', analyser: captureAnalyser, state: getUserState(), color: '#10B981', glow: getUserState() === 'Listening' },
            { label: 'Alex', analyser: playbackAnalyser, state: getAIState(), color: '#FF5701', glow: getAIState() === 'Speaking' },
          ].map(({ label, analyser, state, color, glow }) => (
            <div
              key={label}
              className="rounded-2xl p-4 sm:p-5 flex flex-col items-center transition-all duration-200"
              style={{
                backgroundColor: 'var(--card-bg)',
                border: `1px solid ${glow ? 'var(--accent-primary)' : 'var(--card-border)'}`,
                boxShadow: glow ? '0 0 20px var(--accent-glow)' : 'none',
              }}
            >
              <span className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>
                {label}
              </span>
              <AudioVisualizer analyser={analyser} state={state} color={color} />
            </div>
          ))}
        </div>
      )}

      {/* Controls */}
      <div className="mb-4 flex justify-center">
        {status === 'idle' ? (
          <button onClick={handleStart} className="btn-primary flex items-center gap-2.5 text-[14px] px-8 py-3.5 cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
            </svg>
            Begin Interview
          </button>
        ) : (
          <div
            className="rounded-2xl p-2 flex flex-col sm:flex-row items-center justify-between w-full max-w-3xl gap-2 sm:gap-0 animate-fade-in"
            style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-primary)' }}
          >
            {/* Status indicator */}
            <div className="flex items-center gap-2 px-3">
              <span
                className="block w-2 h-2 rounded-full"
                style={{
                  backgroundColor: status === 'active' ? 'var(--success)' : 'var(--text-muted)',
                  animation: status === 'active' ? 'pulse-glow 2s ease-in-out infinite' : 'none',
                }}
                aria-hidden="true"
              />
              <span className="text-[12px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }} role="status">
                {status === 'connecting' ? 'Connecting' : status === 'ending' ? 'Generating Report' : 'Live'}
              </span>
            </div>

            {/* Action buttons */}
            {status === 'active' && (
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleMute}
                  className="rounded-xl px-4 py-2 font-semibold text-[13px] flex items-center gap-1.5 transition-all cursor-pointer min-h-[40px]"
                  style={{
                    backgroundColor: isMuted ? 'var(--danger-surface)' : 'var(--success-surface)',
                    color: isMuted ? 'var(--danger)' : 'var(--success)',
                    border: `1px solid ${isMuted ? 'var(--danger)' : 'var(--success)'}`,
                  }}
                  aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
                >
                  {isMuted ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                    </svg>
                  )}
                  <span className="hidden sm:inline">{isMuted ? 'Muted' : 'Listening'}</span>
                </button>

                <button
                  onClick={handleFinishAnswer}
                  disabled={isMuted}
                  className="btn-primary flex items-center gap-1.5 text-[13px] !py-2 !px-4 disabled:opacity-50 cursor-pointer min-h-[40px]"
                  aria-label="Finish your answer"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                  </svg>
                  <span className="hidden sm:inline">Done</span>
                </button>
              </div>
            )}

            {/* End session */}
            <button
              onClick={handleEnd}
              disabled={status === 'ending'}
              className="text-[13px] font-semibold px-3 py-2 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1.5 cursor-pointer min-h-[40px]"
              style={{ color: 'var(--danger)', background: 'transparent', border: 'none' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--danger-surface)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'; }}
              aria-label="End interview session"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              <span className="hidden sm:inline">{status === 'ending' ? 'Generating...' : 'End'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Transcript */}
      <div
        className="rounded-2xl h-[320px] sm:h-[400px] overflow-y-auto p-4 sm:p-5"
        style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-primary)' }}
        role="log"
        aria-label="Interview transcript"
        aria-live="polite"
      >
        {transcripts.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full" style={{ color: 'var(--text-muted)' }}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mb-3 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            <span className="text-[13px] font-medium">Transcript appears here once the interview begins</span>
          </div>
        )}
        <div className="space-y-3">
          {transcripts.map((t, i) => (
            <div key={i} className={`flex ${t.speaker === 'interviewer' ? 'justify-start' : 'justify-end'}`}>
              <div className={`flex flex-col ${t.speaker === 'interviewer' ? 'items-start' : 'items-end'} max-w-[88%] sm:max-w-[78%]`}>
                <span className="text-[11px] font-semibold uppercase tracking-wider mb-1 px-0.5" style={{ color: 'var(--text-muted)' }}>
                  {t.speaker === 'interviewer' ? 'Alex' : 'You'}
                </span>
                <div
                  className="px-3.5 py-2.5 rounded-2xl text-[14px] leading-relaxed"
                  style={t.speaker === 'interviewer'
                    ? { backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)', color: 'var(--text-primary)', borderTopLeftRadius: '4px' }
                    : { backgroundColor: 'var(--accent-primary)', color: '#ffffff', borderTopRightRadius: '4px' }
                  }
                >
                  {t.text}
                </div>
              </div>
            </div>
          ))}
          <div ref={transcriptEndRef} />
        </div>
      </div>
    </div>
  );
};
