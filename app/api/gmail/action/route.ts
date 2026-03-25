export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { verifyAuth } from '@/src/lib/firebase/apiAuth';
import { archiveEmail, trashEmail } from '@/src/lib/gmail/api';

export async function POST(request: Request) {
    const auth = await verifyAuth(request);
    if (auth instanceof Response) return auth;

    try {
        const body = await request.json();
        const { action, messageId } = body;

        if (!messageId) {
            return NextResponse.json({ error: 'messageId is required' }, { status: 400 });
        }

        if (action === 'archive') {
            await archiveEmail(messageId);
            return NextResponse.json({ success: true, message: 'Email archived' });
        } else if (action === 'trash') {
            await trashEmail(messageId);
            return NextResponse.json({ success: true, message: 'Email moved to trash' });
        } else {
            return NextResponse.json({ error: 'Invalid action. Use "archive" or "trash"' }, { status: 400 });
        }
    } catch (error: any) {
        console.error('API /gmail/action error:', error);
        return NextResponse.json({ error: error.message || 'Failed to perform action' }, { status: 500 });
    }
}
