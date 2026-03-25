'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, ExternalLink, Volume2, VolumeX } from 'lucide-react';

type Locale = 'fr' | 'en';

type HubBlock = {
  type: string;
  title?: string;
  subtitle?: string;
  text?: string;
  visible?: boolean;
  videoUrl?: string;
};

type HubConfig = {
  global?: Record<string, string>;
  business?: Record<string, string>;
  blocks?: HubBlock[];
};

type Product = {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  loginHref: string;
  crmHref: string;
  external?: boolean;
};

const FALLBACK_LOGO = '/Logo ours agence.png';
const FALLBACK_VIDEOS = [
  '/The_bear_walks._202603181916.mp4',
  '/vertex_animation_202603182054.mp4',
];

// Video palette reference (single source of truth)
const VIDEO_PALETTE = {
  pearl: '#eef4f7',
  mist: '#8fd0df',
  sand: '#e2c8a0',
  ink: '#0f2233',
} as const;

const TITLE_GRADIENT = `linear-gradient(100deg, ${VIDEO_PALETTE.mist} 0%, ${VIDEO_PALETTE.sand} 52%, ${VIDEO_PALETTE.ink} 100%)`;

const I18N = {
  fr: {
    badge: 'Creation SaaS, App, Web & Agents IA',
    title: 'On conçoit des produits SaaS clairs, rapides et elegants.',
    subtitle: 'Conception, design, dev, agents IA et lancement: un flux simple, orienté resultat.',
    sectionLabel: 'Creations en production',
    live: 'Live',
    login: 'Connexion',
    enterCrm: 'Entrer CRM',
    discover: 'Decouvrir',
    audioOn: 'Activer le son',
    audioOff: 'Couper le son',
    loading: 'Chargement du Hub',
    terminalHeader: 'Terminal creation',
  },
  en: {
    badge: 'SaaS, App, Web & AI Agents',
    title: 'We craft clear, fast and elegant SaaS products.',
    subtitle: 'Strategy, design, development, AI agents and launch in one focused product workflow.',
    sectionLabel: 'Live creations',
    live: 'Live',
    login: 'Login',
    enterCrm: 'Open CRM',
    discover: 'Discover',
    audioOn: 'Enable sound',
    audioOff: 'Mute sound',
    loading: 'Loading Hub',
    terminalHeader: 'Creation terminal',
  },
} as const;

function useLocale(): Locale {
  const [locale, setLocale] = useState<Locale>('fr');

  useEffect(() => {
    const lang = navigator.language || navigator.languages?.[0] || 'fr';
    setLocale(lang.startsWith('fr') ? 'fr' : 'en');
  }, []);

  return locale;
}

function getProducts(locale: Locale): Product[] {
  if (locale === 'fr') {
    return [
      {
        id: 'travel',
        name: 'Luna Travel',
        subtitle: 'Conciergerie B2B & itineraires IA',
        description: 'Leads, devis, roadmaps clients et operations agence dans un cockpit unique.',
        loginHref: '/landing?vertical=travel',
        crmHref: '/crm/luna',
      },
      {
        id: 'legal',
        name: 'Lawyer Suite',
        subtitle: 'Productivite cabinet & analyse juridique',
        description: 'Dossiers, jurisprudence, CRM client et process internes dans un meme flux.',
        loginHref: '/landing-legal?vertical=legal',
        crmHref: '/crm/avocat?vertical=legal',
      },
      {
        id: 'monum',
        name: 'Monum',
        subtitle: 'Pilotage chantiers & budgets',
        description: 'Suivi terrain, planning, fournisseurs et marge projet en temps reel.',
        loginHref: '/landing-monum?vertical=monum',
        crmHref: '/crm/monum?vertical=monum',
      },
    ];
  }

  return [
    {
      id: 'travel',
      name: 'Luna Travel',
      subtitle: 'B2B concierge & AI itineraries',
      description: 'Leads, quotes, client roadmaps and agency operations in one single cockpit.',
      loginHref: '/landing?vertical=travel',
      crmHref: '/crm/luna',
    },
      {
        id: 'legal',
      name: 'Lawyer Suite',
      subtitle: 'Law firm productivity & legal analysis',
      description: 'Case files, legal research, client CRM and workflows in one place.',
      loginHref: '/landing-legal?vertical=legal',
      crmHref: '/crm/avocat?vertical=legal',
    },
    {
      id: 'monum',
      name: 'Monum',
      subtitle: 'Construction tracking & budgets',
      description: 'Field tracking, suppliers, planning and project margin in real time.',
      loginHref: '/landing-monum?vertical=monum',
      crmHref: '/crm/monum?vertical=monum',
    },
  ];
}

