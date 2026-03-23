// frontend/src/pages/InterviewPage.tsx
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

  const lastInterruptionRef = useRef<number>(0);

  const onAudio = useCallback((data: ArrayBuffer) => {
    playChunk(data);
  }, [playChunk]);

  const onJson = useCallback((msg: any) => {
    if (msg.type === 'transcript') {
      setStatus('active');
      setTranscripts(prev => {
        if (prev.length > 0 && prev[prev.length - 1].speaker === msg.speaker) {
          const last = prev[prev.length - 1];
          const newText = last.text.endsWith(' ') || msg.text.startsWith(' ') 
            ? last.text + msg.text 
            : last.text + " " + msg.text; 
          return [...prev.slice(0, -1), { ...last, text: newText }];
        }
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
    // Only send audio if we are not muted
    if (!isMuted) {
      send(audioData);
    }
  });

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const handleFinishAnswer = () => {
    // Stop any ongoing playback
    stopAll();
    // Send a client_content message with end_of_turn to force the AI to process and respond
    // In our backend, "interrupted" currently acts as a signal for the user taking control,
    // but to explicitly yield control back to the AI without a specific payload,
    // we can send a custom "client_turn_complete" message
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

  // Recording and segment tracking logic
  useEffect(() => {
    if (connected && stream && status === 'connecting') {
      interviewStartTimeRef.current = performance.now();
      startRecording(stream);
      
      send({ 
        type: 'start', 
        role_id: roleId, 
        difficulty: difficulty,
        job_description: jobDescription,
        token: token,
        voice_name: selectedVoice
      });
    }
  }, [connected, stream, status, startRecording, send, roleId, difficulty, jobDescription, token, selectedVoice]);

  // Handle cleanup on unmount
  useEffect(() => {
    return () => {
      stopCapture();
      stopPlayback();
      disconnect();
    };
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

  return (
    <div className="max-w-4xl mx-auto p-6 transition-colors duration-300">
      <h1 className="text-3xl font-bold mb-6 text-slate-800 dark:text-slate-100 flex items-center gap-3">
        <span className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        </span>
        AI Mock Interview
      </h1>
      
      <div className="grid grid-cols-2 gap-6 mb-8 bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
        <div className="flex flex-col items-center p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/50">
          <div className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-3 uppercase tracking-widest">Candidate (You)</div>
          <div className="bg-white dark:bg-slate-900 p-4 rounded-lg shadow-inner">
            <AudioVisualizer analyser={captureAnalyser} state={getUserState()} color="#10b981" />
          </div>
        </div>
        <div className="flex flex-col items-center p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/50">
          <div className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-3 uppercase tracking-widest">Interviewer (Alex)</div>
          <div className="bg-white dark:bg-slate-900 p-4 rounded-lg shadow-inner">
            <AudioVisualizer analyser={playbackAnalyser} state={getAIState()} color="#6366f1" />
          </div>
        </div>
      </div>

      <div className="mb-6 flex justify-center">
        {status === 'idle' ? (
          <button 
            onClick={handleStart} 
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-4 px-10 rounded-2xl transition duration-300 shadow-lg shadow-indigo-200 dark:shadow-none flex items-center gap-2 group"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 group-hover:scale-110 transition-transform" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
            Start Interview
          </button>
        ) : (
          <div className="flex flex-col items-center w-full max-w-2xl gap-4">
            <div className="flex items-center justify-between w-full px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl">
              <div className="flex items-center space-x-2">
                <div className={`w-2.5 h-2.5 rounded-full ${status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></div>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{status}</span>
              </div>
              <button 
                onClick={handleEnd} 
                disabled={status === 'ending'}
                className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 px-4 py-1.5 rounded-lg text-sm font-bold transition-colors disabled:opacity-50 flex items-center gap-1"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
                {status === 'ending' ? 'Generating Report...' : 'End Session'}
              </button>
            </div>
            
            {status === 'active' && (
              <div className="flex justify-center gap-4 w-full">
                <button
                  onClick={toggleMute}
                  className={`px-6 py-3 rounded-xl font-bold transition-all flex-1 flex items-center justify-center gap-2 border-2 ${
                    isMuted 
                      ? 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-900/10 dark:border-rose-900/30' 
                      : 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/10 dark:border-emerald-900/30'
                  }`}
                >
                  {isMuted ? (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                      Muted
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                      </svg>
                      Listening
                    </>
                  )}
                </button>
                <button
                  onClick={handleFinishAnswer}
                  disabled={isMuted}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold transition-all disabled:opacity-50 flex-1 shadow-lg shadow-indigo-200 dark:shadow-none flex items-center justify-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                  </svg>
                  Finish Answer
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl h-[450px] overflow-y-auto shadow-sm">
        {transcripts.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-600 italic">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-3 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            Transcript will appear here...
          </div>
        )}
        <div className="space-y-6">
          {transcripts.map((t, i) => (
            <div key={i} className={`flex ${t.speaker === 'interviewer' ? 'justify-start' : 'justify-end'}`}>
              <div className={`flex flex-col ${t.speaker === 'interviewer' ? 'items-start' : 'items-end'} max-w-[85%]`}>
                <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 px-1">
                  {t.speaker === 'interviewer' ? 'Alex (Interviewer)' : 'You'}
                </span>
                <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                  t.speaker === 'interviewer' 
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-none border border-slate-200 dark:border-slate-700/50' 
                    : 'bg-indigo-600 text-white rounded-tr-none shadow-indigo-100 dark:shadow-none'
                }`}>
                  {t.text}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
