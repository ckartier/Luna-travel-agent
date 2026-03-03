import type { Metadata } from "next";
import "./globals.css";
import { Moon, Plane, Bell, Search, ChevronDown } from "lucide-react";

export const metadata: Metadata = {
  title: "Luna | Travel B2B Dashboard",
  description: "AI-powered CRM for Travel Agencies",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased font-sans relative w-screen h-screen">

        {/* Top Floating Action Bar */}
        <header className="absolute top-6 left-6 right-6 z-50 flex items-start justify-between pointer-events-none">

          {/* Main Top Bar (Spans full width minus margins) */}
          <div className="glass-pill px-6 py-3 flex items-center justify-between w-full pointer-events-auto">

            <div className="flex items-center gap-12">
              {/* Logo */}
              <div className="flex items-center gap-3">
                <div className="relative w-10 h-10 flex-center">
                  <Moon className="absolute w-8 h-8 text-blue-900" strokeWidth={2} />
                  <Plane className="absolute w-5 h-5 text-blue-900 -mr-2 -mt-1 transform rotate-45" fill="currentColor" />
                </div>
                <div className="flex flex-col">
                  <span className="font-extrabold text-2xl tracking-tight text-gray-900 leading-none">Luna</span>
                  <span className="text-[11px] text-gray-500 font-medium">Luna Travel B2B Dashboard</span>
                </div>
              </div>

              {/* Nav Links */}
              <nav className="hidden lg:flex items-center gap-2 bg-gray-100/50 rounded-full p-1 border border-gray-200/50">
                <a href="#" className="bg-gray-200 text-gray-900 rounded-full px-5 py-2 text-sm font-semibold shadow-sm">Dashboard</a>
                <a href="#" className="text-gray-600 hover:text-gray-900 rounded-full px-5 py-2 text-sm font-medium transition-colors">Clients</a>
                <a href="#" className="text-gray-600 hover:text-gray-900 rounded-full px-5 py-2 text-sm font-medium transition-colors">Agents</a>
                <a href="#" className="text-gray-600 hover:text-gray-900 rounded-full px-5 py-2 text-sm font-medium transition-colors">Reports</a>
                <a href="#" className="text-gray-600 hover:text-gray-900 rounded-full px-5 py-2 text-sm font-medium transition-colors">Settings</a>
              </nav>
            </div>

            {/* Right Side: User Profile */}
            <div className="flex items-center gap-6">
              <div className="relative cursor-pointer">
                <Bell className="w-6 h-6 text-gray-600 hover:text-gray-900 transition-colors" />
                <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></div>
              </div>

              <div className="flex items-center gap-3 cursor-pointer pl-4 border-l border-gray-300">
                <img src="https://i.pravatar.cc/150?u=a042581f4e29026704d" alt="Profile" className="w-10 h-10 rounded-full shadow-sm" />
                <div className="flex flex-col items-start hidden sm:flex">
                  <span className="text-sm font-bold text-gray-900 leading-tight">Eleanor Vance</span>
                  <span className="text-xs text-gray-500 leading-tight">(Admin)</span>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-400 ml-2" />
              </div>
            </div>

          </div>
        </header>

        {/* Search Pill - Positioned below the right side of the header */}
        <div className="absolute top-28 right-6 z-50 pointer-events-auto">
          <div className="glass-pill px-5 py-3 flex items-center gap-3 w-72 shadow-lg">
            <Search className="w-5 h-5 text-gray-400" />
            <input type="text" placeholder="Search..." className="bg-transparent border-none outline-none text-sm w-full font-medium text-gray-800 placeholder-gray-400 focus:ring-0" />
          </div>
        </div>

        <main className="w-full h-full">
          {children}
        </main>
      </body>
    </html>
  );
}
