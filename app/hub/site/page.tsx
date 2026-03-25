'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import Link from 'next/link';
import {
    ArrowRight, Send, Loader2, CheckCircle2, ChevronRight,
    Sparkles, Play, Pause, Volume2, VolumeX
} from 'lucide-react';

/* ═══ Design tokens — read from config.global ═══ */
interface HubBlock {
    id: string; type: string; order: number; visible: boolean;
    title?: string; subtitle?: string; description?: string; text?: string;
    imageUrl?: string; videoUrl?: string; buttonText?: string; buttonUrl?: string;
    images?: string[]; items?: any[]; fields?: string[];
}
interface HubConfig {
    global: Record<string, string>;
    blocks: HubBlock[];
    nav: { menuItems: { label: string; href: string }[] };
    business: Record<string, string>;
}

export default function HubSitePage() {
    const [config, setConfig] = useState<HubConfig | null>(null);
    const [loading, setLoading] = useState(true);
    const [tenantId, setTenantId] = useState<string>('');

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const tid = params.get('tenantId') || '';
        setTenantId(tid);

        const configUrl = tid
            ? `/api/hub/config?tenantId=${encodeURIComponent(tid)}`
            : '/api/hub/config';

        fetch(configUrl)
            .then(r => r.json())
            .then(data => { setConfig(data); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#edf2ec]">
                <Loader2 className="h-8 w-8 animate-spin text-[#19c37d]" />
            </div>
        );
    }
    if (!config) return <div className="min-h-screen flex items-center justify-center bg-[#edf2ec] text-zinc-500">Config introuvable</div>;

    const g = config.global;
    const blocks = [...config.blocks].filter(b => b.visible).sort((a, b) => a.order - b.order);
    const pri = g.primaryColor || '#19c37d';
    const sec = g.secondaryColor || '#16b8c8';
    const acc = g.accentColor || '#e3f24f';
    const bg = g.bgColor || '#edf2ec';
    const txt = g.textColor || '#3f3f46';

    return (
        <div className="min-h-screen font-mono" style={{ backgroundColor: bg, color: txt }}>
            {/* ═══ NAV ═══ */}
            <nav className="sticky top-0 z-50 backdrop-blur-xl border-b border-white/30" style={{ background: `${bg}cc` }}>
                <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {g.logo && <img src={g.logo} alt="Logo" className="h-8 w-auto" />}
                        <span className="text-sm font-bold tracking-wide">{g.siteName || 'Hub'}</span>
                    </div>
                    <div className="hidden md:flex items-center gap-6">
                        {config.nav?.menuItems?.map((item, i) => (
                            <Link key={i} href={item.href} className="text-xs uppercase tracking-widest hover:opacity-70 transition">{item.label}</Link>
                        ))}
                    </div>
                    <Link href="/hub/dashboard"
                        className="px-4 py-2 rounded-xl text-xs font-bold text-white" style={{ backgroundColor: pri }}>
                        Dashboard
                    </Link>
                </div>
            </nav>

            {/* ═══ BLOCKS ═══ */}
            {blocks.map((block, idx) => (
                <BlockRenderer key={block.id} block={block} idx={idx} pri={pri} sec={sec} acc={acc} bg={bg} txt={txt} tenantId={tenantId} />
            ))}

            {/* ═══ FOOTER ═══ */}
            <footer className="border-t border-white/20 py-10 px-6">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="text-xs text-zinc-400">
                        © {new Date().getFullYear()} {config.business?.name || 'Datarnivore'}
                    </div>
                    <div className="flex gap-6">
                        {config.nav?.menuItems?.map((item, i) => (
                            <Link key={i} href={item.href} className="text-xs text-zinc-400 hover:text-zinc-600 transition">{item.label}</Link>
                        ))}
                    </div>
                </div>
            </footer>
        </div>
    );
}

/* ═══════════════════════════════════════════════════
   Block Renderer — Renders each block type with animations
   ═══════════════════════════════════════════════════ */
function BlockRenderer({ block, idx, pri, sec, acc, bg, txt, tenantId }: { block: HubBlock; idx: number; pri: string; sec: string; acc: string; bg: string; txt: string; tenantId?: string }) {
    const ref = useRef<HTMLDivElement>(null);
    const inView = useInView(ref, { once: true, margin: '-80px' });
    const variants = {
        hidden: { opacity: 0, y: 40 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as [number,number,number,number], delay: 0.1 } },
    };

    return (
        <motion.section ref={ref} variants={variants} initial="hidden" animate={inView ? 'visible' : 'hidden'}>
            {block.type === 'hero' && <HeroBlock block={block} pri={pri} sec={sec} acc={acc} />}
            {block.type === 'gallery' && <GalleryBlock block={block} pri={pri} />}
            {block.type === 'content' && <ContentBlock block={block} pri={pri} />}
            {block.type === 'feature' && <FeatureBlock block={block} pri={pri} sec={sec} acc={acc} />}
            {block.type === 'media' && <MediaBlock block={block} />}
            {block.type === 'cta' && <CtaBlock block={block} pri={pri} acc={acc} />}
            {block.type === 'cards' && <CardsBlock block={block} pri={pri} sec={sec} />}
            {block.type === 'form' && <FormBlock block={block} pri={pri} tenantId={tenantId} />}
        </motion.section>
    );
}

