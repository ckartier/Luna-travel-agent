'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import {
    Scale, Briefcase, BookOpen, FileSearch, Shield, BarChart3,
    ArrowRight, Check, Star, Bot, Mail, Calendar, Gavel,
    ScrollText, Users, Clock, TrendingUp, Zap,
} from 'lucide-react';

// ── FEATURES ──
const FEATURES = [
    { icon: Bot, title: 'Analyse IA de Dossiers', desc: 'L\'IA qualifie automatiquement vos dossiers : branche du droit, articles applicables, forces et faiblesses.', color: '#C9A96E' },
    { icon: FileSearch, title: 'Recherche Jurisprudence', desc: 'Trouvez les décisions pertinentes en secondes : Cass, CE, CEDH, CJUE — avec analyse de pertinence.', color: '#2a3a5c' },
    { icon: Briefcase, title: 'CRM Juridique Complet', desc: 'Pipeline dossiers, contacts 360°, agenda d\'audiences — tout interconnecté en temps réel.', color: '#1a1a2e' },
    { icon: Calendar, title: 'Timeline Procédure', desc: 'Calendrier procédural automatique avec délais impératifs, audiences et actes à rédiger.', color: '#C9A96E' },
    { icon: ScrollText, title: 'Honoraires & Facturation', desc: 'Conventions, devis, factures et suivi paiements — conforme aux règles déontologiques.', color: '#2a3a5c' },
    { icon: Shield, title: 'Sécurité & Secret Pro', desc: 'Données chiffrées, hébergement souverain, conformité RGPD et secret professionnel.', color: '#1a1a2e' },
];

// ── PLANS ──
const PLANS = [
    { name: 'Solo', price: 49, desc: 'Avocat individuel', features: ['5 analyses IA / jour', 'Recherche jurisprudence', 'Timeline procédure', '50 dossiers actifs'] },
    { name: 'Cabinet', price: 129, desc: 'Cabinet 2-10 avocats', popular: true, features: ['Analyses IA illimitées', 'CRM complet', 'Agenda partagé', 'Facturation intégrée', '500 dossiers', '5 collaborateurs'] },
    { name: 'Enterprise', price: 299, desc: 'Grand cabinet / réseau', features: ['Tout Cabinet', 'API & Webhooks', 'SSO / SAML', 'Collaborateurs illimités', 'Support prioritaire', 'Formation dédiée'] },
];

// ── TESTIMONIALS ──
const TESTIMONIALS = [
    { name: 'Maître Durand', role: 'Avocate en droit des affaires, Paris', text: 'L\'analyse IA me fait gagner 3h par dossier. La recherche jurisprudence est bluffante de précision.', avatar: 'MD' },
    { name: 'Maître Leclerc', role: 'Avocat pénaliste, Lyon', text: 'La timeline procédurale est un game-changer. Plus aucun délai oublié depuis que j\'utilise Le Droit Agent.', avatar: 'JL' },
    { name: 'Maître Petit', role: 'Associée, Cabinet Petit & Associés', text: 'Le CRM juridique a transformé notre gestion de cabinet. Nos clients sont mieux suivis, nos honoraires mieux facturés.', avatar: 'SP' },
];

