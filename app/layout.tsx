import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";
import { LunaLogo } from "./components/LunaLogo";

export const metadata: Metadata = {
  title: "Luna | Concierge Voyage",
  description: "Votre concierge voyage premium propulsé par l'intelligence artificielle",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased font-sans font-light relative w-screen h-screen">

        {/* Compact floating nav — left only */}
        <header className="absolute top-3 left-3 md:top-5 md:left-5 z-50 pointer-events-none">
          <div className="glass-pill px-3 py-1.5 md:px-4 md:py-2 flex items-center gap-3 md:gap-6 pointer-events-auto shadow-glass">
            <Link href="/" className="flex items-center gap-1.5 md:gap-2">
              <LunaLogo size={22} />
              <span className="font-serif text-sm md:text-lg font-semibold tracking-tight text-luna-charcoal leading-none">Luna</span>
            </Link>
            <nav className="flex items-center gap-1">
              <Link href="/" className="text-luna-charcoal px-2 py-0.5 md:px-2.5 md:py-1 text-[9px] md:text-[10px] font-semibold rounded-full bg-luna-charcoal/5 uppercase tracking-wider">Voyages</Link>
              <Link href="/crm" className="text-luna-text-muted hover:text-luna-charcoal px-2 py-0.5 md:px-2.5 md:py-1 text-[9px] md:text-[10px] font-semibold rounded-full transition-colors uppercase tracking-wider">CRM</Link>
            </nav>
          </div>
        </header>

        <main className="w-full h-full">
          {children}
        </main>
      </body>
    </html>
  );
}
