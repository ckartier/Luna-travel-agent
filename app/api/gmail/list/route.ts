import { NextResponse } from 'next/server';
import { verifyAuth } from '@/src/lib/firebase/apiAuth';
import { listEmails, getEmailContent } from '@/src/lib/gmail/api';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const auth = await verifyAuth(request);
    if (auth instanceof Response) return auth;
    try {
        const { searchParams } = new URL(request.url);
        const query = searchParams.get('q') || '';
        const action = searchParams.get('action'); // 'list' or 'get'
        const messageId = searchParams.get('messageId');
        const folder = searchParams.get('folder') || 'inbox'; // 'inbox', 'archive', 'trash'

        if (action === 'get' && messageId) {
            const emailContent = await getEmailContent(messageId);
            return NextResponse.json(emailContent);
        }

        const filter = searchParams.get('filter') || 'site'; // 'site' = only site emails, 'all' = everything

        let baseQuery = '';
        let includeSpamTrash = false;

        if (folder === 'inbox') {
            // Filter: only show site-generated emails (contact form submissions)
            if (filter === 'site') {
                baseQuery = 'in:inbox subject:[Luna B2C]';
            } else {
                baseQuery = 'in:inbox -from:ckartier@gmail.com';
            }
        } else if (folder === 'archive') {
            if (filter === 'site') {
                baseQuery = '-in:inbox -in:trash -in:sent -in:spam -in:draft subject:[Luna B2C]';
            } else {
                baseQuery = '-in:inbox -in:trash -in:sent -in:spam -in:draft -from:ckartier@gmail.com';
            }
        } else if (folder === 'trash') {
            baseQuery = 'in:trash';
            includeSpamTrash = true;
        }

        const mailQuery = query ? `${baseQuery} ${query}` : baseQuery;
        const emails = await listEmails(mailQuery, 20, includeSpamTrash);
        return NextResponse.json({ emails });
    } catch (error: any) {
        console.error('API /gmail/list error:', error);
        return NextResponse.json({ error: error.message || 'Failed to fetch emails' }, { status: 500 });
    }
}
