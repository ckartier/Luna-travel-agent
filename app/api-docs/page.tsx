'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
    Book, Code, Key, Users, Plane, FileText, CreditCard,
    Webhook, ChevronDown, ChevronRight, Copy, Check, ExternalLink,
} from 'lucide-react';

/* ═══════════════════════════════════════
   API v1 Documentation — Interactive Reference
   ═══════════════════════════════════════ */

const API_BASE = '/api/v1';

interface Endpoint {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    path: string;
    description: string;
    params?: { name: string; type: string; required: boolean; desc: string }[];
    body?: { name: string; type: string; required: boolean; desc: string }[];
    response?: string;
    curl?: string;
}

interface Section {
    title: string;
    icon: any;
    color: string;
    description: string;
    endpoints: Endpoint[];
}

const SECTIONS: Section[] = [
    {
        title: 'Contacts',
        icon: Users,
        color: '#2F80ED',
        description: 'Gérer les contacts clients (B2B/B2C)',
        endpoints: [
            {
                method: 'GET',
                path: '/contacts',
                description: 'Lister les contacts',
                params: [
                    { name: 'limit', type: 'number', required: false, desc: 'Résultats par page (max 100, défaut 20)' },
                    { name: 'offset', type: 'number', required: false, desc: 'Position de départ' },
                    { name: 'type', type: 'string', required: false, desc: 'Filtrer par type: B2B | B2C' },
                    { name: 'tag', type: 'string', required: false, desc: 'Filtrer par tag' },
                ],
                curl: `curl -H "X-API-Key: lk_xxx" https://luna.app/api/v1/contacts?limit=10`,
            },
            {
                method: 'POST',
                path: '/contacts',
                description: 'Créer un contact',
                body: [
                    { name: 'name', type: 'string', required: true, desc: 'Nom complet' },
                    { name: 'email', type: 'string', required: false, desc: 'Email' },
                    { name: 'phone', type: 'string', required: false, desc: 'Téléphone' },
                    { name: 'type', type: 'string', required: false, desc: 'B2B ou B2C (défaut B2C)' },
                    { name: 'tags', type: 'string[]', required: false, desc: 'Tags associés' },
                    { name: 'company', type: 'string', required: false, desc: 'Société' },
                    { name: 'notes', type: 'string', required: false, desc: 'Notes' },
                ],
                curl: `curl -X POST -H "X-API-Key: lk_xxx" -H "Content-Type: application/json" \\
  -d '{"name":"Claire Cartier","email":"claire@email.com","type":"B2C"}' \\
  https://luna.app/api/v1/contacts`,
            },
        ],
    },
    {
        title: 'Trips',
        icon: Plane,
        color: '#27AE60',
        description: 'Gérer les voyages et itinéraires',
        endpoints: [
            {
                method: 'GET',
                path: '/trips',
                description: 'Lister les voyages',
                params: [
                    { name: 'limit', type: 'number', required: false, desc: 'Résultats par page' },
                    { name: 'offset', type: 'number', required: false, desc: 'Position de départ' },
                    { name: 'status', type: 'string', required: false, desc: 'DRAFT | CONFIRMED | COMPLETED | CANCELLED' },
                    { name: 'clientName', type: 'string', required: false, desc: 'Filtrer par client' },
                ],
                curl: `curl -H "X-API-Key: lk_xxx" https://luna.app/api/v1/trips?status=CONFIRMED`,
            },
            {
                method: 'POST',
                path: '/trips',
                description: 'Créer un voyage',
                body: [
                    { name: 'destination', type: 'string', required: true, desc: 'Destination' },
                    { name: 'clientName', type: 'string', required: true, desc: 'Nom du client' },
                    { name: 'title', type: 'string', required: false, desc: 'Titre du voyage' },
                    { name: 'startDate', type: 'string', required: false, desc: 'Date de début (YYYY-MM-DD)' },
                    { name: 'endDate', type: 'string', required: false, desc: 'Date de fin' },
                    { name: 'travelers', type: 'number', required: false, desc: 'Nombre de voyageurs' },
                    { name: 'budget', type: 'number', required: false, desc: 'Budget' },
                    { name: 'currency', type: 'string', required: false, desc: 'Code devise (EUR, USD, etc.)' },
                ],
                curl: `curl -X POST -H "X-API-Key: lk_xxx" -H "Content-Type: application/json" \\
  -d '{"destination":"Bali","clientName":"Claire Cartier","travelers":2,"budget":5000}' \\
  https://luna.app/api/v1/trips`,
            },
        ],
    },
    {
        title: 'Quotes',
        icon: FileText,
        color: '#F2994A',
        description: 'Gérer les devis clients',
        endpoints: [
            {
                method: 'GET',
                path: '/quotes',
                description: 'Lister les devis',
                params: [
                    { name: 'limit', type: 'number', required: false, desc: 'Résultats par page' },
                    { name: 'status', type: 'string', required: false, desc: 'DRAFT | SENT | ACCEPTED | REJECTED' },
                ],
                curl: `curl -H "X-API-Key: lk_xxx" https://luna.app/api/v1/quotes?status=SENT`,
            },
            {
                method: 'POST',
                path: '/quotes',
                description: 'Créer un devis (auto-calcul totaux)',
                body: [
                    { name: 'clientName', type: 'string', required: true, desc: 'Nom du client' },
                    { name: 'items', type: 'array', required: true, desc: '[ { description, unitPrice, quantity, taxRate } ]' },
                    { name: 'currency', type: 'string', required: false, desc: 'Code devise (défaut EUR)' },
                    { name: 'validDays', type: 'number', required: false, desc: 'Validité en jours (défaut 30)' },
                ],
                curl: `curl -X POST -H "X-API-Key: lk_xxx" -H "Content-Type: application/json" \\
  -d '{"clientName":"Claire","items":[{"description":"Vol","unitPrice":900,"quantity":2}]}' \\
  https://luna.app/api/v1/quotes`,
            },
        ],
    },
    {
        title: 'Invoices',
        icon: CreditCard,
        color: '#9B51E0',
        description: 'Gérer les factures',
        endpoints: [
            {
                method: 'GET',
                path: '/invoices',
                description: 'Lister les factures',
                params: [
                    { name: 'status', type: 'string', required: false, desc: 'DRAFT | SENT | PAID | OVERDUE' },
                ],
                curl: `curl -H "X-API-Key: lk_xxx" https://luna.app/api/v1/invoices`,
            },
            {
                method: 'POST',
                path: '/invoices',
                description: 'Créer une facture (auto-calcul totaux)',
                body: [
                    { name: 'clientName', type: 'string', required: true, desc: 'Nom du client' },
                    { name: 'items', type: 'array', required: true, desc: '[ { description, unitPrice, quantity, taxRate } ]' },
                    { name: 'currency', type: 'string', required: false, desc: 'Code devise' },
                    { name: 'dueDays', type: 'number', required: false, desc: 'Échéance en jours (défaut 30)' },
                    { name: 'quoteId', type: 'string', required: false, desc: 'ID du devis lié' },
                ],
                curl: `curl -X POST -H "X-API-Key: lk_xxx" -H "Content-Type: application/json" \\
  -d '{"clientName":"Claire","items":[{"description":"Voyage Bali","unitPrice":4850,"quantity":1}]}' \\
  https://luna.app/api/v1/invoices`,
            },
        ],
    },
    {
        title: 'Webhooks',
        icon: Webhook,
        color: '#EB5757',
        description: 'Recevoir des notifications en temps réel',
        endpoints: [
            {
                method: 'GET',
                path: '/webhooks',
                description: 'Lister les webhooks enregistrés',
                curl: `curl -H "X-API-Key: lk_xxx" https://luna.app/api/v1/webhooks`,
            },
            {
                method: 'POST',
                path: '/webhooks',
                description: 'Enregistrer un webhook',
                body: [
                    { name: 'url', type: 'string', required: true, desc: 'URL HTTPS de destination' },
                    { name: 'events', type: 'string[]', required: false, desc: 'Events à écouter (défaut: tous)' },
                    { name: 'name', type: 'string', required: false, desc: 'Nom du webhook' },
                ],
                response: 'Retourne { url, events, secret } — gardez le secret pour vérifier les signatures.',
                curl: `curl -X POST -H "X-API-Key: lk_xxx" -H "Content-Type: application/json" \\
  -d '{"url":"https://myapp.com/webhook","events":["quote.accepted","invoice.paid"]}' \\
  https://luna.app/api/v1/webhooks`,
            },
            {
                method: 'DELETE',
                path: '/webhooks',
                description: 'Supprimer un webhook',
                body: [{ name: 'url', type: 'string', required: true, desc: 'URL du webhook à supprimer' }],
                curl: `curl -X DELETE -H "X-API-Key: lk_xxx" -H "Content-Type: application/json" \\
  -d '{"url":"https://myapp.com/webhook"}' \\
  https://luna.app/api/v1/webhooks`,
            },
        ],
    },
];

