'use client';

export default function GlobalLoading() {
    return (
        <div className="fixed top-0 left-0 right-0 h-[2px] z-[9999] overflow-hidden">
            <div className="h-full bg-luna-charcoal w-full origin-left animate-loading-bar" />
            <style jsx>{`
                @keyframes loading-bar {
                    0% { transform: translateX(-100%); }
                    50% { transform: translateX(-20%); }
                    100% { transform: translateX(0%); }
                }
                .animate-loading-bar {
                    animation: loading-bar 1.5s ease-in-out infinite;
                }
            `}</style>
        </div>
    );
}
