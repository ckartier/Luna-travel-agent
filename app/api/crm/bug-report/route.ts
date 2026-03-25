export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { adminDb } from '@/src/lib/firebase/admin';
import { GoogleGenAI } from '@google/genai';
import { verifyAuth } from '@/src/lib/firebase/apiAuth';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

// POST — Submit a bug report
export async function POST(req: Request) {
    try {
        // Auth check
        const auth = await verifyAuth(req);
        if (auth instanceof Response) return auth;

        const body = await req.json();
        const { action } = body;

        // ── Analyze bug reports with Gemini ──
        if (action === 'analyze') {
            const snap = await adminDb.collection('bug_reports').orderBy('createdAt', 'desc').limit(50).get();
            const reports = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));

            if (reports.length === 0) {
                return NextResponse.json({ analysis: 'Aucun bug signalé pour le moment. 🎉' });
            }

            const reportsSummary = reports.map((r: any, i: number) =>
                `${i + 1}. [${r.severity || 'normal'}] ${r.title} — ${r.description} (page: ${r.page || 'N/A'}, date: ${r.createdAt?.toDate?.()?.toISOString?.() || 'N/A'})`
            ).join('\n');

            const prompt = `Tu es un expert QA/DevOps. Analyse les bug reports suivants d'une application SaaS de conciergerie de voyage (Luna Conciergerie).

Bug reports:
${reportsSummary}

Génère un rapport structuré en français avec:
1. **Résumé exécutif** — Vue d'ensemble
2. **Bugs critiques** — À traiter en priorité
3. **Tendances** — Patterns récurrents
4. **Recommandations** — Actions concrètes
5. **Score de santé** — Note sur 10

Utilise des emojis et un format Markdown propre.`;

            try {
                const result = await ai.models.generateContent({ model: 'gemini-3.1-flash', contents: prompt });
                return NextResponse.json({ analysis: result.text || 'Analyse indisponible.' });
            } catch {
                return NextResponse.json({ analysis: `## Rapport automatique\n\n${reports.length} bugs signalés. Analyse IA indisponible — vérifiez GEMINI_API_KEY.` });
            }
        }

        // ── Submit new bug report ──
        const { title, description, severity, page, userAgent, userId, userName, userEmail } = body;
        if (!title || !description) {
            return NextResponse.json({ error: 'Titre et description requis' }, { status: 400 });
        }

        const docRef = await adminDb.collection('bug_reports').add({
            title,
            description,
            severity: severity || 'normal',
            page: page || '',
            userAgent: userAgent || '',
            userId: userId || '',
            userName: userName || '',
            userEmail: userEmail || '',
            status: 'open',
            createdAt: new Date(),
        });

        return NextResponse.json({ id: docRef.id, success: true });
    } catch (error: any) {
        console.error('[Bug Report] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// GET — List all bug reports
export async function GET() {
    try {
        const snap = await adminDb.collection('bug_reports').orderBy('createdAt', 'desc').limit(100).get();
        const reports = snap.docs.map((d: any) => {
            const data = d.data();
            return {
                id: d.id,
                ...data,
                createdAt: data.createdAt?.toDate?.()?.toISOString?.() || null,
            };
        });
        return NextResponse.json(reports);
    } catch (error: any) {
        console.error('[Bug Report] GET Error:', error);
        return NextResponse.json([], { status: 500 });
    }
}
