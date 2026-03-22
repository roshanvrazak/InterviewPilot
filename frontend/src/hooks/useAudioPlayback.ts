// frontend/src/hooks/useAudioPlayback.ts
import { useRef, useCallback } from 'react';

export function useAudioPlayback() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);

  const init = useCallback(() => {
    audioContextRef.current = new AudioContext({ sampleRate: 24000 });
    nextStartTimeRef.current = 0;
  }, []);

  const playChunk = useCallback((pcmData: ArrayBuffer) => {
    const ctx = audioContextRef.current;
    if (!ctx) return;

    const int16 = new Int16Array(pcmData);
    const float32 = new Float32Array(int16.length);
    for (let i = 0; i < int16.length; i++) {
      float32[i] = int16[i] / 0x8000;
    }

    const buffer = ctx.createBuffer(1, float32.length, 24000);
    buffer.getChannelData(0).set(float32);

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);

    const currentTime = ctx.currentTime;
    const startTime = Math.max(currentTime, nextStartTimeRef.current);
    source.start(startTime);
    nextStartTimeRef.current = startTime + buffer.duration;
  }, []);

  const stop = useCallback(() => {
    audioContextRef.current?.close();
    audioContextRef.current = null;
    nextStartTimeRef.current = 0;
  }, []);

  return { init, playChunk, stop };
}
