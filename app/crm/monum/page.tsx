import { redirect } from 'next/navigation';

export default function MonumCRMEntry() {
    const defaultMonumAppUrl = process.env.NODE_ENV === 'development'
        ? 'http://127.0.0.1:4173'
        : 'https://monum.app';
    const monumAppUrl = (process.env.NEXT_PUBLIC_MONUM_APP_URL || defaultMonumAppUrl).replace(/\/$/, '');

    redirect(`${monumAppUrl}/app`);
}
