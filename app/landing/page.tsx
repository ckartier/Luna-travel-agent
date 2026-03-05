'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { LunaLogo } from '@/app/components/LunaLogo';
import {
    Sparkles, Globe, BarChart3, Users, Zap, Shield, Plane, Mail, Calendar,
    ArrowRight, Check, Star, ChevronRight, Bot
} from 'lucide-react';

const FEATURES = [
    { icon: Bot, title: 'Agents IA Spécialisés', desc: 'Multi-agents autonomes qui recherchent vols, hôtels et activités en parallèle pour chaque demande client.', color: 'from-violet-500 to-purple-600' },
    { icon: Mail, title: 'Boîte Email Intelligente', desc: 'Connectez votre Gmail. L\'IA analyse chaque email, extrait les informations et crée automatiquement des leads.', color: 'from-sky-500 to-blue-600' },
    { icon: Globe, title: 'CRM Voyage Complet', desc: 'Pipeline de ventes, contacts 360°, planning, activités — tout est interconnecté et mis à jour en temps réel.', color: 'from-amber-500 to-orange-600' },
    { icon: Calendar, title: 'Planning & Calendrier', desc: 'Suivez tous les voyages confirmés avec export Google Calendar et Apple Calendar intégré.', color: 'from-emerald-500 to-green-600' },
    { icon: BarChart3, title: 'Analytics & KPIs', desc: 'Dashboard avec revenus, taux de conversion, et métriques clés pour piloter votre activité.', color: 'from-pink-500 to-rose-600' },
    { icon: Shield, title: 'Sécurité Enterprise', desc: 'Hébergement Firebase (Google Cloud), données chiffrées, conformité RGPD, SLA garanti.', color: 'from-indigo-500 to-blue-700' },
];

const PLANS_MINI = [
    { name: 'Starter', price: 99, desc: '1 Agent IA · 50 leads/mois', color: 'border-sky-200' },
    { name: 'Pro', price: 249, desc: '5 Agents · Leads illimités', color: 'border-violet-300', popular: true },
    { name: 'Enterprise', price: 499, desc: 'Illimité · API · SLA', color: 'border-amber-200' },
];

