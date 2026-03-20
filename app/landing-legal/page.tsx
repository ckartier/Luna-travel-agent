'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import {
    Scale, Globe, BarChart3, Users, Zap, Shield, Mail, Calendar,
    ArrowRight, Star, Bot, FileText, Search, Gavel, BookOpen, Lock
} from 'lucide-react';

const FEATURES = [
    { icon: Bot, title: 'Agent IA Juridique', desc: 'Analyse automatique de dossiers, extraction d\'informations clés et suggestions de stratégie en temps réel.', color: '#E3E2F3' },
    { icon: Search, title: 'Jurisprudence Légifrance', desc: 'Recherche NLP dans la base Légifrance. Trouvez les décisions pertinentes en quelques secondes.', color: '#bcdeea' },
    { icon: FileText, title: 'Gestion de Dossiers', desc: 'Pipeline juridique complet : nouveau dossier → analyse → proposition → gagné. Tout centralisé.', color: '#D3E8E3' },
    { icon: BookOpen, title: 'Base Documentaire', desc: 'Documents juridiques, modèles de contrats et templates personnalisables pour chaque dossier.', color: '#E6D2BD' },
    { icon: BarChart3, title: 'Honoraires & Facturation', desc: 'Suivi des honoraires, génération de factures et contrôle de rentabilité par dossier.', color: '#F2D9D3' },
    { icon: Lock, title: 'Secret Professionnel', desc: 'Chiffrement bout-en-bout, hébergement Google Cloud certifié, conformité RGPD et secret avocat.', color: '#F3F4F6' },
];

const PLANS_MINI = [
    { name: 'Solo', price: 49, desc: 'Avocat indépendant' },
    { name: 'Cabinet Pro', price: 99, desc: 'Dossiers + IA + Facturation', popular: true },
    { name: 'Enterprise', price: 199, desc: 'Multi-associés + API' },
];

const TESTIMONIALS = [
    { name: 'Maître Dupont', role: 'Associé, Cabinet Dupont & Fils', text: 'L\'agent IA a réduit notre temps de recherche jurisprudentielle de 80%. Un gain de productivité énorme.', avatar: 'MD' },
    { name: 'Claire Moreau', role: 'Avocate, Droit des Affaires', text: 'Le pipeline de dossiers est parfaitement adapté à notre workflow. Tout est tracé et rien ne passe entre les mailles.', avatar: 'CM' },
    { name: 'Jean-Pierre Aubert', role: 'Fondateur, Aubert Avocats', text: 'La facturation intégrée et le suivi des honoraires nous font gagner une demi-journée par semaine.', avatar: 'JA' },
];

