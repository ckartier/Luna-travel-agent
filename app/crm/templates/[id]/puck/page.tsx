'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Puck } from '@puckeditor/core';
import '@puckeditor/core/puck.css';
import './puck-theme.css';
import { lunaConfig } from '@/src/components/puck/puck-config';
import { fetchWithAuth } from '@/src/lib/utils/fetchWithAuth';
import { ArrowLeft, Save, Check, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function PuckEditorPage() {
    const { id } = useParams() as { id: string };
    const router = useRouter();
    const [puckData, setPuckData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    // ── Load puckData from Firebase ──
    useEffect(() => {
        fetchWithAuth('/api/crm/site-config')
            .then(r => r.json())
            .then(data => {
                // puckData is stored inside the site config
                setPuckData(data?.puckData || { root: { props: {} }, content: [], zones: {} });
                setLoading(false);
            })
            .catch(() => {
                setPuckData({ root: { props: {} }, content: [], zones: {} });
                setLoading(false);
            });
    }, []);

    // ── Save puckData to Firebase ──
    const handlePublish = useCallback(async (data: any) => {
        setSaving(true);
        try {
            // First get existing config
            const existing = await fetchWithAuth('/api/crm/site-config').then(r => r.json());
            // Merge puckData into existing config
            await fetchWithAuth('/api/crm/site-config', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...existing, puckData: data }),
            });
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch (err) {
            console.error('Failed to save:', err);
        } finally {
            setSaving(false);
        }
    }, []);

    if (loading) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-[#fafbfc]">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 size={32} className="animate-spin text-[#b9dae9]" />
                    <span className="text-[14px] text-gray-400 font-medium">Chargement de l&apos;éditeur Visuel…</span>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen w-full flex flex-col">
            {/* ── Luna Header ── */}
            <div className="h-[52px] bg-[#1a1a2e] flex items-center justify-between px-4 shrink-0 z-50">
                <div className="flex items-center gap-3">
                    <Link href={`/crm/templates/${id}`} className="flex items-center gap-2 text-white/70 hover:text-white transition-colors text-[13px]">
                        <ArrowLeft size={16} />
                        <span>Éditeur classique</span>
                    </Link>
                    <span className="text-white/30 text-[13px]">|</span>
                    <span className="text-white text-[14px] font-bold tracking-wide">LUNA</span>
                    <span className="text-[#b9dae9] text-[12px] font-medium ml-1">Éditeur Visuel</span>
                </div>
                <div className="flex items-center gap-3">
                    {saved && (
                        <div className="flex items-center gap-1.5 text-emerald-400 text-[12px] font-medium">
                            <Check size={14} />
                            <span>Sauvegardé</span>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Global Styles for Preview Clone ── */}
            <style dangerouslySetInnerHTML={{ __html: `
                @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,300;0,400;0,600;0,700;1,300;1,400&family=Inter:wght@300;400;500;600&display=swap');
                :root {
                    --font-heading: 'Playfair Display', serif;
                    --font-body: 'Inter', sans-serif;
                    --luna-primary: #2E2E2E;
                    --luna-secondary: #b9dae9;
                    --luna-charcoal: #2E2E2E;
                }
            `}} />

            {/* ── Puck Editor ── */}
            <div className="flex-1 overflow-hidden">
                <Puck
                    config={lunaConfig as any}
                    data={puckData}
                    onPublish={handlePublish}
                />
            </div>
        </div>
    );
}
