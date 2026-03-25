'use client';


import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { Plane, Scale, ArrowRight, ExternalLink } from 'lucide-react';

const PRODUCTS = [
    {
        id: 'travel',
        name: 'Luna Travel',
        tagline: 'Concierge Voyage IA',
        desc: 'CRM complet pour agences de voyage : agents IA, pipeline, emails, itinéraires, site vitrine.',
        href: '/landing',
        loginHref: '/crm/luna?vertical=travel',
        crmHref: '/crm/luna?vertical=travel',
        icon: Plane,
        gradient: 'from-[#b9dae9] to-[#8bb8cf]',
        bg: 'bg-[#f8fafb]',
        borderColor: 'border-[#b9dae9]/30',
        hoverBorder: 'hover:border-[#b9dae9]/60',
        textColor: 'text-[#5a8fa3]',
        shadow: 'shadow-[0_0_40px_rgba(185,218,233,0.15)]',
        features: ['Agents IA Voyage', 'Pipeline B2B', 'Emails intelligents', 'Itinéraire jour/jour', 'Site vitrine', 'Facturation'],
    },
    {
        id: 'legal',
        name: 'Le Droit Agent',
        tagline: 'IA Juridique',
        desc: 'CRM pour cabinets d\'avocats : analyse de dossiers IA, jurisprudence, timeline procédurale, honoraires.',
        href: '/legal',
        loginHref: '/crm/avocat?vertical=legal',
        crmHref: '/crm/avocat?vertical=legal',
        icon: Scale,
        gradient: 'from-[#C9A96E] to-[#A08050]',
        bg: 'bg-[#0d0d1a]',
        borderColor: 'border-[#C9A96E]/20',
        hoverBorder: 'hover:border-[#C9A96E]/50',
        textColor: 'text-[#C9A96E]',
        shadow: 'shadow-[0_0_40px_rgba(201,169,110,0.1)]',
        features: ['Analyse IA Dossiers', 'Jurisprudence', 'Timeline Procédure', 'CRM Juridique', 'Honoraires', 'Secret professionnel'],
    },
    {
        id: 'monum',
        name: 'Monum',
        tagline: 'Suivi Chantiers IA',
        desc: 'CRM de suivi de chantiers : planning, budget, fournisseurs et monitoring opérationnel.',
        href: '/landing-monum?vertical=monum',
        loginHref: '/crm/monum?vertical=monum',
        crmHref: '/crm/monum?vertical=monum',
        icon: ExternalLink,
        gradient: 'from-[#c084fc] to-[#9333ea]',
        bg: 'bg-[#0d0a1a]',
        borderColor: 'border-[#c084fc]/20',
        hoverBorder: 'hover:border-[#c084fc]/50',
        textColor: 'text-[#c084fc]',
        shadow: 'shadow-[0_0_40px_rgba(192,132,252,0.1)]',
        features: ['Planning chantier', 'Gestion fournisseurs', 'Budgets', 'Alertes temps réel', 'Rapports IA', 'Coordination équipe'],
    },
];

