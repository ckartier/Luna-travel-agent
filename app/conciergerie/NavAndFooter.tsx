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

    // Nav labels from siteConfig.nav with fallbacks to translations
    const navItems = siteConfig?.nav?.menuItems || [];
    const navLabel1 = navItems[0]?.label || t('nav.destinations');
    const navHref1 = navItems[0]?.href || '#destinations';
    const navLabel2 = navItems[1]?.label || t('nav.services');
    const navHref2 = navItems[1]?.href || '#services';
    const navLabel3 = navItems[2]?.label || t('nav.contact');
    const navHref3 = navItems[2]?.href || '#tailor-made';
    const ctaText = siteConfig?.nav?.ctaText || t('nav.client_area');

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
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-16 mb-20">
                        <div className="md:col-span-1 flex flex-col items-start">
                            <img src={logo} alt="Luna Travel" className="h-10 object-contain brightness-0 mb-8" />
                            <p className="text-[15px] font-serif italic text-luna-charcoal/60 leading-relaxed max-w-sm">
                                {t('footer.desc')}
                            </p>
                            <div className="mt-8 flex gap-4">
                                <a href="#" className="w-12 h-12 rounded-full border border-gray-200 flex items-center justify-center text-luna-charcoal hover:bg-luna-charcoal hover:border-luna-charcoal hover:text-white transition-all shadow-sm">
                                    <span className="text-[12px] font-bold tracking-widest">IN</span>
                                </a>
                                <a href="#" className="w-12 h-12 rounded-full border border-gray-200 flex items-center justify-center text-luna-charcoal hover:bg-luna-charcoal hover:border-luna-charcoal hover:text-white transition-all shadow-sm">
                                    <span className="text-[12px] font-bold tracking-widest">IG</span>
                                </a>
                            </div>
                        </div>

                        <div className="md:col-span-1">
                            <h4 className="font-bold text-[11px] uppercase tracking-[0.3em] mb-10 text-gray-400">{t('footer.col1')}</h4>
                            <ul className="space-y-6 text-[15px] font-light text-luna-charcoal/80">
                                <li><a href="#destinations" className="hover:text-[#b9dae9] hover:translate-x-1 inline-block transition-transform duration-300">{t('footer.private_col')}</a></li>
                                <li><a href="#services" className="hover:text-[#b9dae9] hover:translate-x-1 inline-block transition-transform duration-300">{t('footer.services_link')}</a></li>
                                <li><a href="#tailor-made" className="hover:text-[#b9dae9] hover:translate-x-1 inline-block transition-transform duration-300">{t('footer.tailor_made')}</a></li>
                                <li><a href="/client" className="hover:text-[#b9dae9] hover:translate-x-1 inline-block transition-transform duration-300">{t('footer.client_area')}</a></li>
                            </ul>
                        </div>

                        <div className="md:col-span-1">
                            <h4 className="font-bold text-[11px] uppercase tracking-[0.3em] mb-10 text-gray-400">{t('footer.col2')}</h4>
                            <ul className="space-y-6 text-[15px] font-light text-luna-charcoal/80">
                                <li><a href="#histoire" className="hover:text-[#b9dae9] hover:translate-x-1 inline-block transition-transform duration-300">{t('footer.our_story')}</a></li>
                                <li><a href="#" className="hover:text-[#b9dae9] hover:translate-x-1 inline-block transition-transform duration-300">{t('footer.private_concierge')}</a></li>
                                <li><a href="#" className="hover:text-[#b9dae9] hover:translate-x-1 inline-block transition-transform duration-300">{t('footer.signature_trips')}</a></li>
                                <li><a href="#" className="hover:text-[#b9dae9] hover:translate-x-1 inline-block transition-transform duration-300">{t('footer.testimonials')}</a></li>
                            </ul>
                        </div>

                        <div className="md:col-span-1">
                            <h4 className="font-bold text-[11px] uppercase tracking-[0.3em] mb-10 text-gray-400">{t('footer.col3')}</h4>
                            <ul className="space-y-6 text-[15px] font-light text-luna-charcoal/80">
                                <li>Paris, France</li>
                                <li><a href="mailto:lunaconciergerie@gmail.com" className="hover:text-[#b9dae9] transition-colors">lunaconciergerie@gmail.com</a></li>
                                <li><a href="tel:+33100000000" className="hover:text-[#b9dae9] transition-colors">+33 (0) 1 00 00 00 00</a></li>
                            </ul>
                        </div>
                    </div>

                    <div className="pt-10 border-t border-gray-200/60 flex flex-col lg:flex-row items-center justify-between gap-8 text-[11px] uppercase tracking-[0.2em] text-gray-400 font-bold">
                        <div>{t('footer.rights')}</div>
                        <div className="flex flex-wrap justify-center gap-8">
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
