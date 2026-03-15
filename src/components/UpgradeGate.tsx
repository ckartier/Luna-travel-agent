'use client';

import { motion } from 'framer-motion';
import { Lock, Sparkles, ArrowRight, Globe, BarChart3, Users, Calendar, Mail, Plane, FileText, CreditCard, Zap, MessageCircle, Hotel, UsersRound, Settings } from 'lucide-react';
import Link from 'next/link';
import { fetchWithAuth } from '@/src/lib/utils/fetchWithAuth';
import { useState } from 'react';
import type { ProductModule } from '@/src/hooks/useAccess';

interface UpgradeGateProps {
    featureName: string;
    featureDescription: string;
    requiredModule: ProductModule;
    suggestedPlan: {
        planId: string;
        planName: string;
        price: number;
    };
    previewFeatures?: { icon: any; title: string; desc: string }[];
}

// Module-specific preview configurations
const MODULE_PREVIEWS: Record<ProductModule, { title: string; subtitle: string; gradient: string; features: { icon: any; title: string; desc: string }[] }> = {
    site_builder: {
        title: 'Créez votre site vitrine',
        subtitle: 'Un site professionnel pour votre conciergerie en quelques clics',
        gradient: 'from-sky-500 to-blue-600',
        features: [
            { icon: Globe, title: 'Éditeur Visuel', desc: '3 templates premium avec drag & drop, animations et personnalisation complète.' },
            { icon: Sparkles, title: 'Bibliothèque d\'Effets', desc: '30+ animations d\'entrée, de survol et de scroll pour un site vivant.' },
            { icon: BarChart3, title: 'Analytics Site', desc: 'Visites, formulaires reçus, taux de conversion et sources de trafic.' },
            { icon: Settings, title: 'SEO & Domaine', desc: 'Meta tags, Open Graph, sitemap et connexion de votre domaine personnalisé.' },
        ],
    },
    crm: {
        title: 'Gérez votre activité',
        subtitle: 'Le CRM complet conçu pour les professionnels du voyage',
        gradient: 'from-violet-500 to-purple-600',
        features: [
            { icon: Users, title: 'Gestion Clients', desc: 'Fiches contacts enrichies, historique complet et vue 360° de chaque client.' },
            { icon: Calendar, title: 'Planning Voyages', desc: 'Planification drag & drop, vue Gantt et synchronisation calendrier.' },
            { icon: Mail, title: 'Boîte de Réception', desc: 'Emails centralisés, analyse IA automatique et conversion en leads.' },
            { icon: Plane, title: 'Réservations', desc: 'Suivi des bookings, confirmations automatiques et rappels WhatsApp.' },
            { icon: FileText, title: 'Devis & Factures', desc: 'Génération PDF, calcul de marges et suivi des paiements Stripe.' },
            { icon: Hotel, title: 'Catalogue', desc: 'Base de données prestataires avec prix, disponibilités et évaluations.' },
        ],
    },
    ai_agents: {
        title: 'Intelligence Artificielle',
        subtitle: 'Des agents IA qui travaillent pour vous 24/7',
        gradient: 'from-amber-500 to-orange-600',
        features: [
            { icon: Zap, title: 'Agent Voyage', desc: 'Création d\'itinéraires complets avec vols, hôtels et activités en parallèle.' },
            { icon: Sparkles, title: 'Agent Prestations', desc: 'Matching catalogue intelligent, calcul de marges et suggestions automatiques.' },
            { icon: Mail, title: 'Analyse Email', desc: 'Chaque email analysé et transformé en lead qualifié automatiquement.' },
            { icon: BarChart3, title: 'Recommandations', desc: 'Suggestions personnalisées basées sur les préférences de chaque client.' },
        ],
    },
    whatsapp: {
        title: 'WhatsApp Business',
        subtitle: 'Communiquez directement avec vos clients et prestataires',
        gradient: 'from-emerald-500 to-green-600',
        features: [
            { icon: MessageCircle, title: 'Notifications Auto', desc: 'Confirmations de booking, rappels et récaps envoyés automatiquement.' },
            { icon: Users, title: 'Contact Prestataires', desc: 'Envoi direct aux hôtels, restaurants et guides depuis le CRM.' },
            { icon: Zap, title: 'Templates', desc: 'Messages pré-formatés personnalisables pour chaque type de communication.' },
        ],
    },
    analytics_pro: {
        title: 'Analytics Avancés',
        subtitle: 'Des métriques détaillées pour piloter votre croissance',
        gradient: 'from-pink-500 to-rose-600',
        features: [
            { icon: BarChart3, title: 'KPIs Temps Réel', desc: 'Revenus, taux de conversion, panier moyen et tendances.' },
            { icon: Users, title: 'Rapports Clients', desc: 'Segmentation, LTV, récurrence et satisfaction.' },
            { icon: Calendar, title: 'Prévisions', desc: 'Projections de CA, saisonnalité et objectifs.' },
        ],
    },
};

