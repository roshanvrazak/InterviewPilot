import React, { useEffect, useRef, useState } from 'react';

interface MicCheckPageProps {
  roleId: string;
  selectedVoice: string;
  onStartInterview: () => void;
  onBack: () => void;
}

export const MicCheckPage: React.FC<MicCheckPageProps> = ({ 
  roleId, 
  selectedVoice, 
  onStartInterview,
  onBack 
}) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [volume, setVolume] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    async function setupMic() {
      try {
        const userStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setStream(userStream);

        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        const source = audioContext.createMediaStreamSource(userStream);
        source.connect(analyser);

        audioContextRef.current = audioContext;
        analyserRef.current = analyser;

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const updateVolume = () => {
          analyser.getByteFrequencyData(dataArray);
          const sum = dataArray.reduce((a, b) => a + b, 0);
          const average = sum / dataArray.length;
          setVolume(average);
          animationFrameRef.current = requestAnimationFrame(updateVolume);
        };
        updateVolume();
      } catch (err) {
        console.error('Error accessing microphone:', err);
        setError('Could not access microphone. Please ensure you have granted permission.');
      }
    }

    setupMic();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  return (
    <div className="max-w-2xl mx-auto mt-12 p-8 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800">
      <h1 className="text-3xl font-bold mb-6 text-slate-900 dark:text-white">Mic Check</h1>
      
      <div className="space-y-6">
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Selected Role</h2>
          <p className="text-lg font-medium text-slate-900 dark:text-slate-100">{roleId || 'General Interview'}</p>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Voice Preference</h2>
          <p className="text-lg font-medium text-slate-900 dark:text-slate-100">{selectedVoice}</p>
        </div>

        <div className="py-8 text-center">
          <p className="mb-4 text-slate-600 dark:text-slate-400">
            Speak into your microphone to test the volume levels.
          </p>
          
          <div className="w-full h-4 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden mb-2">
            <div 
              className={`h-full transition-all duration-75 ${volume > 5 ? 'bg-blue-500' : 'bg-slate-400'}`}
              style={{ width: `${Math.min(100, (volume / 128) * 100)}%` }}
            />
          </div>
          
          {error && (
            <p className="text-red-500 mt-4 text-sm font-medium">
              ⚠️ {error}
            </p>
          )}
        </div>

        <div className="flex gap-4">
          <button 
            onClick={onBack}
            className="flex-1 py-3 px-6 rounded-xl border border-slate-200 dark:border-slate-700 font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Back
          </button>
          <button 
            disabled={!stream || !!error}
            onClick={onStartInterview}
            className={`flex-1 py-3 px-6 rounded-xl font-semibold text-white transition-all shadow-lg ${
              !stream || !!error 
                ? 'bg-slate-400 cursor-not-allowed opacity-50' 
                : 'bg-blue-600 hover:bg-blue-700 hover:shadow-blue-500/20'
            }`}
          >
            Start Interview
          </button>
        </div>
      </div>
    </div>
  );
};
