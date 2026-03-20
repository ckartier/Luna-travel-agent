'use client';

import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, Check, Zap, Globe, Shield, Search, Bell, FileText, BarChart3, Users, Calendar, LucideIcon } from 'lucide-react';
import { T } from '@/src/components/T';

interface ChangelogFeature {
    icon: LucideIcon;
    text: string;
    badge?: string;
}

const CHANGELOG: { version: string; date: string; tag?: string; features: ChangelogFeature[] }[] = [
    {
        version: '2.6.0',
        date: '13 Mars 2026',
        tag: 'latest',
        features: [
            { icon: Search, text: 'Recherche globale ⌘K cross-entité', badge: 'New' },
            { icon: Shield, text: 'Firestore rules renforcées avec RBAC', badge: 'Security' },
            { icon: FileText, text: 'Export CSV (contacts, voyages, devis, factures)' },
            { icon: BarChart3, text: 'API rapport mensuel avec KPIs et tendances' },
            { icon: Users, text: 'Détection de doublons contacts & prestataires' },
            { icon: Zap, text: 'Health check API pour monitoring' },
        ],
    },
    {
        version: '2.5.0',
        date: '12 Mars 2026',
        features: [
            { icon: Globe, text: 'API publique v1 (contacts, trips, quotes, invoices)' },
            { icon: Bell, text: 'Webhooks 9 événements avec HMAC-SHA256' },
            { icon: FileText, text: 'Documentation API interactive (/api-docs)' },
            { icon: Users, text: 'Dashboard admin multi-tenant' },
            { icon: Calendar, text: 'Cron jobs (rappels factures, expiration devis)' },
        ],
    },
    {
        version: '2.4.0',
        date: '11 Mars 2026',
        features: [
            { icon: FileText, text: 'PDF devis premium avec cover page et carte' },
            { icon: Globe, text: 'Portail client partageable (voyage, devis, paiements)' },
            { icon: Zap, text: 'Templates email brandés (8 types)' },
            { icon: Shield, text: 'PWA manifest et offline support' },
        ],
    },
    {
        version: '2.3.0',
        date: '10 Mars 2026',
        features: [
            { icon: BarChart3, text: 'Dashboard analytics avec graphiques Recharts' },
            { icon: Users, text: 'Pipeline CRM avec drag & drop' },
            { icon: Globe, text: 'Site builder avec 4 templates' },
            { icon: FileText, text: 'Vouchers PDF pour prestataires' },
        ],
    },
];

export default function ChangelogPage() {
    return (
        <div className="max-w-3xl mx-auto py-10 px-6">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-12"
            >
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#5a8fa3]/10 to-[#b9dae9]/20 flex items-center justify-center">
                        <Sparkles size={18} className="text-[#5a8fa3]" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-light tracking-tight text-[#2E2E2E]"><T>Quoi de neuf</T></h1>
                        <p className="text-xs text-gray-400"><T>Dernières mises à jour et améliorations</T></p>
                    </div>
                </div>
            </motion.div>

            {/* Timeline */}
            <div className="relative">
                <div className="absolute left-[19px] top-0 bottom-0 w-px bg-gray-100" />

                {CHANGELOG.map((release, ri) => (
                    <motion.div
                        key={release.version}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: ri * 0.1 }}
                        className="relative pl-12 pb-10"
                    >
                        {/* Dot */}
                        <div className={`absolute left-[14px] top-1.5 w-3 h-3 rounded-full border-2 ${ri === 0
                            ? 'bg-[#5a8fa3] border-[#5a8fa3]/30'
                            : 'bg-white border-gray-200'
                            }`} />

                        {/* Version header */}
                        <div className="flex items-center gap-3 mb-4">
                            <span className="text-sm font-medium text-[#2E2E2E]">v{release.version}</span>
                            <span className="text-xs text-gray-400">{release.date}</span>
                            {release.tag && (
                                <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-[#5a8fa3]/10 text-[#5a8fa3]">
                                    {release.tag}
                                </span>
                            )}
                        </div>

                        {/* Features */}
                        <div className="space-y-2.5">
                            {release.features.map((feat, fi) => (
                                <div
                                    key={fi}
                                    className="flex items-start gap-3 group"
                                >
                                    <div className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0 group-hover:bg-[#5a8fa3]/10 transition-colors">
                                        <feat.icon size={14} className="text-gray-400 group-hover:text-[#5a8fa3] transition-colors" />
                                    </div>
                                    <div className="flex items-center gap-2 pt-1">
                                        <span className="text-sm text-gray-600">{feat.text}</span>
                                        {feat.badge && (
                                            <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${feat.badge === 'New' ? 'bg-green-50 text-green-500' :
                                                feat.badge === 'Security' ? 'bg-amber-50 text-amber-500' :
                                                    'bg-gray-50 text-gray-400'
                                                }`}>
                                                {feat.badge}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
