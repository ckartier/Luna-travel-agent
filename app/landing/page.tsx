'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { LunaLogo } from '@/app/components/LunaLogo';
import {
    Globe, BarChart3, Zap, Shield, Plane, Mail, Calendar,
    ArrowRight, Star, Bot
} from 'lucide-react';

const FEATURES = [
    { icon: Bot, title: 'Agents IA Spécialisés', desc: 'Multi-agents autonomes qui recherchent vols, hôtels et activités en parallèle.', color: '#E3E2F3' },
    { icon: Mail, title: 'Boîte Email Intelligente', desc: 'Gmail connecté. L\'IA analyse chaque email et crée automatiquement des leads.', color: '#bcdeea' },
    { icon: Globe, title: 'CRM Voyage Complet', desc: 'Pipeline, contacts 360°, planning, activités — tout interconnecté en temps réel.', color: '#D3E8E3' },
    { icon: Calendar, title: 'Planning & Calendrier', desc: 'Voyages confirmés, export Google Calendar et Apple Calendar intégré.', color: '#E6D2BD' },
    { icon: BarChart3, title: 'Analytics & KPIs', desc: 'Dashboard avec revenus, taux de conversion et métriques clés.', color: '#F2D9D3' },
    { icon: Shield, title: 'Sécurité Enterprise', desc: 'Firebase (Google Cloud), données chiffrées, conformité RGPD.', color: '#F3F4F6' },
];

const PLANS_MINI = [
    { name: 'Site Builder', price: 29, desc: 'Site vitrine professionnel' },
    { name: 'CRM Pro', price: 79, desc: 'Pipeline + Contacts + Planning', popular: true },
    { name: 'All-in-One', price: 99, desc: 'Site + CRM complet' },
];

