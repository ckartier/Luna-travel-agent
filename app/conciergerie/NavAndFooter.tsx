'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useLang } from './LangContext';
import { ChevronDown, ShoppingBag } from 'lucide-react';
import { useCart } from '@/src/contexts/CartContext';
import { useLogo, useSiteConfig } from '@/src/hooks/useSiteConfig';

export default function NavAndFooter({ children }: { children: ReactNode }) {
    const { lang, setLang, t } = useLang();
    const { cart } = useCart();
    const logo = useLogo();
    const siteConfig = useSiteConfig() as any;
    const [scrolled, setScrolled] = useState(false);
    const cartCount = cart.length;

    const navItems = siteConfig?.nav?.menuItems || [];
    
    const getNavLabel = (index: number, key: string, frFallback: string) => {
        const val = navItems[index]?.label;
        if (!val || val === frFallback) return t(key);
        return val;
    };

    const navLabel1 = getNavLabel(0, 'nav.destinations', 'Destinations');
    const navHref1 = navItems[0]?.href || '#destinations';
    const navLabel2 = getNavLabel(1, 'nav.services', 'Services');
    const navHref2 = navItems[1]?.href || '#services';
    const navLabel3 = getNavLabel(2, 'nav.contact', 'Contact');
    const navHref3 = navItems[2]?.href || '#tailor-made';
    
    const customCta = siteConfig?.nav?.ctaText;
    const ctaText = (!customCta || customCta === 'Espace Client') ? t('nav.client_area') : customCta;

    const customFooterDesc = siteConfig?.footer?.description;
    const footerDesc = (!customFooterDesc || customFooterDesc === 'Voyages privés et services de conciergerie sur-mesure pour les voyageurs exigeants.') ? t('footer.desc') : customFooterDesc;
    
    const customCopyright = siteConfig?.footer?.copyright;
    const footerCopyright = (!customCopyright || customCopyright === '© 2026 Luna Conciergerie. Tous droits réservés.') ? t('footer.rights') : customCopyright;

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <>
            <nav className={`fixed top-0 w-full z-50 transition-all duration-500 ease-out border-b ${scrolled ? 'bg-white/80 backdrop-blur-xl border-luna-warm-gray/20 shadow-sm py-4' : 'bg-transparent border-transparent py-6'}`}>
                <div className="max-w-[1400px] mx-auto flex items-center justify-between px-6 md:px-12">
                    <div className="flex items-center gap-3">
                        <img
                            src={logo}
                            alt="Luna Travel"
                            className={`object-contain brightness-0 transition-all duration-500 ${scrolled ? 'h-10' : 'h-16'}`}
                        />
                    </div>
                    <div className="hidden md:flex items-center gap-10 text-[13px] font-medium tracking-wide">
                        <a href={navHref1} className="text-luna-charcoal/70 hover:text-black transition-colors">{navLabel1}</a>
                        <a href={navHref2} className="text-luna-charcoal/70 hover:text-black transition-colors">{navLabel2}</a>
                        <a href={navHref3} className="text-luna-charcoal/70 hover:text-black transition-colors">{navLabel3}</a>

                        {/* Selector de Langue */}
                        <div className="relative group flex items-center gap-1.5 cursor-pointer ml-2">
                            <span className="text-luna-charcoal/90 uppercase text-[11px] font-bold tracking-widest">{lang}</span>
                            <ChevronDown size={14} className="text-gray-400 group-hover:text-black transition-colors" />
                            {/* Invisible bridge wrapper: pt-4 fills the gap so hover is continuous */}
                            <div className="absolute top-full right-0 pt-4 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-all transform group-hover:translate-y-0 translate-y-2">
                                <div className="py-3 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-100 flex flex-col min-w-[140px] overflow-hidden">
                                    {['FR', 'EN', 'NL', 'DA'].map((l) => (
                                        <button
                                            key={l}
                                            onClick={() => setLang(l as 'FR' | 'EN' | 'NL' | 'DA')}
                                            className={`px-6 py-2.5 text-left text-[11px] font-bold tracking-wider hover:bg-gray-50 transition-colors uppercase ${lang === l ? 'text-luna-charcoal' : 'text-gray-400'}`}
                                        >
                                            {l === 'FR' ? 'Français' : l === 'EN' ? 'English' : l === 'NL' ? 'Nederlands' : 'Dansk'}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <a href="/client" className="relative px-6 py-3 rounded-full bg-luna-charcoal text-white hover:bg-black transition-all flex items-center gap-2 shadow-lg hover:shadow-xl hover:-translate-y-0.5 ml-4">
                            {cartCount > 0 && (
                                <span className="flex items-center gap-1.5">
                                    <ShoppingBag size={14} />
                                    <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[#b9dae9] text-[#2E2E2E] text-[10px] font-black rounded-full flex items-center justify-center shadow-md animate-bounce">
                                        {cartCount}
                                    </span>
                                </span>
                            )}
                            {ctaText}
                        </a>
                    </div>
                </div>
            </nav>

            <main className="min-h-screen">
                {children}
            </main>

            <footer className="border-t border-gray-100 bg-[#f9fafb] pt-20 pb-8 px-6 md:px-16 shrink-0 relative overflow-hidden text-luna-charcoal font-sans">
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-bl from-[#b9dae9]/20/50 to-transparent rounded-full blur-[120px] pointer-events-none" />
                <div className="max-w-[1600px] mx-auto relative z-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-8 xl:gap-16 mb-20">
                        {/* 1. BRAND & SOCIALS */}
                        <div className="lg:col-span-1 flex flex-col items-start">
                            <img src={logo} alt="Luna Travel" className="h-10 object-contain brightness-0 mb-8" />
                            <p className="text-[14px] font-serif italic text-luna-charcoal/60 leading-relaxed max-w-sm mb-8">
                                {footerDesc}
                            </p>
                            <div className="flex flex-wrap gap-3">
                                {(siteConfig?.business?.linkedin) && (
                                    <a href={siteConfig.business.linkedin} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-luna-charcoal hover:bg-luna-charcoal hover:border-luna-charcoal hover:text-white transition-all shadow-sm">
                                        <span className="text-[10px] font-bold tracking-widest">IN</span>
                                    </a>
                                )}
                                {(siteConfig?.business?.instagram) && (
                                    <a href={siteConfig.business.instagram} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-luna-charcoal hover:bg-luna-charcoal hover:border-luna-charcoal hover:text-white transition-all shadow-sm">
                                        <span className="text-[10px] font-bold tracking-widest">IG</span>
                                    </a>
                                )}
                                {(siteConfig?.business?.facebook) && (
                                    <a href={siteConfig.business.facebook} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-luna-charcoal hover:bg-luna-charcoal hover:border-luna-charcoal hover:text-white transition-all shadow-sm">
                                        <span className="text-[10px] font-bold tracking-widest">FB</span>
                                    </a>
                                )}
                                {(siteConfig?.business?.tiktok) && (
                                    <a href={siteConfig.business.tiktok} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-luna-charcoal hover:bg-luna-charcoal hover:border-luna-charcoal hover:text-white transition-all shadow-sm">
                                        <span className="text-[10px] font-bold tracking-widest">TK</span>
                                    </a>
                                )}
                            </div>
                        </div>

                        {/* 2. COLONNE 1 (Voyages) */}
                        <div className="lg:col-span-1">
                            <h4 className="font-bold text-[11px] uppercase tracking-[0.3em] mb-8 text-gray-400">
                                {siteConfig?.footer?.col1Title || t('footer.col1')}
                            </h4>
                            <ul className="space-y-5 text-[14px] font-light text-luna-charcoal/80">
                                {(siteConfig?.footer?.col1Links || [
                                    { label: t('footer.private_col'), href: '#destinations' },
                                    { label: 'Offres du moment', href: '#catalog' },
                                ]).map((link: any, idx: number) => (
                                    <li key={idx}><a href={link.href} className="hover:text-[#b9dae9] hover:translate-x-1 inline-block transition-transform duration-300">{link.label}</a></li>
                                ))}
                            </ul>
                        </div>

                        {/* 3. COLONNE 2 (Services) */}
                        <div className="lg:col-span-1">
                            <h4 className="font-bold text-[11px] uppercase tracking-[0.3em] mb-8 text-gray-400">
                                {siteConfig?.footer?.col2Title || t('footer.col2')}
                            </h4>
                            <ul className="space-y-5 text-[14px] font-light text-luna-charcoal/80">
                                {(siteConfig?.footer?.col2Links || [
                                    { label: t('footer.services_link'), href: '#services' },
                                    { label: t('footer.signature_trips'), href: '#catalog' },
                                    { label: t('footer.tailor_made'), href: '#tailor-made' },
                                    { label: t('footer.client_area'), href: '/client' },
                                ]).map((link: any, idx: number) => (
                                    <li key={idx}><a href={link.href} className="hover:text-[#b9dae9] hover:translate-x-1 inline-block transition-transform duration-300">{link.label}</a></li>
                                ))}
                            </ul>
                        </div>

                        {/* 4. COLONNE 3 (À Propos) */}
                        <div className="lg:col-span-1">
                            <h4 className="font-bold text-[11px] uppercase tracking-[0.3em] mb-8 text-gray-400">
                                {siteConfig?.footer?.col3Title || t('footer.col3')}
                            </h4>
                            <ul className="space-y-5 text-[14px] font-light text-luna-charcoal/80">
                                {(siteConfig?.footer?.col3Links || [
                                    { label: t('footer.our_story'), href: '#histoire' },
                                    { label: t('footer.testimonials'), href: '#temoignages' },
                                    { label: 'Devenir Partenaire', href: 'mailto:' + (siteConfig?.business?.email || '') },
                                ]).map((link: any, idx: number) => (
                                    <li key={idx}><a href={link.href} className="hover:text-[#b9dae9] hover:translate-x-1 inline-block transition-transform duration-300">{link.label}</a></li>
                                ))}
                            </ul>
                        </div>

                        {/* 5. CONTACT */}
                        <div className="lg:col-span-1">
                            <h4 className="font-bold text-[11px] uppercase tracking-[0.3em] mb-8 text-gray-400">
                                {siteConfig?.footer?.colContactTitle || 'Contact'}
                            </h4>
                            <ul className="space-y-5 text-[14px] font-light text-luna-charcoal/80">
                                <li>{siteConfig?.business?.address || 'Paris, France'}</li>
                                <li>
                                    <a href={`mailto:${siteConfig?.business?.email || 'lunaconciergerie@gmail.com'}`} className="hover:text-[#b9dae9] transition-colors block break-all">
                                        {siteConfig?.business?.email || 'lunaconciergerie@gmail.com'}
                                    </a>
                                </li>
                                <li>
                                    <a href={`tel:${(siteConfig?.business?.phone || '+33100000000').replace(/\s/g, '')}`} className="hover:text-[#b9dae9] transition-colors block">
                                        {siteConfig?.business?.phone || '+33 (0) 1 00 00 00 00'}
                                    </a>
                                </li>
                                {siteConfig?.business?.whatsapp && (
                                    <li>
                                        <a href={`https://wa.me/${siteConfig.business.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="hover:text-[#b9dae9] transition-colors block">
                                            WhatsApp
                                        </a>
                                    </li>
                                )}
                            </ul>
                        </div>
                    </div>

                    {/* BARRE LÉGALE */}
                    <div className="pt-8 border-t border-gray-200/60 flex flex-col lg:flex-row items-center justify-between gap-6 text-[10px] uppercase tracking-[0.2em] text-gray-400 font-bold">
                        <div>{footerCopyright}</div>
                        <div className="flex flex-wrap justify-center gap-x-8 gap-y-4">
                            <a href="/cgv" className="hover:text-[#b9dae9] transition-colors">{t('footer.cgv')}</a>
                            <a href="/mentions-legales" className="hover:text-[#b9dae9] transition-colors">{t('footer.legal')}</a>
                            <a href="/confidentialite" className="hover:text-[#b9dae9] transition-colors">{t('footer.privacy')}</a>
                            <a href="/cookies" className="hover:text-[#b9dae9] transition-colors">{t('footer.cookies')}</a>
                        </div>
                    </div>
                </div>
            </footer>
        </>
    );
}
