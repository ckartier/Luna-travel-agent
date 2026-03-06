'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Sparkles, Shield, Zap, Globe, Users, BarChart3, Headphones, ArrowRight, Star } from 'lucide-react';
import Link from 'next/link';
import { LunaLogo } from '@/app/components/LunaLogo';
import { fetchWithAuth } from '@/src/lib/utils/fetchWithAuth';

const PLANS = [
    {
        id: 'starter',
        name: 'Starter',
        price: 99,
        period: '/mois',
        tagline: 'Pour démarrer avec l\'IA voyage',
        accent: 'from-sky-500 to-blue-600',
        accentLight: 'bg-sky-50 text-sky-700 border-sky-200',
        features: [
            '1 Agent IA',
            '50 leads / mois',
            'CRM Basique',
            'Pipeline de vente',
            'Boîte de réception email',
            'Support par email',
        ],
        cta: 'Commencer',
    },
    {
        id: 'pro',
        name: 'Pro',
        price: 249,
        period: '/mois',
        tagline: 'La solution complète pour les agences',
        popular: true,
        accent: 'from-violet-500 to-purple-600',
        accentLight: 'bg-violet-50 text-violet-700 border-violet-200',
        features: [
            '5 Agents IA',
            'Leads illimités',
            'CRM Complet + Planning',
            'Export Google / Apple Calendar',
            'Analytics avancés',
            'Vue 360° contacts',
            'Support prioritaire',
            'API accès limité',
        ],
        cta: 'Choisir Pro',
    },
    {
        id: 'enterprise',
        name: 'Enterprise',
        price: 499,
        period: '/mois',
        tagline: 'Pour les réseaux et groupes',
        accent: 'from-amber-500 to-orange-600',
        accentLight: 'bg-amber-50 text-amber-700 border-amber-200',
        features: [
            'Agents IA illimités',
            'Leads illimités',
            'CRM Complet + Planning',
            'API complète + Webhooks',
            'Multi-utilisateurs',
            'SLA garanti 99.9%',
            'Account Manager dédié',
            'Formations personnalisées',
            'Intégration sur mesure',
        ],
        cta: 'Contacter',
    },
];