export default function LegalLandingPage() {
    return (
        <div className="min-h-screen bg-[#0d0d1a] overflow-hidden text-white">

            {/* ── Navbar ── */}
            <nav className="fixed top-0 w-full z-50 bg-[#0d0d1a]/80 backdrop-blur-xl border-b border-white/5">
                <div className="max-w-[1200px] mx-auto flex items-center justify-between px-6 py-4">
                    <Link href="/legal" className="flex items-center gap-3 cursor-pointer">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#C9A96E] to-[#A08050] flex items-center justify-center">
                                <Scale size={16} className="text-white" strokeWidth={2} />
                            </div>
                            <span className="text-[18px] font-light tracking-[0.15em] text-white/90">LE DROIT AGENT</span>
                        </div>
                    </Link>
                    <div className="hidden md:flex items-center gap-8 text-[13px] text-white/40">
                        <a href="#features" className="hover:text-white/80 transition-colors cursor-pointer">Fonctionnalités</a>
                        <a href="#pricing" className="hover:text-white/80 transition-colors cursor-pointer">Tarifs</a>
                        <a href="#testimonials" className="hover:text-white/80 transition-colors cursor-pointer">Témoignages</a>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link href="/crm/avocat" className="text-[13px] text-white/40 hover:text-white/80 px-4 py-2 transition-colors cursor-pointer">Connexion</Link>
                        <Link href="/crm/avocat" className="text-[13px] bg-gradient-to-r from-[#C9A96E] to-[#A08050] text-white px-5 py-2.5 rounded-xl hover:opacity-90 transition-opacity cursor-pointer">
                            Essai gratuit →
                        </Link>
                    </div>
                </div>
            </nav>

            {/* ── Hero ── */}
            <section className="pt-36 pb-20 px-6 relative">
                {/* Background glow effects */}
                <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#C9A96E]/5 rounded-full blur-[120px] pointer-events-none" />
                <div className="absolute top-40 right-0 w-[300px] h-[300px] bg-[#2a3a5c]/20 rounded-full blur-[80px] pointer-events-none" />

                <div className="max-w-[900px] mx-auto text-center relative z-10">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                        <span className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.25em] text-[#C9A96E] mb-6">
                            <Gavel size={12} />
                            Plateforme IA pour Cabinets d&apos;Avocats — Essai gratuit 14 jours
                        </span>

                        <h1 className="text-[42px] md:text-[60px] leading-[1.05] text-white tracking-tight mb-6 font-light">
                            L&apos;IA analyse vos<br />
                            dossiers en<br />
                            <span className="bg-gradient-to-r from-[#C9A96E] to-[#E8D5A8] bg-clip-text text-transparent">quelques secondes</span>
                        </h1>

                        <p className="text-white/35 text-[16px] max-w-[520px] mx-auto leading-relaxed mb-10">
                            Le Droit Agent automatise l&apos;analyse de dossiers, la recherche de jurisprudence, le suivi procédural et la gestion de votre cabinet.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                            <Link href="/crm/avocat"
                                className="bg-gradient-to-r from-[#C9A96E] to-[#A08050] text-white px-8 py-4 rounded-xl flex items-center gap-2 text-[14px] hover:opacity-90 transition-opacity cursor-pointer shadow-[0_0_30px_rgba(201,169,110,0.2)]">
                                Essai gratuit 14 jours <ArrowRight size={15} />
                            </Link>
                            <a href="#features"
                                className="px-8 py-4 rounded-xl border border-white/10 text-white/50 text-[14px] hover:bg-white/5 hover:border-white/20 transition-all cursor-pointer">
                                Voir les fonctionnalités
                            </a>
                        </div>
                    </motion.div>

                    {/* Stats */}
                    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                        className="mt-16 flex flex-wrap items-center justify-center gap-12 md:gap-20">
                        {[
                            { value: '3h', label: 'Gagnées par dossier' },
                            { value: '98%', label: 'Délais respectés' },
                            { value: '24/7', label: 'Agents IA actifs' },
                            { value: '200+', label: 'Cabinets connectés' },
                        ].map((s, i) => (
                            <div key={i} className="text-center">
                                <p className="text-[32px] tracking-tight text-white font-light">{s.value}</p>
                                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#C9A96E]/60 mt-1">{s.label}</p>
                            </div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* ── Dashboard Preview ── */}
            <section className="px-6 pb-20">
                <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                    className="max-w-[900px] mx-auto">
                    <div className="bg-gradient-to-b from-white/[0.06] to-white/[0.02] rounded-[20px] p-1.5 border border-white/[0.08] shadow-[0_0_60px_rgba(201,169,110,0.08)]">
                        <div className="bg-[#0d0d1a] rounded-[16px] overflow-hidden">
                            <Image
                                src="/legal/hero-dashboard.png"
                                alt="Le Droit Agent — Dashboard IA"
                                width={1200}
                                height={675}
                                className="w-full h-auto"
                                priority
                            />
                        </div>
                    </div>
                </motion.div>
            </section>

            {/* ── How the AI Agents Work ── */}
            <section className="px-6 py-20 relative">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#C9A96E]/[0.02] to-transparent pointer-events-none" />
                <div className="max-w-[900px] mx-auto relative z-10">
                    <div className="text-center mb-14">
                        <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#C9A96E]/60 mb-4 inline-block">4 Agents spécialisés</span>
                        <h2 className="text-[32px] text-white tracking-tight mb-3 font-light">Comment fonctionnent vos agents IA</h2>
                        <p className="text-white/30 text-[14px]">Chaque agent est un expert de son domaine</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                            { icon: Scale, title: 'Agent Analyse', desc: 'Qualifie le dossier, identifie la branche du droit, évalue forces/faiblesses et recommande une stratégie.', color: '#C9A96E', tag: '01' },
                            { icon: FileSearch, title: 'Agent Jurisprudence', desc: 'Recherche les décisions pertinentes (Cass., CE, CEDH), articles de loi et doctrine récente.', color: '#4a6fa5', tag: '02' },
                            { icon: Users, title: 'Agent Client', desc: 'Analyse le profil client, recommande le mode d\'honoraires et les bonnes pratiques relationnelles.', color: '#C9A96E', tag: '03' },
                            { icon: Clock, title: 'Agent Timeline', desc: 'Planifie chaque étape de la procédure avec délais impératifs, audiences et actes à rédiger.', color: '#4a6fa5', tag: '04' },
                        ].map((agent, i) => (
                            <motion.div key={i} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                                className="bg-white/[0.03] rounded-2xl p-6 border border-white/[0.06] hover:border-[#C9A96E]/20 transition-all group">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${agent.color}15` }}>
                                        <agent.icon size={20} style={{ color: agent.color }} strokeWidth={1.5} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1.5">
                                            <span className="text-[9px] font-mono text-[#C9A96E]/40">{agent.tag}</span>
                                            <h3 className="text-[15px] text-white/90">{agent.title}</h3>
                                        </div>
                                        <p className="text-[12px] text-white/30 leading-relaxed">{agent.desc}</p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Agents IA Preview Image */}
                    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                        className="mt-12">
                        <div className="bg-gradient-to-b from-white/[0.04] to-white/[0.01] rounded-[16px] p-1 border border-white/[0.06] shadow-[0_0_40px_rgba(201,169,110,0.06)]">
                            <Image src="/legal/agents-preview.png" alt="Agents IA juridiques en action" width={900} height={506} className="w-full h-auto rounded-[12px]" />
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* ── Features ── */}
            <section id="features" className="px-6 py-20 bg-white/[0.02]">
                <div className="max-w-[1000px] mx-auto">
                    <div className="text-center mb-14">
                        <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#C9A96E]/60 mb-4 inline-block">Fonctionnalités</span>
                        <h2 className="text-[32px] text-white tracking-tight mb-3 font-light">Tout pour gérer votre cabinet</h2>
                        <p className="text-white/30 text-[14px] max-w-[480px] mx-auto">Une plateforme complète qui connecte chaque aspect de votre pratique.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {FEATURES.map((f, i) => (
                            <motion.div key={i} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }}
                                className="bg-white/[0.03] rounded-2xl p-6 border border-white/[0.06] hover:border-[#C9A96E]/15 transition-all">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: `${f.color}20` }}>
                                    <f.icon size={18} style={{ color: f.color === '#1a1a2e' ? '#C9A96E' : f.color }} strokeWidth={1.5} />
                                </div>
                                <h3 className="text-[14px] text-white/90 mb-2">{f.title}</h3>
                                <p className="text-[12px] text-white/30 leading-relaxed">{f.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── CRM Preview ── */}
            <section className="px-6 py-20">
                <div className="max-w-[1000px] mx-auto">
                    <div className="text-center mb-10">
                        <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#C9A96E]/60 mb-4 inline-block">CRM Intégré</span>
                        <h2 className="text-[32px] text-white tracking-tight mb-3 font-light">Votre pipeline juridique</h2>
                        <p className="text-white/30 text-[14px] max-w-[480px] mx-auto">De l&apos;email au dossier ouvert — chaque étape est tracée et automatisée.</p>
                    </div>
                    <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                        <div className="bg-gradient-to-b from-white/[0.06] to-white/[0.02] rounded-[20px] p-1.5 border border-white/[0.08] shadow-[0_0_60px_rgba(201,169,110,0.08)]">
                            <div className="bg-white rounded-[16px] overflow-hidden">
                                <Image src="/legal/crm-preview.png" alt="CRM Pipeline Le Droit Agent" width={1200} height={675} className="w-full h-auto" />
                            </div>
                        </div>
                        <div className="text-center mt-6">
                            <Link href="/crm/avocat"
                                className="inline-flex items-center gap-2 text-[13px] text-[#C9A96E] hover:text-[#E8D5A8] transition-colors">
                                Voir le CRM en démo <ArrowRight size={14} />
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* ── How it works ── */}
            <section className="px-6 py-20">
                <div className="max-w-[800px] mx-auto">
                    <div className="text-center mb-14">
                        <h2 className="text-[32px] text-white tracking-tight mb-3 font-light">Comment ça marche</h2>
                        <p className="text-white/30 text-[14px]">3 étapes pour transformer votre pratique</p>
                    </div>

                    <div className="space-y-0">
                        {[
                            { step: '01', title: 'Email reçu → Dossier créé', desc: 'Un client vous contacte. L\'IA analyse l\'email, identifie le type de contentieux, et crée automatiquement un dossier dans votre pipeline.', icon: Mail },
                            { step: '02', title: 'IA → Analyse complète', desc: 'Lancez vos agents spécialisés. Ils analysent les faits, recherchent la jurisprudence, évaluent les risques et planifient la procédure en parallèle.', icon: Zap },
                            { step: '03', title: 'Dossier ouvert → Timeline gérée', desc: 'Le client valide vos honoraires, Le Droit Agent crée la timeline de procédure avec tous les délais impératifs et les audiences à venir.', icon: Gavel },
                        ].map((s, i) => (
                            <motion.div key={i} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                                className="flex items-start gap-5 py-8 border-b border-white/5 last:border-0">
                                <div className="text-[36px] text-white/[0.06] shrink-0 w-14 tracking-tight font-light">{s.step}</div>
                                <div className="flex-1">
                                    <h3 className="text-[15px] text-white/80 mb-1.5 flex items-center gap-2">
                                        <s.icon size={16} className="text-[#C9A96E]" strokeWidth={1.5} />
                                        {s.title}
                                    </h3>
                                    <p className="text-[13px] text-white/30 leading-relaxed">{s.desc}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Testimonials ── */}
            <section id="testimonials" className="px-6 py-20 bg-white/[0.02]">
                <div className="max-w-[1000px] mx-auto">
                    <div className="text-center mb-14">
                        <h2 className="text-[32px] text-white tracking-tight mb-3 font-light">Ils nous font confiance</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {TESTIMONIALS.map((t, i) => (
                            <motion.div key={i} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                                className="bg-white/[0.03] rounded-2xl p-6 border border-white/[0.06]">
                                <div className="flex items-center gap-1 mb-3">
                                    {Array.from({ length: 5 }).map((_, j) => <Star key={j} size={12} className="text-[#C9A96E] fill-[#C9A96E]" />)}
                                </div>
                                <p className="text-[13px] text-white/50 leading-relaxed mb-5 italic">&ldquo;{t.text}&rdquo;</p>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#C9A96E]/20 to-[#C9A96E]/5 flex items-center justify-center text-[#C9A96E] text-[10px] font-bold border border-[#C9A96E]/10">
                                        {t.avatar}
                                    </div>
                                    <div>
                                        <p className="text-[12px] text-white/70">{t.name}</p>
                                        <p className="text-[10px] text-white/25">{t.role}</p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Pricing ── */}
            <section id="pricing" className="px-6 py-20">
                <div className="max-w-[900px] mx-auto text-center">
                    <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#C9A96E]/60 mb-4 inline-block">Tarifs</span>
                    <h2 className="text-[32px] text-white tracking-tight mb-3 font-light">Choisissez votre formule</h2>
                    <p className="text-white/30 text-[14px] mb-12">Adapté à votre taille de cabinet. Sans engagement.</p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        {PLANS.map((plan, i) => (
                            <motion.div key={plan.name} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                                className={`bg-white/[0.03] rounded-2xl p-7 border text-left relative ${plan.popular ? 'border-[#C9A96E]/30 shadow-[0_0_40px_rgba(201,169,110,0.08)]' : 'border-white/[0.06]'}`}>
                                {plan.popular && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                        <span className="text-[9px] font-bold uppercase tracking-[0.15em] bg-gradient-to-r from-[#C9A96E] to-[#A08050] text-white px-3 py-1 rounded-full">Populaire</span>
                                    </div>
                                )}
                                <h3 className="text-[14px] text-white/80 mb-0.5">{plan.name}</h3>
                                <p className="text-[11px] text-white/25 mb-4">{plan.desc}</p>
                                <p className="text-[32px] tracking-tight text-white mb-5 font-light">{plan.price}€<span className="text-[12px] text-white/25 ml-1">/mois</span></p>
                                <div className="space-y-2.5 mb-6">
                                    {plan.features.map((f, j) => (
                                        <div key={j} className="flex items-center gap-2">
                                            <Check size={13} className="text-[#C9A96E] shrink-0" />
                                            <span className="text-[12px] text-white/40">{f}</span>
                                        </div>
                                    ))}
                                </div>
                                <Link href="/signup"
                                    className={`block w-full py-3 rounded-xl text-[12px] text-center transition-all cursor-pointer ${plan.popular
                                        ? 'bg-gradient-to-r from-[#C9A96E] to-[#A08050] text-white hover:opacity-90'
                                        : 'bg-white/5 text-white/50 hover:bg-white/10'
                                    }`}>
                                    Choisir {plan.name}
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── CTA Final ── */}
            <section className="px-6 py-20">
                <div className="max-w-[800px] mx-auto">
                    <div className="bg-gradient-to-br from-[#C9A96E]/10 to-transparent rounded-[20px] p-12 md:p-16 text-center border border-[#C9A96E]/10">
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#C9A96E] to-[#A08050] flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(201,169,110,0.3)]">
                            <Scale size={24} className="text-white" strokeWidth={1.5} />
                        </div>
                        <h2 className="text-[28px] text-white tracking-tight mb-3 font-light">
                            Prêt à transformer votre cabinet ?
                        </h2>
                        <p className="text-white/30 text-[14px] mb-8 max-w-[400px] mx-auto leading-relaxed">
                            Rejoignez les 200+ cabinets qui utilisent Le Droit Agent pour analyser leurs dossiers et ne plus jamais manquer un délai.
                        </p>
                        <Link href="/crm/avocat"
                            className="inline-flex items-center gap-2 bg-gradient-to-r from-[#C9A96E] to-[#A08050] text-white px-8 py-4 rounded-xl text-[14px] hover:opacity-90 transition-opacity cursor-pointer shadow-[0_0_30px_rgba(201,169,110,0.2)]">
                            Essai gratuit 14 jours <ArrowRight size={15} />
                        </Link>
                    </div>
                </div>
            </section>

            {/* ── Footer ── */}
            <footer className="border-t border-white/5 py-10 px-6">
                <div className="max-w-[1000px] mx-auto">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-6">
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-6 h-6 rounded-md bg-gradient-to-br from-[#C9A96E] to-[#A08050] flex items-center justify-center">
                                    <Scale size={12} className="text-white" />
                                </div>
                                <span className="text-[12px] tracking-[0.1em] text-white/50">LE DROIT AGENT</span>
                            </div>
                            <p className="text-[11px] text-white/20 leading-relaxed">L&apos;IA au service des professionnels du droit.</p>
                        </div>
                        <div>
                            <h4 className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/30 mb-3">Produit</h4>
                            <div className="space-y-2">
                                <a href="#features" className="block text-[12px] text-white/20 hover:text-white/50 transition-colors cursor-pointer">Fonctionnalités</a>
                                <a href="#pricing" className="block text-[12px] text-white/20 hover:text-white/50 transition-colors cursor-pointer">Tarifs</a>
                            </div>
                        </div>
                        <div>
                            <h4 className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/30 mb-3">Légal</h4>
                            <div className="space-y-2">
                                <Link href="/cgv" className="block text-[12px] text-white/20 hover:text-white/50 transition-colors cursor-pointer">CGV</Link>
                                <a href="mailto:contact@droit-agent.com" className="block text-[12px] text-white/20 hover:text-white/50 transition-colors cursor-pointer">Contact</a>
                            </div>
                        </div>
                        <div>
                            <h4 className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/30 mb-3">Compte</h4>
                            <div className="space-y-2">
                                <Link href="/login" className="block text-[12px] text-white/20 hover:text-white/50 transition-colors cursor-pointer">Connexion</Link>
                                <Link href="/signup" className="block text-[12px] text-white/20 hover:text-white/50 transition-colors cursor-pointer">Essai gratuit</Link>
                            </div>
                        </div>
                    </div>
                    <div className="border-t border-white/5 pt-5 text-center">
                        <p className="text-[11px] text-white/15">© 2026 Le Droit Agent — Powered by Luna. Tous droits réservés.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
