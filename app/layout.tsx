import type { Metadata } from "next";
import "./globals.css";
import { Compass, Bell, ChevronDown } from "lucide-react";
import Link from "next/link";

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
      <body className="antialiased font-sans relative w-screen h-screen">

        {/* Ultra-minimal floating nav */}
        <header className="absolute top-6 left-6 right-6 z-50 flex items-center justify-between pointer-events-none">

          <div className="glass-pill px-6 py-3 flex items-center justify-between w-full pointer-events-auto shadow-luxury">

            {/* Left: Logo */}
            <div className="flex items-center gap-10">
              <Link href="/" className="flex items-center gap-3 group">
                <div className="w-10 h-10 rounded-full bg-luna-charcoal flex-center">
                  <Compass className="w-5 h-5 text-luna-accent" strokeWidth={1.5} />
                </div>
                <div className="flex flex-col">
                  <span className="font-serif text-2xl font-semibold tracking-tight text-luna-charcoal leading-none">Luna</span>
                  <span className="text-[10px] uppercase tracking-[0.2em] text-luna-text-muted font-medium">Concierge Voyage</span>
                </div>
              </Link>

              {/* Nav Links */}
              <nav className="hidden lg:flex items-center gap-1">
                <Link href="/" className="text-luna-charcoal px-4 py-2 text-sm font-medium rounded-full bg-luna-charcoal/5">Voyages</Link>
                <Link href="/crm" className="text-luna-text-muted hover:text-luna-charcoal px-4 py-2 text-sm font-medium rounded-full transition-colors">Clients</Link>
                <Link href="/crm/pipeline" className="text-luna-text-muted hover:text-luna-charcoal px-4 py-2 text-sm font-medium rounded-full transition-colors">Pipeline</Link>
                <Link href="/crm/activities" className="text-luna-text-muted hover:text-luna-charcoal px-4 py-2 text-sm font-medium rounded-full transition-colors">Activités</Link>
              </nav>
            </div>

            {/* Right: Profile */}
            <div className="flex items-center gap-5">
              <div className="relative cursor-pointer">
                <Bell className="w-5 h-5 text-luna-text-muted hover:text-luna-charcoal transition-colors" strokeWidth={1.5} />
                <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-luna-accent rounded-full"></div>
              </div>

              <div className="flex items-center gap-3 cursor-pointer pl-5 border-l border-luna-warm-gray/30">
                <img src="https://i.pravatar.cc/150?u=a042581f4e29026704d" alt="Profile" className="w-9 h-9 rounded-full shadow-sm ring-2 ring-white" />
                <div className="flex flex-col items-start hidden sm:flex">
                  <span className="text-sm font-semibold text-luna-charcoal leading-tight">Eleanor Vance</span>
                  <span className="text-[10px] text-luna-text-muted uppercase tracking-wider leading-tight">Directrice</span>
                </div>
                <ChevronDown className="w-4 h-4 text-luna-text-muted ml-1" />
              </div>
            </div>

          </div>
        </header>

        <main className="w-full h-full">
          {children}
        </main>
      </body>
    </html>
  );
}
