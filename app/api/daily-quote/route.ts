export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';

const quotes = [
    { quote: "Le monde est un livre dont chaque page est un voyage.", author: "Saint Augustin" },
    { quote: "Le voyage est la seule chose qu'on achète qui nous rend plus riche.", author: "Anonyme" },
    { quote: "Chaque voyage commence par un premier pas vers l'inconnu.", author: "Lao-Tseu" },
    { quote: "Rester, c'est exister. Mais voyager, c'est vivre.", author: "Gustave Nadaud" },
    { quote: "On ne fait pas un voyage. C'est le voyage qui nous fait.", author: "Nicolas Bouvier" },
    { quote: "L'impulsion du voyage est l'une des plus encourageantes de l'humanité.", author: "Agnes Repplier" },
    { quote: "Le véritable voyage de découverte ne consiste pas à chercher de nouveaux paysages, mais à avoir de nouveaux yeux.", author: "Marcel Proust" },
    { quote: "Voyager, c'est naître et mourir à chaque instant.", author: "Victor Hugo" },
    { quote: "Il n'y a d'homme plus complet que celui qui a beaucoup voyagé, qui a changé vingt fois la forme de sa pensée et de sa vie.", author: "Alphonse de Lamartine" },
    { quote: "Une fois que l'on a été piqué par la mouche du voyage, il n'y a pas d'antidote connu.", author: "Michael Palin" }
];

export async function GET() {
    // Force la non-mise en cache par Next.js (si besoin) pour avoir du vrai random
    const randomIndex = Math.floor(Math.random() * quotes.length);
    const selected = quotes[randomIndex];

    return NextResponse.json({
        date: new Date().toISOString().split('T')[0],
        quote: selected.quote,
        author: selected.author,
        _random: Math.random() // Ajout d'un paramètre aléatoire pour forcer l'uncache si le client vérifie l'égalité stricte
    }, {
        headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
        }
    });
}

