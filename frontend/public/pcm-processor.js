// frontend/public/pcm-processor.js
class PCMProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.inputSampleRate = 48000;
    this.outputSampleRate = 16000;
    this.ratio = this.inputSampleRate / this.outputSampleRate;
    
    // Buffer for ~32ms of audio at 16kHz (reduced from 2048 for lower latency)
    this.bufferSize = 512;
    this.buffer = new Int16Array(this.bufferSize);
    this.bufferOffset = 0;
  }

  process(inputs) {
    const input = inputs[0];
    if (!input || !input[0]) return true;

    const channelData = input[0];
    const downsampledLength = Math.floor(channelData.length / this.ratio);
    
    for (let i = 0; i < downsampledLength; i++) {
      const sample = channelData[Math.round(i * this.ratio)];
      const s = Math.max(-1, Math.min(1, sample));
      this.buffer[this.bufferOffset] = s < 0 ? s * 0x8000 : s * 0x7FFF;
      this.bufferOffset++;

      if (this.bufferOffset >= this.bufferSize) {
        // Send a copy of the buffer
        const outBuffer = new Int16Array(this.buffer);
        this.port.postMessage(outBuffer.buffer, [outBuffer.buffer]);
        this.bufferOffset = 0;
      }
    }

    return true;
  }
}

registerProcessor('pcm-processor', PCMProcessor);
