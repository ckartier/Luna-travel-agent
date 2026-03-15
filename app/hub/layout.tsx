import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Datarnivore | Hub Produits',
    description: 'Datarnivore — Agence de création SaaS, CRM et applications intelligentes.',
};

export default function HubLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
