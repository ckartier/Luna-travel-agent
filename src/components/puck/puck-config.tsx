'use client';

import type { Config } from '@puckeditor/core';
import { motion } from 'framer-motion';
import { ChevronRight, ArrowRight, Mail, Phone, MapPin } from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════
// LUNA PUCK CONFIG — All components for the visual page builder
// ═══════════════════════════════════════════════════════════════════

const FONT_OPTIONS = [
    { label: 'Playfair Display', value: 'Playfair Display' },
    { label: 'Cormorant Garamond', value: 'Cormorant Garamond' },
    { label: 'Inter', value: 'Inter' },
    { label: 'Outfit', value: 'Outfit' },
    { label: 'DM Sans', value: 'DM Sans' },
    { label: 'Poppins', value: 'Poppins' },
    { label: 'Montserrat', value: 'Montserrat' },
    { label: 'Raleway', value: 'Raleway' },
    { label: 'Libre Baskerville', value: 'Libre Baskerville' },
    { label: 'Merriweather', value: 'Merriweather' },
];

const ANIM_OPTIONS = [
    { label: 'Aucune', value: 'none' },
    { label: 'Fade In', value: 'fadeIn' },
    { label: 'Slide Up', value: 'slideUp' },
    { label: 'Scale In', value: 'scaleIn' },
    { label: 'Slide Left', value: 'slideLeft' },
    { label: 'Slide Right', value: 'slideRight' },
];

const getAnim = (type: string) => {
    const anims: Record<string, any> = {
        fadeIn: { initial: { opacity: 0 }, whileInView: { opacity: 1 } },
        slideUp: { initial: { opacity: 0, y: 60 }, whileInView: { opacity: 1, y: 0 } },
        scaleIn: { initial: { opacity: 0, scale: 0.9 }, whileInView: { opacity: 1, scale: 1 } },
        slideLeft: { initial: { opacity: 0, x: -60 }, whileInView: { opacity: 1, x: 0 } },
        slideRight: { initial: { opacity: 0, x: 60 }, whileInView: { opacity: 1, x: 0 } },
    };
    return anims[type] || { initial: { opacity: 0, y: 30 }, whileInView: { opacity: 1, y: 0 } };
};

// ═══ PUCK CONFIG ═══

