// frontend/src/pages/InterviewPage.tsx
import React, { useEffect, useState } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import { useAudioCapture } from '../hooks/useAudioCapture';
import { useAudioPlayback } from '../hooks/useAudioPlayback';

interface InterviewPageProps {
  onScorecard: (data: any) => void;
}

export const InterviewPage: React.FC<InterviewPageProps> = ({ onScorecard }) => {
  const [transcripts, setTranscripts] = useState<any[]>([]);
  const { init: initPlayback, playChunk, stop: stopPlayback } = useAudioPlayback();
  
  const onAudio = (data: ArrayBuffer) => {
    playChunk(data);
  };

  const onJson = (msg: any) => {
    if (msg.type === 'transcript') {
      setTranscripts(prev => [...prev, msg]);
    } else if (msg.type === 'scorecard') {
      onScorecard(msg.data);
    }
  };

  const { connect, send, connected } = useWebSocket(onAudio, onJson);
  const { start: startCapture, stop: stopCapture } = useAudioCapture((audioData) => {
    send(audioData);
  });

  const handleStart = () => {
    initPlayback();
    connect('ws://localhost:8000/ws/interview');
  };

  useEffect(() => {
    if (connected) {
      send({ type: 'start' });
      startCapture();
    } else {
      stopCapture();
      stopPlayback();
    }
  }, [connected, send, startCapture, stopCapture, stopPlayback]);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">AI Mock Interview</h1>
      
      <div className="mb-4">
        {!connected ? (
          <button onClick={handleStart} className="bg-blue-500 text-white px-4 py-2 rounded">
            Start Interview
          </button>
        ) : (
          <button onClick={() => send({ type: 'end' })} className="bg-red-500 text-white px-4 py-2 rounded">
            End Interview
          </button>
        )}
      </div>
      <div className="bg-gray-100 p-4 rounded h-96 overflow-y-auto">
        {transcripts.map((t, i) => (
          <div key={i} className={`mb-2 ${t.speaker === 'interviewer' ? 'text-blue-600' : 'text-green-600'}`}>
            <strong>{t.speaker === 'interviewer' ? 'Interviewer: ' : 'You: '}</strong>
            {t.text}
          </div>
        ))}
      </div>
    </div>
  );
};