export default function PricingPage() {
    const [loading, setLoading] = useState<string | null>(null);
    const [annual, setAnnual] = useState(false);

    const handleSubscribe = async (planId: string) => {
        setLoading(planId);
        try {
            const res = await fetchWithAuth('/api/stripe/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ planId }),
            });
            const data = await res.json();
            if (data.url) {
                window.location.href = data.url;
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(null);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#faf8f5] via-white to-[#f5f0ea]">
            {/* Navbar */}
            <nav className="flex items-center justify-between px-6 md:px-12 py-5 max-w-7xl mx-auto">
                <Link href="/" className="flex items-center gap-3">
                    <LunaLogo size={28} />
                </Link>
                <div className="flex items-center gap-6">
                    <Link href="/cgv" className="text-sm text-luna-text-muted hover:text-luna-charcoal transition-colors font-medium">CGV</Link>
                    <Link href="/login" className="text-sm btn-primary">
                        Connexion
                    </Link>
                </div>
            </nav>

            {/* Hero */}
            <div className="text-center px-6 pt-12 pb-8 max-w-4xl mx-auto">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <span className="inline-flex items-center gap-2 bg-luna-charcoal/5 text-luna-charcoal text-xs font-semibold px-4 py-1.5 rounded-full mb-6">
                        <Sparkles size={14} /> Plateforme B2B pour agences de voyage
                    </span>
                    <h1 className="font-serif text-4xl md:text-5xl font-bold text-luna-charcoal leading-tight mb-4">
                        L'IA qui transforme vos<br />
                        <span className="bg-gradient-to-r from-violet-600 to-sky-500 bg-clip-text text-transparent">demandes en voyages</span>
                    </h1>
                    <p className="text-luna-text-muted text-lg max-w-2xl mx-auto leading-relaxed">
                        Automatisez votre prospection, gérez votre pipeline et créez des itinéraires sur mesure grâce à nos agents IA spécialisés.
                    </p>
                </motion.div>

                {/* Annual toggle */}
                <div className="flex items-center justify-center gap-3 mt-8">
                    <span className={`text-sm font-medium ${!annual ? 'text-luna-charcoal' : 'text-luna-text-muted'}`}>Mensuel</span>
                    <button onClick={() => setAnnual(!annual)}
                        className={`relative w-12 h-6 rounded-full transition-colors ${annual ? 'bg-violet-500' : 'bg-luna-warm-gray/30'}`}>
                        <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${annual ? 'translate-x-6' : 'translate-x-0.5'}`} />
                    </button>
                    <span className={`text-sm font-medium ${annual ? 'text-luna-charcoal' : 'text-luna-text-muted'}`}>
                        Annuel <span className="text-emerald-500 font-semibold">-20%</span>
                    </span>
                </div>
            </div>

            {/* Plans */}
            <div className="max-w-6xl mx-auto px-6 pb-16">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {PLANS.map((plan, i) => (
                        <motion.div key={plan.id}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className={`relative bg-white rounded-3xl border ${plan.popular ? 'border-violet-300 shadow-xl shadow-violet-100/50 scale-105' : 'border-luna-warm-gray/15 shadow-lg'} overflow-hidden flex flex-col`}>

                            {plan.popular && (
                                <div className="bg-gradient-to-r from-violet-500 to-purple-600 text-white text-center text-xs font-bold uppercase tracking-widest py-2">
                                    ⭐ Le plus populaire
                                </div>
                            )}

                            <div className="p-7 flex-1 flex flex-col">
                                <div className={`inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.15em] font-semibold px-3 py-1 rounded-full border w-fit mb-4 ${plan.accentLight}`}>
                                    {plan.name}
                                </div>

                                <div className="mb-2">
                                    <span className="text-4xl font-bold text-luna-charcoal">{annual ? Math.round(plan.price * 0.8) : plan.price}€</span>
                                    <span className="text-luna-text-muted text-sm font-medium">{plan.period}</span>
                                </div>
                                <p className="text-sm text-luna-text-muted mb-6">{plan.tagline}</p>

                                <ul className="space-y-3 mb-8 flex-1">
                                    {plan.features.map((f, j) => (
                                        <li key={j} className="flex items-center gap-2.5 text-sm text-luna-charcoal">
                                            <Check size={16} className="text-emerald-500 shrink-0" />
                                            {f}
                                        </li>
                                    ))}
                                </ul>

                                <button onClick={() => handleSubscribe(plan.id)}
                                    disabled={loading === plan.id}
                                    className={`w-full py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${plan.popular
                                        ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-200/50 hover:shadow-xl hover:shadow-violet-200/70'
                                        : 'bg-luna-charcoal text-white hover:bg-[#1a1a1a]'
                                        } ${loading === plan.id ? 'opacity-60' : ''}`}>
                                    {loading === plan.id ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>{plan.cta} <ArrowRight size={16} /></>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Features grid */}
            <div className="max-w-6xl mx-auto px-6 pb-20">
                <h2 className="font-serif text-2xl font-semibold text-luna-charcoal text-center mb-10">Tout ce qu'il faut pour réussir</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { icon: Zap, title: 'Agents IA', desc: 'Multi-agents spécialisés : vols, hôtels, activités' },
                        { icon: Globe, title: 'CRM Complet', desc: 'Pipeline, contacts, planning, activités liés' },
                        { icon: Users, title: 'Multi-utilisateurs', desc: 'Collaborez en équipe sur vos dossiers' },
                        { icon: BarChart3, title: 'Analytics', desc: 'KPIs en temps réel et rapports automatiques' },
                        { icon: Shield, title: 'Sécurité', desc: 'Données chiffrées, hébergement Firebase' },
                        { icon: Headphones, title: 'Support', desc: 'Assistance dédiée selon votre formule' },
                        { icon: Star, title: 'Sur mesure', desc: 'Intégrations personnalisées pour Enterprise' },
                        { icon: Sparkles, title: 'Mises à jour', desc: 'Nouvelles fonctionnalités chaque mois' },
                    ].map((f, i) => (
                        <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.05 }}
                            className="bg-white/60 backdrop-blur-xl rounded-2xl p-5 border border-luna-warm-gray/10 shadow-sm hover:shadow-md transition-all">
                            <f.icon size={20} className="text-luna-accent mb-3" />
                            <h3 className="font-semibold text-sm text-luna-charcoal mb-1">{f.title}</h3>
                            <p className="text-xs text-luna-text-muted leading-relaxed">{f.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Footer */}
            <footer className="border-t border-luna-warm-gray/10 py-8 px-6">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <LunaLogo size={24} />
                        <span className="text-sm text-luna-text-muted">© 2026 Luna — Concierge Voyage. Tous droits réservés.</span>
                    </div>
                    <div className="flex gap-6 text-sm text-luna-text-muted">
                        <Link href="/cgv" className="hover:text-luna-charcoal transition-colors">CGV</Link>
                        <Link href="/login" className="hover:text-luna-charcoal transition-colors">Connexion</Link>
                        <a href="mailto:contact@luna-travel.io" className="hover:text-luna-charcoal transition-colors">Contact</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
