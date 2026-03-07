import type { Metadata } from "next";
import "./globals.css";
import { LayoutContent } from "./components/LayoutContent";
import { AuthProvider } from "@/src/contexts/AuthContext";
import { AuthGuard } from "@/src/components/AuthGuard";
import { SubscriptionGuard } from "@/src/components/SubscriptionGuard";

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
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@200;300;400;500;600&family=Quicksand:wght@300;400;500;600&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased font-sans font-normal relative w-screen min-h-screen overflow-x-hidden">
        <AuthProvider>
          <AuthGuard>
            <SubscriptionGuard>
              <LayoutContent>
                {children}
              </LayoutContent>
            </SubscriptionGuard>
          </AuthGuard>
        </AuthProvider>
      </body>
    </html>
  );
}