/* ── HERO ── */
function HeroBlock({ block, pri, sec, acc }: { block: HubBlock; pri: string; sec: string; acc: string }) {
    const [muted, setMuted] = useState(true);
    return (
        <div className="relative min-h-[80vh] flex items-center overflow-hidden">
            {block.videoUrl && (
                <video autoPlay loop muted={muted} playsInline className="absolute inset-0 w-full h-full object-cover">
                    <source src={block.videoUrl} type="video/mp4" />
                </video>
            )}
            {block.imageUrl && !block.videoUrl && (
                <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${block.imageUrl})` }} />
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/50" />
            <div className="relative z-10 max-w-5xl mx-auto px-6 py-20 text-white">
                <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.8 }}>
                    <div className="text-[10px] uppercase tracking-[0.4em] mb-4 opacity-70">{block.subtitle || ''}</div>
                    <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.05] mb-6">
                        {block.title}
                    </h1>
                    <p className="text-lg md:text-xl text-white/80 max-w-2xl leading-relaxed mb-8">
                        {block.description}
                    </p>
                    <div className="flex items-center gap-4">
                        <Link href="/hub/dashboard"
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all hover:scale-105"
                            style={{ backgroundColor: pri, color: 'white' }}>
                            Accéder <ArrowRight className="h-4 w-4" />
                        </Link>
                        {block.videoUrl && (
                            <button onClick={() => setMuted(!muted)}
                                className="flex items-center justify-center w-11 h-11 rounded-full bg-white/20 backdrop-blur-xl hover:bg-white/30 transition">
                                {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                            </button>
                        )}
                    </div>
                </motion.div>
            </div>
            {/* Animated accent line */}
            <motion.div className="absolute bottom-0 left-0 h-1 rounded-r-full" style={{ backgroundColor: acc }}
                initial={{ width: 0 }} animate={{ width: '40%' }} transition={{ delay: 1, duration: 1.5, ease: 'easeOut' }} />
        </div>
    );
}

/* ── GALLERY ── */
function GalleryBlock({ block, pri }: { block: HubBlock; pri: string }) {
    const images = block.images || [];
    return (
        <div className="max-w-6xl mx-auto px-6 py-20">
            <h2 className="text-3xl font-bold tracking-tight mb-2">{block.title}</h2>
            <div className="h-1 w-16 rounded-full mb-10" style={{ backgroundColor: pri }} />
            {images.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {images.map((src, i) => (
                        <motion.div key={i} whileHover={{ scale: 1.02 }} className="rounded-2xl overflow-hidden shadow-lg">
                            <img src={src} alt="" className="w-full h-64 object-cover" />
                        </motion.div>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-3 gap-4">
                    {[0,1,2].map(i => (
                        <div key={i} className="h-48 rounded-2xl bg-white/30 border border-white/40 flex items-center justify-center text-xs text-zinc-400">
                            Image {i+1}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

/* ── CONTENT ── */
function ContentBlock({ block, pri }: { block: HubBlock; pri: string }) {
    return (
        <div className="max-w-4xl mx-auto px-6 py-20">
            <h2 className="text-3xl font-bold tracking-tight mb-4">{block.title}</h2>
            <div className="h-1 w-16 rounded-full mb-8" style={{ backgroundColor: pri }} />
            <div className="text-base leading-relaxed text-zinc-600 whitespace-pre-line">
                {block.description || block.text}
            </div>
            {block.imageUrl && (
                <motion.div whileHover={{ scale: 1.01 }} className="mt-8 rounded-2xl overflow-hidden shadow-lg">
                    <img src={block.imageUrl} alt="" className="w-full h-80 object-cover" />
                </motion.div>
            )}
        </div>
    );
}

/* ── FEATURE ── */
function FeatureBlock({ block, pri, sec, acc }: { block: HubBlock; pri: string; sec: string; acc: string }) {
    const items = block.items || [];
    const colors = [pri, sec, acc, '#7fd9ca'];
    return (
        <div className="max-w-6xl mx-auto px-6 py-20">
            <h2 className="text-3xl font-bold tracking-tight mb-2">{block.title}</h2>
            <div className="h-1 w-16 rounded-full mb-10" style={{ backgroundColor: pri }} />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {items.map((item: any, i: number) => (
                    <motion.div key={i} whileHover={{ y: -4 }}
                        className="rounded-2xl border border-white/40 bg-white/20 backdrop-blur-xl p-6 transition-all hover:shadow-lg">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                            style={{ backgroundColor: colors[i % colors.length] + '22' }}>
                            <Sparkles className="h-5 w-5" style={{ color: colors[i % colors.length] }} />
                        </div>
                        <h3 className="text-sm font-bold mb-2">{item.title}</h3>
                        <p className="text-xs text-zinc-500 leading-relaxed">{item.description}</p>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}

/* ── MEDIA ── */
function MediaBlock({ block }: { block: HubBlock }) {
    const [playing, setPlaying] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const toggle = () => {
        if (!videoRef.current) return;
        if (playing) videoRef.current.pause(); else videoRef.current.play();
        setPlaying(!playing);
    };
    return (
        <div className="max-w-5xl mx-auto px-6 py-20">
            {block.videoUrl ? (
                <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                    <video ref={videoRef} src={block.videoUrl} className="w-full" muted playsInline />
                    <button onClick={toggle}
                        className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition">
                        {playing ? <Pause className="h-12 w-12 text-white" /> : <Play className="h-12 w-12 text-white" />}
                    </button>
                </div>
            ) : block.imageUrl ? (
                <div className="rounded-2xl overflow-hidden shadow-2xl">
                    <img src={block.imageUrl} alt="" className="w-full" />
                </div>
            ) : null}
            {block.title && <p className="mt-4 text-center text-sm text-zinc-500">{block.title}</p>}
        </div>
    );
}

/* ── CTA ── */
function CtaBlock({ block, pri, acc }: { block: HubBlock; pri: string; acc: string }) {
    return (
        <div className="py-20 px-6">
            <div className="max-w-3xl mx-auto text-center rounded-[32px] border border-white/40 bg-white/20 backdrop-blur-xl p-12">
                <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                    className="text-4xl font-bold tracking-tight mb-4">{block.title}</motion.h2>
                <p className="text-zinc-500 mb-8 text-sm">{block.description}</p>
                <Link href={block.buttonUrl || '/hub/dashboard'}
                    className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-sm font-bold text-white transition-all hover:scale-105 shadow-lg"
                    style={{ backgroundColor: pri }}>
                    {block.buttonText || 'Commencer'} <ArrowRight className="h-4 w-4" />
                </Link>
            </div>
        </div>
    );
}

/* ── CARDS ── */
function CardsBlock({ block, pri, sec }: { block: HubBlock; pri: string; sec: string }) {
    const items = block.items || [];
    return (
        <div className="max-w-6xl mx-auto px-6 py-20">
            <h2 className="text-3xl font-bold tracking-tight mb-10">{block.title}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {items.map((item: any, i: number) => (
                    <motion.div key={i} whileHover={{ y: -4 }}
                        className="rounded-2xl border border-white/40 bg-white/20 backdrop-blur-xl overflow-hidden shadow-md hover:shadow-xl transition-all">
                        {item.imageUrl && <img src={item.imageUrl} alt="" className="w-full h-40 object-cover" />}
                        <div className="p-5">
                            <h3 className="text-sm font-bold mb-2">{item.title}</h3>
                            <p className="text-xs text-zinc-500">{item.description}</p>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}

/* ── FORM ── */
function FormBlock({ block, pri, tenantId }: { block: HubBlock; pri: string; tenantId?: string }) {
    const [form, setForm] = useState({ name: '', email: '', message: '' });
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name || !form.email || !form.message) return;
        setSending(true);
        try {
            const contactUrl = tenantId
                ? `/api/hub/contact?tenantId=${encodeURIComponent(tenantId)}`
                : '/api/hub/contact';

            const res = await fetch(contactUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(tenantId ? { ...form, tenantId } : form),
            });
            if (res.ok) { setSent(true); setForm({ name: '', email: '', message: '' }); }
        } catch (e) { console.error('Form error:', e); }
        setSending(false);
    };

    return (
        <div className="max-w-2xl mx-auto px-6 py-20">
            <h2 className="text-3xl font-bold tracking-tight mb-2">{block.title}</h2>
            <p className="text-sm text-zinc-500 mb-8">{block.subtitle}</p>
            {sent ? (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                    className="rounded-2xl border border-white/40 bg-white/20 backdrop-blur-xl p-8 text-center">
                    <CheckCircle2 className="h-12 w-12 mx-auto mb-4" style={{ color: pri }} />
                    <h3 className="text-lg font-bold mb-1">Message envoyé !</h3>
                    <p className="text-xs text-zinc-500">Nous revenons vers vous rapidement.</p>
                </motion.div>
            ) : (
                <form onSubmit={submit} className="space-y-4">
                    <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                        placeholder="Nom" required
                        className="w-full px-4 py-3 rounded-xl border border-white/40 bg-white/20 backdrop-blur-xl outline-none text-sm focus:ring-2 transition"
                        style={{ '--tw-ring-color': pri } as any} />
                    <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                        placeholder="Email" required
                        className="w-full px-4 py-3 rounded-xl border border-white/40 bg-white/20 backdrop-blur-xl outline-none text-sm focus:ring-2 transition" />
                    <textarea value={form.message} onChange={e => setForm({ ...form, message: e.target.value })}
                        placeholder="Message" rows={4} required
                        className="w-full px-4 py-3 rounded-xl border border-white/40 bg-white/20 backdrop-blur-xl outline-none text-sm resize-none focus:ring-2 transition" />
                    <button type="submit" disabled={sending}
                        className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white transition-all hover:scale-[1.02] disabled:opacity-50"
                        style={{ backgroundColor: pri }}>
                        {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        {sending ? 'Envoi…' : 'Envoyer'}
                    </button>
                </form>
            )}
        </div>
    );
}
