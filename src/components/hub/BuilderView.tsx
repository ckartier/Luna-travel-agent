'use client';

import { useState, useEffect, useRef } from 'react';
import {
    Save, Check, Loader2, RefreshCw, LayoutGrid, Type, Palette, Settings, Upload, Monitor, Tablet, Smartphone, Video, Trash2, Plus
} from 'lucide-react';
import { fetchWithAuth } from '@/src/lib/utils/fetchWithAuth';

// Hub Design Tokens
const GREEN = '#19c37d';
const CYAN = '#16b8c8';

export interface HubBlock {
    id: string; type: string; order: number; visible: boolean;
    title?: string; subtitle?: string; description?: string; text?: string;
    imageUrl?: string; videoUrl?: string; buttonText?: string; buttonUrl?: string;
    images?: string[]; items?: any[]; fields?: string[];
    animation?: string; effect?: string; layout?: string;
}
export interface HubConfig {
    global: Record<string, string>;
    blocks: HubBlock[];
    nav: { menuItems: { label: string; href: string }[] };
    business: Record<string, string>;
}

type Tab = 'contenu' | 'design' | 'blocs' | 'settings';
type Device = 'desktop' | 'tablet' | 'mobile';

const DEVICE_WIDTHS: Record<Device, string> = { desktop: '100%', tablet: '768px', mobile: '375px' };