const WEBHOOK_EVENTS = [
    { event: 'quote.created', desc: 'Nouveau devis créé' },
    { event: 'quote.accepted', desc: 'Devis accepté par le client' },
    { event: 'quote.rejected', desc: 'Devis refusé' },
    { event: 'invoice.created', desc: 'Nouvelle facture créée' },
    { event: 'invoice.paid', desc: 'Facture payée' },
    { event: 'trip.created', desc: 'Nouveau voyage créé' },
    { event: 'contact.created', desc: 'Nouveau contact ajouté' },
    { event: 'booking.confirmed', desc: 'Réservation confirmée' },
    { event: 'portal.viewed', desc: 'Client a consulté son portail' },
];

const METHOD_COLORS: Record<string, { bg: string; text: string }> = {
    GET: { bg: '#E8F5E9', text: '#2E7D32' },
    POST: { bg: '#E3F2FD', text: '#1565C0' },
    PUT: { bg: '#FFF3E0', text: '#E65100' },
    DELETE: { bg: '#FFEBEE', text: '#C62828' },
};

export default function APIDocsPage() {
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
    const [copiedCurl, setCopiedCurl] = useState<string | null>(null);

    const toggleSection = (title: string) => {
        setExpandedSections(prev => ({ ...prev, [title]: !prev[title] }));
    };

    const copyCurl = (curl: string) => {
        navigator.clipboard.writeText(curl);
        setCopiedCurl(curl);
        setTimeout(() => setCopiedCurl(null), 2000);
    };

    return (
        <div className="min-h-screen bg-[#FAFAF8]">
            <div className="max-w-[960px] mx-auto px-6 py-16">
                {/* Header */}
                <div className="mb-12">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-[#2E2E2E] rounded-xl flex items-center justify-center">
                            <Book size={18} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-light text-[#2E2E2E] tracking-tight">Luna API v1</h1>
                            <p className="text-xs text-gray-400">Documentation de référence</p>
                        </div>
                    </div>
                    <p className="text-sm text-gray-500 leading-relaxed max-w-xl">
                        API RESTful pour intégrer Luna avec vos outils. Authentification par clé API,
                        pagination, filtres, webhooks temps réel.
                    </p>
                </div>

                {/* Auth Section */}
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl border border-gray-100 p-6 mb-8 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                        <Key size={16} className="text-amber-500" />
                        <h2 className="text-sm font-bold text-[#2E2E2E] uppercase tracking-wider">Authentification</h2>
                    </div>
                    <p className="text-sm text-gray-500 mb-4">
                        Ajoutez votre clé API dans le header <code className="bg-gray-100 px-2 py-0.5 rounded text-xs font-mono">X-API-Key</code> de chaque requête.
                    </p>
                    <div className="bg-[#2E2E2E] rounded-xl p-4 font-mono text-xs text-gray-300 overflow-x-auto">
                        <span className="text-emerald-400">curl</span> -H <span className="text-amber-300">&quot;X-API-Key: lk_votre_cle&quot;</span> https://luna.app/api/v1/contacts
                    </div>
                    <p className="text-[10px] text-gray-400 mt-3">
                        Les clés commencent par <code className="font-mono">lk_</code>. Configurez-les dans CRM → Paramètres → Clés API.
                    </p>
                </motion.div>

                {/* Endpoints */}
                <div className="space-y-4">
                    {SECTIONS.map((section, si) => (
                        <motion.div key={section.title}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.05 * si }}
                            className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
                        >
                            <button onClick={() => toggleSection(section.title)}
                                className="w-full px-6 py-5 flex items-center justify-between hover:bg-gray-50/50 transition-colors cursor-pointer">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${section.color}15` }}>
                                        <section.icon size={16} style={{ color: section.color }} />
                                    </div>
                                    <div className="text-left">
                                        <h3 className="text-sm font-bold text-[#2E2E2E]">{section.title}</h3>
                                        <p className="text-[10px] text-gray-400">{section.description}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[9px] font-bold text-gray-300 bg-gray-50 px-2 py-1 rounded-full">
                                        {section.endpoints.length} endpoint{section.endpoints.length > 1 ? 's' : ''}
                                    </span>
                                    {expandedSections[section.title] ? <ChevronDown size={14} className="text-gray-300" /> : <ChevronRight size={14} className="text-gray-300" />}
                                </div>
                            </button>

                            {expandedSections[section.title] && (
                                <div className="border-t border-gray-50 px-6 pb-6 space-y-6">
                                    {section.endpoints.map((ep, ei) => {
                                        const mc = METHOD_COLORS[ep.method];
                                        return (
                                            <div key={ei} className="mt-4">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <span className="text-[10px] font-bold px-2 py-1 rounded-md" style={{ backgroundColor: mc.bg, color: mc.text }}>
                                                        {ep.method}
                                                    </span>
                                                    <code className="text-xs font-mono text-[#2E2E2E]">{API_BASE}{ep.path}</code>
                                                    <span className="text-[10px] text-gray-400 ml-2">— {ep.description}</span>
                                                </div>

                                                {ep.params && ep.params.length > 0 && (
                                                    <div className="mb-3">
                                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-2">Query Params</p>
                                                        <div className="bg-gray-50 rounded-xl overflow-hidden">
                                                            <table className="w-full text-xs">
                                                                <tbody>
                                                                    {ep.params.map((p, pi) => (
                                                                        <tr key={pi} className="border-b border-gray-100 last:border-0">
                                                                            <td className="px-3 py-2 font-mono text-[#2E2E2E] font-medium w-28">{p.name}</td>
                                                                            <td className="px-3 py-2 text-gray-400 w-16">{p.type}</td>
                                                                            <td className="px-3 py-2">
                                                                                {p.required && <span className="text-[8px] font-bold text-red-400 bg-red-50 px-1.5 py-0.5 rounded mr-1">requis</span>}
                                                                                <span className="text-gray-500">{p.desc}</span>
                                                                            </td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </div>
                                                )}

                                                {ep.body && ep.body.length > 0 && (
                                                    <div className="mb-3">
                                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-2">Request Body (JSON)</p>
                                                        <div className="bg-gray-50 rounded-xl overflow-hidden">
                                                            <table className="w-full text-xs">
                                                                <tbody>
                                                                    {ep.body.map((p, pi) => (
                                                                        <tr key={pi} className="border-b border-gray-100 last:border-0">
                                                                            <td className="px-3 py-2 font-mono text-[#2E2E2E] font-medium w-28">{p.name}</td>
                                                                            <td className="px-3 py-2 text-gray-400 w-16">{p.type}</td>
                                                                            <td className="px-3 py-2">
                                                                                {p.required && <span className="text-[8px] font-bold text-red-400 bg-red-50 px-1.5 py-0.5 rounded mr-1">requis</span>}
                                                                                <span className="text-gray-500">{p.desc}</span>
                                                                            </td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </div>
                                                )}

                                                {ep.response && (
                                                    <p className="text-[10px] text-amber-600 bg-amber-50 px-3 py-2 rounded-lg mb-3">💡 {ep.response}</p>
                                                )}

                                                {ep.curl && (
                                                    <div className="relative">
                                                        <div className="bg-[#2E2E2E] rounded-xl p-4 font-mono text-[11px] text-gray-300 overflow-x-auto whitespace-pre-wrap">
                                                            {ep.curl}
                                                        </div>
                                                        <button
                                                            onClick={() => copyCurl(ep.curl!)}
                                                            className="absolute top-2 right-2 p-1.5 bg-white/10 rounded-md hover:bg-white/20 transition-colors cursor-pointer"
                                                        >
                                                            {copiedCurl === ep.curl ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} className="text-gray-400" />}
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </motion.div>
                    ))}
                </div>

                {/* Webhook Events Reference */}
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                    className="bg-white rounded-2xl border border-gray-100 p-6 mt-8 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                        <Webhook size={16} className="text-red-400" />
                        <h2 className="text-sm font-bold text-[#2E2E2E] uppercase tracking-wider">Webhook Events</h2>
                    </div>
                    <p className="text-sm text-gray-500 mb-4">
                        Chaque webhook envoyé inclut les headers : <code className="bg-gray-100 px-1.5 py-0.5 rounded text-[10px] font-mono">X-Webhook-Event</code>,
                        <code className="bg-gray-100 px-1.5 py-0.5 rounded text-[10px] font-mono ml-1">X-Webhook-Signature</code> (HMAC-SHA256),
                        <code className="bg-gray-100 px-1.5 py-0.5 rounded text-[10px] font-mono ml-1">X-Webhook-Timestamp</code>.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        {WEBHOOK_EVENTS.map(we => (
                            <div key={we.event} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                                <code className="text-[10px] font-mono font-bold text-[#2E2E2E]">{we.event}</code>
                                <span className="text-[10px] text-gray-400">— {we.desc}</span>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Footer */}
                <div className="mt-12 text-center">
                    <p className="text-[10px] text-gray-300 uppercase tracking-widest">Luna API v1 · Conciergerie Voyage Sur Mesure</p>
                </div>
            </div>
        </div>
    );
}