export function UpgradeGate({ featureName, featureDescription, requiredModule, suggestedPlan, previewFeatures }: UpgradeGateProps) {
    const [loading, setLoading] = useState(false);
    const modulePreview = MODULE_PREVIEWS[requiredModule];
    const features = previewFeatures || modulePreview.features;

    const handleUpgrade = async () => {
        setLoading(true);
        try {
            const res = await fetchWithAuth('/api/stripe/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ planId: suggestedPlan.planId }),
            });
            const data = await res.json();
            if (data.url) {
                window.location.href = data.url;
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full h-full flex items-center justify-center">
            <div className="max-w-[1100px] w-full mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className="relative"
                >
                    {/* Header Card */}
                    <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${modulePreview.gradient} p-12 md:p-16 text-white mb-8`}>
                        {/* Background decoration */}
                        <div className="absolute top-0 right-0 w-1/2 h-full opacity-10">
                            <div className="absolute top-10 right-10 w-40 h-40 rounded-full border-2 border-white" />
                            <div className="absolute top-20 right-20 w-60 h-60 rounded-full border border-white" />
                            <div className="absolute -bottom-10 right-40 w-32 h-32 rounded-full bg-white/10" />
                        </div>

                        <div className="relative z-10 max-w-2xl">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.2, duration: 0.5 }}
                                className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-8 border border-white/30"
                            >
                                <Lock size={28} strokeWidth={1.5} />
                            </motion.div>

                            <h1 className="text-4xl md:text-5xl font-light tracking-tight mb-4 leading-tight">
                                {modulePreview.title}
                            </h1>
                            <p className="text-lg md:text-xl font-light opacity-80 leading-relaxed mb-8">
                                {modulePreview.subtitle}
                            </p>

                            <div className="flex items-center gap-4 flex-wrap">
                                <button
                                    onClick={handleUpgrade}
                                    disabled={loading}
                                    className="group flex items-center gap-3 bg-white text-gray-900 px-8 py-4 rounded-2xl text-sm font-bold uppercase tracking-widest hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-60"
                                >
                                    {loading ? (
                                        <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <Sparkles size={16} />
                                            Débloquer — {suggestedPlan.price}€/mois
                                            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </button>
                                <Link
                                    href="/pricing"
                                    className="text-white/70 hover:text-white text-sm font-medium underline underline-offset-4 transition-colors"
                                >
                                    Voir tous les plans
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Features Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {features.map((feature, i) => {
                            const Icon = feature.icon;
                            return (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 + i * 0.08, duration: 0.6 }}
                                    className="group bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-lg hover:border-gray-200 hover:-translate-y-1 transition-all duration-300"
                                >
                                    <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center mb-4 group-hover:bg-gray-100 transition-colors">
                                        <Icon size={18} className="text-gray-500 group-hover:text-gray-700 transition-colors" strokeWidth={1.5} />
                                    </div>
                                    <h3 className="text-sm font-bold text-[#2E2E2E] mb-2 tracking-tight">{feature.title}</h3>
                                    <p className="text-xs text-gray-500 leading-relaxed font-light">{feature.desc}</p>
                                </motion.div>
                            );
                        })}
                    </div>

                    {/* Social proof */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8 }}
                        className="mt-8 flex items-center justify-center gap-6 text-gray-400"
                    >
                        <div className="flex -space-x-2">
                            {['L', 'M', 'S', 'A'].map((letter, i) => (
                                <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-[10px] font-bold text-gray-600 border-2 border-white">
                                    {letter}
                                </div>
                            ))}
                        </div>
                        <p className="text-xs font-medium">
                            Utilisé par <span className="text-[#2E2E2E] font-bold">200+ agences</span> en France
                        </p>
                    </motion.div>
                </motion.div>
            </div>
        </div>
    );
}