export const lunaConfig: Config = {
    categories: {
        sections: {
            title: '📐 Sections',
            components: ['Hero', 'Section', 'Divider', 'ColumnGrid'],
        },
        content: {
            title: '✏️ Contenu',
            components: ['Heading', 'Text', 'Image', 'Button', 'Spacer'],
        },
        interactive: {
            title: '⚡ Interactif',
            components: ['ContactForm', 'Gallery', 'Slider'],
        },
    },
    components: {
        // ═══════════════════════════════════════
        // HERO — Full-width hero section
        // ═══════════════════════════════════════
        Hero: {
            fields: {
                title: { type: 'text' },
                subtitle: { type: 'text' },
                backgroundImage: { type: 'text' },
                backgroundVideo: { type: 'text' },
                overlayOpacity: {
                    type: 'select',
                    options: [
                        { label: '20%', value: '0.2' },
                        { label: '30%', value: '0.3' },
                        { label: '40%', value: '0.4' },
                        { label: '50%', value: '0.5' },
                        { label: '60%', value: '0.6' },
                        { label: '70%', value: '0.7' },
                    ],
                },
                height: {
                    type: 'select',
                    options: [
                        { label: 'Moyen (60vh)', value: '60vh' },
                        { label: 'Grand (80vh)', value: '80vh' },
                        { label: 'Plein écran', value: '100vh' },
                    ],
                },
                textColor: { type: 'text' },
                animation: {
                    type: 'select',
                    options: ANIM_OPTIONS,
                },
            },
            defaultProps: {
                title: 'Votre Voyage d\'Exception',
                subtitle: 'CONCIERGERIE DE LUXE',
                backgroundImage: '',
                backgroundVideo: '',
                overlayOpacity: '0.5',
                height: '100vh',
                textColor: '#FFFFFF',
                animation: 'fadeIn',
            },
            render: ({ title, subtitle, backgroundImage, backgroundVideo, overlayOpacity, height, textColor, animation }) => {
                const anim = getAnim(animation || 'fadeIn');
                return (
                    <section className="relative w-full flex items-center justify-center overflow-hidden" style={{ minHeight: height || '100vh' }}>
                        {backgroundVideo ? (
                            <video autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover">
                                <source src={backgroundVideo} type="video/mp4" />
                            </video>
                        ) : backgroundImage ? (
                            <img src={backgroundImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
                        ) : (
                            <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460]" />
                        )}
                        <div className="absolute inset-0" style={{ backgroundColor: `rgba(0,0,0,${overlayOpacity || 0.5})` }} />
                        <motion.div
                            {...anim}
                            viewport={{ once: true }}
                            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                            className="relative z-10 text-center px-6 max-w-4xl"
                        >
                            {subtitle && (
                                <span className="text-[12px] md:text-[14px] font-bold uppercase tracking-[0.5em] mb-8 block" style={{ color: `${textColor || '#fff'}99` }}>
                                    {subtitle}
                                </span>
                            )}
                            <h1 className="text-[45px] md:text-[80px] lg:text-[100px] leading-[0.95] mb-8" style={{ fontFamily: 'var(--font-heading)', color: textColor || '#fff' }}>
                                {title}
                            </h1>
                        </motion.div>
                    </section>
                );
            },
        },

        // ═══════════════════════════════════════
        // SECTION — Generic container with slot
        // ═══════════════════════════════════════
        Section: {
            fields: {
                backgroundColor: { type: 'text' },
                textColor: { type: 'text' },
                paddingY: {
                    type: 'select',
                    options: [
                        { label: 'Petit', value: '40px' },
                        { label: 'Moyen', value: '80px' },
                        { label: 'Grand', value: '120px' },
                        { label: 'Très grand', value: '160px' },
                    ],
                },
                maxWidth: {
                    type: 'select',
                    options: [
                        { label: 'Étroit (900px)', value: '900px' },
                        { label: 'Normal (1200px)', value: '1200px' },
                        { label: 'Large (1400px)', value: '1400px' },
                        { label: 'Pleine largeur', value: '100%' },
                    ],
                },
                content: { type: 'slot' },
            },
            defaultProps: {
                backgroundColor: '#FFFFFF',
                textColor: '#2E2E2E',
                paddingY: '120px',
                maxWidth: '1400px',
            },
            render: ({ backgroundColor, textColor, paddingY, maxWidth, content: Content }) => (
                <section style={{ backgroundColor: backgroundColor || '#fff', color: textColor || '#2E2E2E', paddingTop: paddingY || '120px', paddingBottom: paddingY || '120px' }}>
                    <div style={{ maxWidth: maxWidth || '1400px', margin: '0 auto', padding: '0 24px' }}>
                        <Content />
                    </div>
                </section>
            ),
        },

        // ═══════════════════════════════════════
        // COLUMN GRID — Multi-column layout
        // ═══════════════════════════════════════
        ColumnGrid: {
            fields: {
                columns: {
                    type: 'select',
                    options: [
                        { label: '2 colonnes', value: '2' },
                        { label: '3 colonnes', value: '3' },
                        { label: '4 colonnes', value: '4' },
                    ],
                },
                gap: {
                    type: 'select',
                    options: [
                        { label: 'Petit (16px)', value: '16' },
                        { label: 'Moyen (32px)', value: '32' },
                        { label: 'Grand (48px)', value: '48' },
                        { label: 'Très grand (64px)', value: '64' },
                    ],
                },
                verticalAlign: {
                    type: 'select',
                    options: [
                        { label: 'Haut', value: 'start' },
                        { label: 'Centre', value: 'center' },
                        { label: 'Bas', value: 'end' },
                        { label: 'Étirer', value: 'stretch' },
                    ],
                },
                content: { type: 'slot' },
            },
            defaultProps: {
                columns: '2',
                gap: '32',
                verticalAlign: 'start',
            },
            render: ({ columns, gap, verticalAlign, content: Content }) => (
                <Content
                    style={{
                        display: 'grid',
                        gridTemplateColumns: `repeat(${columns || 2}, 1fr)`,
                        gap: `${gap || 32}px`,
                        alignItems: verticalAlign || 'start',
                    }}
                />
            ),
        },

        // ═══════════════════════════════════════
        // DIVIDER — Parallax separator
        // ═══════════════════════════════════════
        Divider: {
            fields: {
                image: { type: 'text' },
                height: {
                    type: 'select',
                    options: [
                        { label: 'Petit (200px)', value: '200' },
                        { label: 'Moyen (400px)', value: '400' },
                        { label: 'Grand (600px)', value: '600' },
                    ],
                },
                overlay: { type: 'text' },
            },
            defaultProps: {
                image: '',
                height: '400',
                overlay: 'rgba(0,0,0,0.3)',
            },
            render: ({ image, height, overlay }) => (
                <div className="relative w-full overflow-hidden" style={{ height: `${height || 400}px` }}>
                    {image && (
                        <div className="absolute inset-0" style={{ backgroundImage: `url(${image})`, backgroundAttachment: 'fixed', backgroundPosition: 'center', backgroundSize: 'cover' }} />
                    )}
                    <div className="absolute inset-0" style={{ backgroundColor: overlay || 'rgba(0,0,0,0.3)' }} />
                </div>
            ),
        },

        // ═══════════════════════════════════════
        // HEADING — Rich heading component
        // ═══════════════════════════════════════
        Heading: {
            inline: true,
            fields: {
                text: { type: 'text' },
                level: {
                    type: 'select',
                    options: [
                        { label: 'H1 — Titre principal', value: 'h1' },
                        { label: 'H2 — Titre section', value: 'h2' },
                        { label: 'H3 — Sous-titre', value: 'h3' },
                        { label: 'H4 — Petit titre', value: 'h4' },
                        { label: 'Étiquette', value: 'label' },
                    ],
                },
                color: { type: 'text' },
                align: {
                    type: 'select',
                    options: [
                        { label: 'Gauche', value: 'left' },
                        { label: 'Centre', value: 'center' },
                        { label: 'Droite', value: 'right' },
                    ],
                },
                animation: { type: 'select', options: ANIM_OPTIONS },
            },
            defaultProps: {
                text: 'Votre Titre',
                level: 'h2',
                color: '#2E2E2E',
                align: 'left',
                animation: 'slideUp',
            },
            render: ({ text, level, color, align, animation, puck }) => {
                const anim = getAnim(animation || 'slideUp');
                const sizes: Record<string, string> = {
                    h1: 'text-[50px] md:text-[80px] leading-[0.95]',
                    h2: 'text-[35px] md:text-[55px] leading-tight',
                    h3: 'text-[24px] md:text-[36px] leading-snug',
                    h4: 'text-[18px] md:text-[24px] leading-snug font-medium',
                    label: 'text-[11px] md:text-[13px] uppercase tracking-[0.4em] font-bold',
                };
                return (
                    <motion.div ref={puck.dragRef} {...anim} viewport={{ once: true }} transition={{ duration: 0.8 }} style={{ textAlign: (align as any) || 'left' }}>
                        {level === 'label' ? (
                            <span className={sizes.label} style={{ color: `${color || '#2E2E2E'}80` }}>{text}</span>
                        ) : (
                            <div className={sizes[level || 'h2']} style={{ fontFamily: 'var(--font-heading)', color: color || '#2E2E2E' }}>{text}</div>
                        )}
                    </motion.div>
                );
            },
        },

        // ═══════════════════════════════════════
        // TEXT — Paragraph text
        // ═══════════════════════════════════════
        Text: {
            inline: true,
            fields: {
                text: { type: 'textarea' },
                color: { type: 'text' },
                size: {
                    type: 'select',
                    options: [
                        { label: 'Petit (14px)', value: '14' },
                        { label: 'Normal (16px)', value: '16' },
                        { label: 'Grand (18px)', value: '18' },
                        { label: 'Très grand (20px)', value: '20' },
                    ],
                },
                maxWidth: { type: 'text' },
                align: {
                    type: 'select',
                    options: [
                        { label: 'Gauche', value: 'left' },
                        { label: 'Centre', value: 'center' },
                        { label: 'Droite', value: 'right' },
                    ],
                },
            },
            defaultProps: {
                text: 'Votre texte ici...',
                color: '#555555',
                size: '16',
                maxWidth: '700px',
                align: 'left',
            },
            render: ({ text, color, size, maxWidth, align, puck }) => (
                <p
                    ref={puck.dragRef}
                    className="font-light leading-relaxed"
                    style={{
                        color: color || '#555',
                        fontSize: `${size || 16}px`,
                        maxWidth: maxWidth || '700px',
                        textAlign: (align as any) || 'left',
                        margin: align === 'center' ? '0 auto' : undefined,
                    }}
                >
                    {text}
                </p>
            ),
        },

        // ═══════════════════════════════════════
        // IMAGE — Image with effects
        // ═══════════════════════════════════════
        Image: {
            inline: true,
            fields: {
                src: { type: 'text' },
                alt: { type: 'text' },
                rounded: {
                    type: 'select',
                    options: [
                        { label: 'Aucun', value: '0' },
                        { label: 'Petit (8px)', value: '8' },
                        { label: 'Moyen (16px)', value: '16' },
                        { label: 'Grand (24px)', value: '24' },
                        { label: 'Cercle', value: '50%' },
                    ],
                },
                shadow: {
                    type: 'select',
                    options: [
                        { label: 'Aucune', value: 'none' },
                        { label: 'Légère', value: '0 4px 20px rgba(0,0,0,0.08)' },
                        { label: 'Moyenne', value: '0 8px 40px rgba(0,0,0,0.12)' },
                        { label: 'Forte', value: '0 20px 60px rgba(0,0,0,0.2)' },
                    ],
                },
                height: { type: 'text' },
                animation: { type: 'select', options: ANIM_OPTIONS },
            },
            defaultProps: {
                src: '',
                alt: '',
                rounded: '16',
                shadow: '0 8px 40px rgba(0,0,0,0.12)',
                height: 'auto',
                animation: 'scaleIn',
            },
            render: ({ src, alt, rounded, shadow, height, animation, puck }) => {
                const anim = getAnim(animation || 'scaleIn');
                return (
                    <motion.div ref={puck.dragRef} {...anim} viewport={{ once: true }} transition={{ duration: 0.8 }} className="overflow-hidden group" style={{ borderRadius: rounded?.includes('%') ? rounded : `${rounded || 16}px` }}>
                        {src ? (
                            <img
                                src={src}
                                alt={alt || ''}
                                className="w-full object-cover group-hover:scale-105 transition-transform duration-700"
                                style={{ height: height || 'auto', boxShadow: shadow || 'none' }}
                            />
                        ) : (
                            <div className="w-full bg-gray-100 flex items-center justify-center text-gray-300" style={{ height: height || '300px', borderRadius: rounded?.includes('%') ? rounded : `${rounded || 16}px` }}>
                                <span className="text-sm">📷 Ajouter une image (URL)</span>
                            </div>
                        )}
                    </motion.div>
                );
            },
        },

        // ═══════════════════════════════════════
        // BUTTON — CTA button
        // ═══════════════════════════════════════
        Button: {
            inline: true,
            fields: {
                text: { type: 'text' },
                url: { type: 'text' },
                style: {
                    type: 'select',
                    options: [
                        { label: 'Plein', value: 'solid' },
                        { label: 'Contour', value: 'outline' },
                        { label: 'Texte + flèche', value: 'ghost' },
                    ],
                },
                color: { type: 'text' },
                textColor: { type: 'text' },
                size: {
                    type: 'select',
                    options: [
                        { label: 'Petit', value: 'sm' },
                        { label: 'Normal', value: 'md' },
                        { label: 'Grand', value: 'lg' },
                    ],
                },
                align: {
                    type: 'select',
                    options: [
                        { label: 'Gauche', value: 'left' },
                        { label: 'Centre', value: 'center' },
                        { label: 'Droite', value: 'right' },
                    ],
                },
            },
            defaultProps: {
                text: 'Découvrir →',
                url: '#',
                style: 'solid',
                color: '#2E2E2E',
                textColor: '#FFFFFF',
                size: 'md',
                align: 'left',
            },
            render: ({ text, url, style: btnStyle, color, textColor, size, align, puck }) => {
                const pad = size === 'sm' ? '10px 24px' : size === 'lg' ? '18px 48px' : '14px 36px';
                const fontSize = size === 'sm' ? '11px' : size === 'lg' ? '14px' : '12px';
                const justification = align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start';

                if (btnStyle === 'ghost') {
                    return (
                        <div ref={puck.dragRef} style={{ display: 'flex', justifyContent: justification }}>
                            <a href={url || '#'} className="inline-flex items-center gap-2 font-bold uppercase hover:gap-4 transition-all duration-300" style={{ color: color || '#2E2E2E', fontSize, letterSpacing: '0.2em' }}>
                                {text} <ChevronRight size={14} />
                            </a>
                        </div>
                    );
                }

                return (
                    <div ref={puck.dragRef} style={{ display: 'flex', justifyContent: justification }}>
                        <a
                            href={url || '#'}
                            className="inline-block font-bold uppercase tracking-[0.2em] transition-all duration-300 hover:opacity-90 hover:shadow-lg"
                            style={{
                                padding: pad,
                                fontSize,
                                backgroundColor: btnStyle === 'outline' ? 'transparent' : (color || '#2E2E2E'),
                                color: btnStyle === 'outline' ? (color || '#2E2E2E') : (textColor || '#fff'),
                                border: btnStyle === 'outline' ? `2px solid ${color || '#2E2E2E'}` : 'none',
                                borderRadius: '6px',
                            }}
                        >
                            {text || 'Découvrir →'}
                        </a>
                    </div>
                );
            },
        },

        // ═══════════════════════════════════════
        // SPACER — Vertical spacing
        // ═══════════════════════════════════════
        Spacer: {
            inline: true,
            fields: {
                height: {
                    type: 'select',
                    options: [
                        { label: 'XS (16px)', value: '16' },
                        { label: 'Small (32px)', value: '32' },
                        { label: 'Medium (48px)', value: '48' },
                        { label: 'Large (64px)', value: '64' },
                        { label: 'XL (96px)', value: '96' },
                        { label: '2XL (128px)', value: '128' },
                    ],
                },
            },
            defaultProps: { height: '48' },
            render: ({ height, puck }) => (
                <div ref={puck.dragRef} style={{ height: `${height || 48}px`, minHeight: '8px' }} className="w-full" />
            ),
        },

        // ═══════════════════════════════════════
        // GALLERY — Image grid
        // ═══════════════════════════════════════
        Gallery: {
            fields: {
                images: { type: 'textarea' },
                columns: {
                    type: 'select',
                    options: [
                        { label: '2 colonnes', value: '2' },
                        { label: '3 colonnes', value: '3' },
                        { label: '4 colonnes', value: '4' },
                    ],
                },
                gap: { type: 'text' },
                rounded: { type: 'text' },
                imageHeight: { type: 'text' },
            },
            defaultProps: {
                images: '',
                columns: '3',
                gap: '12',
                rounded: '12',
                imageHeight: '280px',
            },
            render: ({ images, columns, gap, rounded, imageHeight }) => {
                const urls = (images || '').split('\n').filter(Boolean);
                if (!urls.length) return (
                    <div className="w-full py-16 text-center text-gray-300 border-2 border-dashed border-gray-200 rounded-xl">
                        📷 Collez les URLs des images (une par ligne)
                    </div>
                );
                return (
                    <div className="grid" style={{ gridTemplateColumns: `repeat(${columns || 3}, 1fr)`, gap: `${gap || 12}px` }}>
                        {urls.map((url: string, idx: number) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, scale: 0.9 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.08, duration: 0.6 }}
                                className="overflow-hidden group shadow-lg hover:shadow-2xl transition-shadow duration-500"
                                style={{ borderRadius: `${rounded || 12}px` }}
                            >
                                <img src={url} alt="" className="w-full object-cover group-hover:scale-110 transition-transform duration-700" style={{ height: imageHeight || '280px' }} />
                            </motion.div>
                        ))}
                    </div>
                );
            },
        },

        // ═══════════════════════════════════════
        // SLIDER — Horizontal auto-scroll
        // ═══════════════════════════════════════
        Slider: {
            fields: {
                images: { type: 'textarea' },
                speed: {
                    type: 'select',
                    options: [
                        { label: 'Lent', value: '40' },
                        { label: 'Normal', value: '25' },
                        { label: 'Rapide', value: '15' },
                    ],
                },
                itemWidth: { type: 'text' },
                itemHeight: { type: 'text' },
                rounded: { type: 'text' },
            },
            defaultProps: {
                images: '',
                speed: '25',
                itemWidth: '450px',
                itemHeight: '350px',
                rounded: '16',
            },
            render: ({ images, speed, itemWidth, itemHeight, rounded }) => {
                const urls = (images || '').split('\n').filter(Boolean);
                if (!urls.length) return (
                    <div className="w-full py-16 text-center text-gray-300 border-2 border-dashed border-gray-200 rounded-xl">
                        📷 Collez les URLs des images (une par ligne)
                    </div>
                );
                const doubled = [...urls, ...urls];
                return (
                    <div className="w-full overflow-hidden relative">
                        <style>{`
                            @keyframes puck-slide { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
                            .puck-slider-track { display: flex; animation: puck-slide ${speed || 25}s linear infinite; }
                            .puck-slider-track:hover { animation-play-state: paused; }
                        `}</style>
                        <div className="puck-slider-track">
                            {doubled.map((url: string, idx: number) => (
                                <div key={idx} className="shrink-0 mx-3 overflow-hidden shadow-lg" style={{ width: itemWidth || '450px', height: itemHeight || '350px', borderRadius: `${rounded || 16}px` }}>
                                    <img src={url} alt="" className="w-full h-full object-cover hover:scale-110 transition-transform duration-700" />
                                </div>
                            ))}
                        </div>
                    </div>
                );
            },
        },

        // ═══════════════════════════════════════
        // CONTACT FORM — Embedded form
        // ═══════════════════════════════════════
        ContactForm: {
            fields: {
                title: { type: 'text' },
                subtitle: { type: 'text' },
                backgroundColor: { type: 'text' },
                buttonColor: { type: 'text' },
                buttonText: { type: 'text' },
            },
            defaultProps: {
                title: 'Contactez-nous',
                subtitle: 'Créons ensemble votre voyage sur-mesure',
                backgroundColor: '#f8f7f4',
                buttonColor: '#2E2E2E',
                buttonText: 'ENVOYER',
            },
            render: ({ title, subtitle, backgroundColor, buttonColor, buttonText }) => (
                <section style={{ backgroundColor: backgroundColor || '#f8f7f4' }} className="py-24 px-6">
                    <div className="max-w-[700px] mx-auto text-center">
                        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
                            <h2 className="text-[35px] md:text-[50px] leading-tight mb-4" style={{ fontFamily: 'var(--font-heading)' }}>{title}</h2>
                            {subtitle && <p className="text-[16px] text-gray-500 font-light mb-12">{subtitle}</p>}
                        </motion.div>
                        <form className="space-y-5 text-left" onSubmit={e => e.preventDefault()}>
                            <div className="grid grid-cols-2 gap-4">
                                <input type="text" placeholder="Prénom" className="w-full px-5 py-4 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400 transition-colors" />
                                <input type="text" placeholder="Nom" className="w-full px-5 py-4 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400 transition-colors" />
                            </div>
                            <input type="email" placeholder="Email" className="w-full px-5 py-4 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400 transition-colors" />
                            <input type="tel" placeholder="Téléphone" className="w-full px-5 py-4 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400 transition-colors" />
                            <textarea placeholder="Décrivez votre voyage idéal..." rows={5} className="w-full px-5 py-4 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400 transition-colors resize-none" />
                            <button type="submit" className="w-full py-5 text-white font-bold text-[13px] tracking-[0.3em] uppercase rounded-lg transition-all duration-300 hover:opacity-90 hover:shadow-lg" style={{ backgroundColor: buttonColor || '#2E2E2E' }}>
                                {buttonText || 'ENVOYER'}
                            </button>
                        </form>
                    </div>
                </section>
            ),
        },
    },
};

export default lunaConfig;
