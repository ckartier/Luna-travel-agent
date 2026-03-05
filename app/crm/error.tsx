'use client';

import { useEffect } from 'react';

export default function CRMError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
    useEffect(() => {
        console.error('CRM error:', error);
    }, [error]);

    return (
        <div className="flex items-center justify-center py-20">
            <div className="text-center max-w-md">
                <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                        <line x1="12" y1="9" x2="12" y2="13" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                </div>
                <h2 className="text-lg font-serif font-bold text-luna-charcoal mb-2">Erreur dans le CRM</h2>
                <p className="text-sm text-gray-500 mb-5">{error.message || 'Un problème est survenu dans cette section.'}</p>
                <button onClick={() => reset()}
                    className="px-5 py-2 bg-luna-charcoal text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors">
                    Réessayer
                </button>
            </div>
        </div>
    );
}
