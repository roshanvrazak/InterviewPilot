import React, { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Terminal, Activity, RotateCcw } from 'lucide-react';

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
        setError('CRITICAL: COULD_NOT_ACCESS_ACOUSTIC_HARDWARE. PERMISSION_DENIED.');
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

  const renderMeter = () => {
     const segments = 15;
     const filled = Math.round(normalizedVolume * segments);
     return (
        <div className="flex gap-1 h-8 w-full max-w-[200px]">
           {Array.from({ length: segments }).map((_, i) => (
              <div 
                key={i} 
                className={`flex-1 ${i < filled ? (i > segments * 0.8 ? 'bg-[var(--danger)]' : 'bg-[var(--border-primary)]') : 'bg-[var(--border-subtle)] opacity-10'}`} 
              />
           ))}
        </div>
     );
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100dvh-3.5rem)] px-4 font-mono bg-black">
      <div className="border border-[var(--border-primary)] bg-black w-full max-w-lg p-8 sm:p-12 relative animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-3 text-[var(--border-primary)] mb-10 border-b border-[var(--border-subtle)] pb-4">
           <Activity size={18} />
           <h1 className="text-xs font-bold uppercase tracking-[0.3em]">Module: Acoustic_Calibration</h1>
        </div>

        {/* System Specs */}
        <div className="grid grid-cols-2 gap-4 mb-10 text-[10px] text-[var(--text-muted)] uppercase tracking-widest">
           <div className="p-3 border border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
              <span className="block mb-1 opacity-50">TARGET_ROLE:</span>
              <span className="text-white font-bold">{roleId.toUpperCase() || 'GENERAL'}</span>
           </div>
           <div className="p-3 border border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
              <span className="block mb-1 opacity-50">VOICE_CORE:</span>
              <span className="text-white font-bold">{selectedVoice.toUpperCase()}</span>
           </div>
        </div>

        {/* Calibration Display */}
        <div className="flex flex-col items-center py-10 border border-[var(--border-subtle)] bg-black mb-10 relative">
          <div className="absolute top-2 right-3 text-[8px] font-bold text-[var(--border-primary)] opacity-40">CAL_REF: 01-A</div>
          
          <div className={`mb-6 p-4 border-2 ${isActive ? 'border-[var(--success)]' : 'border-[var(--border-primary)] opacity-20'} transition-colors`}>
             {isActive ? <Mic size={32} className="text-[var(--success)]" /> : <MicOff size={32} className="text-[var(--border-primary)]" />}
          </div>

          <span className="text-[10px] font-bold mb-4 uppercase tracking-[0.2em] text-[var(--text-muted)]">Acoustic_Input_Level</span>
          {renderMeter()}

          <p className={`mt-6 text-[11px] font-bold uppercase tracking-widest ${isActive ? 'text-[var(--success)] animate-pulse' : 'text-[var(--text-muted)]'}`}>
            {isActive ? '>> SIGNAL_DETECTED: OPTIMAL' : '>> WAITING_FOR_INPUT...'}
          </p>

          {error && (
            <div className="mt-8 border border-[var(--danger)] p-4 w-full">
              <p className="text-[10px] font-bold text-[var(--danger)] uppercase tracking-widest">! {error}</p>
            </div>
          )}
        </div>

        {/* Commands */}
        <div className="grid grid-cols-2 gap-4">
          <button onClick={onBack} className="flex items-center justify-center gap-2 py-3 border border-[var(--border-primary)] text-[var(--border-primary)] text-[10px] font-bold uppercase tracking-widest hover:bg-[var(--border-primary)] hover:text-black transition-all cursor-pointer">
            <RotateCcw size={14} />
            <span>[ RETURN ]</span>
          </button>
          <button
            disabled={!stream || !!error}
            onClick={onStartInterview}
            className={`flex items-center justify-center gap-2 py-3 bg-[var(--border-primary)] text-black text-[10px] font-bold uppercase tracking-widest hover:bg-white disabled:opacity-20 transition-all cursor-pointer`}
          >
            <Terminal size={14} />
            <span>[ INITIALIZE ]</span>
          </button>
        </div>
      </div>
      
      <div className="mt-8 text-[9px] text-[var(--text-muted)] uppercase tracking-[0.4em]">Hardware_Calibration_Sequence_01_Rev_B</div>
    </div>
  );
};
