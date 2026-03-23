// frontend/src/hooks/useAudioCapture.ts
import { useRef, useCallback, useState } from 'react';

export function useAudioCapture(onAudioChunk: (data: ArrayBuffer) => void) {
  const audioContextRef = useRef<AudioContext | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const start = useCallback(async () => {
    const mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: { sampleRate: 48000, channelCount: 1, echoCancellation: true, noiseSuppression: true }
    });
    streamRef.current = mediaStream;
    setStream(mediaStream);

    const audioContext = new AudioContext({ sampleRate: 48000 });
    audioContextRef.current = audioContext;

    await audioContext.audioWorklet.addModule('/pcm-processor.js');

    const source = audioContext.createMediaStreamSource(mediaStream);
    
    const analyserNode = audioContext.createAnalyser();
    analyserNode.fftSize = 256;
    setAnalyser(analyserNode);

    const workletNode = new AudioWorkletNode(audioContext, 'pcm-processor');
    workletNodeRef.current = workletNode;

    workletNode.port.onmessage = (event: MessageEvent<ArrayBuffer>) => {
      onAudioChunk(event.data);
    };

    source.connect(analyserNode);
    analyserNode.connect(workletNode);
  }, [onAudioChunk]);

  const stop = useCallback(() => {
    workletNodeRef.current?.disconnect();
    audioContextRef.current?.close();
    streamRef.current?.getTracks().forEach(track => track.stop());
    setAnalyser(null);
    setStream(null);
  }, []);

  return { start, stop, analyser, stream };
}
