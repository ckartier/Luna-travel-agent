'use client';

import { motion } from 'framer-motion';
import { CheckCircle, Mail, ArrowRight, Shield, Download, Headphones } from 'lucide-react';
import Link from 'next/link';
import { LunaLogo } from '@/app/components/LunaLogo';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

const PLAN_DETAILS: Record<string, { name: string; description: string }> = {
    self_hosted_code: {
        name: 'Code Source',
        description: 'Vous recevrez le code source complet par email sous 24h avec les instructions d\'installation.',
    },
    self_hosted_install: {
        name: 'Code + Installation',
        description: 'Notre équipe vous contactera sous 24h pour planifier le déploiement sur votre infrastructure.',
    },
    self_hosted_formation: {
        name: 'Code + Install + Formation',
        description: 'Notre équipe vous contactera sous 24h pour planifier le déploiement et organiser votre session de formation.',
    },
};

function SuccessContent() {
    const params = useSearchParams();
    const planId = params.get('plan') || 'self_hosted_code';
    const plan = PLAN_DETAILS[planId] || PLAN_DETAILS.self_hosted_code;

    return (
        <div className="min-h-screen bg-luna-bg flex flex-col">
            {/* Navbar */}
            <nav className="flex items-center justify-between px-6 md:px-12 py-5 max-w-[1200px] mx-auto w-full">
                <Link href="/" className="flex items-center gap-3 cursor-pointer">
                    <LunaLogo size={28} />
                </Link>
                <Link href="/pricing" className="text-[13px] text-luna-text-muted hover:text-luna-charcoal transition-colors cursor-pointer">
                    ← Retour aux tarifs
                </Link>
            </nav>

            {/* Content */}
            <div className="flex-1 flex items-center justify-center px-6 pb-20">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="max-w-[480px] w-full text-center"
                >
                    {/* Icon */}
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                        className="w-16 h-16 rounded-[16px] bg-[#D3E8E3] flex items-center justify-center mx-auto mb-8"
                    >
                        <CheckCircle size={28} className="text-luna-charcoal" strokeWidth={1.5} />
                    </motion.div>

                    <h1 className="text-[28px] text-luna-charcoal tracking-tight mb-4">
                        Paiement confirmé
                    </h1>

                    <div className="inline-flex items-center gap-2 bg-luna-warm-gray text-luna-charcoal px-4 py-2 rounded-[10px] text-[12px] mb-6">
                        <Download size={12} />
                        {plan.name}
                    </div>

                    <p className="text-luna-text-muted text-[14px] leading-relaxed mb-8">
                        {plan.description}
                    </p>

                    {/* Info cards */}
                    <div className="grid grid-cols-3 gap-3 mb-8">
                        {[
                            { icon: Mail, title: 'Email envoyé', desc: 'À votre adresse' },
                            { icon: Headphones, title: 'Support dédié', desc: 'contact@luna-travel.io' },
                            { icon: Shield, title: 'Garantie 14j', desc: 'Remboursement sans condition' },
                        ].map((item, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 + i * 0.08 }}
                                className="glass-card-premium p-4"
                            >
                                <item.icon size={14} className="text-luna-text-muted mx-auto mb-2" strokeWidth={1.5} />
                                <div className="text-[11px] text-luna-charcoal mb-0.5">{item.title}</div>
                                <p className="text-[10px] text-luna-text-muted">{item.desc}</p>
                            </motion.div>
                        ))}
                    </div>

                    {/* CTA */}
                    <div className="flex flex-col sm:flex-row gap-2 justify-center">
                        <Link
                            href="/"
                            className="px-5 py-3 bg-luna-charcoal text-white rounded-[12px] text-[13px] hover:bg-[#1a1a1a] transition-colors cursor-pointer flex items-center justify-center gap-2"
                        >
                            Retour à l&apos;accueil <ArrowRight size={14} />
                        </Link>
                        <a
                            href="mailto:contact@luna-travel.io"
                            className="px-5 py-3 bg-white text-luna-charcoal border border-gray-100 rounded-[12px] text-[13px] hover:bg-luna-warm-gray transition-colors cursor-pointer flex items-center justify-center gap-2"
                        >
                            <Mail size={14} /> Contacter le support
                        </a>
                    </div>
                </motion.div>
            </div>

            {/* Footer */}
            <footer className="border-t border-gray-100 py-5 px-6">
                <div className="max-w-[1200px] mx-auto flex items-center justify-center gap-3">
                    <LunaLogo size={16} />
                    <span className="text-[11px] text-luna-text-muted">© 2026 Luna — Concierge Voyage</span>
                </div>
            </footer>
        </div>
    );
}

export default function PricingSuccessPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-luna-bg flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-gray-200 border-t-luna-charcoal rounded-full animate-spin" />
            </div>
        }>
            <SuccessContent />
        </Suspense>
    );
}