const TESTIMONIALS = [
    { name: 'Sophie Martin', role: 'Directrice, Voyages Évasion', text: 'Luna a transformé notre façon de gérer les demandes. Ce qui prenait 2h prend maintenant 10 minutes.', avatar: 'SM' },
    { name: 'Pierre Dubois', role: 'Fondateur, Jet Luxe Travel', text: 'Le CRM interconnecté est un game changer. Tout est lié : emails, pipeline, planning.', avatar: 'PD' },
    { name: 'Marie Laurent', role: 'Agent Senior, Globe Trotter Pro', text: 'Les agents IA trouvent des combinaisons vol+hôtel que je n\'aurais jamais vues.', avatar: 'ML' },
];

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-luna-bg overflow-hidden">

            {/* ── Navbar ── */}
            <nav className="fixed top-0 w-full z-50 bg-luna-bg/80 backdrop-blur-md border-b border-gray-100">
                <div className="max-w-[1200px] mx-auto flex items-center justify-between px-6 py-4">
                    <Link href="/landing" className="flex items-center gap-3 cursor-pointer">
                        <LunaLogo size={28} />
                    </Link>
                    <div className="hidden md:flex items-center gap-8 text-[13px] text-luna-text-muted">
                        <a href="#features" className="hover:text-luna-charcoal transition-colors cursor-pointer">Fonctionnalités</a>
                        <a href="#pricing" className="hover:text-luna-charcoal transition-colors cursor-pointer">Tarifs</a>
                        <a href="#testimonials" className="hover:text-luna-charcoal transition-colors cursor-pointer">Témoignages</a>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link href="/login/travel" className="text-[13px] text-luna-text-muted hover:text-luna-charcoal px-4 py-2 transition-colors cursor-pointer">Connexion</Link>
                        <Link href="/signup/travel" className="btn-primary text-[13px] cursor-pointer">Essai gratuit →</Link>
                    </div>
                </div>
            </nav>

            {/* ── Hero ── */}
            <section className="pt-32 pb-16 px-6 relative">
                <div className="max-w-[900px] mx-auto text-center relative z-10">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                        <span className="text-label-sharp inline-block mb-6">Plateforme IA pour Agences de Voyage B2B — <span className="text-[#5a8fa3] font-semibold">Essai gratuit 14 jours</span></span>

                        <h1 className="text-[40px] md:text-[56px] leading-[1.1] text-luna-charcoal tracking-tight mb-5">
                            Vos agents IA créent<br />
                            des voyages en<br />
                            quelques minutes
                        </h1>

                        <p className="text-luna-text-muted text-[15px] max-w-[520px] mx-auto leading-relaxed mb-8">
                            Luna automatise la recherche de vols, hôtels et activités, gère votre pipeline commercial et transforme chaque email en opportunité.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                            <Link href="/signup/travel"
                                className="btn-primary px-7 py-3.5 rounded-[12px] flex items-center gap-2 text-[13px] cursor-pointer">
                                Essai gratuit 14 jours <ArrowRight size={14} />
                            </Link>
                            <a href="#features"
                                className="px-7 py-3.5 rounded-[12px] border border-gray-100 text-luna-charcoal text-[13px] hover:bg-luna-warm-gray transition-colors cursor-pointer">
                                Voir les fonctionnalités
                            </a>
                        </div>
                    </motion.div>

                    {/* Stats */}
                    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                        className="mt-14 flex flex-wrap items-center justify-center gap-10 md:gap-16">
                        {[
                            { value: '10x', label: 'Plus rapide' },
                            { value: '95%', label: 'Satisfaction' },
                            { value: '24/7', label: 'Agents IA actifs' },
                            { value: '500+', label: 'Agences connectées' },
                        ].map((s, i) => (
                            <div key={i} className="text-center">
                                <p className="text-[28px] tracking-tight text-luna-charcoal">{s.value}</p>
                                <p className="text-label-sharp mt-1">{s.label}</p>
                            </div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* ── App Preview ── */}
            <section className="px-6 pb-16">
                <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                    className="max-w-[1000px] mx-auto">
                    <div className="bg-luna-charcoal rounded-[16px] p-1.5">
                        <div className="bg-luna-bg rounded-[12px] p-6 md:p-8">
                            <div className="grid grid-cols-3 gap-3 mb-5">
                                {['Pipeline', 'CRM', 'IA Agents'].map((tab, i) => (
                                    <div key={tab} className={`text-center py-2.5 rounded-[10px] text-[12px] transition-all cursor-pointer ${i === 2 ? 'bg-luna-charcoal text-white' : 'bg-white border border-gray-100 text-luna-text-muted'}`}>
                                        {tab}
                                    </div>
                                ))}
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {['Nouveau', 'IA en cours', 'Devis envoyé', 'Gagné'].map((stage, i) => (
                                    <div key={stage} className="glass-card-premium p-4">
                                        <p className="text-label-sharp mb-3">{stage}</p>
                                        {Array.from({ length: 3 - i }, (_, j) => (
                                            <div key={j} className="bg-luna-warm-gray rounded-[8px] p-2.5 mb-2">
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
                        <span className="text-label-sharp mb-4 inline-block">Fonctionnalités</span>
                        <h2 className="text-[28px] text-luna-charcoal tracking-tight mb-3">Tout pour gérer votre agence</h2>
                        <p className="text-luna-text-muted text-[14px] max-w-[480px] mx-auto">Une plateforme complète qui connecte chaque aspect de votre activité.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {FEATURES.map((f, i) => (
                            <motion.div key={i} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }}
                                className="glass-card-premium p-6 hover:border-luna-primary/40 transition-colors cursor-default">
                                <div className="w-10 h-10 rounded-[10px] flex items-center justify-center mb-4" style={{ backgroundColor: f.color }}>
                                    <f.icon size={18} className="text-luna-charcoal" strokeWidth={1.5} />
                                </div>
                                <h3 className="text-[14px] text-luna-charcoal mb-2">{f.title}</h3>
                                <p className="text-[12px] text-luna-text-muted leading-relaxed">{f.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── How it works ── */}
            <section className="px-6 py-16">
                <div className="max-w-[800px] mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-[28px] text-luna-charcoal tracking-tight mb-3">Comment ça marche</h2>
                        <p className="text-luna-text-muted text-[14px]">3 étapes pour transformer votre productivité</p>
                    </div>

                    <div className="space-y-0">
                        {[
                            { step: '01', title: 'Email reçu → Lead créé', desc: 'Un client envoie un email. L\'IA l\'analyse, extrait destination, dates, budget, et crée automatiquement un lead dans votre pipeline.', icon: Mail },
                            { step: '02', title: 'Agents IA → Itinéraire complet', desc: 'Lancez vos agents spécialisés. Ils recherchent en parallèle vols, hôtels et activités pour construire un itinéraire complet.', icon: Zap },
                            { step: '03', title: 'Deal gagné → Voyage planifié', desc: 'Le client valide, Luna crée le voyage dans votre planning avec export calendrier et suivi de paiement.', icon: Plane },
                        ].map((s, i) => (
                            <motion.div key={i} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                                className="flex items-start gap-5 py-7 border-b border-gray-100 last:border-0">
                                <div className="text-[36px] text-gray-200 shrink-0 w-14 tracking-tight">{s.step}</div>
                                <div className="flex-1">
                                    <h3 className="text-[15px] text-luna-charcoal mb-1.5 flex items-center gap-2">
                                        <s.icon size={16} className="text-luna-primary-hover" strokeWidth={1.5} />
                                        {s.title}
                                    </h3>
                                    <p className="text-[13px] text-luna-text-muted leading-relaxed">{s.desc}</p>
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
                        <h2 className="text-[28px] text-luna-charcoal tracking-tight mb-3">Ils nous font confiance</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {TESTIMONIALS.map((t, i) => (
                            <motion.div key={i} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                                className="glass-card-premium p-6">
                                <div className="flex items-center gap-1 mb-3">
                                    {Array.from({ length: 5 }).map((_, j) => <Star key={j} size={12} className="text-amber-400 fill-amber-400" />)}
                                </div>
                                <p className="text-[13px] text-luna-charcoal leading-relaxed mb-4 italic">&ldquo;{t.text}&rdquo;</p>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-[8px] bg-luna-primary flex items-center justify-center text-luna-charcoal text-[10px]">
                                        {t.avatar}
                                    </div>
                                    <div>
                                        <p className="text-[12px] text-luna-charcoal">{t.name}</p>
                                        <p className="text-[10px] text-luna-text-muted">{t.role}</p>
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
                    <h2 className="text-[28px] text-luna-charcoal tracking-tight mb-3">Tarifs simples, sans surprise</h2>
                    <p className="text-luna-text-muted text-[14px] mb-10">Un outil professionnel pour des professionnels.</p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        {PLANS_MINI.map((plan, i) => (
                            <motion.div key={plan.name} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                                className={`glass-card-premium p-6 relative ${plan.popular ? 'ring-2 ring-luna-primary' : ''}`}>
                                {plan.popular && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                        <span className="text-label-sharp bg-luna-primary text-luna-charcoal px-3 py-1 rounded-full text-[9px]">Populaire</span>
                                    </div>
                                )}
                                <h3 className="text-[14px] text-luna-charcoal mb-1">{plan.name}</h3>
                                <p className="text-[28px] tracking-tight text-luna-charcoal mb-1">{plan.price}€<span className="text-[12px] text-luna-text-muted ml-1">/mois</span></p>
                                <p className="text-[11px] text-luna-text-muted mb-4">{plan.desc}</p>
                                <Link href="/pricing"
                                    className={`block w-full py-2.5 rounded-[10px] text-[12px] text-center transition-colors cursor-pointer ${plan.popular ? 'bg-luna-primary text-luna-charcoal hover:bg-luna-primary-hover' : 'bg-luna-charcoal text-white hover:bg-[#1a1a1a]'}`}>
                                    Choisir
                                </Link>
                            </motion.div>
                        ))}
                    </div>

                    <Link href="/pricing" className="text-[12px] text-luna-primary-hover hover:text-luna-charcoal transition-colors cursor-pointer">
                        Voir tous les détails et comparer →
                    </Link>
                </div>
            </section>

            {/* ── CTA Final ── */}
            <section className="px-6 py-16">
                <div className="max-w-[800px] mx-auto">
                    <div className="bg-luna-charcoal rounded-[16px] p-10 md:p-14 text-center">
                        <h2 className="text-[24px] text-white tracking-tight mb-3">
                            Prêt à transformer votre agence ?
                        </h2>
                        <p className="text-white/40 text-[13px] mb-8 max-w-[400px] mx-auto leading-relaxed">
                            Rejoignez les 500+ agences qui utilisent Luna pour automatiser leur prospection et créer des voyages sur mesure.
                        </p>
                        <Link href="/signup/travel"
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
                                <LunaLogo size={20} />
                            </div>
                            <p className="text-[11px] text-luna-text-muted leading-relaxed">La plateforme IA B2B pour les professionnels du voyage.</p>
                        </div>
                        <div>
                            <h4 className="text-label-sharp mb-3">Produit</h4>
                            <div className="space-y-2">
                                <a href="#features" className="block text-[12px] text-luna-text-muted hover:text-luna-charcoal transition-colors cursor-pointer">Fonctionnalités</a>
                                <Link href="/pricing" className="block text-[12px] text-luna-text-muted hover:text-luna-charcoal transition-colors cursor-pointer">Tarifs</Link>
                            </div>
                        </div>
                        <div>
                            <h4 className="text-label-sharp mb-3">Légal</h4>
                            <div className="space-y-2">
                                <Link href="/cgv" className="block text-[12px] text-luna-text-muted hover:text-luna-charcoal transition-colors cursor-pointer">CGV</Link>
                                <a href="mailto:contact@luna-travel.io" className="block text-[12px] text-luna-text-muted hover:text-luna-charcoal transition-colors cursor-pointer">Contact</a>
                            </div>
                        </div>
                        <div>
                            <h4 className="text-label-sharp mb-3">Compte</h4>
                            <div className="space-y-2">
                                <Link href="/login/travel" className="block text-[12px] text-luna-text-muted hover:text-luna-charcoal transition-colors cursor-pointer">Connexion</Link>
                                <Link href="/signup/travel" className="block text-[12px] text-luna-text-muted hover:text-luna-charcoal transition-colors cursor-pointer">Essai gratuit</Link>
                            </div>
                        </div>
                    </div>
                    <div className="border-t border-gray-100 pt-5 text-center">
                        <p className="text-[11px] text-luna-text-muted">© 2026 Luna — Concierge Voyage. Tous droits réservés.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
