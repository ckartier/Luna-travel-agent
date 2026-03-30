'use client';

import Link from 'next/link';
import MonumWordmark from '@/src/components/branding/MonumWordmark';

export default function LandingMonumPage() {
  return (
    <div className="min-h-screen bg-[#f1f2f7] text-[#0f172a]">
      <header className="sticky top-0 z-40 border-b border-[#e6e8ef] bg-[#f1f2f7]/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-[1100px] items-center justify-between px-5 py-4">
          <Link href="/landing-monum" className="block w-[140px]">
            <MonumWordmark className="w-full" strokeWidth={2.5} />
          </Link>

          <nav className="hidden items-center gap-6 text-[12px] font-semibold text-[#5b6780] md:flex">
            <a href="#fonctionnalites" className="transition-colors hover:text-[#1f2a44]">Fonctionnalités</a>
            <a href="#tarifs" className="transition-colors hover:text-[#1f2a44]">Tarifs</a>
            <a href="#apropos" className="transition-colors hover:text-[#1f2a44]">À propos</a>
            <Link href="/login/monum" className="transition-colors hover:text-[#1f2a44]">Connexion</Link>
            <Link href="/signup/monum" className="rounded-xl bg-[#5b5ce2] px-4 py-2 text-[11px] font-extrabold uppercase tracking-[0.04em] text-white shadow-[0_8px_22px_rgba(91,92,226,0.35)] transition hover:bg-[#494ad0]">
              Essai gratuit
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-[1360px] grid-cols-1 items-center gap-10 px-5 pb-16 pt-10 md:min-h-[calc(100vh-81px)] md:grid-cols-[0.82fr_1.18fr] md:gap-12 md:pt-12">
        <section className="max-w-[580px] md:pb-10">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#d8dbf5] bg-[#eceeff] px-4 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#5b5ce2]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#5b5ce2]" />
            Intelligence Architecturale - France
          </div>

          <h1 className="text-[46px] font-black leading-[0.95] tracking-[-0.03em] text-[#121c39] md:text-[74px]">
            Bâtissez avec
            <br />
            <span className="bg-[linear-gradient(90deg,#5254e8,#8082f2,#5254e8)] bg-[length:200%_100%] bg-clip-text text-transparent">
              l&apos;intelligence
            </span>
            <br />
            territoriale
          </h1>

          <p className="mt-6 max-w-[520px] text-[18px] font-medium leading-relaxed text-[#6a768f]">
            Monum synchronise les permis de construire, les monuments historiques et l&apos;IA prédictive pour transformer chaque adresse en opportunité stratégique.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Link href="/crm/monum" className="inline-flex items-center gap-2 rounded-2xl bg-[#0f172a] px-7 py-4 text-[13px] font-bold uppercase tracking-[0.04em] text-white shadow-[0_16px_36px_rgba(15,23,42,0.25)] transition hover:bg-[#1f2a44]">
              Commencer l&apos;aventure
              <span aria-hidden>→</span>
            </Link>
            <Link href="/login/monum" className="inline-flex items-center gap-2 rounded-2xl border border-[#dde2ef] bg-white/80 px-7 py-4 text-[13px] font-bold text-[#3f4c67] transition hover:bg-white">
              Voir la démo
              <span aria-hidden>›</span>
            </Link>
          </div>
        </section>

        <section className="relative flex h-[460px] justify-center md:h-[760px] md:justify-end">
          <div className="relative h-full w-full overflow-hidden rounded-[34px] border border-[#dde2ef] bg-[#0f172a] shadow-[0_24px_60px_rgba(15,23,42,0.10)]">
            <video
              className="absolute inset-0 h-full w-full object-cover"
              autoPlay
              loop
              muted
              playsInline
              preload="auto"
              poster="/hero-poster.jpg"
            >
              <source src="/monum-city-pins-couleurs.mp4" type="video/mp4" />
            </video>

            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(91,92,226,0.12),_transparent_52%)]" />
            <div className="absolute inset-0 bg-gradient-to-tr from-[#0f172a]/72 via-[#0f172a]/18 to-white/8" />

            <div className="pointer-events-none absolute left-6 top-6 z-10 flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.16em] text-white/85 backdrop-blur-md">
              <span className="h-1.5 w-1.5 rounded-full bg-[#8082f2]" />
              Ville en mouvement
            </div>

            <div className="pointer-events-none absolute right-6 top-6 z-10 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.16em] text-white/85 backdrop-blur-md">
              Monum
            </div>

            <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-[#0f172a]/65 via-[#0f172a]/18 to-transparent px-6 pb-6 pt-24 md:px-8 md:pb-8">
              <p className="max-w-md text-[12px] font-semibold uppercase tracking-[0.18em] text-white/70">
                Permis de construire, monuments historiques et pins colorés
              </p>
            </div>
          </div>
        </section>
      </main>

      <section id="fonctionnalites" className="mx-auto w-full max-w-[1100px] px-5 pb-8">
        <div className="rounded-3xl border border-[#e4e8f2] bg-white/70 p-6 text-center text-[13px] font-semibold text-[#5f6b85]">
          Landing Paris Rénov Tracker (renommée Monum) activée.
        </div>
      </section>

      <section id="tarifs" className="hidden" />
      <section id="apropos" className="hidden" />
    </div>
  );
}
