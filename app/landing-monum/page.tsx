'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import {
    Building2, HardHat, Hammer, Ruler, ArrowRight, Star, Bot, FileText, Pickaxe, BookOpen, Lock, Wallet, CalendarDays
} from 'lucide-react';

const FEATURES = [
    { icon: Bot, title: 'Agent IA Travaux', desc: 'Analyse automatique des devis métiers, prévision des dépassements de budget et scoring des artisans.', color: '#E3E2F3' },
    { icon: CalendarDays, title: 'Plannings Gantt', desc: 'Génération automatique des plannings de chantier, dépendances entre artisans et mises à jour en temps réel.', color: '#bcdeea' },
    { icon: Building2, title: 'Suivi Multi-Chantiers', desc: 'Cockpit centralisé : de la phase d\'étude à la levée des réserves. Voir l\'avancement d\'un coup d\'œil.', color: '#D3E8E3' },
    { icon: HardHat, title: 'Annuaire Artisans', desc: 'Base de données de vos sous-traitants, notation qualité, suivi des attestations et factures.', color: '#E6D2BD' },
    { icon: Wallet, title: 'Gestion Budgétaire', desc: 'Contrôle strict des budgets consommés, rapprochement factures/devis et calcul des marges.', color: '#F2D9D3' },
    { icon: Lock, title: 'Cloud Sécurisé', desc: 'Hébergement haute disponibilité, sauvegarde des plans (PDF, DWG) et conformité totale.', color: '#F3F4F6' },
];

const PLANS_MINI = [
    { name: 'Indépendant', price: 49, desc: 'Chef de chantier solo' },
    { name: 'Studio Archi', price: 99, desc: 'Multi-chantiers + IA + Clients', popular: true },
    { name: 'Promotion', price: 199, desc: 'Grands projets + API + ERP' },
];

const TESTIMONIALS = [
    { name: 'Marc L.', role: 'Architecte DPLG', text: 'Monum a réduit notre temps administratif de 50%. L\'IA détecte instantanément les erreurs dans les devis TCE.', avatar: 'ML' },
    { name: 'Sophie Bernard', role: 'Conductrice de Travaux', text: 'Le diagramme de Gantt interactif est parfait. Dès qu\'un artisan prend du retard, tout le planning s\'ajuste intelligemment.', avatar: 'SB' },
    { name: 'Jean-Pierre C.', role: 'Directeur, Rénovation Pro', text: 'Nos clients adorent les comptes-rendus générés automatiquement. Une transparence qui rassure énormément.', avatar: 'JC' },
];

