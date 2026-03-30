export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { verifyAuth } from '@/src/lib/firebase/apiAuth';
import { adminDb, admin } from '@/src/lib/firebase/admin';
import { GoogleGenAI } from '@google/genai';

export async function POST(request: Request) {
    try {
        const auth = await verifyAuth(request);
        if (auth instanceof Response) return auth;

        // Use standard uid from the validated token
        const uid = auth.uid;

        const { transcript, vertical } = await request.json();

        if (!transcript || !Array.isArray(transcript) || transcript.length === 0) {
            return NextResponse.json({ error: 'Transcript is required' }, { status: 400 });
        }

        // 1. Save the raw conversation to Firestore for history
        const sessionRef = await adminDb.collection('voice_sessions').add({
            userId: uid,
            vertical: vertical || 'travel',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            messageCount: transcript.length,
            transcript: transcript.map(t => ({
                role: t.role,
                text: t.text,
                timestamp: t.timestamp
            }))
        });

        // 2. Analyze the conversation using Gemini to extract tone and preferences
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.warn('No GEMINI_API_KEY found. Skipping analysis.');
            return NextResponse.json({ success: true, sessionId: sessionRef.id });
        }

        const ai = new GoogleGenAI({ apiKey });
        
        // Convert transcript to pure text to feed into the analyzer prompt
        const conversationText = transcript.map(t => `${t.role.toUpperCase()}: ${t.text}`).join('\n');

        const systemPrompt = `Tu es un analyste expert du comportement client CRM.
Analyse la conversation ci-dessous entre l'Agent IA et l'utilisateur. 
Ton objectif est de mettre à jour le profil de l'utilisateur avec ses préférences sous-jacentes et son ton général. 
Réponds UNIQUEMENT avec un objet JSON strict contenant ces trois clés:
- "tone": (string) Le ton général de l'utilisateur (ex: "Exigeant et pressé", "Amical et détendu", "Très formel")
- "newPreferences": (array of strings) Une liste de nouvelles préférences spécifiques détectées (ex: ["Préfère les vols du matin", "Allergique aux chats", "Cherche toujours du haut de gamme"]). Si aucune nouvelle préférence n'est détectée, renvoie un tableau vide [].
- "summary": (string) Un résumé ultra-concis de 1 ou 2 phrases du besoin global de cette session.

Conversation à analyser:
${conversationText}`;

        const aiResponse = await ai.models.generateContent({
            model: 'gemini-3.1-flash',
            contents: systemPrompt,
            config: {
                responseMimeType: 'application/json'
            }
        });

        const analysisText = aiResponse.text;
        if (analysisText) {
            try {
                const analysis = JSON.parse(analysisText);
                
                // Update the user profile with the newly discovered tone and preferences
                const userRef = adminDb.collection('users').doc(uid);
                
                // We use set with merge:true to create it if it doesn't exist, or update if it does
                const updates: any = {
                    lastVoiceSessionId: sessionRef.id,
                    lastVoiceSessionDate: admin.firestore.FieldValue.serverTimestamp()
                };

                if (analysis.tone) {
                    updates['preferences.communicationTone'] = analysis.tone;
                }

                if (analysis.summary) {
                    updates['lastVoiceSessionSummary'] = analysis.summary;
                }
                
                // For nested fields or array unions, it's safer to use an update operation.
                // Doing an atomic update for the array of new insights:
                await userRef.set(updates, { merge: true });

                if (analysis.newPreferences && analysis.newPreferences.length > 0) {
                    await userRef.update({
                        'preferences.detectedInsights': admin.firestore.FieldValue.arrayUnion(...analysis.newPreferences)
                    });
                }

                console.log(`[VoiceAnalyzer] Successfully analyzed session ${sessionRef.id} for user ${uid}. Tone: ${analysis.tone}`);

            } catch (jsonErr) {
                console.error('[VoiceAnalyzer] Failed to parse JSON from AI analysis:', analysisText, jsonErr);
            }
        }

        return NextResponse.json({ success: true, sessionId: sessionRef.id });

    } catch (error: any) {
        console.error('Conversation saving/analysis error:', error);
        return NextResponse.json(
            { error: error.message || 'Error processing conversation' },
            { status: 500 }
        );
    }
}
