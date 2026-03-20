import { NextResponse } from 'next/server';
import { adminDb } from '@/src/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

export const dynamic = 'force-dynamic';

// ── POST: Receive contact form submissions ──
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, email, message, phone, subject } = body;

        if (!name || !email || !message) {
            return NextResponse.json(
                { error: 'Missing required fields: name, email, message' },
                { status: 400 }
            );
        }

        // Basic email validation
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
        }

        const contactData = {
            name: name.trim(),
            email: email.trim().toLowerCase(),
            message: message.trim(),
            phone: phone?.trim() || '',
            subject: subject?.trim() || 'Contact Hub',
            status: 'new',
            readAt: null,
            createdAt: FieldValue.serverTimestamp(),
        };

        const docRef = await adminDb.collection('hub_contacts').add(contactData);

        return NextResponse.json({ success: true, id: docRef.id });
    } catch (error: any) {
        console.error('[HubContact] POST error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// ── GET: List contact submissions (for admin) ──
export async function GET(request: Request) {
    try {
        const snap = await adminDb.collection('hub_contacts')
            .orderBy('createdAt', 'desc')
            .limit(50)
            .get();

        const contacts = snap.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || null,
            readAt: doc.data().readAt?.toDate?.()?.toISOString() || null,
        }));

        return NextResponse.json({ contacts });
    } catch (error: any) {
        console.error('[HubContact] GET error:', error);
        return NextResponse.json({ contacts: [] });
    }
}
