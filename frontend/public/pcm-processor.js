// frontend/public/pcm-processor.js
class PCMProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.inputSampleRate = 48000;
    this.outputSampleRate = 16000;
    this.ratio = this.inputSampleRate / this.outputSampleRate;
  }

  process(inputs) {
    const input = inputs[0];
    if (!input || !input[0]) return true;

    const channelData = input[0];
    const downsampledLength = Math.floor(channelData.length / this.ratio);
    const downsampled = new Float32Array(downsampledLength);
    for (let i = 0; i < downsampledLength; i++) {
      downsampled[i] = channelData[Math.round(i * this.ratio)];
    }

    const pcm16 = new Int16Array(downsampled.length);
    for (let i = 0; i < downsampled.length; i++) {
      const s = Math.max(-1, Math.min(1, downsampled[i]));
      pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }

    this.port.postMessage(pcm16.buffer, [pcm16.buffer]);
    return true;
  }
}

registerProcessor('pcm-processor', PCMProcessor);
