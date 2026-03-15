import { ReactNode } from 'react';
import { LangProvider } from './LangContext';
import NavAndFooter from './NavAndFooter';

export const metadata = {
    title: 'Luna Conciergerie | Travel beautifully.',
};

export default function ConciergeLayout({ children }: { children: ReactNode }) {
    return (
        <div className="min-h-screen bg-[#faf8f5] text-luna-charcoal font-sans selection:bg-luna-primary selection:text-white">
            <LangProvider>
                <NavAndFooter>
                    {children}
                    <meta name="description" content="L&apos;alliance de l&apos;intelligence artificielle et de l&apos;humain." />
                </NavAndFooter>
            </LangProvider>
        </div>
    );
}
