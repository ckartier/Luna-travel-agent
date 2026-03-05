'use client';

import { useEffect } from 'react';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
    useEffect(() => {
        console.error('Application error:', error);
    }, [error]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-6">
            <div className="text-center max-w-md">
                <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                </div>
                <h2 className="text-xl font-serif font-bold text-gray-900 mb-2">Une erreur est survenue</h2>
                <p className="text-sm text-gray-500 mb-6">
                    {error.message || 'Quelque chose s\'est mal passé. Veuillez réessayer.'}
                </p>
                <button onClick={() => reset()}
                    className="px-6 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors shadow-sm">
                    Réessayer
                </button>
            </div>
        </div>
    );
}
