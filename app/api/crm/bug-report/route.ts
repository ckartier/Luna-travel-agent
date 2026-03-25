export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/src/lib/firebase/admin';
import { GoogleGenAI } from '@google/genai';
import { verifyAuth } from '@/src/lib/firebase/apiAuth';
import { FieldValue } from 'firebase-admin/firestore';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

async function resolveTenantIdFromAuth(request: Request): Promise<string | Response> {
    const auth = await verifyAuth(request);
    if (auth instanceof Response) return auth;
    if (!auth.tenantId) {
        return NextResponse.json({ error: 'Tenant required' }, { status: 403 });
    }
    return auth.tenantId;
}

async function resolveTenantIdFromRequest(request: NextRequest): Promise<string | Response | null> {
    const authHeader = request.headers.get('Authorization');

    if (authHeader?.startsWith('Bearer ')) {
        const auth = await verifyAuth(request);
        if (auth instanceof Response) return auth;
        if (!auth.tenantId) {
            return NextResponse.json({ error: 'Tenant required' }, { status: 403 });
        }
        return auth.tenantId;
    }

    const tenantIdFromQuery = request.nextUrl.searchParams.get('tenantId');
    if (tenantIdFromQuery) return tenantIdFromQuery;

    const tenantsSnap = await adminDb.collection('tenants').limit(1).get();
    if (tenantsSnap.empty) return null;
    return tenantsSnap.docs[0].id;
}

async function fetchBugReportsForTenant(tenantId: string, limit: number) {
    const tenantBugRef = adminDb.collection('tenants').doc(tenantId).collection('bug_reports');
    try {
        const tenantSnap = await tenantBugRef.orderBy('createdAt', 'desc').limit(limit).get();
        return tenantSnap;
    } catch {
        return tenantBugRef.limit(limit).get();
    }
}

function serializeBug(doc: FirebaseFirestore.QueryDocumentSnapshot | FirebaseFirestore.DocumentSnapshot) {
    const data: any = doc.data() || {};
    const toIso = (value: any) => value?.toDate?.()?.toISOString?.() || null;
    return {
        id: doc.id,
        ...data,
        createdAt: toIso(data.createdAt),
        updatedAt: toIso(data.updatedAt),
        resolvedAt: toIso(data.resolvedAt),
    };
}

// POST — Submit a bug report or run analysis
export async function POST(req: Request) {
    try {
        const tenantId = await resolveTenantIdFromAuth(req);
        if (tenantId instanceof Response) return tenantId;

        const body = await req.json();
        const { action } = body;

        if (action === 'analyze') {
            const snap = await fetchBugReportsForTenant(tenantId, 50);
            const reports = snap.docs.map((d: any) => serializeBug(d));

            if (reports.length === 0) {
                return NextResponse.json({ analysis: 'Aucun bug signalé pour le moment. 🎉' });
            }

            const reportsSummary = reports.map((r: any, i: number) =>
                `${i + 1}. [${r.severity || 'normal'}] ${r.title} — ${r.description} (page: ${r.page || 'N/A'}, date: ${r.createdAt || 'N/A'})`
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

        const { title, description, severity, page, userAgent, userId, userName, userEmail } = body;
        if (!title || !description) {
            return NextResponse.json({ error: 'Titre et description requis' }, { status: 400 });
        }

        const payload = {
            title: title.trim(),
            description: description.trim(),
            severity: severity || 'normal',
            page: page || '',
            userAgent: userAgent || '',
            userId: userId || '',
            userName: userName || '',
            userEmail: userEmail || '',
            tenantId,
            status: 'open',
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
        };

        const docRef = await adminDb.collection('tenants').doc(tenantId).collection('bug_reports').add(payload);

        return NextResponse.json({ id: docRef.id, success: true });
    } catch (error: any) {
        console.error('[Bug Report] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// GET — List tenant bug reports
export async function GET(request: NextRequest) {
    try {
        const resolvedTenant = await resolveTenantIdFromRequest(request);
        if (resolvedTenant instanceof Response) return resolvedTenant;
        if (!resolvedTenant) return NextResponse.json([]);

        const snap = await fetchBugReportsForTenant(resolvedTenant, 100);
        const reports = snap.docs.map((d: any) => serializeBug(d));
        return NextResponse.json(reports);
    } catch (error: any) {
        console.error('[Bug Report] GET Error:', error);
        return NextResponse.json([], { status: 500 });
    }
}

// PUT — Update bug status (open/resolved)
export async function PUT(request: Request) {
    try {
        const tenantId = await resolveTenantIdFromAuth(request);
        if (tenantId instanceof Response) return tenantId;

        const body = await request.json();
        const { id, status } = body || {};
        if (!id || !['open', 'resolved'].includes(status)) {
            return NextResponse.json({ error: 'id and valid status are required' }, { status: 400 });
        }

        const updates: any = {
            status,
            updatedAt: FieldValue.serverTimestamp(),
            resolvedAt: status === 'resolved' ? FieldValue.serverTimestamp() : null,
        };

        const tenantDocRef = adminDb.collection('tenants').doc(tenantId).collection('bug_reports').doc(id);
        const tenantDoc = await tenantDocRef.get();
        if (!tenantDoc.exists) {
            return NextResponse.json({ error: 'Bug not found' }, { status: 404 });
        }

        await tenantDocRef.update(updates);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('[Bug Report] PUT Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
