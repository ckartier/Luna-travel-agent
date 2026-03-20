import { MicCapture } from './audio/micCapture';
import { PCMPlayer } from './audio/pcmPlayer';

export type OrbState = 'idle' | 'listening' | 'speaking' | 'connecting' | 'error';

export class VoiceSocketClient {
    private ws: WebSocket | null = null;
    private mic: MicCapture | null = null;
    private player: PCMPlayer | null = null;
    
    public state: OrbState = 'idle';
    
    // Callbacks for UI updates
    public onStateChange: ((state: OrbState) => void) | null = null;
    public onVolumeChange: ((rms: number) => void) | null = null;
    
    private url = 'ws://localhost:3001';

    async connect() {
        this.setState('connecting');
        
        try {
            this.ws = new WebSocket(this.url);
            this.player = new PCMPlayer();
            // Resume AudioContext immediately (we're in a user gesture context from click)
            await this.player.resume();
            
            this.ws.onopen = async () => {
                console.log('[VoiceClient] Connected to relay server');
                // Start capturing mic right away
                await this.startMic();
                this.setState('listening');
            };
            
            this.ws.onmessage = async (event) => {
                try {
                    const msg = JSON.parse(event.data);
                    if (msg.type === 'audio') {
                        // We are receiving voice from Gemini
                        if (this.state !== 'speaking') {
                            this.setState('speaking');
                        }
                        
                        // Buffer and play
                        await this.player?.addChunk(msg.data);
                    }
                } catch (e) {
                    console.error('[VoiceClient] Failed to parse message', e);
                }
            };

            this.ws.onclose = () => {
                console.log('[VoiceClient] Disconnected');
                this.disconnect();
            };

            this.ws.onerror = (e) => {
                console.error('[VoiceClient] WebSocket error', e);
                this.setState('error');
            };

        } catch (err) {
            console.error('[VoiceClient] Connection failed:', err);
            this.setState('error');
        }
    }

    private async startMic() {
        if (!this.mic) {
            this.mic = new MicCapture();
        }
        
        // When we get PCM16 data, send it to the WebSocket relay
        this.mic.onAudioData = (pcm16) => {
            if (this.ws?.readyState === WebSocket.OPEN) {
                // Determine if we should send
                // Convert Int16Array to Base64
                this.sendPcm(pcm16);
            }
        };

        // UI volume level
        this.mic.onVolumeChange = (rms) => {
            if (this.onVolumeChange) {
                // Simple noise gate for UI
                if (rms < 0.01) rms = 0;
                this.onVolumeChange(rms);
                
                // Switch back to listening state if we were speaking but the audio finished
                // This requires tracking when playback ends, but for now we fallback slowly
            }
        };

        await this.mic.start();
    }

    // Fast Int16Array to Base64
    private sendPcm(pcm16: Int16Array) {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
        
        const buffer = new ArrayBuffer(pcm16.length * 2);
        const view = new DataView(buffer);
        for (let i = 0; i < pcm16.length; i++) {
            view.setInt16(i * 2, pcm16[i], true); // true = little-endian
        }
        
        // Convert to base64
        let binary = '';
        const bytes = new Uint8Array(buffer);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        const b64 = btoa(binary);

        this.ws.send(JSON.stringify({
            type: 'audio',
            data: b64
        }));
    }

    private setState(state: OrbState) {
        this.state = state;
        if (this.onStateChange) this.onStateChange(state);
    }

    disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        if (this.mic) {
            this.mic.stop();
            this.mic = null;
        }
        if (this.player) {
            this.player.stop();
            this.player = null;
        }
        this.setState('idle');
    }
}
