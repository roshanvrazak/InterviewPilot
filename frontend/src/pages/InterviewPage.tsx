// frontend/src/pages/InterviewPage.tsx
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import { useAudioCapture } from '../hooks/useAudioCapture';
import { useAudioPlayback } from '../hooks/useAudioPlayback';
import { useMediaRecorder } from '../hooks/useMediaRecorder';
import { AudioVisualizer, VisualizerState } from '../components/AudioVisualizer';

interface InterviewPageProps {
  roleId: string;
  difficulty: string;
  jobDescription: string;
  onScorecard: (data: any) => void;
}

export const InterviewPage: React.FC<InterviewPageProps> = ({ roleId, difficulty, jobDescription, onScorecard }) => {
  const [transcripts, setTranscripts] = useState<any[]>([]);
  const [status, setStatus] = useState<'idle' | 'connecting' | 'active' | 'ending'>('idle');
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
      setStatus('active'); // First transcript means we are active
      setTranscripts(prev => [...prev, msg]);
    } else if (msg.type === 'history') {
      setTranscripts(msg.history);
      setStatus('active'); // Restore status as well
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

  const { connect, send, connected } = useWebSocket(onAudio, onJson);
  const { start: startCapture, stop: stopCapture, analyser: captureAnalyser, stream } = useAudioCapture((audioData) => {
    send(audioData);
  });

  const handleStart = () => {
    setStatus('connecting');
    initPlayback();
    connect('ws://localhost:8000/ws/interview');
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
      send({ type: 'end' });
    }
  };

  // Recording and segment tracking logic
  useEffect(() => {
    if (connected && stream && status === 'connecting') {
      interviewStartTimeRef.current = performance.now();
      startRecording(stream);
    }
  }, [connected, stream, status, startRecording]);

  // Interruption and segment detection logic
  useEffect(() => {
    if (!connected || !captureAnalyser || !playbackAnalyser || status !== 'active') return;

    let animationFrameId: number;
    const captureData = new Uint8Array(captureAnalyser.frequencyBinCount);
    const playbackData = new Uint8Array(playbackAnalyser.frequencyBinCount);

    const checkAudioLevels = () => {
      animationFrameId = requestAnimationFrame(checkAudioLevels);
      
      captureAnalyser.getByteFrequencyData(captureData);
      playbackAnalyser.getByteFrequencyData(playbackData);

      const captureLevel = captureData.reduce((a, b) => a + b, 0) / captureData.length;
      const playbackLevel = playbackData.reduce((a, b) => a + b, 0) / playbackData.length;

      const now = performance.now() - interviewStartTimeRef.current;

      // Segment tracking: Candidate starts speaking
      if (captureLevel > 15 && playbackLevel < 5 && !currentSegmentRef.current) {
        currentSegmentRef.current = { start: now };
      }

      // Segment tracking: Candidate stops speaking (AI starts)
      if (playbackLevel > 10 && currentSegmentRef.current) {
        setSegments(prev => [...prev, { ...currentSegmentRef.current!, end: now }]);
        currentSegmentRef.current = null;
      }

      // Interruption logic
      if (captureLevel > 15 && playbackLevel > 5 && Date.now() - lastInterruptionRef.current > 1000) {
        lastInterruptionRef.current = Date.now();
        stopAll();
        send({ type: 'interrupted' });
        setIsInterrupted(true);
        setTimeout(() => setIsInterrupted(false), 1000);
      }
    };

    checkAudioLevels();
    return () => cancelAnimationFrame(animationFrameId);
  }, [connected, captureAnalyser, playbackAnalyser, status, stopAll, send]);

  useEffect(() => {
    if (connected) {
      send({ 
        type: 'start', 
        role_id: roleId, 
        difficulty: difficulty,
        job_description: jobDescription
      });
      startCapture();
    } else {
      stopCapture();
      stopPlayback();
    }
  }, [connected, send, startCapture, stopCapture, stopPlayback, roleId, difficulty, jobDescription]);

  const getAIState = (): VisualizerState => {
    if (status === 'connecting') return 'Connecting';
    if (isInterrupted) return 'Interrupted';
    if (status === 'active') return 'Speaking';
    return 'Idle';
  };

  const getUserState = (): VisualizerState => {
    if (status === 'connecting') return 'Connecting';
    if (status === 'active') return 'Listening';
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
          <div className="flex items-center justify-between mb-8 w-full max-w-2xl">
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
        )}
      </div>

      <div className="bg-white border border-gray-200 p-6 rounded-xl h-[450px] overflow-y-auto shadow-inner">
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
