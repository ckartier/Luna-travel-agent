/**
 * VoiceWorkletProcessor — Luna CRM Voice Agent
 * Captures microphone audio in 128-sample chunks (~8ms at 16kHz)
 * and sends base64-encoded PCM16 data to the main thread.
 * 
 * This replaces the deprecated ScriptProcessorNode (4096 samples = ~256ms lag).
 * Must be served from /public so it loads via addModule().
 */
class VoiceWorkletProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        this._buffer = [];
        this._bufferSize = 2048; // Collect 2048 samples before sending (~128ms at 16kHz)
        this._silenceThreshold = 0.001;
        this._silenceCount = 0;
    }

    process(inputs) {
        const input = inputs[0];
        if (!input || !input[0]) return true;

        const channelData = input[0];

        // Detect silence
        let maxAmp = 0;
        for (let i = 0; i < channelData.length; i++) {
            const abs = Math.abs(channelData[i]);
            if (abs > maxAmp) maxAmp = abs;
        }

        if (maxAmp < this._silenceThreshold) {
            this._silenceCount++;
            if (this._silenceCount > 50) {
                this.port.postMessage({ type: 'silence' });
            }
        } else {
            this._silenceCount = 0;
            this.port.postMessage({ type: 'active' });
        }

        // Accumulate samples
        for (let i = 0; i < channelData.length; i++) {
            this._buffer.push(channelData[i]);
        }

        // When buffer is full, encode to PCM16 and send
        if (this._buffer.length >= this._bufferSize) {
            const samples = this._buffer.splice(0, this._bufferSize);
            const int16 = new Int16Array(samples.length);
            for (let i = 0; i < samples.length; i++) {
                const s = Math.max(-1, Math.min(1, samples[i]));
                int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
            }

            // Convert to base64
            const bytes = new Uint8Array(int16.buffer);
            let binary = '';
            const chunkSize = 8192;
            for (let i = 0; i < bytes.length; i += chunkSize) {
                binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
            }

            this.port.postMessage({
                type: 'audio',
                b64: btoa(binary),
            });
        }

        return true;
    }
}

registerProcessor('voice-worklet-processor', VoiceWorkletProcessor);
