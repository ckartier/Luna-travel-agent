export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { verifyAuth } from '@/src/lib/firebase/apiAuth';
import path from 'path';

/* ═══════════════════════════════════════════════════
   TTS Provider Configuration
   Priority: ElevenLabs (premium) → Kokoro (free) → Google Cloud (fallback)
   ═══════════════════════════════════════════════════ */

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_VOICE_ID = process.env.ELEVENLABS_VOICE_ID || 'rbFGGoDXFHtVghjHuS3E';

// Google Cloud TTS fallback
const keyPath = path.join(process.cwd(), 'luna-travel-agent-firebase-adminsdk-fbsvc-b2c7ba5ed8.json');
let googleTtsClient: any = null;

/* ═══════════════════════════════════════════════════
   Kokoro TTS — truly lazy singleton (never loaded unless needed)
   ═══════════════════════════════════════════════════ */
let kokoroInstance: any = null;
let kokoroLoadFailed = false;

async function getKokoroTTS(): Promise<any> {
  if (kokoroInstance) return kokoroInstance;
  if (kokoroLoadFailed) return null; // Don't retry a failed load within the same process

  try {
    console.log('[TTS] 🔄 Loading Kokoro model (first request only)...');
    const { KokoroTTS } = await import('kokoro-js');
    const tts = await KokoroTTS.from_pretrained('onnx-community/Kokoro-82M-v1.0-ONNX', {
      dtype: 'q8',
      device: 'cpu',
    });
    kokoroInstance = tts;
    console.log('[TTS] ✅ Kokoro model loaded');
    return tts;
  } catch (err: any) {
    console.error('[TTS] ❌ Kokoro load failed:', err.message);
    kokoroLoadFailed = true;
    return null;
  }
}

function float32ToWav(float32: Float32Array, sampleRate: number): Buffer {
  const bytesPerSample = 2;
  const dataLength = float32.length * bytesPerSample;
  const buffer = Buffer.alloc(44 + dataLength);
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataLength, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * bytesPerSample, 28);
  buffer.writeUInt16LE(bytesPerSample, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataLength, 40);
  for (let i = 0; i < float32.length; i++) {
    const s = Math.max(-1, Math.min(1, float32[i]));
    buffer.writeInt16LE(Math.round(s < 0 ? s * 0x8000 : s * 0x7FFF), 44 + i * 2);
  }
  return buffer;
}

async function synthesizeWithKokoro(text: string): Promise<Buffer | null> {
  try {
    const tts = await getKokoroTTS();
    if (!tts) return null;
    const audio = await tts.generate(text, { voice: 'ff_siwis' });
    return float32ToWav(audio.data as Float32Array, 24000);
  } catch (err: any) {
    console.error('[TTS] Kokoro synthesis error:', err.message);
    return null;
  }
}

/* ═══════════════════════════════════════════════════
   Google Cloud TTS
   ═══════════════════════════════════════════════════ */
async function getGoogleTtsClient() {
  if (googleTtsClient) return googleTtsClient;
  try {
    const textToSpeech = await import('@google-cloud/text-to-speech');
    googleTtsClient = new textToSpeech.TextToSpeechClient({ keyFilename: keyPath });
    return googleTtsClient;
  } catch {
    return null;
  }
}

async function synthesizeWithGoogle(cleanText: string): Promise<Buffer | null> {
  try {
    const client = await getGoogleTtsClient();
    if (!client) return null;
    const [response] = await client.synthesizeSpeech({
      input: { text: cleanText },
      voice: { languageCode: 'fr-FR', name: 'fr-FR-Journey-O' },
      audioConfig: { audioEncoding: 'MP3' as const, speakingRate: 1.15 },
    });
    if (!response.audioContent) return null;
    return Buffer.from(response.audioContent);
  } catch (err: any) {
    console.error('[TTS] Google fallback error:', err.message);
    return null;
  }
}

/* ═══════════════════════════════════════════════════
   POST Handler
   ═══════════════════════════════════════════════════ */
export async function POST(request: Request) {
  try {
    const auth = await verifyAuth(request);
    if (auth instanceof Response) return auth;

    let body: any;
    try {
      body = await request.json();
    } catch (parseErr: any) {
      console.error('[TTS] Body parse error:', parseErr.message);
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { text, provider: requestedProvider } = body;

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    const cleanText = text
      .replace(/[#*_`>]/g, '')
      .replace(/⚡/g, '')
      .replace(/\n+/g, '. ')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 2000);

    let audioBuffer: Buffer | null = null;
    let contentType = 'audio/mpeg';
    let usedProvider = 'none';

    // ── Force a specific provider if requested ──
    if (requestedProvider === 'kokoro') {
      audioBuffer = await synthesizeWithKokoro(cleanText);
      if (audioBuffer) { usedProvider = 'kokoro'; contentType = 'audio/wav'; }
    } else if (requestedProvider === 'google') {
      audioBuffer = await synthesizeWithGoogle(cleanText);
      if (audioBuffer) { usedProvider = 'google'; }
    }

    // ── Default cascade: ElevenLabs → Google → Kokoro (lazy, last resort) ──
    if (!audioBuffer) {
      // 1. ElevenLabs (fast, premium)
      if (ELEVENLABS_API_KEY) {
        try {
          const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}/stream`, {
            method: 'POST',
            headers: {
              'Accept': 'audio/mpeg',
              'Content-Type': 'application/json',
              'xi-api-key': ELEVENLABS_API_KEY
            },
            body: JSON.stringify({
              text: cleanText,
              model_id: 'eleven_multilingual_v2',
              voice_settings: { stability: 0.5, similarity_boost: 0.75 }
            })
          });

          if (response.ok) {
            const arrayBuffer = await response.arrayBuffer();
            audioBuffer = Buffer.from(arrayBuffer);
            usedProvider = 'elevenlabs';
            console.log('[TTS] ✅ ElevenLabs OK');
          } else {
            console.warn(`[TTS] ⚠️ ElevenLabs ${response.status}`);
          }
        } catch (err: any) {
          console.warn('[TTS] ⚠️ ElevenLabs error:', err.message);
        }
      }
    }

    // 2. Google Cloud TTS (fast fallback)
    if (!audioBuffer) {
      audioBuffer = await synthesizeWithGoogle(cleanText);
      if (audioBuffer) { usedProvider = 'google'; }
    }

    // 3. Kokoro (last resort — may take time on first load)
    if (!audioBuffer) {
      audioBuffer = await synthesizeWithKokoro(cleanText);
      if (audioBuffer) { usedProvider = 'kokoro'; contentType = 'audio/wav'; }
    }

    if (!audioBuffer || audioBuffer.length < 100) {
      throw new Error('All TTS providers failed');
    }

    return new NextResponse(new Uint8Array(audioBuffer), {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'no-cache',
        'X-TTS-Provider': usedProvider,
      },
    });

  } catch (error: any) {
    console.error('[TTS] Error:', error?.message || error);
    return NextResponse.json(
      { error: error.message || 'TTS service unavailable' },
      { status: 500 }
    );
  }
}
