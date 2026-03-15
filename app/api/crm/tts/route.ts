import { NextResponse } from 'next/server';
import textToSpeech from '@google-cloud/text-to-speech';
import { verifyAuth } from '@/src/lib/firebase/apiAuth';
import path from 'path';

// Use absolute path to avoid working directory issues
const keyPath = path.join(process.cwd(), 'luna-travel-agent-firebase-adminsdk-fbsvc-b2c7ba5ed8.json');

// Initialize the TTS client with absolute path credentials
const client = new textToSpeech.TextToSpeechClient({
  keyFilename: keyPath,
});

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

    const { text, vertical } = body;

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    // Clean the text of any problematic characters
    const cleanText = text
      .replace(/[#*_`>]/g, '')
      .replace(/⚡/g, '')
      .replace(/\n+/g, '. ')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 2000); // Limit to 2000 chars max

    // Journey-O = voix féminine voco-expressive de dernière génération de Google
    const voiceName = vertical === 'legal' ? 'fr-FR-Journey-O' : 'fr-FR-Journey-O';

    const [response] = await client.synthesizeSpeech({
      input: { text: cleanText },
      voice: { languageCode: 'fr-FR', name: voiceName },
      audioConfig: { audioEncoding: 'MP3' as const, speakingRate: 1.15 },
    });

    if (!response.audioContent) {
      throw new Error('No audio content returned from TTS API');
    }

    // Return the audio buffer with the correct MIME type
    const audioBuffer = Buffer.from(response.audioContent);
    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'no-cache',
      },
    });

  } catch (error: any) {
    console.error('[TTS] Error:', error?.message || error);
    console.error('[TTS] Stack:', error?.stack?.split('\n').slice(0, 3).join('\n'));
    return NextResponse.json(
      { error: error.message || 'TTS service unavailable' },
      { status: 500 }
    );
  }
}