const TESTIMONIALS = [
    { name: 'Sophie Martin', role: 'Directrice, Voyages Évasion', text: 'Luna a transformé notre façon de gérer les demandes. Ce qui prenait 2h prend maintenant 10 minutes.', avatar: 'SM' },
    { name: 'Pierre Dubois', role: 'Fondateur, Jet Luxe Travel', text: 'Le CRM interconnecté est un game changer. Tout est lié : emails, pipeline, planning. Incroyable.', avatar: 'PD' },
    { name: 'Marie Laurent', role: 'Agent Senior, Globe Trotter Pro', text: 'Les agents IA sont impressionnants. Ils trouvent des combinaisons vol+hôtel que je n\'aurais jamais vues.', avatar: 'ML' },
];

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-[#faf8f5] overflow-hidden">
            {/* Navbar */}
            <nav className="fixed top-0 w-full z-50 backdrop-blur-xl bg-[#faf8f5]/80 border-b border-luna-warm-gray/10">
                <div className="max-w-7xl mx-auto flex items-center justify-between px-6 md:px-12 py-4">
                    <Link href="/landing" className="flex items-center gap-3">
                        <LunaLogo size={32} />
                        <span className="font-serif text-xl font-semibold text-luna-charcoal">Luna</span>
                    </Link>
                    <div className="hidden md:flex items-center gap-8 text-sm text-luna-text-muted font-medium">
                        <a href="#features" className="hover:text-luna-charcoal transition-colors">Fonctionnalités</a>
                        <a href="#pricing" className="hover:text-luna-charcoal transition-colors">Tarifs</a>
                        <a href="#testimonials" className="hover:text-luna-charcoal transition-colors">Témoignages</a>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link href="/login" className="text-sm text-luna-text-muted hover:text-luna-charcoal font-medium px-4 py-2 transition-colors">Connexion</Link>
                        <Link href="/pricing" className="text-sm btn-primary">
                            Commencer →
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero */}
            <section className="pt-32 pb-20 px-6 relative">
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <div className="absolute top-20 right-[10%] w-[500px] h-[500px] bg-violet-200/20 rounded-full blur-[150px]" />
                    <div className="absolute bottom-0 left-[5%] w-[400px] h-[400px] bg-sky-200/20 rounded-full blur-[120px]" />
                    <div className="absolute top-[40%] left-[40%] w-[300px] h-[300px] bg-amber-200/15 rounded-full blur-[100px]" />
                </div>

                <div className="max-w-5xl mx-auto text-center relative z-10">
                    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
                        <span className="inline-flex items-center gap-2 bg-luna-charcoal text-white text-xs font-semibold px-5 py-2 rounded-full mb-8 shadow-lg">
                            <Sparkles size={14} /> Plateforme IA pour Agences de Voyage B2B
                        </span>

                        <h1 className="font-serif text-5xl md:text-7xl font-bold text-luna-charcoal leading-[1.1] mb-6">
                            Vos agents IA<br />
                            <span className="bg-gradient-to-r from-violet-600 via-sky-500 to-emerald-500 bg-clip-text text-transparent">
                                créent des voyages
                            </span><br />
                            en quelques minutes
                        </h1>

                        <p className="text-lg md:text-xl text-luna-text-muted max-w-2xl mx-auto leading-relaxed mb-10">
                            Luna automatise la recherche de vols, hôtels et activités, gère votre pipeline commercial et transforme chaque email en opportunité.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link href="/pricing"
                                className="group btn-primary font-semibold px-8 py-4 rounded-2xl shadow-xl hover:shadow-2xl transition-all flex items-center gap-3 text-base">
                                Démarrer maintenant
                                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                            </Link>
                            <a href="#features"
                                className="text-luna-charcoal font-medium px-8 py-4 rounded-2xl border border-luna-warm-gray/20 hover:bg-white/60 transition-all text-base">
                                Voir les fonctionnalités
                            </a>
                        </div>
                    </motion.div>

                    {/* Stats bar */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.6 }}
                        className="mt-16 flex flex-wrap items-center justify-center gap-8 md:gap-16">
                        {[
                            { value: '10x', label: 'Plus rapide' },
                            { value: '95%', label: 'Satisfaction client' },
                            { value: '24/7', label: 'Agents IA actifs' },
                            { value: '500+', label: 'Agences connectées' },
                        ].map((s, i) => (
                            <div key={i} className="text-center">
                                <p className="text-3xl md:text-4xl font-bold text-luna-charcoal font-serif">{s.value}</p>
                                <p className="text-xs text-luna-text-muted font-medium mt-1 uppercase tracking-wider">{s.label}</p>
                            </div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* App Preview */}
            <section className="px-6 pb-20">
                <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                    className="max-w-6xl mx-auto">
                    <div className="bg-gradient-to-br from-luna-charcoal to-[#1a1a2e] rounded-3xl p-2 shadow-2xl">
                        <div className="bg-[#faf8f5] rounded-2xl p-8 md:p-12">
                            <div className="grid grid-cols-3 gap-4 mb-6">
                                {['Pipeline', 'CRM', 'IA Agents'].map((tab, i) => (
                                    <div key={tab} className={`text-center py-3 rounded-xl text-sm font-semibold transition-all ${i === 2 ? 'bg-luna-charcoal text-white shadow-lg' : 'bg-luna-cream text-luna-text-muted'}`}>
                                        {tab}
                                    </div>
                                ))}
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {['Nouveau', 'IA en cours', 'Devis envoyé', 'Gagné'].map((stage, i) => (
                                    <div key={stage} className="bg-white rounded-xl p-4 border border-luna-warm-gray/10 shadow-sm">
                                        <p className="text-[10px] uppercase tracking-wider font-bold text-luna-text-muted mb-3">{stage}</p>
                                        {Array.from({ length: 3 - i }, (_, j) => (
                                            <div key={j} className="bg-luna-cream/50 rounded-lg p-2.5 mb-2 border border-luna-warm-gray/5">
                                                <div className="w-3/4 h-2 bg-luna-warm-gray/15 rounded mb-1.5" />
                                                <div className="w-1/2 h-1.5 bg-luna-warm-gray/10 rounded" />
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </motion.div>
            </section>

            {/* Features */}
            <section id="features" className="px-6 py-20 bg-white">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-luna-text-muted bg-luna-cream px-4 py-1.5 rounded-full">Fonctionnalités</span>
                        <h2 className="font-serif text-3xl md:text-4xl font-bold text-luna-charcoal mt-6 mb-4">Tout pour gérer votre agence</h2>
                        <p className="text-luna-text-muted max-w-xl mx-auto">Une plateforme complète qui connecte chaque aspect de votre activité.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {FEATURES.map((f, i) => (
                            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                                className="bg-[#faf8f5] rounded-3xl p-7 border border-luna-warm-gray/10 hover:shadow-lg hover:-translate-y-1 transition-all group">
                                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${f.color} flex items-center justify-center text-white mb-5 shadow-lg group-hover:scale-110 transition-transform`}>
                                    <f.icon size={22} />
                                </div>
                                <h3 className="font-semibold text-lg text-luna-charcoal mb-2">{f.title}</h3>
                                <p className="text-sm text-luna-text-muted leading-relaxed">{f.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How it works */}
            <section className="px-6 py-20">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="font-serif text-3xl md:text-4xl font-bold text-luna-charcoal mb-4">Comment ça marche</h2>
                        <p className="text-luna-text-muted">3 étapes pour transformer votre productivité</p>
                    </div>

                    <div className="space-y-0">
                        {[
                            { step: '01', title: 'Email reçu → Lead créé', desc: 'Un client envoie un email. L\'IA l\'analyse, extrait destination, dates, budget, et crée automatiquement un lead dans votre pipeline.', icon: Mail },
                            { step: '02', title: 'Agents IA → Itinéraire complet', desc: 'Lancez vos agents spécialisés. Ils recherchent en parallèle vols, hôtels et activités pour construire un itinéraire complet.', icon: Zap },
                            { step: '03', title: 'Deal gagné → Voyage planifié', desc: 'Quand le client valide, Luna crée automatiquement le voyage dans votre planning avec export calendrier et suivi de paiement.', icon: Plane },
                        ].map((s, i) => (
                            <motion.div key={i} initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                                className="flex items-start gap-6 py-8 border-b border-luna-warm-gray/10 last:border-0">
                                <div className="text-5xl font-serif font-bold text-luna-warm-gray/20 shrink-0 w-16">{s.step}</div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-xl text-luna-charcoal mb-2 flex items-center gap-3">
                                        <s.icon size={20} className="text-luna-accent" />
                                        {s.title}
                                    </h3>
                                    <p className="text-luna-text-muted leading-relaxed">{s.desc}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            <section id="testimonials" className="px-6 py-20 bg-white">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="font-serif text-3xl md:text-4xl font-bold text-luna-charcoal mb-4">Ils nous font confiance</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {TESTIMONIALS.map((t, i) => (
                            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                                className="bg-[#faf8f5] rounded-3xl p-7 border border-luna-warm-gray/10">
                                <div className="flex items-center gap-1 mb-4">
                                    {Array.from({ length: 5 }).map((_, j) => <Star key={j} size={14} className="text-amber-400 fill-amber-400" />)}
                                </div>
                                <p className="text-luna-charcoal text-sm leading-relaxed mb-5 italic">"{t.text}"</p>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-400 to-sky-500 flex items-center justify-center text-white text-xs font-bold">
                                        {t.avatar}
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-luna-charcoal">{t.name}</p>
                                        <p className="text-xs text-luna-text-muted">{t.role}</p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Pricing preview */}
            <section id="pricing" className="px-6 py-20">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="font-serif text-3xl md:text-4xl font-bold text-luna-charcoal mb-4">Tarifs simples, sans surprise</h2>
                    <p className="text-luna-text-muted mb-12">Pas de version gratuite. Un outil professionnel pour des professionnels.</p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        {PLANS_MINI.map((plan, i) => (
                            <motion.div key={plan.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                                className={`bg-white rounded-3xl p-7 border-2 ${plan.popular ? 'border-violet-300 shadow-xl scale-105' : plan.color + ' shadow-lg'} relative`}>
                                {plan.popular && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-violet-500 to-purple-600 text-white text-[10px] font-bold px-4 py-1 rounded-full uppercase tracking-wider">
                                        Populaire
                                    </div>
                                )}
                                <h3 className="font-semibold text-lg text-luna-charcoal mb-1">{plan.name}</h3>
                                <p className="text-3xl font-bold text-luna-charcoal font-serif mb-1">{plan.price}€<span className="text-sm text-luna-text-muted font-normal">/mois</span></p>
                                <p className="text-xs text-luna-text-muted mb-5">{plan.desc}</p>
                                <Link href="/pricing"
                                    className={`block w-full py-2.5 rounded-xl font-semibold text-sm text-center transition-all ${plan.popular ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg' : 'bg-luna-charcoal text-white'}`}>
                                    Choisir
                                </Link>
                            </motion.div>
                        ))}
                    </div>

                    <Link href="/pricing" className="text-sm text-violet-500 hover:text-violet-600 font-medium transition-colors">
                        Voir tous les détails et comparer →
                    </Link>
                </div>
            </section>

            {/* CTA Final */}
            <section className="px-6 py-20">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-gradient-to-br from-luna-charcoal to-[#1a1a2e] rounded-3xl p-12 md:p-16 text-center relative overflow-hidden">
                        <div className="absolute inset-0 pointer-events-none">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/10 rounded-full blur-[80px]" />
                            <div className="absolute bottom-0 left-0 w-48 h-48 bg-sky-500/10 rounded-full blur-[60px]" />
                        </div>
                        <div className="relative z-10">
                            <h2 className="font-serif text-3xl md:text-4xl font-bold text-white mb-4">
                                Prêt à transformer votre agence ?
                            </h2>
                            <p className="text-white/50 mb-8 max-w-lg mx-auto">
                                Rejoignez les 500+ agences qui utilisent Luna pour automatiser leur prospection et créer des voyages sur mesure.
                            </p>
                            <Link href="/pricing"
                                className="inline-flex items-center gap-3 bg-white text-luna-charcoal font-semibold px-8 py-4 rounded-2xl shadow-xl hover:shadow-2xl hover:scale-105 transition-all text-base">
                                Commencer maintenant <ArrowRight size={18} />
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-luna-warm-gray/10 py-10 px-6 bg-white">
                <div className="max-w-6xl mx-auto">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <LunaLogo size={24} />
                                <span className="font-serif text-lg font-semibold text-luna-charcoal">Luna</span>
                            </div>
                            <p className="text-xs text-luna-text-muted leading-relaxed">La plateforme IA B2B pour les professionnels du voyage.</p>
                        </div>
                        <div>
                            <h4 className="text-xs font-bold uppercase tracking-wider text-luna-charcoal mb-3">Produit</h4>
                            <div className="space-y-2">
                                <a href="#features" className="block text-sm text-luna-text-muted hover:text-luna-charcoal transition-colors">Fonctionnalités</a>
                                <Link href="/pricing" className="block text-sm text-luna-text-muted hover:text-luna-charcoal transition-colors">Tarifs</Link>
                            </div>
                        </div>
                        <div>
                            <h4 className="text-xs font-bold uppercase tracking-wider text-luna-charcoal mb-3">Légal</h4>
                            <div className="space-y-2">
                                <Link href="/cgv" className="block text-sm text-luna-text-muted hover:text-luna-charcoal transition-colors">CGV</Link>
                                <a href="mailto:legal@luna-travel.io" className="block text-sm text-luna-text-muted hover:text-luna-charcoal transition-colors">Contact</a>
                            </div>
                        </div>
                        <div>
                            <h4 className="text-xs font-bold uppercase tracking-wider text-luna-charcoal mb-3">Compte</h4>
                            <div className="space-y-2">
                                <Link href="/login" className="block text-sm text-luna-text-muted hover:text-luna-charcoal transition-colors">Connexion</Link>
                                <Link href="/pricing" className="block text-sm text-luna-text-muted hover:text-luna-charcoal transition-colors">S'abonner</Link>
                            </div>
                        </div>
                    </div>
                    <div className="border-t border-luna-warm-gray/10 pt-6 text-center">
                        <p className="text-xs text-luna-text-muted">© {new Date().getFullYear()} Luna Travel SaaS. Tous droits réservés.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
