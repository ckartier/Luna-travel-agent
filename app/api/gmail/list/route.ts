import { NextResponse } from 'next/server';
import { verifyAuth } from '@/src/lib/firebase/apiAuth';
import { listEmails, getEmailContent } from '@/src/lib/gmail/api';

export async function GET(request: Request) {
    const auth = await verifyAuth(request);
    if (auth instanceof Response) return auth;
    try {
        const { searchParams } = new URL(request.url);
        const query = searchParams.get('q') || '';
        const action = searchParams.get('action'); // 'list' or 'get'
        const messageId = searchParams.get('messageId');

        if (action === 'get' && messageId) {
            const emailContent = await getEmailContent(messageId);
            return NextResponse.json(emailContent);
        }

        // Default: list emails
        const emails = await listEmails(query);
        return NextResponse.json({ emails });
    } catch (error: any) {
        console.error('API /gmail/list error:', error);
        return NextResponse.json({ error: error.message || 'Failed to fetch emails' }, { status: 500 });
    }
}
