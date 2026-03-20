import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Hub Site | Datarnivore',
    description: 'Site vitrine généré par le Hub Site Builder',
};

export default function HubSiteLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