export default function BuilderView({ config, setConfig, saveConfig, saving, saved }: {
    config: HubConfig | null;
    setConfig: (c: HubConfig) => void;
    saveConfig: () => void;
    saving: boolean;
    saved: boolean;
}) {
    const [tab, setTab] = useState<Tab>('contenu');
    const [device, setDevice] = useState<Device>('desktop');
    const [previewKey, setPreviewKey] = useState(0);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const uploadCallbackRef = useRef<((url: string) => void) | null>(null);

    const syncPreview = () => {
        if (!config) return;
        const iframe = iframeRef.current;
        if (!iframe?.contentWindow) return;
        iframe.contentWindow.postMessage({ type: 'hub-editor-update', config }, window.location.origin);
    };

    useEffect(() => {
        syncPreview();
    }, [config]);

    const updateGlobal = (key: string, val: string) => config && setConfig({ ...config, global: { ...config.global, [key]: val } });
    const updateBlock = (blockId: string, updates: Partial<HubBlock>) => config && setConfig({ ...config, blocks: config.blocks.map(b => b.id === blockId ? { ...b, ...updates } : b) });
    const updateBusiness = (key: string, val: string) => config && setConfig({ ...config, business: { ...config.business, [key]: val } });
    const updateNavItem = (idx: number, key: string, val: string) => {
        if (!config) return;
        const items = [...(config.nav?.menuItems || [])];
        items[idx] = { ...items[idx], [key]: val };
        setConfig({ ...config, nav: { ...config.nav, menuItems: items } });
    };
    const addBlock = (type: string) => {
        if (!config) return;
        const normalizedType = type.toLowerCase();
        // Core block types are singleton in the renderer.
        if (config.blocks.some(b => b.type === normalizedType)) return;
        const id = `${normalizedType}_${Date.now()}`;
        setConfig({ ...config, blocks: [...config.blocks, { id, type: normalizedType, order: config.blocks.length, visible: true, title: type }] });
    };
    const deleteBlock = (blockId: string) => config && setConfig({ ...config, blocks: config.blocks.filter(b => b.id !== blockId).map((b, i) => ({ ...b, order: i })) });

    const triggerUpload = (accept: string, callback: (url: string) => void) => {
        uploadCallbackRef.current = callback;
        if (fileInputRef.current) { fileInputRef.current.accept = accept; fileInputRef.current.click(); }
    };
    const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        try {
            const form = new FormData();
            form.append('file', file);
            const res = await fetchWithAuth('/api/crm/upload', { method: 'POST', body: form });
            if (res.ok) { const { url } = await res.json(); uploadCallbackRef.current?.(url); }
        } catch (e) { console.error('Upload error:', e); }
        finally {
            setUploading(false);
            e.target.value = '';
        }
    };

    if (!config) return null;
    const blocks = [...config.blocks].sort((a, b) => a.order - b.order);

    return (
        <div className="flex gap-4 md:gap-6 h-[calc(100vh-140px)] select-none">
            <input ref={fileInputRef} type="file" className="hidden" onChange={onFileChange} />

            {/* LEFT TOOLBAR */}
            <div className="w-[64px] shrink-0 bg-white/60 backdrop-blur-xl rounded-[24px] border border-white flex flex-col items-center py-5 gap-4 shadow-sm">
                <ToolbarButton icon={LayoutGrid} active={tab === 'blocs'} onClick={() => setTab('blocs')} />
                <ToolbarButton icon={Type} active={tab === 'contenu'} onClick={() => setTab('contenu')} />
                <ToolbarButton icon={Palette} active={tab === 'design'} onClick={() => setTab('design')} />
                <ToolbarButton icon={Settings} active={tab === 'settings'} onClick={() => setTab('settings')} />
            </div>

            {/* CENTER CANVAS */}
            <div className="flex-1 bg-white/40 backdrop-blur-md rounded-[30px] border border-white overflow-hidden shadow-sm relative flex flex-col p-4">
                <div className="flex justify-between items-center mb-4 px-2">
                    <div className="flex gap-1.5 bg-white/70 backdrop-blur p-1 rounded-full shadow-sm border border-white">
                         {([['desktop', Monitor], ['tablet', Tablet], ['mobile', Smartphone]] as [Device, any][]).map(([id, Icon]) => (
                            <button key={id} onClick={() => setDevice(id)}
                                className="w-8 h-8 rounded-full flex items-center justify-center transition-all"
                                style={{ backgroundColor: device === id ? GREEN : 'transparent', color: device === id ? 'white' : '#9ca3af' }}>
                                <Icon size={14} />
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center gap-2">
                         <button onClick={() => setPreviewKey(k => k + 1)} className="w-10 h-10 bg-white/70 backdrop-blur rounded-full flex items-center justify-center text-zinc-400 border border-white shadow-sm hover:text-zinc-700 transition">
                             <RefreshCw size={15} />
                         </button>
                         <button onClick={saveConfig} disabled={saving}
                            className="h-10 px-5 rounded-full text-[12px] font-mono font-bold text-white shadow-md flex items-center gap-2 transition-all hover:opacity-90 active:scale-95"
                            style={{ backgroundColor: saved ? GREEN : saving ? '#cbd5e1' : '#f59e0b' }}>
                            {saving ? <Loader2 size={14} className="animate-spin" /> : saved ? <Check size={14} /> : <Save size={14} />}
                            {saved ? 'Saved' : 'Publish'}
                         </button>
                    </div>
                </div>

                <div className="flex-1 rounded-[20px] overflow-hidden border border-white bg-zinc-100 flex items-start justify-center p-2 shadow-inner">
                    <div className="transition-all duration-500 h-full rounded-[14px] overflow-hidden shadow-lg bg-white" style={{ width: DEVICE_WIDTHS[device] }}>
                        <iframe ref={iframeRef} id="hub-preview-iframe" key={previewKey} src="/hub" className="w-full h-full border-0" onLoad={syncPreview} />
                    </div>
                </div>
            </div>

            {/* RIGHT PROPERTIES PANEL */}
            <div className="w-[320px] shrink-0 overflow-y-auto no-scrollbar space-y-4 pb-10">
                {/* BLOCS TAB */}
                {tab === 'blocs' && (
                    <PanelCard title="Gestion des Blocs">
                        <div className="space-y-2">
                            {blocks.map(block => (
                                <div key={block.id} className="flex items-center justify-between p-3 rounded-xl border border-white bg-white/40 shadow-sm">
                                    <div className="text-[11px] font-mono font-medium text-zinc-700">{block.title || block.type}</div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => updateBlock(block.id, { visible: !block.visible })}
                                            className="w-8 h-4.5 rounded-full relative transition-all"
                                            style={{ backgroundColor: block.visible ? GREEN : '#d1d5db' }}>
                                            <div className={`absolute top-0.5 w-3.5 h-3.5 bg-white rounded-full shadow transition-all ${block.visible ? 'left-[16px]' : 'left-0.5'}`} />
                                        </button>
                                        {!['hero', 'form'].includes(block.type) && (
                                            <button onClick={() => deleteBlock(block.id)} className="text-zinc-300 hover:text-red-500 transition">
                                                <Trash2 size={13} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="border-t border-zinc-100 mt-4 pt-4">
                            <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 mb-2">Ajouter un bloc</p>
                            <div className="grid grid-cols-2 gap-2">
                                {['Hero', 'Gallery', 'Content', 'Feature', 'Media', 'CTA', 'Cards', 'Form'].map(t => (
                                    <button key={t} onClick={() => addBlock(t)}
                                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/50 text-[10px] font-mono text-zinc-600 hover:bg-white transition border border-white">
                                        <Plus size={12} /> {t}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </PanelCard>
                )}

                {/* CONTENU TAB */}
                {tab === 'contenu' && (
                    <>
                        <PanelCard title="Navigation">
                            {(config.nav?.menuItems || []).map((item: any, i: number) => (
                                <div key={i} className="flex gap-2 mb-2">
                                    <Field label={`Menu ${i+1}`} value={item.label} onChange={v => updateNavItem(i, 'label', v)} />
                                    <Field label="Lien" value={item.href} onChange={v => updateNavItem(i, 'href', v)} />
                                </div>
                            ))}
                        </PanelCard>
                        {blocks.filter(b => b.visible).map(block => (
                            <PanelCard key={block.id} title={`${block.title || block.type}`}>
                                <Field label="Titre" value={block.title || ''} onChange={v => updateBlock(block.id, { title: v })} />
                                {(block.type !== 'gallery' && block.type !== 'cards') && (
                                    <FieldArea label="Texte" value={block.description || block.text || ''} onChange={v => updateBlock(block.id, { description: v, text: v })} />
                                )}
                                {block.type === 'hero' && (
                                    <Field label="Sous-titre" value={block.subtitle || ''} onChange={v => updateBlock(block.id, { subtitle: v })} />
                                )}
                                {block.type === 'cta' && (
                                    <>
                                        <Field label="Bouton texte" value={block.buttonText || ''} onChange={v => updateBlock(block.id, { buttonText: v })} />
                                        <Field label="Bouton lien" value={block.buttonUrl || ''} onChange={v => updateBlock(block.id, { buttonUrl: v })} />
                                    </>
                                )}
                                <ImageField label="Image" value={block.imageUrl || ''} onChange={v => updateBlock(block.id, { imageUrl: v })}
                                    onUpload={() => triggerUpload('image/*', url => updateBlock(block.id, { imageUrl: url }))} uploading={uploading} />
                                {block.type === 'hero' ? (
                                    <VideoFieldWithPresets label="Vidéo" value={block.videoUrl || ''} onChange={v => updateBlock(block.id, { videoUrl: v })}
                                        onUpload={() => triggerUpload('video/*', url => updateBlock(block.id, { videoUrl: url }))} uploading={uploading} />
                                ) : (
                                    <VideoField label="Vidéo" value={block.videoUrl || ''} onChange={v => updateBlock(block.id, { videoUrl: v })}
                                        onUpload={() => triggerUpload('video/*', url => updateBlock(block.id, { videoUrl: url }))} uploading={uploading} />
                                )}
                            </PanelCard>
                        ))}
                    </>
                )}

                {/* DESIGN TAB */}
                {tab === 'design' && (
                    <>
                        <PanelCard title="Colors">
                            <div className="flex flex-wrap gap-2 mb-4">
                                <div className="flex flex-col gap-1 items-center"><ColorSwatch val={config.global?.primaryColor || GREEN} onChange={v => updateGlobal('primaryColor', v)} /><span className="text-[8px] font-mono text-zinc-400">P</span></div>
                                <div className="flex flex-col gap-1 items-center"><ColorSwatch val={config.global?.secondaryColor || CYAN} onChange={v => updateGlobal('secondaryColor', v)} /><span className="text-[8px] font-mono text-zinc-400">S</span></div>
                                <div className="flex flex-col gap-1 items-center"><ColorSwatch val={config.global?.accentColor || '#e3f24f'} onChange={v => updateGlobal('accentColor', v)} /><span className="text-[8px] font-mono text-zinc-400">A</span></div>
                                <div className="flex flex-col gap-1 items-center"><ColorSwatch val={config.global?.brandColor || '#ffffff'} onChange={v => updateGlobal('brandColor', v)} /><span className="text-[8px] font-mono text-zinc-400">Marque</span></div>
                                <div className="flex flex-col gap-1 items-center"><ColorSwatch val={config.global?.bgColor || '#edf2ec'} onChange={v => updateGlobal('bgColor', v)} /><span className="text-[8px] font-mono text-zinc-400">Bg</span></div>
                                <div className="flex flex-col gap-1 items-center"><ColorSwatch val={config.global?.textColor || '#3f3f46'} onChange={v => updateGlobal('textColor', v)} /><span className="text-[8px] font-mono text-zinc-400">Texte</span></div>
                            </div>
                        </PanelCard>
                        <PanelCard title="Typography">
                            <Field label="Police Titres" value={config.global?.fontHeading || 'Inter'} onChange={v => updateGlobal('fontHeading', v)} />
                            <Field label="Police Corps" value={config.global?.fontBody || 'Inter'} onChange={v => updateGlobal('fontBody', v)} />
                        </PanelCard>
                        <PanelCard title="Logo">
                            <ImageField label="Image" value={config.global?.logo || ''} onChange={v => updateGlobal('logo', v)}
                                onUpload={() => triggerUpload('image/*', url => updateGlobal('logo', url))} uploading={uploading} />
                        </PanelCard>
                    </>
                )}

                {/* SETTINGS TAB */}
                {tab === 'settings' && (
                    <>
                        <PanelCard title="Fond du CRM">
                            <SelectField label="Type de fond" value={config.global?.crmBgType || 'color'} options={[{id:'color', label:'Couleur unie'}, {id:'image', label:'Image URL'}, {id:'video', label:'Vidéo Animée'}]} onChange={v => updateGlobal('crmBgType', v)} />
                            {config.global?.crmBgType === 'image' && (
                                <ImageField label="Image de fond" value={config.global?.crmBgUrl || ''} onChange={v => updateGlobal('crmBgUrl', v)} onUpload={() => triggerUpload('image/*', url => updateGlobal('crmBgUrl', url))} uploading={uploading} />
                            )}
                            {config.global?.crmBgType === 'video' && (
                                <VideoField label="Vidéo de fond" value={config.global?.crmBgUrl || ''} onChange={v => updateGlobal('crmBgUrl', v)} onUpload={() => triggerUpload('video/*', url => updateGlobal('crmBgUrl', url))} uploading={uploading} />
                            )}
                            {(!config.global?.crmBgType || config.global?.crmBgType === 'color') && (
                                <div className="flex gap-2 items-center mt-2">
                                    <span className="text-[10px] text-zinc-500 font-mono">Couleur bg</span>
                                    <ColorSwatch val={config.global?.crmBgColor || '#edf2ec'} onChange={v => updateGlobal('crmBgColor', v)} />
                                </div>
                            )}
                        </PanelCard>
                        <PanelCard title="Entreprise">
                            <Field label="Nom" value={config.business?.name || ''} onChange={v => updateBusiness('name', v)} />
                            <Field label="Email" value={config.business?.email || ''} onChange={v => updateBusiness('email', v)} />
                            <Field label="Téléphone" value={config.business?.phone || ''} onChange={v => updateBusiness('phone', v)} />
                            <Field label="Description" value={config.business?.description || ''} onChange={v => updateBusiness('description', v)} />
                        </PanelCard>
                    </>
                )}
            </div>
        </div>
    );
}

function ToolbarButton({ icon: Icon, active, onClick }: { icon: any, active: boolean, onClick: () => void }) {
    return (
        <button onClick={onClick} className={`w-11 h-11 rounded-[16px] flex items-center justify-center transition-all shadow-sm ${
            active ? 'bg-[#19c37d] text-white' : 'bg-white text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50 border border-zinc-100'
        }`}>
            <Icon size={18} />
        </button>
    );
}

function PanelCard({ title, children }: { title: string, children: React.ReactNode }) {
    return (
        <div className="bg-white/60 backdrop-blur-xl rounded-[24px] p-5 border border-white shadow-sm flex flex-col gap-3">
            <h3 className="text-[12px] font-bold font-mono text-zinc-800 tracking-wide mb-1">{title}</h3>
            {children}
        </div>
    );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
    return (
        <label className="block w-full">
            <div className="text-[9px] font-mono font-bold uppercase tracking-wider text-zinc-400 mb-1.5 pl-1">{label}</div>
            <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
                className="w-full rounded-xl border border-white bg-white/50 px-3 py-2 text-[11px] font-mono outline-none focus:ring-1 focus:ring-[#19c37d] transition shadow-inner" />
        </label>
    );
}

function FieldArea({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
    return (
        <label className="block w-full">
            <div className="text-[9px] font-mono font-bold uppercase tracking-wider text-zinc-400 mb-1.5 pl-1">{label}</div>
            <textarea value={value} onChange={e => onChange(e.target.value)} rows={3}
                className="w-full rounded-xl border border-white bg-white/50 px-3 py-2 text-[11px] font-mono outline-none resize-none focus:ring-1 focus:ring-[#19c37d] transition shadow-inner" />
        </label>
    );
}

function ColorSwatch({ val, onChange }: { val: string; onChange: (v: string) => void }) {
    return (
        <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-white shadow-sm shrink-0">
            <input type="color" value={val} onChange={e => onChange(e.target.value)}
                className="absolute -top-2 -left-2 w-16 h-16 cursor-pointer opacity-0" />
            <div className="w-full h-full pointer-events-none border border-black/10" style={{ backgroundColor: val }} />
        </div>
    );
}

function ImageField({ label, value, onChange, onUpload, uploading }: { label: string; value: string; onChange: (v: string) => void; onUpload: () => void; uploading: boolean }) {
    return (
        <div className="w-full">
            <div className="text-[9px] font-mono font-bold uppercase tracking-wider text-zinc-400 mb-1.5 pl-1">{label}</div>
            <div className="flex gap-2 mb-2">
                <input value={value} onChange={e => onChange(e.target.value)} placeholder="URL ou upload"
                    className="flex-1 rounded-xl border border-white bg-white/50 px-3 py-2 text-[11px] font-mono outline-none shadow-inner" />
                <button onClick={onUpload} disabled={uploading}
                    className="shrink-0 w-8 h-8 rounded-xl bg-white border border-zinc-200 text-zinc-400 hover:text-zinc-600 flex items-center justify-center transition disabled:opacity-50">
                    {uploading ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                </button>
            </div>
            {value && <img src={value} alt="" className="w-full h-16 object-cover rounded-xl border border-white shadow-sm" />}
        </div>
    );
}

function VideoField({ label, value, onChange, onUpload, uploading }: { label: string; value: string; onChange: (v: string) => void; onUpload: () => void; uploading: boolean }) {
    return (
        <div className="w-full">
            <div className="text-[9px] font-mono font-bold uppercase tracking-wider text-zinc-400 mb-1.5 pl-1">{label}</div>
            <div className="flex gap-2 mb-2">
                <input value={value} onChange={e => onChange(e.target.value)} placeholder="URL vidéo"
                    className="flex-1 rounded-xl border border-white bg-white/50 px-3 py-2 text-[11px] font-mono outline-none shadow-inner" />
                <button onClick={onUpload} disabled={uploading}
                    className="shrink-0 w-8 h-8 rounded-xl bg-white border border-zinc-200 text-zinc-400 hover:text-zinc-600 flex items-center justify-center transition disabled:opacity-50">
                    {uploading ? <Loader2 size={13} className="animate-spin" /> : <Video size={13} />}
                </button>
            </div>
            {value && <video src={value} className="w-full h-16 object-cover rounded-xl border border-white shadow-sm" muted />}
        </div>
    );
}

function VideoFieldWithPresets({ label, value, onChange, onUpload, uploading }: { label: string; value: string; onChange: (v: string) => void; onUpload: () => void; uploading: boolean }) {
    return (
        <div className="w-full">
            <div className="text-[9px] font-mono font-bold uppercase tracking-wider text-zinc-400 mb-1.5 pl-1">{label}</div>
            <div className="flex gap-2 mb-1.5">
                <input value={value} onChange={e => onChange(e.target.value)} placeholder="URL vidéo"
                    className="flex-1 rounded-xl border border-white bg-white/50 px-3 py-2 text-[11px] font-mono outline-none shadow-inner" />
                <button onClick={onUpload} disabled={uploading}
                    className="shrink-0 w-8 h-8 rounded-xl bg-white border border-zinc-200 text-zinc-400 hover:text-zinc-600 flex items-center justify-center transition disabled:opacity-50">
                    {uploading ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                </button>
            </div>
            <div className="flex gap-1 mb-2">
                 <button onClick={() => onChange('/hub/videos/1.mp4')} className="flex-1 py-1.5 text-[9px] font-mono rounded-lg bg-white/40 hover:bg-white border border-white transition text-zinc-500 shadow-sm">Vidéo 1</button>
                 <button onClick={() => onChange('/hub/videos/2.mp4')} className="flex-1 py-1.5 text-[9px] font-mono rounded-lg bg-white/40 hover:bg-white border border-white transition text-zinc-500 shadow-sm">Vidéo 2</button>
            </div>
            {value && <video src={value} className="w-full h-16 object-cover rounded-xl border border-white shadow-sm" muted controls />}
        </div>
    );
}

function SelectField({ label, value, options, onChange }: { label: string; value: string; options: { id: string; label: string }[]; onChange: (v: string) => void }) {
    return (
        <label className="block w-full">
            <div className="text-[9px] font-mono font-bold uppercase tracking-wider text-zinc-400 mb-1.5 pl-1">{label}</div>
            <select value={value} onChange={e => onChange(e.target.value)}
                className="w-full rounded-xl border border-white bg-white/50 px-3 py-2 text-[11px] font-mono outline-none focus:ring-1 focus:ring-[#19c37d] transition shadow-inner">
                {options.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
            </select>
        </label>
    );
}
