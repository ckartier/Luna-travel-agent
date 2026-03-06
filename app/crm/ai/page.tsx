'use client';

import { useState, useRef, useEffect } from 'react';
import { Bot, Send, Sparkles, User, Loader2, Plane, Hotel, Map } from 'lucide-react';
import { fetchWithAuth } from '@/src/lib/utils/fetchWithAuth';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
}

const INITIAL_SUGGESTIONS = [
    { icon: <Plane size={16} />, text: 'Propose un voyage à Bali 10 jours, 4000€' },
    { icon: <Hotel size={16} />, text: 'Trouve des hôtels 5 étoiles à Santorin' },
    { icon: <Map size={16} />, text: 'Génère un itinéraire Japon 2 semaines' },
];

export default function AIAssistantPage() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;
        const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            const res = await fetchWithAuth('/api/crm/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: input,
                    history: messages.map(m => ({ role: m.role, content: m.content })),
                }),
            });
            const data = await res.json();
            const aiMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: data.response || data.error || 'Erreur de réponse',
            };
            setMessages(prev => [...prev, aiMsg]);
        } catch (e) {
            setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', content: '❌ Erreur de connexion au service IA.' }]);
        }
        setIsLoading(false);
    };

    return (
        <div className="flex flex-col h-[calc(100vh-64px)] -m-6">
            {messages.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8">
                    <div className="mb-6">
                        <Sparkles className="text-gray-400" size={40} strokeWidth={1.5} />
                    </div>
                    <h1 className="text-2xl font-semibold text-luna-charcoal mb-2 text-center">Assistant IA Luna</h1>
                    <p className="text-gray-500 text-sm max-w-md text-center mb-8">
                        Décrivez le voyage de votre client en langage naturel. Je crée l'itinéraire, trouve les vols et les hôtels pour vous.
                    </p>
                    <div className="flex flex-wrap gap-3 justify-center max-w-lg">
                        {INITIAL_SUGGESTIONS.map((s, i) => (
                            <button key={i} onClick={() => setInput(s.text)}
                                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 font-medium hover:bg-gray-50 hover:border-luna-charcoal transition-colors shadow-[0_2px_20px_rgba(0,0,0,0.04)]">
                                {s.icon} {s.text}
                            </button>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/30">
                    {messages.map(msg => (
                        <div key={msg.id} className={`flex gap-4 max-w-3xl mx-auto ${msg.role === 'user' ? 'justify-end' : ''}`}>
                            {msg.role === 'assistant' && (
                                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1">
                                    <Bot size={20} strokeWidth={1.5} className="text-gray-400" />
                                </div>
                            )}
                            <div className={`p-4 rounded-2xl max-w-[85%] ${msg.role === 'user' ? 'bg-gray-100 text-gray-800 rounded-br-sm' : 'bg-white border border-gray-100 text-gray-800 rounded-bl-sm'}`}>
                                <p className="text-sm leading-relaxed whitespace-pre-line">{msg.content}</p>
                            </div>
                            {msg.role === 'user' && (
                                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1">
                                    <User size={20} strokeWidth={1.5} className="text-gray-400" />
                                </div>
                            )}
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex gap-4 max-w-3xl mx-auto">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1">
                                <Bot size={20} strokeWidth={1.5} className="text-gray-400" />
                            </div>
                            <div className="bg-white border border-gray-100 p-4 rounded-2xl rounded-bl-sm shadow-sm flex items-center gap-3">
                                <Loader2 size={16} className="animate-spin text-gray-400" />
                                <span className="text-sm text-gray-500 font-medium">Luna réfléchit...</span>
                            </div>
                        </div>
                    )}
                    <div ref={bottomRef} />
                </div>
            )}

            <div className="p-4 bg-white border-t border-gray-200">
                <div className="max-w-3xl mx-auto">
                    <div className="bg-gray-50 rounded-2xl border border-gray-200 p-2 flex items-end gap-2 focus-within:border-violet-400 focus-within:ring-2 focus-within:ring-violet-100 transition-all">
                        <textarea value={input} onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                            placeholder="Décrivez ce que vous recherchez pour votre client..."
                            className="flex-1 max-h-32 min-h-[44px] bg-transparent border-none resize-none focus:ring-0 text-sm py-3 px-2 text-luna-charcoal placeholder-gray-400" rows={1} />
                        <button onClick={handleSend} disabled={!input.trim() || isLoading}
                            className={`p-3 rounded-xl flex items-center justify-center transition-colors ${input.trim() && !isLoading ? 'bg-luna-charcoal text-white hover:bg-gray-800' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
                            <Send size={18} />
                        </button>
                    </div>
                    <p className="text-[11px] text-gray-400 text-center mt-2 font-medium">Luna AI utilise Gemini pour proposer des suggestions personnalisées.</p>
                </div>
            </div>
        </div>
    );
}