export default function LandingLegalPage() {
    return (
        <div className="min-h-screen bg-[#F8FAFC] overflow-hidden">

            {/* ── Navbar ── */}
            <nav className="fixed top-0 w-full z-50 bg-[#F8FAFC]/80 backdrop-blur-md border-b border-gray-100">
                <div className="max-w-[1200px] mx-auto flex items-center justify-between px-6 py-4">
                    <Link href="/landing-legal" className="flex items-center gap-3 cursor-pointer">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-[#2E2E2E] flex items-center justify-center">
                                <Scale size={16} className="text-white" />
                            </div>
                            <span className="text-[16px] text-[#2E2E2E] tracking-tight">
                                Le Droit <span className="font-semibold">Agent</span>
                            </span>
                        </div>
                    </Link>
                    <div className="hidden md:flex items-center gap-8 text-[13px] text-[#6B7280]">
                        <a href="#features" className="hover:text-[#2E2E2E] transition-colors cursor-pointer">Fonctionnalités</a>
                        <a href="#pricing" className="hover:text-[#2E2E2E] transition-colors cursor-pointer">Tarifs</a>
                        <a href="#testimonials" className="hover:text-[#2E2E2E] transition-colors cursor-pointer">Témoignages</a>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link href="/login?vertical=legal" className="text-[13px] text-luna-text-muted hover:text-luna-charcoal px-4 py-2 transition-colors cursor-pointer">Connexion</Link>
                        <Link href="/signup?vertical=legal" className="btn-primary text-[13px] cursor-pointer">Essai gratuit →</Link>
                    </div>
                </div>
            </nav>

            {/* ── Hero ── */}
            <section className="pt-32 pb-16 px-6 relative">
                <div className="max-w-[900px] mx-auto text-center relative z-10">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                        <span className="inline-block mb-6 text-[10px] font-semibold uppercase tracking-[0.15em] text-[#6B7280] bg-[#F5F5F5] px-4 py-1.5 rounded-full border border-[#E5E7EB]">
                            Plateforme IA pour Cabinets d'Avocats — <span className="text-[#5a8fa3] font-semibold">Essai gratuit 14 jours</span>
                        </span>

                        <h1 className="text-[40px] md:text-[56px] leading-[1.1] text-[#2E2E2E] tracking-tight mb-5">
                            Votre IA juridique<br />
                            analyse vos dossiers<br />
                            en quelques minutes
                        </h1>

                        <p className="text-[#6B7280] text-[15px] max-w-[520px] mx-auto leading-relaxed mb-8">
                            Le Droit Agent automatise la recherche jurisprudentielle, gère votre pipeline de dossiers et transforme chaque consultation en dossier structuré.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                            <Link href="/signup?vertical=legal"
                                className="px-7 py-3.5 bg-[#2E2E2E] text-white rounded-[12px] flex items-center gap-2 text-[13px] cursor-pointer hover:bg-black transition-colors shadow-lg">
                                Essai gratuit 14 jours <ArrowRight size={14} />
                            </Link>
                            <a href="#features"
                                className="px-7 py-3.5 rounded-[12px] border border-gray-100 text-[#2E2E2E] text-[13px] hover:bg-[#F5F5F5] transition-colors cursor-pointer">
                                Voir les fonctionnalités
                            </a>
                        </div>
                    </motion.div>

                    {/* Stats */}
                    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                        className="mt-14 flex flex-wrap items-center justify-center gap-10 md:gap-16">
                        {[
                            { value: '80%', label: 'Temps gagné' },
                            { value: '98%', label: 'Taux de précision' },
                            { value: '24/7', label: 'Agent IA actif' },
                            { value: '200+', label: 'Cabinets connectés' },
                        ].map((s, i) => (
                            <div key={i} className="text-center">
                                <p className="text-[28px] tracking-tight text-[#2E2E2E]">{s.value}</p>
                                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#6B7280] mt-1">{s.label}</p>
                            </div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* ── App Preview ── */}
            <section className="px-6 pb-16">
                <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                    className="max-w-[1000px] mx-auto">
                    <div className="bg-[#2E2E2E] rounded-[16px] p-1.5">
                        <div className="bg-[#F8FAFC] rounded-[12px] p-6 md:p-8">
                            <div className="grid grid-cols-3 gap-3 mb-5">
                                {['Pipeline Dossiers', 'Jurisprudence', 'Agent IA'].map((tab, i) => (
                                    <div key={tab} className={`text-center py-2.5 rounded-[10px] text-[12px] transition-all cursor-pointer ${i === 2 ? 'bg-[#2E2E2E] text-white' : 'bg-white border border-gray-100 text-[#6B7280]'}`}>
                                        {tab}
                                    </div>
                                ))}
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {['Nouveau', 'Analyse IA', 'Proposition', 'Gagné'].map((stage, i) => (
                                    <div key={stage} className="bg-white rounded-[16px] border border-[#E5E7EB] p-4">
                                        <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#6B7280] mb-3">{stage}</p>
                                        {Array.from({ length: 3 - i }, (_, j) => (
                                            <div key={j} className="bg-[#F5F5F5] rounded-[8px] p-2.5 mb-2">
                                                <div className="w-3/4 h-2 bg-gray-200 rounded mb-1.5" />
                                                <div className="w-1/2 h-1.5 bg-gray-100 rounded" />
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
                        <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#6B7280] mb-4 inline-block">Fonctionnalités</span>
                        <h2 className="text-[28px] text-[#2E2E2E] tracking-tight mb-3">Tout pour gérer votre cabinet</h2>
                        <p className="text-[#6B7280] text-[14px] max-w-[480px] mx-auto">Une plateforme complète qui connecte chaque aspect de votre activité juridique.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {FEATURES.map((f, i) => (
                            <motion.div key={i} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }}
                                className="bg-white rounded-[16px] border border-[#E5E7EB] p-6 hover:border-[#bcdeea]/40 transition-colors cursor-default shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
                                <div className="w-10 h-10 rounded-[10px] flex items-center justify-center mb-4" style={{ backgroundColor: f.color }}>
                                    <f.icon size={18} className="text-[#2E2E2E]" strokeWidth={1.5} />
                                </div>
                                <h3 className="text-[14px] text-[#2E2E2E] mb-2 font-medium">{f.title}</h3>
                                <p className="text-[12px] text-[#6B7280] leading-relaxed">{f.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── How it works ── */}
            <section className="px-6 py-16">
                <div className="max-w-[800px] mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-[28px] text-[#2E2E2E] tracking-tight mb-3">Comment ça marche</h2>
                        <p className="text-[#6B7280] text-[14px]">3 étapes pour transformer votre productivité</p>
                    </div>

                    <div className="space-y-0">
                        {[
                            { step: '01', title: 'Consultation reçue → Dossier créé', desc: 'Un client vous contacte. L\'IA analyse la demande, identifie le domaine juridique, et crée automatiquement un dossier structuré dans votre pipeline.', icon: Mail },
                            { step: '02', title: 'Agent IA → Analyse complète', desc: 'L\'agent juridique recherche la jurisprudence pertinente sur Légifrance, analyse les points de droit et prépare une note de synthèse.', icon: Zap },
                            { step: '03', title: 'Dossier gagné → Honoraires facturés', desc: 'Le client valide votre proposition. Luna génère les honoraires, suit les paiements et archive le dossier.', icon: Gavel },
                        ].map((s, i) => (
                            <motion.div key={i} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                                className="flex items-start gap-5 py-7 border-b border-gray-100 last:border-0">
                                <div className="text-[36px] text-gray-200 shrink-0 w-14 tracking-tight">{s.step}</div>
                                <div className="flex-1">
                                    <h3 className="text-[15px] text-[#2E2E2E] mb-1.5 flex items-center gap-2 font-medium">
                                        <s.icon size={16} className="text-[#5a8fa3]" strokeWidth={1.5} />
                                        {s.title}
                                    </h3>
                                    <p className="text-[13px] text-[#6B7280] leading-relaxed">{s.desc}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Testimonials ── */}
            <section id="testimonials" className="px-6 py-16 bg-white">
                <div className="max-w-[1000px] mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-[28px] text-[#2E2E2E] tracking-tight mb-3">Ils nous font confiance</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {TESTIMONIALS.map((t, i) => (
                            <motion.div key={i} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                                className="bg-white rounded-[16px] border border-[#E5E7EB] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
                                <div className="flex items-center gap-1 mb-3">
                                    {Array.from({ length: 5 }).map((_, j) => <Star key={j} size={12} className="text-amber-400 fill-amber-400" />)}
                                </div>
                                <p className="text-[13px] text-[#2E2E2E] leading-relaxed mb-4 italic">&ldquo;{t.text}&rdquo;</p>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-[8px] bg-[#E3E2F3] flex items-center justify-center text-[#2E2E2E] text-[10px] font-medium">
                                        {t.avatar}
                                    </div>
                                    <div>
                                        <p className="text-[12px] text-[#2E2E2E] font-medium">{t.name}</p>
                                        <p className="text-[10px] text-[#6B7280]">{t.role}</p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Pricing preview ── */}
            <section id="pricing" className="px-6 py-16">
                <div className="max-w-[800px] mx-auto text-center">
                    <h2 className="text-[28px] text-[#2E2E2E] tracking-tight mb-3">Tarifs adaptés à votre cabinet</h2>
                    <p className="text-[#6B7280] text-[14px] mb-10">Un outil professionnel conforme aux exigences de la profession.</p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        {PLANS_MINI.map((plan, i) => (
                            <motion.div key={plan.name} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                                className={`bg-white rounded-[16px] border border-[#E5E7EB] p-6 relative shadow-[0_2px_8px_rgba(0,0,0,0.05)] ${plan.popular ? 'ring-2 ring-[#bcdeea]' : ''}`}>
                                {plan.popular && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                        <span className="text-[9px] font-semibold uppercase tracking-[0.15em] bg-[#bcdeea] text-[#2E2E2E] px-3 py-1 rounded-full">Populaire</span>
                                    </div>
                                )}
                                <h3 className="text-[14px] text-[#2E2E2E] mb-1 font-medium">{plan.name}</h3>
                                <p className="text-[28px] tracking-tight text-[#2E2E2E] mb-1">{plan.price}€<span className="text-[12px] text-[#6B7280] ml-1">/mois</span></p>
                                <p className="text-[11px] text-[#6B7280] mb-4">{plan.desc}</p>
                                <Link href="/pricing?vertical=legal"
                                    className={`block w-full py-2.5 rounded-[10px] text-[12px] text-center transition-colors cursor-pointer ${plan.popular ? 'bg-[#bcdeea] text-[#2E2E2E] hover:bg-[#a5cfdf]' : 'bg-[#2E2E2E] text-white hover:bg-black'}`}>
                                    Choisir
                                </Link>
                            </motion.div>
                        ))}
                    </div>

                    <Link href="/pricing?vertical=legal" className="text-[12px] text-[#5a8fa3] hover:text-[#2E2E2E] transition-colors cursor-pointer">
                        Voir tous les détails et comparer →
                    </Link>
                </div>
            </section>

            {/* ── CTA Final ── */}
            <section className="px-6 py-16">
                <div className="max-w-[800px] mx-auto">
                    <div className="bg-[#2E2E2E] rounded-[16px] p-10 md:p-14 text-center">
                        <h2 className="text-[24px] text-white tracking-tight mb-3">
                            Prêt à digitaliser votre cabinet ?
                        </h2>
                        <p className="text-white/40 text-[13px] mb-8 max-w-[400px] mx-auto leading-relaxed">
                            Rejoignez les 200+ cabinets qui utilisent Le Droit Agent pour automatiser leur recherche et structurer leurs dossiers.
                        </p>
                        <Link href="/signup?vertical=legal"
                            className="inline-flex items-center gap-2 bg-white text-luna-charcoal px-7 py-3.5 rounded-[12px] text-[13px] hover:bg-gray-50 transition-colors cursor-pointer">
                            Essai gratuit 14 jours <ArrowRight size={14} />
                        </Link>
                    </div>
                </div>
            </section>

            {/* ── Footer ── */}
            <footer className="border-t border-gray-100 py-8 px-6 bg-white">
                <div className="max-w-[1000px] mx-auto">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-6">
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-6 h-6 rounded-lg bg-[#2E2E2E] flex items-center justify-center">
                                    <Scale size={12} className="text-white" />
                                </div>
                                <span className="text-[13px] text-[#2E2E2E]">Le Droit Agent</span>
                            </div>
                            <p className="text-[11px] text-[#6B7280] leading-relaxed">La plateforme IA pour les professionnels du droit.</p>
                        </div>
                        <div>
                            <h4 className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#6B7280] mb-3">Produit</h4>
                            <div className="space-y-2">
                                <a href="#features" className="block text-[12px] text-[#6B7280] hover:text-[#2E2E2E] transition-colors cursor-pointer">Fonctionnalités</a>
                                <Link href="/pricing?vertical=legal" className="block text-[12px] text-[#6B7280] hover:text-[#2E2E2E] transition-colors cursor-pointer">Tarifs</Link>
                            </div>
                        </div>
                        <div>
                            <h4 className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#6B7280] mb-3">Légal</h4>
                            <div className="space-y-2">
                                <Link href="/cgv" className="block text-[12px] text-[#6B7280] hover:text-[#2E2E2E] transition-colors cursor-pointer">CGV</Link>
                                <a href="mailto:contact@luna-travel.io" className="block text-[12px] text-[#6B7280] hover:text-[#2E2E2E] transition-colors cursor-pointer">Contact</a>
                            </div>
                        </div>
                        <div>
                            <h4 className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#6B7280] mb-3">Compte</h4>
                            <div className="space-y-2">
                                <Link href="/login?vertical=legal" className="block text-[12px] text-luna-text-muted hover:text-luna-charcoal transition-colors cursor-pointer">Connexion</Link>
                                <Link href="/signup?vertical=legal" className="block text-[12px] text-luna-text-muted hover:text-luna-charcoal transition-colors cursor-pointer">Essai gratuit</Link>
                            </div>
                        </div>
                    </div>
                    <div className="border-t border-gray-100 pt-5 text-center">
                        <p className="text-[11px] text-[#6B7280]">© 2026 Le Droit Agent — Plateforme IA Juridique. Tous droits réservés.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
