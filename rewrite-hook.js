const fs = require('fs');

const code = fs.readFileSync('src/hooks/useVoiceAgent.ts', 'utf8');

const hookStartIdx = code.indexOf('export function useVoiceAgent(options?: UseVoiceAgentOptions)');

if (hookStartIdx === -1) throw new Error("Could not find hook start");

const beforeHook = code.substring(0, hookStartIdx);

const newHook = `export function useVoiceAgent(options?: UseVoiceAgentOptions): UseVoiceAgentReturn {
    const { pageContext, vertical = 'travel' } = options || {};
    const { user, userProfile } = useAuth();
    const [state, setState] = useState<VoiceState>('idle');
    const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [audioLevel, setAudioLevel] = useState(0);
    const [micStatus, setMicStatus] = useState<DeviceStatus>('unknown');
    const [audioOutputStatus, setAudioOutputStatus] = useState<DeviceStatus>('unknown');

    const idTokenRef = useRef<string | null>(null);
    const recognitionRef = useRef<any>(null);
    const idCounterRef = useRef(0);
    const isPlayingRef = useRef(false);

    /* ─── Fetch real CRM data for a tool call ─── */
    const fetchVoiceData = useCallback(async (tool: string, args: Record<string, any>): Promise<{ text: string; action?: ActionResult }> => {
        try {
            let idToken = idTokenRef.current;
            if (!idToken && user) {
                idToken = await user.getIdToken(true);
                idTokenRef.current = idToken;
            }
            if (!idToken) return { text: 'Non authentifié — veuillez vous reconnecter.' };

            const res = await fetch('/api/crm/voice-data', {
                method: 'POST',
                headers: { 'Authorization': \`Bearer \${idToken}\`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ tool, args, vertical }),
            });

            if (!res.ok) {
                const errorBody = await res.json().catch(() => ({}));
                return { text: \`Erreur \${res.status} : \${errorBody.error || 'données indisponibles'}\` };
            }
            const data = await res.json();
            if (data.error && !data.success) return { text: \`Erreur : \${data.error}\` };

            // WRITE actions
            if (data.success && data.action) {
                return { text: data.message || \`Action effectuée avec succès.\`, action: data.action as ActionResult };
            }

            // READ actions
            if (tool === 'get_upcoming_trips') {
                if (!data.trips?.length) return { text: 'Aucun voyage à venir pour le moment.' };
                return { text: data.trips.map((t: any) => \`\${t.destination} — \${t.clientName}\`).join(' | ') };
            }
            if (tool === 'get_client_info') {
                if (!data.clients?.length) return { text: \`Aucun client trouvé.\` };
                return { text: data.clients.map((c: any) => \`\${c.name}\${c.email ? ' (' + c.email + ')' : ''}\`).join(' | ') };
            }
            if (tool === 'get_today_pipeline') {
                if (!data.leads?.length) return { text: 'Aucun lead actif récemment.' };
                return { text: data.leads.map((l: any) => \`\${l.clientName} (\${l.stage})\`).join(' | ') };
            }
            if (tool === 'get_recent_emails') {
                if (!data.emails?.length) return { text: 'Aucun email récent.' };
                return { text: data.emails.map((e: any) => \`De \${e.from} : "\${e.subject}"\`).join(' | ') };
            }
            if (tool === 'get_quote_details') {
                if (!data.quotes?.length) return { text: \`Aucun devis trouvé.\` };
                return { text: data.quotes.map((q: any) => \`\${q.clientName} — \${q.destination}\`).join(' | ') };
            }
            if (tool === 'get_dossiers') {
                if (!data.dossiers?.length) return { text: 'Aucun dossier actif.' };
                return { text: data.dossiers.map((d: any) => \`\${d.title} — \${d.client}\`).join(' | ') };
            }
            if (tool === 'get_upcoming_deadlines') {
                if (!data.deadlines?.length) return { text: 'Aucune échéance.' };
                return { text: data.deadlines.map((d: any) => \`\${d.title} — priorité \${d.priority}\`).join(' | ') };
            }
            if (tool === 'get_unpaid_invoices') {
                if (!data.invoices?.length) return { text: 'Aucune facture impayée.' };
                return { text: \`Total impayé : \${data.total}€.\` };
            }
            if (tool === 'search_crm') {
                return { text: data.summary || 'Aucun résultat.' };
            }
            return { text: JSON.stringify(data).substring(0, 300) };
        } catch (err) {
            return { text: 'Erreur lors de la récupération des données.' };
        }
    }, [vertical, user]);

    /* ─── TTS Playback ─── */
    const speakText = useCallback((text: string) => {
        if (typeof window === 'undefined') return;
        window.speechSynthesis.cancel(); // cancel any ongoing speech
        setState('speaking');
        isPlayingRef.current = true;
        
        // Remove markdown formatting for speech
        const cleanText = text.replace(/[#*_\`>]/g, '')
                              .replace(/\\n/g, ' ')
                              .replace(/⚡/g, '')
                              .trim();

        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.lang = 'fr-FR';
        utterance.rate = 1.05;
        
        const voices = window.speechSynthesis.getVoices();
        const premium = voices.find(v => v.lang.startsWith('fr') && (v.name.includes('Thomas') || v.name.includes('Aurelie') || v.name.includes('Premium') || v.name.includes('Google')));
        if (premium) utterance.voice = premium;

        utterance.onend = () => {
            isPlayingRef.current = false;
            setState('idle'); // Could return to listening here if desired
        };
        utterance.onerror = () => {
            isPlayingRef.current = false;
            setState('idle');
        };

        window.speechSynthesis.speak(utterance);
    }, []);

    /* ─── HTTP LLM Processing ─── */
    const handleUserMessage = useCallback(async (text: string) => {
        if (!text.trim()) return;
        setState('thinking');
        
        const userMsg: TranscriptEntry = { id: \`user-\${++idCounterRef.current}\`, role: 'user', text, timestamp: Date.now() };
        setTranscript(prev => [...prev, userMsg]);

        const fullName = userProfile?.displayName || user?.displayName || 'Utilisateur';
        const firstName = fullName.split(' ')[0];
        const isLegal = vertical === 'legal';
        const tools = isLegal ? LEGAL_TOOLS : TRAVEL_TOOLS;
        const systemPrompt = isLegal ? buildLegalPrompt(firstName, pageContext) : buildTravelPrompt(firstName, pageContext);

        try {
            let idToken = idTokenRef.current;
            if (!idToken && user) {
                idToken = await user.getIdToken();
                idTokenRef.current = idToken;
            }

            const tokenRes = await fetch('/api/crm/voice-token', {
                method: 'POST',
                headers: { 'Authorization': \`Bearer \${idToken}\`, 'Content-Type': 'application/json' },
            });
            const { apiKey } = await tokenRes.json();
            if (!apiKey) throw new Error("Clé API introuvable");

            const ai = new GoogleGenAI({ apiKey });
            
            // Build contents array taking last 10 messages for context
            let historyBase = transcript.slice(-10);
            const contents = [...historyBase, userMsg].map(t => ({
                role: t.role === 'model' ? 'model' : 'user',
                parts: [{ text: t.text }]
            }));

            // Force the updated 3.1 Pro model for incredible accuracy & tool calling
            const response = await ai.models.generateContent({
                model: 'gemini-3.1-pro-preview',
                contents,
                config: {
                    systemInstruction: { parts: [{ text: systemPrompt }] },
                    tools: [{ functionDeclarations: tools as any }],
                    temperature: 0.7,
                }
            });

            const toolCalls = response.functionCalls || [];
            let finalResponseText = response.text || '';

            // Handle functional tool calls
            if (toolCalls.length > 0) {
                const toolResponses = [];
                for (const tc of toolCalls) {
                    const localResult = handleLocalFunctionCall(tc.name, tc.args || {});
                    let resultText;
                    let action;
                    if (localResult !== null) {
                        resultText = localResult;
                    } else {
                        const fetched = await fetchVoiceData(tc.name, tc.args || {});
                        resultText = fetched.text;
                        action = fetched.action;
                    }
                    
                    setTranscript(prev => [...prev, {
                        id: \`tool-\${++idCounterRef.current}\`,
                        role: 'model',
                        text: \`⚡ \${resultText}\`,
                        timestamp: Date.now(),
                        action,
                    }]);
                    
                    if (action?.previewUrl && typeof window !== 'undefined') {
                        window.dispatchEvent(new CustomEvent('voice-agent:action-created', { detail: action }));
                    }
                    toolResponses.push({ id: tc.id, name: tc.name, response: { result: resultText } });
                }

                // Follow up response after tools
                const followUp = await ai.models.generateContent({
                    model: 'gemini-3.1-pro-preview',
                    contents: [
                        ...contents,
                        { role: 'model', parts: toolCalls.map(tc => ({ functionCall: tc })) as any },
                        { role: 'user', parts: toolResponses.map(tr => ({ functionResponse: tr })) as any }
                    ],
                    config: {
                        systemInstruction: { parts: [{ text: systemPrompt }] },
                        tools: [{ functionDeclarations: tools as any }],
                    }
                });
                
                if (followUp.text) finalResponseText = followUp.text;
            }

            if (finalResponseText) {
                setTranscript(prev => [...prev, {
                    id: \`model-\${++idCounterRef.current}\`,
                    role: 'model',
                    text: finalResponseText,
                    timestamp: Date.now()
                }]);
                speakText(finalResponseText);
            } else {
                setState('idle');
            }

        } catch (err: any) {
            console.error('[VoiceAgent] AI processing error:', err);
            setError("Erreur IA: " + (err.message || 'Service indisponible'));
            setState('error');
        }
    }, [transcript, user, userProfile, vertical, pageContext, fetchVoiceData, speakText]);

    /* ─── STT Native Browser Mic Control ─── */
    const start = useCallback(async () => {
        if (state !== 'idle' && state !== 'error') return;
        
        setError(null);
        setMicStatus('unknown');
        
        // Check native STT support
        const SpeechRecognitionApi = typeof window !== 'undefined' ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition : null;
        if (!SpeechRecognitionApi) {
            setError("Votre navigateur ne supporte pas la reconnaissance vocale native (essayez Chrome ou Safari).");
            setState('error');
            return;
        }

        try {
            setState('connecting');
            
            // Ensure mic permission triggers immediately
            await navigator.mediaDevices.getUserMedia({ audio: true });
            setMicStatus('ok');
            setAudioOutputStatus('ok'); // Built-in assume ok

            const recognition = new SpeechRecognitionApi();
            recognition.lang = 'fr-FR';
            recognition.interimResults = true;
            recognition.continuous = false; // We process sentence by sentence

            let currentInterim = '';

            recognition.onstart = () => {
                setState('listening');
            };

            recognition.onresult = (event: any) => {
                let finalSpeech = '';
                let interimSpeech = '';
                
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalSpeech += event.results[i][0].transcript;
                    } else {
                        interimSpeech += event.results[i][0].transcript;
                    }
                }
                
                if (interimSpeech) currentInterim = interimSpeech;
                
                // Animate audio level randomly when talking to mimic volume UI
                if (interimSpeech || finalSpeech) {
                    setAudioLevel(0.3 + Math.random() * 0.4);
                }

                if (finalSpeech) {
                    setAudioLevel(0);
                    recognition.stop();
                    handleUserMessage(finalSpeech);
                }
            };

            recognition.onerror = (event: any) => {
                console.error('[VoiceAgent STT Error]', event.error);
                if (event.error !== 'no-speech') {
                    setError("Erreur microphone: " + event.error);
                    setState('error');
                    setMicStatus('unavailable');
                } else {
                    setState('idle'); // just timed out on silence
                }
                setAudioLevel(0);
            };

            recognition.onend = () => {
                if (state === 'listening') {
                    // if it ended without final result, just set idle
                    setState('idle');
                    setAudioLevel(0);
                }
            };

            recognitionRef.current = recognition;
            recognition.start();

        } catch (err: any) {
            console.error('[VoiceAgent] Mic Auth error:', err);
            setError("Accès microphone refusé.");
            setState('error');
            setMicStatus('denied');
        }
    }, [state, handleUserMessage]);

    const stop = useCallback(() => {
        if (recognitionRef.current) {
            try { recognitionRef.current.stop(); } catch {}
            recognitionRef.current = null;
        }
        if (typeof window !== 'undefined') window.speechSynthesis.cancel();
        isPlayingRef.current = false;
        setAudioLevel(0);
        setState('idle');
    }, []);

    const sendText = useCallback((text: string) => {
        handleUserMessage(text);
    }, [handleUserMessage]);

    // Force stop everything on unmount
    useEffect(() => {
        return () => {
            if (recognitionRef.current) {
                try { recognitionRef.current.stop(); } catch {}
            }
            if (typeof window !== 'undefined') window.speechSynthesis.cancel();
        };
    }, []);

    return {
        state, transcript, start, stop, sendText,
        isListening: state === 'listening',
        isSpeaking: state === 'speaking',
        error, audioLevel, micStatus, audioOutputStatus,
    };
}
`;

fs.writeFileSync('src/hooks/useVoiceAgent.ts', beforeHook + newHook);
console.log("✅ Successfully rewrote useVoiceAgent hook");
