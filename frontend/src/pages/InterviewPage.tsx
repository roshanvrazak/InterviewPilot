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
}

export const InterviewPage: React.FC<InterviewPageProps> = ({ roleId, difficulty, jobDescription, onScorecard }) => {
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
        token: token
      });
    }
  }, [connected, stream, status, startRecording, send, roleId, difficulty, jobDescription]);

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
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">AI Mock Interview</h1>
      
      <div className="flex justify-around mb-8 bg-white p-6 rounded-lg shadow-sm">
        <div className="text-center">
          <div className="text-sm font-bold text-gray-500 mb-2 uppercase tracking-wider">You</div>
          <AudioVisualizer analyser={captureAnalyser} state={getUserState()} color="#10b981" />
        </div>
        <div className="text-center">
          <div className="text-sm font-bold text-gray-500 mb-2 uppercase tracking-wider">Alex (AI)</div>
          <AudioVisualizer analyser={playbackAnalyser} state={getAIState()} color="#3b82f6" />
        </div>
      </div>

      <div className="mb-6 flex justify-center">
        {status === 'idle' ? (
          <button 
            onClick={handleStart} 
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-full transition duration-300 shadow-md"
          >
            Start Interview
          </button>
        ) : (
          <div className="flex flex-col items-center w-full max-w-2xl gap-4">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${status === 'active' ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                <span className="text-sm font-medium text-gray-600 uppercase tracking-wider">{status}</span>
              </div>
              <button 
                onClick={handleEnd} 
                disabled={status === 'ending'}
                className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-full font-bold transition-colors disabled:opacity-50"
              >
                {status === 'ending' ? 'Generating Scorecard...' : 'End Interview'}
              </button>
            </div>
            
            {status === 'active' && (
              <div className="flex justify-center gap-4 w-full mt-4">
                <button
                  onClick={toggleMute}
                  className={`px-6 py-3 rounded-full font-bold transition-colors flex-1 ${
                    isMuted 
                      ? 'bg-red-100 text-red-600 border-2 border-red-500' 
                      : 'bg-green-100 text-green-600 border-2 border-green-500'
                  }`}
                >
                  {isMuted ? 'Mic Muted (Click to Unmute)' : 'Mic Active (Click to Mute)'}
                </button>
                <button
                  onClick={handleFinishAnswer}
                  disabled={isMuted}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full font-bold transition-colors disabled:opacity-50 flex-1 shadow-md"
                >
                  Finish Answer (Send to AI)
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="bg-white border border-gray-200 p-6 rounded-xl h-[400px] overflow-y-auto shadow-inner">
        {transcripts.length === 0 && (
          <div className="text-center text-gray-400 mt-20 italic">
            Interview transcript will appear here...
          </div>
        )}
        {transcripts.map((t, i) => (
          <div key={i} className={`mb-4 flex ${t.speaker === 'interviewer' ? 'justify-start' : 'justify-end'}`}>
            <div className={`max-w-[80%] p-4 rounded-2xl shadow-sm ${
              t.speaker === 'interviewer' 
                ? 'bg-blue-50 text-blue-900 border-l-4 border-blue-500 rounded-tl-none' 
                : 'bg-green-50 text-green-900 border-r-4 border-green-500 rounded-tr-none'
            }`}>
              <div className="text-xs font-bold mb-1 opacity-60 uppercase">
                {t.speaker === 'interviewer' ? 'Alex' : 'You'}
              </div>
              <div className="text-sm leading-relaxed">
                {t.text}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
