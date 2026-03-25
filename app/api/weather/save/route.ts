export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { verifyAuth } from '@/src/lib/firebase/apiAuth';
import { adminDb } from '@/src/lib/firebase/admin';

export async function POST(request: Request) {
    const auth = await verifyAuth(request);
    if (auth instanceof Response) return auth;

    try {
        const { city, weather } = await request.json();

        if (!city || !weather) {
            return NextResponse.json({ error: 'city and weather data required' }, { status: 400 });
        }

        const key = city.trim().toLowerCase().replace(/\s+/g, '-');

        // Save to Firestore under weather collection
        await adminDb.collection('weather').doc(key).set({
            city: weather.city || city,
            country: weather.country || '',
            current: weather.current,
            forecast: weather.forecast || [],
            lastUpdated: new Date().toISOString(),
            fetchedBy: auth.uid,
        }, { merge: true });

        return NextResponse.json({ success: true, key });
    } catch (error: any) {
        console.error('Save weather error:', error);
        return NextResponse.json({ error: 'Failed to save weather data' }, { status: 500 });
    }
}