export default function AdminDemosPage() {


    return (
        <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] to-[#16161f] flex flex-col">

            {/* ── Header ── */}
            <header className="w-full py-8 px-6">
                <div className="max-w-[1100px] mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Image src="/datarnivore-logo.png" alt="Datarnivore" width={52} height={52} className="object-contain hover:opacity-80 transition-opacity" />
                        <div>
                            <h1 className="text-[22px] font-light text-white tracking-tight">
                                DATAR<span className="font-semibold text-[#C9A96E]">NIVORE</span>
                            </h1>
                            <p className="text-[9px] text-white/25 uppercase font-bold tracking-[0.2em] -mt-0.5">Nos Produits</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10">
                        <span className="text-[10px] font-bold text-white/50 uppercase tracking-[0.15em]">Powered by</span>
                        <span className="text-[12px] font-bold text-[#C9A96E] uppercase tracking-[0.1em]">DATARNIVORE</span>
                    </div>
                </div>
            </header>

            {/* ── Products ── */}
            <main className="flex-1 flex items-center justify-center px-6 pb-16">
                <div className="max-w-[1100px] w-full">
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center mb-12">
                        <h2 className="text-[32px] font-light text-white tracking-tight mb-2">
                            Choisissez votre produit
                        </h2>
                        <p className="text-[14px] text-white/25">
                            Même plateforme, différents métiers — sélectionnez la démo à présenter.
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {PRODUCTS.map((product, i) => {
                            const Icon = product.icon;
                            return (
                                <motion.div
                                    key={product.id}
                                    initial={{ opacity: 0, y: 24 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.12, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                                    className={`group relative rounded-[24px] border-2 ${product.borderColor} ${product.hoverBorder} ${product.shadow} transition-all duration-300 overflow-hidden`}
                                >
                                    {/* Top Visual Strip */}
                                    <div className={`${product.bg} p-8 pb-6 relative`}>
                                        {(product.id === 'legal' || product.id === 'monum') && (
                                            <div className="absolute inset-0 bg-gradient-to-br from-[#C9A96E]/5 to-transparent pointer-events-none" />
                                        )}
                                        <div className="flex items-start justify-between relative z-10">
                                            <div>
                                                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${product.gradient} flex items-center justify-center mb-4 shadow-lg`}>
                                                    <Icon size={24} className="text-white" strokeWidth={1.5} />
                                                </div>
                                                <h3 className={`text-[24px] font-light tracking-tight ${(product.id === 'legal' || product.id === 'monum') ? 'text-white' : 'text-[#2E2E2E]'}`}>{product.name}</h3>
                                                <p className={`text-[11px] font-bold uppercase tracking-[0.15em] ${product.textColor} mt-0.5`}>{product.tagline}</p>
                                            </div>
                                        </div>
                                        <p className={`text-[13px] mt-4 leading-relaxed relative z-10 ${(product.id === 'legal' || product.id === 'monum') ? 'text-white/40' : 'text-[#2E2E2E]/40'}`}>{product.desc}</p>
                                    </div>

                                    {/* Features + CTAs */}
                                    <div className="bg-white p-8 pt-6">
                                        <div className="grid grid-cols-2 gap-2 mb-6">
                                            {product.features.map((f, j) => (
                                                <div key={j} className="flex items-center gap-2">
                                                    <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${product.gradient}`} />
                                                    <span className="text-[11px] text-[#2E2E2E]/40">{f}</span>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="flex gap-3">
                                            {'isExternal' in product && product.isExternal ? (
                                                <a href={product.loginHref} target="_blank" rel="noopener noreferrer"
                                                    className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r ${product.gradient} text-white text-[12px] font-semibold uppercase tracking-[0.1em] hover:opacity-90 transition-opacity cursor-pointer`}>
                                                    <ExternalLink size={13} />
                                                    Ouvrir
                                                </a>
                                            ) : (
                                                <>
                                                    <Link href={product.loginHref}
                                                        className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r ${product.gradient} text-white text-[12px] font-semibold uppercase tracking-[0.1em] hover:opacity-90 transition-opacity cursor-pointer`}>
                                                        <ExternalLink size={13} />
                                                        Login
                                                    </Link>
                                                    <Link href={product.crmHref}
                                                        className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-[#2E2E2E] text-white text-[12px] font-semibold uppercase tracking-[0.1em] hover:bg-[#1a1a1a] transition-colors cursor-pointer">
                                                        <ArrowRight size={13} />
                                                        CRM / Dashboard
                                                    </Link>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </main>

            {/* ── Footer ── */}
            <footer className="py-6 text-center">
                <p className="text-[10px] text-white/15">
                    Datarnivore © 2026 — Agence de création SaaS & Applications
                </p>
            </footer>


        </div>
    );
}
