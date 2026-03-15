import { NextResponse } from 'next/server';
import { verifyAuth } from '@/src/lib/firebase/apiAuth';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(request: Request) {
    const auth = await verifyAuth(request);
    if (auth instanceof Response) return auth;

    try {
        const { prompt } = await request.json();
        if (!prompt) {
            return NextResponse.json({ error: 'Prompt required' }, { status: 400 });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 });
        }

        // Use Gemini 3 Pro Image Preview (Nano Banana Pro) — highest quality model
        // Fallback to gemini-2.5-flash-image if Pro unavailable
        const models = [
            'gemini-3-pro-image-preview',
            'gemini-2.5-flash-image',
        ];

        const enhancedPrompt = [
            `Create a breathtaking, ultra-high-resolution travel photograph: ${prompt}.`,
            `Style: Shot on a Sony A7R V with a 24-70mm f/2.8 GM lens.`,
            `Lighting: Golden hour natural light with soft, warm tones and cinematic depth of field.`,
            `Quality: 8K resolution, professional color grading, ultra-sharp details.`,
            `Mood: Luxurious, aspirational, magazine-cover worthy.`,
            `Rules: No text, no watermarks, no logos, no people's faces, no borders or frames.`,
            `The image should look like it belongs in a premium travel magazine like Condé Nast Traveler.`,
        ].join(' ');

        let imageData: { data: string; mimeType: string } | null = null;

        for (const model of models) {
            try {
                console.log(`[AI Image] Trying model: ${model}`);
                const response = await fetch(
                    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            contents: [{
                                parts: [{ text: enhancedPrompt }]
                            }],
                            generationConfig: {
                                responseModalities: ["IMAGE", "TEXT"],
                            },
                        }),
                    }
                );

                if (response.ok) {
                    const data = await response.json();
                    const parts = data.candidates?.[0]?.content?.parts || [];
                    const imagePart = parts.find((p: any) => p.inlineData?.data);
                    if (imagePart?.inlineData?.data) {
                        imageData = {
                            data: imagePart.inlineData.data,
                            mimeType: imagePart.inlineData.mimeType || 'image/png'
                        };
                        console.log(`[AI Image] Success with model: ${model}`);
                        break;
                    }
                } else {
                    const err = await response.text();
                    console.log(`[AI Image] ${model} failed:`, err.slice(0, 200));
                }
            } catch (e: any) {
                console.log(`[AI Image] ${model} error:`, e.message);
            }
        }

        if (!imageData) {
            return NextResponse.json({ error: 'Aucun modèle de génération disponible. Vérifiez votre clé API.' }, { status: 422 });
        }

        // Save image to disk
        const buffer = Buffer.from(imageData.data, 'base64');
        const ext = imageData.mimeType.split('/')[1]?.replace('jpeg', 'jpg') || 'png';
        const filename = `ai_${Date.now()}.${ext}`;

        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'ai');
        await mkdir(uploadDir, { recursive: true });
        await writeFile(path.join(uploadDir, filename), buffer);

        const url = `/uploads/ai/${filename}`;
        console.log(`[AI Image] Generated: ${url} (${(buffer.length / 1024).toFixed(0)}KB)`);

        return NextResponse.json({ url, filename, mimeType: imageData.mimeType });
    } catch (error: any) {
        console.error('[AI Image] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