function AgentTerminal({ locale, visible }: { locale: Locale; visible: boolean }) {
  const lines =
    locale === 'fr'
      ? [
          'create::studio --mode production',
          '[ok] Audit produit',
          '[ok] Design system',
          '[ok] Dev SaaS / App / Web',
          '[ok] Mise en ligne',
        ]
      : [
          'create::studio --mode production',
          '[ok] Product audit',
          '[ok] Design system',
          '[ok] SaaS / App / Web build',
          '[ok] Launch ready',
        ];
  const [lineIndex, setLineIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [cursor, setCursor] = useState(true);

  useEffect(() => {
    if (!visible) return;
    setLineIndex(0);
    setCharIndex(0);
  }, [visible, locale]);

  useEffect(() => {
    const id = window.setInterval(() => setCursor((v) => !v), 420);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!visible) return;
    if (lineIndex >= lines.length) return;

    const current = lines[lineIndex] || '';
    if (charIndex < current.length) {
      const t = window.setTimeout(() => setCharIndex((v) => v + 1), 20);
      return () => window.clearTimeout(t);
    }

    const t = window.setTimeout(() => {
      setLineIndex((v) => v + 1);
      setCharIndex(0);
    }, 80);
    return () => window.clearTimeout(t);
  }, [visible, lines, lineIndex, charIndex]);

  const rendered = lines.map((line, i) => {
    if (i < lineIndex) return line;
    if (i === lineIndex) return line.slice(0, charIndex);
    return '';
  });

  return (
    <div
      className="mt-3 w-full max-w-[520px] rounded-xl p-3"
      style={{ backgroundColor: 'rgba(238,244,247,0.72)' }}
    >
      <div className="space-y-1.5 font-mono text-[11px] text-[#0f2233]">
        {rendered.map((line, i) => (
          <div key={`${i}-${lines[i]}`}>
            {line}
            {i === lineIndex && lineIndex < lines.length && (
              <span className={`ml-0.5 ${cursor ? 'opacity-100' : 'opacity-0'} transition-opacity`}>▌</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function PromptModal({
  title,
  lines,
  visible,
}: {
  title: string;
  lines: string[];
  visible: boolean;
}) {
  const [lineIndex, setLineIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [cursor, setCursor] = useState(true);

  useEffect(() => {
    if (!visible) return;
    setLineIndex(0);
    setCharIndex(0);
  }, [visible, lines.join('|')]);

  useEffect(() => {
    const id = window.setInterval(() => setCursor((v) => !v), 420);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!visible) return;
    if (lineIndex >= lines.length) return;

    const current = lines[lineIndex] || '';
    if (charIndex < current.length) {
      const t = window.setTimeout(() => setCharIndex((v) => v + 1), 22);
      return () => window.clearTimeout(t);
    }

    const t = window.setTimeout(() => {
      setLineIndex((v) => v + 1);
      setCharIndex(0);
    }, 90);
    return () => window.clearTimeout(t);
  }, [visible, lines, lineIndex, charIndex]);

  const renderedLines = lines.map((line, i) => {
    if (i < lineIndex) return line;
    if (i === lineIndex) return line.slice(0, charIndex);
    return '';
  });

  return (
    <div
      className="rounded-2xl p-4 md:p-5"
      style={{
        backgroundColor: 'rgba(255,255,255,0.58)',
      }}
    >
      <p
        className="mb-2 font-mono text-[11px] uppercase tracking-[0.18em]"
        style={{
          color: `${VIDEO_PALETTE.ink}D9`,
        }}
      >
        {title}
      </p>
      <div className="space-y-1.5">
        {renderedLines.map((line, i) => (
          <p key={`${i}-${lines[i]}`} className="font-mono text-[12px] leading-relaxed" style={{ color: VIDEO_PALETTE.ink }}>
            <span className="mr-1" style={{ color: VIDEO_PALETTE.mist }}>{'>'}</span>
            {line}
            {i === lineIndex && lineIndex < lines.length && (
              <span className={`ml-0.5 ${cursor ? 'opacity-100' : 'opacity-0'} transition-opacity`}>▌</span>
            )}
          </p>
        ))}
      </div>
    </div>
  );
}

function LoadingBear({ label }: { label: string }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const duration = 2100;
    const start = performance.now();
    let raf = 0;

    const tick = (now: number) => {
      const ratio = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - ratio, 3);
      setProgress(Math.round(eased * 100));
      if (ratio < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.45 }}
      className="fixed inset-0 z-[999] flex items-center justify-center"
      style={{ backgroundColor: VIDEO_PALETTE.pearl }}
    >
      <div className="flex w-[280px] flex-col items-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.45 }}
        >
          <Image
            src="/Logo ours agence.png"
            alt="Datarnivore"
            width={128}
            height={172}
            className="h-auto w-[128px] object-contain"
            priority
          />
        </motion.div>
        <p className="mt-4 text-[11px] uppercase tracking-[0.2em] text-[#0f2233]/70">{label}</p>
        <div className="mt-3 h-[2px] w-full overflow-hidden rounded bg-[#8fd0df]/35">
          <motion.div
            className="h-full"
            style={{
              width: `${progress}%`,
              background: `linear-gradient(90deg, ${VIDEO_PALETTE.mist} 0%, ${VIDEO_PALETTE.sand} 100%)`,
            }}
          />
        </div>
        <p className="mt-2 font-mono text-[10px] text-[#1e3e58]/55">{progress}%</p>
      </div>
    </motion.div>
  );
}

export default function HubPage() {
  const locale = useLocale();
  const t = I18N[locale];
  const products = useMemo(() => getProducts(locale), [locale]);

  const [savedConfig, setSavedConfig] = useState<HubConfig | null>(null);
  const [editorConfig, setEditorConfig] = useState<HubConfig | null>(null);
  const [isIframePreview, setIsIframePreview] = useState(false);
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);
  const [muted, setMuted] = useState(true);
  const [videoIndex, setVideoIndex] = useState<number | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const activeConfig = editorConfig || savedConfig;
  const heroBlock = activeConfig?.blocks?.find((b) => b.type === 'hero');
  const contentBlock = activeConfig?.blocks?.find((b) => b.type === 'content');
  const featureBlock = activeConfig?.blocks?.find((b) => b.type === 'feature');

  const logo = FALLBACK_LOGO;
  const brandName = isIframePreview ? activeConfig?.business?.name || 'Studio SaaS' : 'Studio SaaS';
  const randomVideo = FALLBACK_VIDEOS[videoIndex ?? 0];
  const heroVideo = isIframePreview ? heroBlock?.videoUrl || randomVideo : randomVideo;
  const heroBadge = isIframePreview ? heroBlock?.subtitle || t.badge : t.badge;
  const heroTitle = isIframePreview ? heroBlock?.title || t.title : t.title;
  const heroSubtitle = isIframePreview ? heroBlock?.subtitle || t.subtitle : t.subtitle;

  useEffect(() => {
    fetch('/api/hub/config')
      .then((r) => r.json())
      .then((cfg) => setSavedConfig(cfg))
      .catch(() => setSavedConfig(null));
  }, []);

  useEffect(() => {
    const iframe = window.parent !== window;
    setIsIframePreview(iframe);
    if (iframe) {
      setLoading(false);
      setReady(true);
    }
  }, []);

  useEffect(() => {
    // Random video per refresh, avoiding the same choice as the previous refresh.
    const prev = Number(window.sessionStorage.getItem('hub-video-idx') ?? '-1');
    let next = Math.floor(Math.random() * FALLBACK_VIDEOS.length);
    if (prev >= 0 && next === prev && FALLBACK_VIDEOS.length > 1) {
      next = (next + 1) % FALLBACK_VIDEOS.length;
    }
    window.sessionStorage.setItem('hub-video-idx', String(next));
    setVideoIndex(next);
  }, []);

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.data?.type === 'hub-editor-update' && e.data.config) {
        setEditorConfig(e.data.config as HubConfig);
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  useEffect(() => {
    if (!isIframePreview) return;
    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const section = target.closest('[data-section-id]') as HTMLElement | null;
      if (!section) return;
      window.parent.postMessage(
        {
          type: 'hub-editor-focus',
          section: section.dataset.sectionId,
        },
        '*'
      );
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [isIframePreview]);

  useEffect(() => {
    if (isIframePreview) return;
    const timer = setTimeout(() => {
      setLoading(false);
      setReady(true);
    }, 2300);
    return () => clearTimeout(timer);
  }, [isIframePreview]);

  useEffect(() => {
    if (!ready) return;
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = 0;
    video.play().catch(() => {});
  }, [heroVideo, ready]);

  useEffect(() => {
    if (!ready) return;
    const video = videoRef.current;
    if (!video) return;

    const FREEZE_DELTA = 0.06;
    const FREEZE_AT: Record<string, number> = {
      '/The_bear_walks._202603181916.mp4': 5.9,
      '/vertex_animation_202603182054.mp4': 4.2,
    };

    const freezeOnCleanFrame = () => {
      if (!video.duration || Number.isNaN(video.duration)) return;
      const preferred = FREEZE_AT[heroVideo];
      const freezeAt =
        typeof preferred === 'number'
          ? Math.min(Math.max(0, preferred), Math.max(0, video.duration - FREEZE_DELTA))
          : Math.max(0, video.duration - FREEZE_DELTA);
      video.pause();
      if (video.currentTime < freezeAt) {
        video.currentTime = freezeAt;
      }
    };

    const onTimeUpdate = () => {
      if (!video.duration || Number.isNaN(video.duration)) return;
      const remaining = video.duration - video.currentTime;
      if (remaining <= FREEZE_DELTA) {
        freezeOnCleanFrame();
      }
    };

    const onEnded = () => freezeOnCleanFrame();

    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('ended', onEnded);

    return () => {
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('ended', onEnded);
    };
  }, [heroVideo, ready]);

  const toggleSound = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !muted;
    setMuted((v) => !v);
  };

  const defaultContentLines =
    locale === 'fr'
      ? [
          'Conception UX/UI sur-mesure',
          'Developpement SaaS, App et Web',
          'Integration et orchestration d agents IA',
          'Automatisation, analytics, lancement',
        ]
      : [
          'Custom UX/UI design',
          'SaaS, App and Web development',
          'AI agent integration and orchestration',
          'Automation, analytics and launch',
        ];

  const customContentLines = (contentBlock?.text || '')
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);

  const contentLines = isIframePreview && customContentLines.length > 0 ? customContentLines : defaultContentLines;

  return (
    <>
      <AnimatePresence>{loading && <LoadingBear label={t.loading} />}</AnimatePresence>

      <main className="relative min-h-screen overflow-hidden text-white" style={{ backgroundColor: VIDEO_PALETTE.pearl }}>
        <div className="absolute inset-0 z-0">
          <video
            ref={videoRef}
            key={heroVideo}
            muted
            autoPlay
            playsInline
            preload="auto"
            poster="/bear-walk-poster.jpg"
            className="h-full w-full object-cover"
          >
            <source src={heroVideo} type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(255,255,255,0.58),transparent_45%),radial-gradient(circle_at_85%_85%,rgba(143,232,255,0.32),transparent_40%)]" />
          <div className="absolute inset-0 bg-white/18" />
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={ready ? { opacity: 0.55, scale: 1 } : {}}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className="absolute -left-20 -top-16 h-[340px] w-[340px] rounded-full blur-3xl"
            style={{ backgroundColor: `${VIDEO_PALETTE.mist}66` }}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={ready ? { opacity: 0.45, scale: 1 } : {}}
            transition={{ duration: 1.3, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="absolute -bottom-20 -right-20 h-[360px] w-[360px] rounded-full blur-3xl"
            style={{ backgroundColor: `${VIDEO_PALETTE.sand}66` }}
          />
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={ready ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.7 }}
          className="relative z-10"
        >
          <header
            data-section-id="nav"
            className="relative z-20 mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-6 md:px-8 md:py-8"
          >
            <motion.div
              initial={{ opacity: 0, y: -18 }}
              animate={ready ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
              className="flex items-center gap-3"
            >
              <Image src={logo} alt={brandName} width={44} height={44} className="object-contain" />
              <span className="text-lg font-semibold tracking-wide" style={{ color: VIDEO_PALETTE.ink }}>{brandName}</span>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: -18 }}
              animate={ready ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
              className="flex items-center gap-3"
            >
              <span className="rounded-full bg-white/65 px-3 py-1 text-[10px] uppercase tracking-[0.18em]" style={{ color: `${VIDEO_PALETTE.ink}D9` }}>
                {t.live}
              </span>
              <button
                onClick={toggleSound}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/65 transition hover:bg-white/90"
                style={{ color: VIDEO_PALETTE.ink }}
                aria-label={muted ? t.audioOn : t.audioOff}
              >
                {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </button>
            </motion.div>
          </header>

          <section
            data-section-id="hero"
            className="relative z-10 mx-auto flex w-full max-w-6xl flex-col px-4 pb-10 pt-8 md:px-8 md:pt-14"
          >
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={ready ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4 }}
              className="mb-4 inline-flex w-fit rounded-full bg-white/65 px-4 py-1.5 text-xs uppercase tracking-[0.18em]"
              style={{ color: `${VIDEO_PALETTE.ink}D9` }}
            >
                {heroBadge}
              </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={ready ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="max-w-4xl font-mono text-3xl font-semibold leading-tight uppercase md:text-5xl"
              style={{
                backgroundImage: TITLE_GRADIENT,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: `0 10px 24px ${VIDEO_PALETTE.mist}44`,
              }}
            >
              {heroTitle}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={ready ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: 0.16, ease: [0.16, 1, 0.3, 1] }}
              className="mt-4 max-w-3xl text-sm leading-relaxed md:text-base"
              style={{ color: `${VIDEO_PALETTE.ink}D9` }}
            >
              {heroSubtitle}
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={ready ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: 0.22, ease: [0.16, 1, 0.3, 1] }}
            >
              <p className="mt-4 font-mono text-xs uppercase tracking-[0.16em]" style={{ color: `${VIDEO_PALETTE.ink}E6` }}>{t.terminalHeader}</p>
              <AgentTerminal locale={locale} visible={ready} />
            </motion.div>
          </section>

          <section data-section-id="content" className="relative z-10 mx-auto w-full max-w-6xl px-4 md:px-8">
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={ready ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.45, delay: 0.22 }}
              className="rounded-2xl p-5 backdrop-blur-xl md:p-6"
              style={{
                backgroundColor: 'rgba(255,255,255,0.46)',
              }}
            >
              <PromptModal
                title={isIframePreview ? contentBlock?.title || t.sectionLabel : t.sectionLabel}
                lines={contentLines}
                visible={ready}
              />
            </motion.div>
          </section>

          {featureBlock?.visible !== false && (
            <section
              data-section-id="feature"
              className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-14 pt-6 md:px-8 md:pb-20 md:pt-8"
            >
              <div className="grid gap-4 md:grid-cols-3">
                {products.map((p, i) => (
                  <motion.article
                    key={p.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={ready ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.45, delay: 0.28 + i * 0.06 }}
                    className="group rounded-2xl p-5 backdrop-blur-xl transition hover:-translate-y-1"
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.44)',
                    }}
                  >
                    <div
                      className="mb-3 h-1 w-16 rounded-full"
                      style={{ background: `linear-gradient(90deg, ${VIDEO_PALETTE.mist} 0%, ${VIDEO_PALETTE.sand} 100%)` }}
                    />
                    <h3
                      className="text-xl font-semibold"
                      style={{
                        backgroundImage: TITLE_GRADIENT,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                      }}
                    >
                      {p.name}
                    </h3>
                    <p className="mt-1 text-sm text-[#23445f]/85">{p.subtitle}</p>
                    <PromptModal title="creation.prompt" lines={[p.description]} visible={ready} />

                    <div className="mt-5 flex items-center gap-3 font-mono text-xs uppercase tracking-[0.14em]">
                      {p.external ? (
                        <a
                          href={p.loginHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-[#0f2233]/85 hover:text-[#0f2233]"
                        >
                          <ExternalLink size={13} />
                          {t.discover}
                        </a>
                      ) : (
                        <>
                          <Link href={p.loginHref} className="inline-flex items-center gap-1.5 text-[#0f2233]/85 hover:text-[#0f2233]">
                            <ExternalLink size={13} />
                            {t.login}
                          </Link>
                          <span className="text-[#0f2233]/30">/</span>
                          <Link href={p.crmHref} className="inline-flex items-center gap-1.5 text-[#0f2233]/95 hover:text-[#0f2233]">
                            <ArrowRight size={13} />
                            {t.enterCrm}
                          </Link>
                        </>
                      )}
                    </div>
                  </motion.article>
                ))}
              </div>
            </section>
          )}
        </motion.div>
      </main>
    </>
  );
}
