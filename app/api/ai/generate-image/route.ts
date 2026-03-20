import { NextResponse } from 'next/server';
import { verifyAuth } from '@/src/lib/firebase/apiAuth';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

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

        const enhancedPrompt = [
            `Create a breathtaking, ultra-high-resolution travel photograph: ${prompt}.`,
            `Style: Shot on a Sony A7R V with a 24-70mm f/2.8 GM lens.`,
            `Lighting: Golden hour natural light with soft, warm tones and cinematic depth of field.`,
            `Quality: 8K resolution, professional color grading, ultra-sharp details.`,
            `Mood: Luxurious, aspirational, magazine-cover worthy.`,
            `Rules: No text, no watermarks, no logos, no people's faces, no borders or frames.`,
            `The image should look like it belongs in a premium travel magazine like Condé Nast Traveler.`,
        ].join(' ');

        // Gemini Image Models — order by preference
        const models = [
            'gemini-2.5-flash-image',
            'gemini-3-pro-image-preview',
        ];

        let imageData: { data: string; mimeType: string } | null = null;
        let lastError = '';

        for (const model of models) {
            // Retry up to 3 times per model (Google Paid Tier 1 bug: returns 429 free_tier limit:0 initially)
            for (let attempt = 0; attempt < 3; attempt++) {
                try {
                    console.log(`[AI Image] Trying ${model} (attempt ${attempt + 1}/3)`);
                    const response = await fetch(
                        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
                        {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                contents: [{ parts: [{ text: enhancedPrompt }] }],
                                generationConfig: {
                                    responseModalities: ['TEXT', 'IMAGE'],
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
                                mimeType: imagePart.inlineData.mimeType || 'image/png',
                            };
                            console.log(`[AI Image] ✅ Success with ${model} on attempt ${attempt + 1}`);
                            break;
                        }
                    } else {
                        const err = await response.json();
                        lastError = err.error?.message || 'Unknown error';
                        
                        // Extract retryDelay from error details if present
                        const retryInfo = err.error?.details?.find((d: any) => d.retryDelay);
                        const retryDelaySec = retryInfo?.retryDelay ? parseInt(retryInfo.retryDelay) || 5 : 5;
                        
                        if (response.status === 429 && attempt < 2) {
                            console.log(`[AI Image] 429 rate limit on ${model}. Retrying in ${retryDelaySec}s...`);
                            await sleep(retryDelaySec * 1000);
                            continue;
                        }
                        console.log(`[AI Image] ${model} failed (${response.status}):`, lastError.slice(0, 150));
                    }
                } catch (e: any) {
                    lastError = e.message;
                    console.log(`[AI Image] ${model} error:`, e.message);
                }
                // If we got here without continue, break the retry loop
                if (!imageData) break;
            }
            if (imageData) break;
        }

        // Fallback: royalty-free travel photo
        if (!imageData) {
            console.log(`[AI Image] Gemini failed (${lastError.substring(0, 80)}). Falling back to LoremFlickr.`);
            try {
                const keywords = prompt.replace(/[^a-zA-Z0-9\s]/g, '').split(/\s+/).filter(Boolean).slice(0, 3).join(',');
                const url = `https://loremflickr.com/1920/1080/travel,${encodeURIComponent(keywords)}`;

                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), 10000);
                const response = await fetch(url, { signal: controller.signal, redirect: 'follow' });
                clearTimeout(timeout);

                if (response.ok) {
                    const arrayBuffer = await response.arrayBuffer();
                    imageData = {
                        data: Buffer.from(arrayBuffer).toString('base64'),
                        mimeType: response.headers.get('content-type') || 'image/jpeg',
                    };
                }
            } catch (e: any) {
                console.error(`[AI Image] Fallback error:`, e.message);
            }
        }

        if (!imageData) {
            return NextResponse.json(
                { error: 'Impossible de générer l\'image. Veuillez réessayer dans quelques secondes.' },
                { status: 422 }
            );
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