export default function LandingMonumPage() {
    return (
        <div className="min-h-screen bg-[#F8FAFC] overflow-hidden">
            {/* ── Navbar ── */}
            <nav className="fixed top-0 w-full z-50 bg-[#F8FAFC]/80 backdrop-blur-md border-b border-gray-100">
                <div className="max-w-[1200px] mx-auto flex items-center justify-between px-6 py-4">
                    <Link href="/landing-monum" className="flex items-center gap-3 cursor-pointer">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-[#0f172a] flex items-center justify-center">
                                <Building2 size={16} className="text-[#facc15]" />
                            </div>
                            <span className="text-[16px] text-[#0f172a] tracking-tight font-semibold">
                                Monum
                            </span>
                        </div>
                    </Link>
                    <div className="hidden md:flex items-center gap-8 text-[13px] text-[#64748b]">
                        <a href="#features" className="hover:text-[#0f172a] transition-colors cursor-pointer">Fonctionnalités</a>
                        <a href="#pricing" className="hover:text-[#0f172a] transition-colors cursor-pointer">Tarifs</a>
                        <a href="#testimonials" className="hover:text-[#0f172a] transition-colors cursor-pointer">Témoignages</a>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link href="/login?vertical=monum" className="text-[13px] text-luna-text-muted hover:text-luna-charcoal px-4 py-2 transition-colors cursor-pointer">Connexion</Link>
                        <Link href="/signup?vertical=monum" className="btn-primary text-[13px] bg-[#0f172a] hover:bg-[#1e293b] cursor-pointer">Essai gratuit →</Link>
                    </div>
                </div>
            </nav>

            {/* ── Hero ── */}
            <section className="pt-32 pb-16 px-6 relative">
                <div className="max-w-[900px] mx-auto text-center relative z-10">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                        <span className="inline-block mb-6 text-[10px] font-semibold uppercase tracking-[0.15em] text-[#64748b] bg-[#f1f5f9] px-4 py-1.5 rounded-full border border-[#e2e8f0]">
                            CRM Travaux Nouvelle Génération — <span className="text-[#0f172a] font-semibold">Essai gratuit 14 jours</span>
                        </span>

                        <h1 className="text-[40px] md:text-[56px] leading-[1.1] text-[#0f172a] tracking-tight mb-5">
                            Reprenez le contrôle<br />
                            absolu sur vos <span className="text-[#ca8a04]">chantiers</span>.
                        </h1>

                        <p className="text-[#64748b] text-[15px] max-w-[560px] mx-auto leading-relaxed mb-8">
                            Monum unifie le suivi budgétaire, les plannings et la gestion de vos artisans. L'Agent IA analyse vos devis pour vous éviter les mauvaises surprises.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                            <Link href="/signup?vertical=monum"
                                className="px-7 py-3.5 bg-[#0f172a] text-white rounded-[12px] flex items-center gap-2 text-[13px] cursor-pointer hover:bg-[#1e293b] transition-colors shadow-lg">
                                Lancer mon premier chantier <ArrowRight size={14} />
                            </Link>
                            <a href="#features"
                                className="px-7 py-3.5 rounded-[12px] border border-gray-200 text-[#0f172a] text-[13px] hover:bg-[#f1f5f9] transition-colors cursor-pointer">
                                Découvrir la plateforme
                            </a>
                        </div>
                    </motion.div>

                    {/* Stats */}
                    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                        className="mt-14 flex flex-wrap items-center justify-center gap-10 md:gap-16">
                        {[
                            { value: '30%', label: 'Gain de marge' },
                            { value: '0', label: 'Retards imprévus' },
                            { value: '100%', label: 'Transparence client' },
                            { value: '150+', label: 'Agences équipées' },
                        ].map((s, i) => (
                            <div key={i} className="text-center">
                                <p className="text-[28px] tracking-tight text-[#0f172a]">{s.value}</p>
                                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#64748b] mt-1">{s.label}</p>
                            </div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* ── App Preview (Mockup structural) ── */}
            <section className="px-6 pb-16">
                <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                    className="max-w-[1000px] mx-auto">
                    <div className="bg-[#0f172a] rounded-[16px] p-1.5 shadow-2xl">
                        <div className="bg-[#F8FAFC] rounded-[12px] p-6 md:p-8">
                            <div className="grid grid-cols-3 gap-3 mb-5">
                                {['Gantt & Planning', 'Budgets', 'Agent Travaux'].map((tab, i) => (
                                    <div key={tab} className={`text-center py-2.5 rounded-[10px] text-[12px] transition-all cursor-pointer ${i === 2 ? 'bg-[#0f172a] text-white' : 'bg-white border border-gray-200 text-[#64748b]'}`}>
                                        {tab}
                                    </div>
                                ))}
                            </div>
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                                {['Étude', 'Démolition', 'Gros Œuvre', 'Finitions'].map((stage, i) => (
                                    <div key={stage} className="bg-white rounded-[16px] border border-[#e2e8f0] p-4 relative overflow-hidden">
                                        <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: ['#E3E2F3', '#fef08a', '#facc15', '#ca8a04'][i] }} />
                                        <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#64748b] mb-3 mt-1">{stage}</p>
                                        {Array.from({ length: 3 - (i % 2) }, (_, j) => (
                                            <div key={j} className="bg-[#f8fafc] rounded-[8px] p-2.5 mb-2 border border-dashed border-gray-200">
                                                <div className="w-3/4 h-2 bg-gray-300 rounded mb-1.5" />
                                                <div className="w-1/2 h-1.5 bg-gray-200 rounded" />
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </motion.div>
            </section>

            {/* ── Features ── */}
            <section id="features" className="px-6 py-16 bg-white">
                <div className="max-w-[1000px] mx-auto">
                    <div className="text-center mb-12">
                        <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#64748b] mb-4 inline-block">Fonctionnalités</span>
                        <h2 className="text-[28px] text-[#0f172a] tracking-tight mb-3">La maîtrise totale de vos chantiers</h2>
                        <p className="text-[#64748b] text-[14px] max-w-[480px] mx-auto">Les meilleurs outils du BTP couplés à la puissance de l'Intelligence Artificielle.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {FEATURES.map((f, i) => (
                            <motion.div key={i} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }}
                                className="bg-white rounded-[16px] border border-[#e2e8f0] p-6 hover:border-[#ca8a04]/40 transition-colors cursor-default shadow-sm">
                                <div className="w-10 h-10 rounded-[10px] flex items-center justify-center mb-4" style={{ backgroundColor: f.color }}>
                                    <f.icon size={18} className="text-[#0f172a]" strokeWidth={1.5} />
                                </div>
                                <h3 className="text-[14px] text-[#0f172a] mb-2 font-medium">{f.title}</h3>
                                <p className="text-[12px] text-[#64748b] leading-relaxed">{f.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Testimonials ── */}
            <section id="testimonials" className="px-6 py-16 bg-[#f8fafc]">
                <div className="max-w-[1000px] mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-[28px] text-[#0f172a] tracking-tight mb-3">Ils ont digitalisé leurs chantiers</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {TESTIMONIALS.map((t, i) => (
                            <motion.div key={i} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                                className="bg-white rounded-[16px] border border-[#e2e8f0] p-6 shadow-sm">
                                <div className="flex items-center gap-1 mb-3">
                                    {Array.from({ length: 5 }).map((_, j) => <Star key={j} size={12} className="text-[#facc15] fill-[#facc15]" />)}
                                </div>
                                <p className="text-[13px] text-[#0f172a] leading-relaxed mb-4 italic">&ldquo;{t.text}&rdquo;</p>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-[8px] bg-[#E3E2F3] flex items-center justify-center text-[#0f172a] text-[10px] font-bold">
                                        {t.avatar}
                                    </div>
                                    <div>
                                        <p className="text-[12px] text-[#0f172a] font-medium">{t.name}</p>
                                        <p className="text-[10px] text-[#64748b]">{t.role}</p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── CTA Final ── */}
            <section className="px-6 py-16">
                <div className="max-w-[800px] mx-auto">
                    <div className="bg-[#0f172a] rounded-[16px] p-10 md:p-14 text-center relative overflow-hidden">
                        <div className="absolute -top-24 -right-24 opacity-10 blur-3xl">
                             <div className="w-64 h-64 bg-[#facc15] rounded-full" />
                        </div>
                        <h2 className="text-[24px] text-white tracking-tight mb-3 relative z-10">
                            Prêt à optimiser vos rénovations ?
                        </h2>
                        <p className="text-[#94a3b8] text-[13px] mb-8 max-w-[400px] mx-auto leading-relaxed relative z-10">
                            Rejoignez les agences qui utilisent Monum pour éviter les retards et maximiser leurs marges de chantier.
                        </p>
                        <Link href="/signup?vertical=monum"
                            className="inline-flex relative z-10 items-center gap-2 bg-[#facc15] text-[#0f172a] font-semibold px-7 py-3.5 rounded-[12px] text-[13px] hover:bg-[#eab308] transition-colors cursor-pointer">
                            Essai gratuit 14 jours <ArrowRight size={14} />
                        </Link>
                    </div>
                </div>
            </section>

            {/* ── Footer ── */}
            <footer className="border-t border-gray-200 py-8 px-6 bg-white">
                <div className="max-w-[1000px] mx-auto text-center">
                    <div className="flex items-center justify-center gap-2 mb-3">
                        <div className="w-6 h-6 rounded-lg bg-[#0f172a] flex items-center justify-center">
                            <Building2 size={12} className="text-[#facc15]" />
                        </div>
                        <span className="text-[13px] text-[#0f172a] font-semibold">Monum</span>
                    </div>
                    <p className="text-[11px] text-[#64748b] leading-relaxed mb-6">Le CRM intelligent pour le suivi de travaux.</p>
                    <p className="text-[11px] text-[#94a3b8]">© 2026 Monum — Tous droits réservés.</p>
                </div>
            </footer>
        </div>
    );
}
