'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Loader2, Mail, Edit3, Trash2, Copy, Eye, X, Code, FileText, Sparkles } from 'lucide-react';
import { useAuth } from '@/src/contexts/AuthContext';
import { fetchWithAuth } from '@/src/lib/utils/fetchWithAuth';
import Modal, { ModalActions, ModalCancelButton, ModalSubmitButton, ModalField, modalInputClass, modalSelectClass } from '@/src/components/ui/Modal';
import { T } from '@/src/components/T';
import { motion, AnimatePresence } from 'framer-motion';
import { sanitizeHtml } from '@/src/lib/sanitize';

interface EmailTemplate {
    id: string;
    name: string;
    subject: string;
    htmlBody: string;
    category: string;
    variables: string[];
    createdAt: string | null;
    updatedAt: string | null;
}

const CATEGORIES = [
    { value: 'confirmation', label: 'Confirmation', icon: '✅', color: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
    { value: 'follow-up', label: 'Suivi', icon: '📌', color: 'bg-sky-50 text-sky-600 border-sky-200' },
    { value: 'promotion', label: 'Promotion', icon: '🎯', color: 'bg-purple-50 text-purple-600 border-purple-200' },
    { value: 'reminder', label: 'Rappel', icon: '⏰', color: 'bg-amber-50 text-amber-600 border-amber-200' },
    { value: 'welcome', label: 'Bienvenue', icon: '👋', color: 'bg-pink-50 text-pink-600 border-pink-200' },
    { value: 'custom', label: 'Custom', icon: '⚙️', color: 'bg-gray-100 text-gray-500 border-gray-200' },
];

const VARIABLE_SUGGESTIONS = [
    '{{clientName}}', '{{firstName}}', '{{destination}}', '{{dates}}',
    '{{budget}}', '{{agencyName}}', '{{tripTitle}}', '{{invoiceNumber}}',
];

export default function EmailTemplatesPage() {
    const { tenantId } = useAuth();
    const [templates, setTemplates] = useState<EmailTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterCat, setFilterCat] = useState('ALL');

    // Modal states
    const [showModal, setShowModal] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
    const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null);
    const [saving, setSaving] = useState(false);

    // Form
    const [form, setForm] = useState({
        name: '',
        subject: '',
        htmlBody: '',
        category: 'custom',
        variables: [] as string[],
    });

    useEffect(() => { loadTemplates(); }, []);

    const loadTemplates = async () => {
        setLoading(true);
        try {
            const res = await fetchWithAuth('/api/crm/email-templates');
            const data = await res.json();
            setTemplates(data.templates || []);
        } catch (e) { console.error(e); }
        setLoading(false);
    };

    const openCreate = () => {
        setEditingTemplate(null);
        setForm({ name: '', subject: '', htmlBody: getDefaultHtml(), category: 'custom', variables: [] });
        setShowModal(true);
    };

    const openEdit = (t: EmailTemplate) => {
        setEditingTemplate(t);
        setForm({
            name: t.name,
            subject: t.subject,
            htmlBody: t.htmlBody,
            category: t.category,
            variables: t.variables || [],
        });
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!form.name || !form.subject || !form.htmlBody) return;
        setSaving(true);
        try {
            if (editingTemplate) {
                await fetchWithAuth(`/api/crm/email-templates?id=${editingTemplate.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(form),
                });
            } else {
                await fetchWithAuth('/api/crm/email-templates', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(form),
                });
            }
            setShowModal(false);
            loadTemplates();
        } catch (e) { console.error(e); }
        setSaving(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Supprimer ce template ?')) return;
        try {
            await fetchWithAuth(`/api/crm/email-templates?id=${id}`, { method: 'DELETE' });
            loadTemplates();
        } catch (e) { console.error(e); }
    };

    const handleDuplicate = async (t: EmailTemplate) => {
        try {
            await fetchWithAuth('/api/crm/email-templates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: `${t.name} (copie)`,
                    subject: t.subject,
                    htmlBody: t.htmlBody,
                    category: t.category,
                    variables: t.variables,
                }),
            });
            loadTemplates();
        } catch (e) { console.error(e); }
    };

    const insertVariable = (v: string) => {
        setForm(p => ({
            ...p,
            htmlBody: p.htmlBody + v,
            variables: p.variables.includes(v) ? p.variables : [...p.variables, v],
        }));
    };

    const filtered = templates
        .filter(t => filterCat === 'ALL' || t.category === filterCat)
        .filter(t => !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.subject.toLowerCase().includes(search.toLowerCase()));

    const getCategoryMeta = (cat: string) => CATEGORIES.find(c => c.value === cat) || CATEGORIES[CATEGORIES.length - 1];

    if (loading) return (
        <div className="flex items-center justify-center h-96">
            <Loader2 className="animate-spin text-gray-400" size={32} />
        </div>
    );

    return (
        <div className="w-full h-full">
            <div className="max-w-[1600px] mx-auto w-full space-y-6 pb-20">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-4xl font-light text-[#2E2E2E] tracking-tight">
                            <T>Templates Email</T>
                        </h1>
                        <p className="text-sm text-[#6B7280] mt-1 font-medium">
                            {templates.length} template{templates.length !== 1 ? 's' : ''} • Modèles réutilisables pour vos communications
                        </p>
                    </div>
                    <button onClick={openCreate}
                        className="bg-luna-charcoal hover:bg-gray-800 text-white px-5 py-2.5 rounded-xl text-sm font-normal transition-all flex items-center gap-2">
                        <Plus size={16} /> Nouveau Template
                    </button>
                </div>

                {/* KPIs */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-5 shadow-sm flex items-center gap-4">
                        <div className="w-11 h-11 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-500 border border-indigo-100">
                            <FileText size={20} />
                        </div>
                        <div>
                            <p className="text-xs font-normal tracking-wide text-gray-400">Total</p>
                            <p className="text-2xl font-normal text-luna-charcoal">{templates.length}</p>
                        </div>
                    </div>
                    {['confirmation', 'follow-up', 'promotion'].map(cat => {
                        const meta = getCategoryMeta(cat);
                        const count = templates.filter(t => t.category === cat).length;
                        return (
                            <div key={cat} className="bg-white/70 backdrop-blur-sm rounded-2xl p-5 shadow-sm flex items-center gap-4">
                                <div className="w-11 h-11 rounded-full flex items-center justify-center text-lg border border-gray-100 bg-gray-50">
                                    {meta.icon}
                                </div>
                                <div>
                                    <p className="text-xs font-normal tracking-wide text-gray-400">{meta.label}</p>
                                    <p className="text-2xl font-normal text-luna-charcoal">{count}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Filters + Search */}
                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                    <div className="flex gap-2 flex-wrap">
                        <button onClick={() => setFilterCat('ALL')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-normal transition-colors ${filterCat === 'ALL' ? 'bg-luna-charcoal text-white' : 'bg-white/60 text-gray-500 hover:bg-white hover:shadow-sm'}`}>
                            Tout
                        </button>
                        {CATEGORIES.map(c => (
                            <button key={c.value} onClick={() => setFilterCat(c.value)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-normal transition-colors flex items-center gap-1.5 ${filterCat === c.value ? 'bg-luna-charcoal text-white' : 'bg-white/60 text-gray-500 hover:bg-white hover:shadow-sm'}`}>
                                <span>{c.icon}</span> {c.label}
                            </button>
                        ))}
                    </div>
                    <div className="relative ml-auto">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                        <input type="text" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)}
                            className="pl-9 pr-4 py-2 bg-white/60 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#bcdeea] focus:ring-1 focus:ring-[#bcdeea] transition-all w-56" />
                    </div>
                </div>

                {/* Template Grid */}
                {filtered.length === 0 ? (
                    <div className="text-center py-16 text-gray-400">
                        <Mail size={40} className="mx-auto mb-3 opacity-30" />
                        <p className="text-sm">Aucun template. Créez votre premier modèle.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        <AnimatePresence>
                            {filtered.map((t, i) => {
                                const meta = getCategoryMeta(t.category);
                                return (
                                    <motion.div
                                        key={t.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        className="bg-white rounded-[24px] border border-gray-100 shadow-sm hover:shadow-lg hover:border-[#bcdeea]/40 transition-all group overflow-hidden"
                                    >
                                        {/* Preview strip */}
                                        <div className="h-28 bg-gradient-to-br from-gray-50 to-gray-100 border-b border-gray-100 relative overflow-hidden flex items-center justify-center p-4">
                                            <div className="text-[8px] text-gray-400 leading-tight max-h-full overflow-hidden opacity-60 font-mono"
                                                dangerouslySetInnerHTML={{ __html: sanitizeHtml(t.htmlBody.substring(0, 300)) }} />
                                            <div className="absolute inset-0 bg-gradient-to-t from-white/80 to-transparent" />
                                            {/* Quick actions overlay */}
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                                                <button onClick={() => setPreviewTemplate(t)}
                                                    className="p-2.5 bg-white rounded-xl shadow-md border border-gray-100 text-gray-500 hover:text-[#5a8fa3] transition-colors">
                                                    <Eye size={16} />
                                                </button>
                                                <button onClick={() => openEdit(t)}
                                                    className="p-2.5 bg-white rounded-xl shadow-md border border-gray-100 text-gray-500 hover:text-[#5a8fa3] transition-colors">
                                                    <Edit3 size={16} />
                                                </button>
                                                <button onClick={() => handleDuplicate(t)}
                                                    className="p-2.5 bg-white rounded-xl shadow-md border border-gray-100 text-gray-500 hover:text-[#5a8fa3] transition-colors">
                                                    <Copy size={16} />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Card body */}
                                        <div className="p-5">
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="text-[15px] font-medium text-[#2E2E2E] truncate">{t.name}</h3>
                                                    <p className="text-[12px] text-gray-400 truncate mt-0.5">{t.subject}</p>
                                                </div>
                                                <span className={`text-[10px] font-medium px-2 py-1 rounded-lg border whitespace-nowrap ml-3 ${meta.color}`}>
                                                    {meta.icon} {meta.label}
                                                </span>
                                            </div>

                                            {/* Variables */}
                                            {t.variables && t.variables.length > 0 && (
                                                <div className="flex flex-wrap gap-1 mb-3">
                                                    {t.variables.slice(0, 4).map(v => (
                                                        <span key={v} className="text-[9px] font-mono bg-gray-50 text-gray-400 px-1.5 py-0.5 rounded border border-gray-100">
                                                            {v}
                                                        </span>
                                                    ))}
                                                    {t.variables.length > 4 && (
                                                        <span className="text-[9px] text-gray-300">+{t.variables.length - 4}</span>
                                                    )}
                                                </div>
                                            )}

                                            {/* Footer */}
                                            <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                                                <span className="text-[10px] text-gray-300">
                                                    {t.updatedAt ? new Date(t.updatedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : '—'}
                                                </span>
                                                <button onClick={() => handleDelete(t.id)}
                                                    className="p-1.5 text-gray-300 hover:text-red-400 transition-colors rounded-lg hover:bg-red-50">
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            {/* ── Create/Edit Modal ── */}
            <Modal isOpen={showModal} onClose={() => setShowModal(false)}
                title={editingTemplate ? 'Modifier le template' : 'Nouveau Template Email'}
                subtitle="Créez un modèle réutilisable pour vos emails"
                size="lg">

                <div className="space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                        <ModalField label="Nom du template" className="col-span-2">
                            <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                                placeholder="Ex: Confirmation de réservation" className={modalInputClass} autoFocus />
                        </ModalField>
                        <ModalField label="Objet de l'email">
                            <input value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))}
                                placeholder="Ex: Votre voyage est confirmé ✈️" className={modalInputClass} />
                        </ModalField>
                        <ModalField label="Catégorie">
                            <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} className={modalSelectClass}>
                                {CATEGORIES.map(c => (
                                    <option key={c.value} value={c.value}>{c.icon} {c.label}</option>
                                ))}
                            </select>
                        </ModalField>
                    </div>

                    {/* Variables quick insert */}
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2 flex items-center gap-1.5">
                            <Code size={12} /> Variables disponibles
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                            {VARIABLE_SUGGESTIONS.map(v => (
                                <button key={v} onClick={() => insertVariable(v)}
                                    className="text-[10px] font-mono bg-[#bcdeea]/10 text-[#5a8fa3] px-2 py-1 rounded-lg border border-[#bcdeea]/20 hover:bg-[#bcdeea]/20 transition-colors">
                                    {v}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* HTML Body */}
                    <ModalField label="Corps de l'email (HTML)">
                        <textarea value={form.htmlBody} onChange={e => setForm(p => ({ ...p, htmlBody: e.target.value }))}
                            placeholder="<h1>Bonjour {{clientName}}</h1><p>Votre voyage est confirmé.</p>"
                            className={`${modalInputClass} min-h-[200px] resize-none font-mono text-[12px] leading-relaxed`} />
                    </ModalField>

                    <ModalActions>
                        <ModalCancelButton onClick={() => setShowModal(false)} />
                        <ModalSubmitButton onClick={handleSave} disabled={saving || !form.name || !form.subject}>
                            {saving ? 'Enregistrement...' : editingTemplate ? 'Mettre à jour' : 'Créer le template'}
                        </ModalSubmitButton>
                    </ModalActions>
                </div>
            </Modal>

            {/* ── Preview Modal ── */}
            <Modal isOpen={!!previewTemplate} onClose={() => setPreviewTemplate(null)}
                title={previewTemplate?.name || ''} subtitle={previewTemplate?.subject || ''} size="lg">
                {previewTemplate && (
                    <div className="space-y-4">
                        <div className="bg-gray-50 rounded-2xl border border-gray-100 p-6 min-h-[300px]">
                            <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(previewTemplate.htmlBody) }} />
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex gap-1.5">
                                {previewTemplate.variables?.map(v => (
                                    <span key={v} className="text-[9px] font-mono bg-gray-100 text-gray-500 px-2 py-1 rounded">
                                        {v}
                                    </span>
                                ))}
                            </div>
                            <button onClick={() => { openEdit(previewTemplate); setPreviewTemplate(null); }}
                                className="text-[11px] font-medium text-[#5a8fa3] hover:text-[#4a7f93] flex items-center gap-1.5 transition-colors">
                                <Edit3 size={13} /> Modifier
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}

function getDefaultHtml(): string {
    return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0; padding:40px; font-family: 'Inter', Arial, sans-serif; background: #f9fafb;">
  <div style="max-width:600px; margin:0 auto; background:white; border-radius:16px; padding:40px; box-shadow:0 2px 12px rgba(0,0,0,0.04);">
    <h1 style="font-size:24px; font-weight:500; color:#2E2E2E; margin:0 0 16px;">Bonjour {{clientName}},</h1>
    <p style="font-size:14px; color:#6B7280; line-height:1.6; margin:0 0 24px;">
      Votre message ici...
    </p>
    <a href="#" style="display:inline-block; padding:12px 28px; background:#2E2E2E; color:white; text-decoration:none; border-radius:12px; font-size:13px; font-weight:500;">
      Voir les détails →
    </a>
    <hr style="border:none; border-top:1px solid #f0f0f0; margin:32px 0 16px;" />
    <p style="font-size:11px; color:#9CA3AF; margin:0;">
      {{agencyName}} — Votre conciergerie voyage
    </p>
  </div>
</body>
</html>`;
}
