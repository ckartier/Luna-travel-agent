// pcmPlayer.ts
// Receives streaming PCM16 audio blocks from the WebSocket,
// decodes them and queues them dynamically for gapless playback.

export class PCMPlayer {
    context: AudioContext | null = null;
    nextStartTime = 0;
    sampleRate = 24000; // Gemini Live API outputs 24kHz PCM
    private chunkCount = 0;

    constructor() {
        this.init();
    }

    init() {
        if (!this.context) {
            this.context = new (window.AudioContext || (window as any).webkitAudioContext)({
                sampleRate: this.sampleRate
            });
            console.log('[PCMPlayer] AudioContext created, state:', this.context.state);
        }
    }

    // Resume the audio context (must be called from user gesture context)
    async resume() {
        if (this.context && this.context.state === 'suspended') {
            console.log('[PCMPlayer] Resuming suspended AudioContext...');
            await this.context.resume();
            console.log('[PCMPlayer] AudioContext resumed, state:', this.context.state);
        }
    }

    // Base64 PCM16 string
    async addChunk(base64Str: string) {
        if (!this.context) {
            this.init();
        }
        if (!this.context) return;

        // Ensure context is running (autoplay policy)
        if (this.context.state === 'suspended') {
            await this.context.resume();
        }

        // Decode base64 to Int16Array
        const raw = atob(base64Str);
        const buffer = new Int16Array(raw.length / 2);
        for (let i = 0; i < buffer.length; i++) {
            buffer[i] = raw.charCodeAt(i * 2) + (raw.charCodeAt(i * 2 + 1) << 8);
            if (buffer[i] >= 0x8000) buffer[i] -= 0x10000; // handle negative
        }

        // Convert Int16Array to Float32Array (-1 to 1)
        const float32 = new Float32Array(buffer.length);
        for (let i = 0; i < buffer.length; i++) {
            float32[i] = buffer[i] / 0x8000;
        }

        // Create audio buffer
        const audioBuffer = this.context.createBuffer(1, float32.length, this.sampleRate);
        audioBuffer.getChannelData(0).set(float32);

        // Schedule playback
        const source = this.context.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(this.context.destination);

        const currentTime = this.context.currentTime;
        if (this.nextStartTime < currentTime) {
            this.nextStartTime = currentTime; // Immediate if we fell behind
        }

        // Add small buffer padding for first chunk to prevent stuttering
        if (this.nextStartTime === currentTime) {
            this.nextStartTime += 0.05; // 50ms pre-buffer
        }

        source.start(this.nextStartTime);
        this.nextStartTime += audioBuffer.duration;
        
        this.chunkCount++;
        if (this.chunkCount <= 3 || this.chunkCount % 20 === 0) {
            console.log(`[PCMPlayer] Chunk #${this.chunkCount} scheduled (${float32.length} samples, ctx.state=${this.context.state})`);
        }
    }

    stop() {
        console.log(`[PCMPlayer] Stopping. Total chunks played: ${this.chunkCount}`);
        if (this.context) {
            this.context.suspend();
            this.context.close();
        }
        this.context = null;
        this.nextStartTime = 0;
        this.chunkCount = 0;
    }
}
