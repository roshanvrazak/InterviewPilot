// frontend/src/hooks/useAudioPlayback.ts
import { useRef, useCallback, useState } from 'react';

export function useAudioPlayback() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);

  const init = useCallback(() => {
    const ctx = new AudioContext({ sampleRate: 24000 });
    audioContextRef.current = ctx;
    
    const analyserNode = ctx.createAnalyser();
    analyserNode.fftSize = 256;
    analyserNode.connect(ctx.destination);
    setAnalyser(analyserNode);

    nextStartTimeRef.current = 0;
  }, []);

  const playChunk = useCallback((pcmData: ArrayBuffer) => {
    const ctx = audioContextRef.current;
    if (!ctx || !analyser) return;

    const int16 = new Int16Array(pcmData);
    const float32 = new Float32Array(int16.length);
    for (let i = 0; i < int16.length; i++) {
      float32[i] = int16[i] / 0x8000;
    }

    const buffer = ctx.createBuffer(1, float32.length, 24000);
    buffer.getChannelData(0).set(float32);

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(analyser);

    const currentTime = ctx.currentTime;
    const startTime = Math.max(currentTime, nextStartTimeRef.current);
    source.start(startTime);
    nextStartTimeRef.current = startTime + buffer.duration;
  }, [analyser]);

  const stop = useCallback(() => {
    audioContextRef.current?.close();
    audioContextRef.current = null;
    setAnalyser(null);
    nextStartTimeRef.current = 0;
  }, []);

  return { init, playChunk, stop, analyser };
}
