import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import { LayoutContent } from "@/app/components/LayoutContent";
import { AuthProvider } from "@/src/contexts/AuthContext";
import { AuthGuard } from "@/src/components/AuthGuard";
import { SubscriptionGuard } from "@/src/components/SubscriptionGuard";
import { VerticalProvider } from "@/src/contexts/VerticalContext";

export const metadata: Metadata = {
  title: "Luna | Concierge Voyage",
  description: "Votre concierge voyage premium propulsé par l'intelligence artificielle",
};

import { CartProvider } from "@/src/contexts/CartContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@200;300;400;500;600&family=Quicksand:wght@300;400;500;600&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased font-sans font-normal relative w-screen min-h-screen overflow-x-hidden" suppressHydrationWarning>
        <CartProvider>
          <AuthProvider>
            <Suspense fallback={null}>
              <VerticalProvider>
                <AuthGuard>
                  <SubscriptionGuard>
                    <LayoutContent>
                      {children}
                    </LayoutContent>
                  </SubscriptionGuard>
                </AuthGuard>
              </VerticalProvider>
            </Suspense>
          </AuthProvider>
        </CartProvider>
      </body>
    </html>
  );
}

