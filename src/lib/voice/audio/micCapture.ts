export class MicCapture {
    context: AudioContext | null = null;
    stream: MediaStream | null = null;
    source: MediaStreamAudioSourceNode | null = null;
    worklet: AudioWorkletNode | null = null;
    onAudioData: ((pcm16: Int16Array) => void) | null = null;
    onVolumeChange: ((rms: number) => void) | null = null;

    async start() {
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                }
            });

            this.context = new (window.AudioContext || (window as any).webkitAudioContext)({
                sampleRate: 16000 // Force 16kHz if browser supports it, otherwise we resample
            });

            // Load worklet
            await this.context.audioWorklet.addModule('/capture-worklet.js');

            this.source = this.context.createMediaStreamSource(this.stream);
            this.worklet = new AudioWorkletNode(this.context, 'capture-worklet');

            this.worklet.port.onmessage = (e) => {
                if (e.data.event === 'data') {
                    const float32Data = e.data.buffer;
                    if (this.onVolumeChange) this.onVolumeChange(e.data.rms);
                    
                    // The Float32Data needs to be converted to PCM16 Int16Array
                    const pcm16 = new Int16Array(float32Data.length);
                    for (let i = 0; i < float32Data.length; i++) {
                        let s = Math.max(-1, Math.min(1, float32Data[i]));
                        pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
                    }

                    if (this.onAudioData) this.onAudioData(pcm16);
                }
            };

            this.source.connect(this.worklet);
            this.worklet.connect(this.context.destination);

        } catch (e) {
            console.error('MicCapture error:', e);
            throw e;
        }
    }

    stop() {
        if (this.stream) this.stream.getTracks().forEach(t => t.stop());
        if (this.source) this.source.disconnect();
        if (this.worklet) this.worklet.disconnect();
        if (this.context) this.context.close();
        
        this.stream = null;
        this.source = null;
        this.worklet = null;
        this.context = null;
    }
}
