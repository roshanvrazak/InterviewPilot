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
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (stream) stream.getTracks().forEach(track => track.stop());
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, []);

  const isActive = volume > 5;
  const normalizedVolume = Math.min(1, volume / 128);

  return (
    <div className="max-w-md mx-auto mt-12 sm:mt-20 px-4 animate-fade-in-up">
      <div className="surface-elevated rounded-2xl p-6 sm:p-8">
        <div className="text-center mb-6">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Mic check
          </h1>
          <p className="mt-1.5 text-[13px]" style={{ color: 'var(--text-secondary)' }}>
            Make sure your microphone is working
          </p>
        </div>

        {/* Info */}
        <div className="flex flex-wrap gap-2 justify-center mb-6 animate-fade-in-up delay-1">
          {[
            { label: 'Role', value: roleId || 'General' },
            { label: 'Voice', value: selectedVoice },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px]" style={{ backgroundColor: 'var(--bg-secondary)' }}>
              <span style={{ color: 'var(--text-muted)' }}>{label}</span>
              <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{value}</span>
            </div>
          ))}
        </div>

        {/* Mic Indicator */}
        <div className="flex flex-col items-center py-6 animate-fade-in-up delay-2">
          <div
            className="w-24 h-24 sm:w-28 sm:h-28 rounded-full flex items-center justify-center transition-all duration-150"
            style={{
              backgroundColor: isActive ? 'var(--success-surface)' : 'var(--bg-secondary)',
              boxShadow: isActive ? `0 0 ${20 + normalizedVolume * 30}px ${8 + normalizedVolume * 16}px var(--success-surface)` : 'none',
              border: `2px solid ${isActive ? 'var(--success)' : 'var(--border-primary)'}`,
            }}
            aria-label={isActive ? 'Microphone is active' : 'Microphone is inactive'}
          >
            <svg
              className="w-6 h-6 sm:w-7 sm:h-7 transition-colors duration-150"
              style={{ color: isActive ? 'var(--success)' : 'var(--text-muted)' }}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
            </svg>
          </div>

          <p className="mt-4 text-[13px] font-medium" style={{ color: 'var(--text-muted)' }}>
            {isActive ? 'Microphone detected' : 'Speak to test your mic'}
          </p>

          {error && (
            <div className="mt-3 px-3.5 py-2.5 rounded-xl text-[13px] font-medium" style={{ backgroundColor: 'var(--danger-surface)', color: 'var(--danger)' }} role="alert">
              {error}
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="flex gap-3 mt-2 animate-fade-in-up delay-3">
          <button onClick={onBack} className="btn-secondary flex-1 py-2.5 text-[14px] cursor-pointer">
            Back
          </button>
          <button
            disabled={!stream || !!error}
            onClick={onStartInterview}
            className={`btn-primary flex-1 py-2.5 text-[14px] cursor-pointer ${!stream || !!error ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Start Interview
          </button>
        </div>
      </div>
    </div>
  );
};
