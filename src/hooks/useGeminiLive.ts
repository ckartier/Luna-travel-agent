'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

/* ═══════════════════════════════════════════════════
   Types (same interface as legacy useVoiceAgent)
   ═══════════════════════════════════════════════════ */

export type VoiceState = 'idle' | 'connecting' | 'listening' | 'thinking' | 'speaking' | 'error';

export interface TranscriptEntry {
    id: string;
    role: 'user' | 'model';
    text: string;
    timestamp: number;
    action?: ActionResult;
}

export interface ActionResult {
    type: 'quote' | 'email' | 'client' | 'invoice' | 'note' | 'lead' | 'reminder' | 'dossier';
    label: string;
    id?: string;
    previewUrl?: string;
}

export type DeviceStatus = 'ok' | 'muted' | 'denied' | 'unavailable' | 'unknown';

export interface UseVoiceAgentReturn {
    state: VoiceState;
    transcript: TranscriptEntry[];
    start: () => Promise<void>;
    stop: () => void;
    sendText: (text: string) => void;
    isListening: boolean;
    isSpeaking: boolean;
    error: string | null;
    audioLevel: number;
    interimText: string;
    micStatus: DeviceStatus;
    audioOutputStatus: DeviceStatus;
}

export interface UseVoiceAgentOptions {
    pageContext?: string;
    vertical?: string;
}

/* ═══════════════════════════════════════════════════
   Constants
   ═══════════════════════════════════════════════════ */

const MODEL_NAME = 'gemini-2.5-flash-native-audio-preview-12-2025';
const WS_BASE = 'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent';
const SAMPLE_RATE = 16000;
const OUTPUT_SAMPLE_RATE = 24000;

/* ═══════════════════════════════════════════════════
   Tools (same as legacy — CRM function calling)
   ═══════════════════════════════════════════════════ */

const TRAVEL_TOOLS = [
    { name: 'get_upcoming_trips', description: 'Liste voyages à venir.', parameters: { type: 'object' as const, properties: {} } },
    { name: 'get_client_info', description: 'Chercher un client par nom/email.', parameters: { type: 'object' as const, properties: { query: { type: 'string', description: 'Nom ou email' } }, required: ['query'] } },
    { name: 'get_today_pipeline', description: 'Leads récents du pipeline.', parameters: { type: 'object' as const, properties: {} } },
    { name: 'get_tasks', description: 'Tâches en cours et à venir.', parameters: { type: 'object' as const, properties: {} } },
    { name: 'get_unpaid_invoices', description: 'Factures impayées.', parameters: { type: 'object' as const, properties: {} } },
    { name: 'get_reservations', description: 'Réservations actives (bookings).', parameters: { type: 'object' as const, properties: {} } },
    { name: 'get_payments_summary', description: 'Résumé paiements du mois.', parameters: { type: 'object' as const, properties: {} } },
    { name: 'search_crm', description: 'Recherche globale CRM.', parameters: { type: 'object' as const, properties: { query: { type: 'string' } }, required: ['query'] } },
    { name: 'search_catalog', description: 'Chercher dans le catalogue.', parameters: { type: 'object' as const, properties: { query: { type: 'string' } }, required: ['query'] } },
    { name: 'navigate_to', description: 'Naviguer vers une section CRM.', parameters: { type: 'object' as const, properties: { section: { type: 'string', enum: ['dashboard','clients','pipeline','voyages','planning','devis','factures','paiements','mails','taches','catalogue','fournisseurs','parametres'] } }, required: ['section'] } },
    { name: 'open_record', description: 'Ouvrir un dossier/client/devis par nom.', parameters: { type: 'object' as const, properties: { query: { type: 'string', description: 'Nom ou référence' } }, required: ['query'] } },
    { name: 'create_task', description: 'Créer tâche/rappel.', parameters: { type: 'object' as const, properties: { title: { type: 'string' }, dueDate: { type: 'string', description: 'YYYY-MM-DD' }, priority: { type: 'string', enum: ['low','medium','high','urgent'] } }, required: ['title'] } },
    { name: 'create_client_and_quote', description: 'Créer un client ET son devis.', parameters: { type: 'object' as const, properties: { firstName: { type: 'string' }, lastName: { type: 'string' }, email: { type: 'string' }, phone: { type: 'string' }, destination: { type: 'string' }, startDate: { type: 'string' }, endDate: { type: 'string' }, numberOfGuests: { type: 'number' }, budget: { type: 'number' }, notes: { type: 'string' } }, required: ['firstName', 'lastName', 'destination'] } },
    { name: 'create_client', description: 'Créer fiche client seule.', parameters: { type: 'object' as const, properties: { firstName: { type: 'string' }, lastName: { type: 'string' }, email: { type: 'string' }, phone: { type: 'string' } }, required: ['firstName','lastName'] } },
    { name: 'create_quote', description: 'Créer devis voyage.', parameters: { type: 'object' as const, properties: { clientName: { type: 'string' }, destination: { type: 'string' }, startDate: { type: 'string' }, endDate: { type: 'string' }, budget: { type: 'number' } }, required: ['clientName','destination'] } },
    { name: 'create_invoice', description: 'Créer facture.', parameters: { type: 'object' as const, properties: { clientName: { type: 'string' }, amount: { type: 'number' }, description: { type: 'string' } }, required: ['clientName','amount','description'] } },
    { name: 'create_trip', description: 'Créer un voyage.', parameters: { type: 'object' as const, properties: { clientName: { type: 'string' }, destination: { type: 'string' }, startDate: { type: 'string' }, endDate: { type: 'string' }, numberOfGuests: { type: 'number' } }, required: ['clientName', 'destination', 'startDate', 'endDate'] } },
    { name: 'create_lead', description: 'Créer un lead/prospect.', parameters: { type: 'object' as const, properties: { clientName: { type: 'string' }, destination: { type: 'string' }, notes: { type: 'string' } }, required: ['clientName', 'destination'] } },
    { name: 'mark_invoice_paid', description: 'Marquer facture comme payée.', parameters: { type: 'object' as const, properties: { clientName: { type: 'string' } }, required: ['clientName'] } },
    { name: 'complete_task', description: 'Marquer tâche comme terminée.', parameters: { type: 'object' as const, properties: { taskTitle: { type: 'string' } }, required: ['taskTitle'] } },
    { name: 'update_lead_stage', description: 'Changer stade pipeline.', parameters: { type: 'object' as const, properties: { clientName: { type: 'string' }, stage: { type: 'string', enum: ['lead','qualified','proposal','negotiation','won','lost'] } }, required: ['clientName','stage'] } },
    { name: 'send_whatsapp', description: 'Envoyer WhatsApp.', parameters: { type: 'object' as const, properties: { recipientName: { type: 'string' }, message: { type: 'string' } }, required: ['recipientName', 'message'] } },
    { name: 'add_note', description: 'Ajouter note sur client.', parameters: { type: 'object' as const, properties: { clientName: { type: 'string' }, note: { type: 'string' } }, required: ['clientName', 'note'] } },
    { name: 'morning_report', description: 'Rapport matinal.', parameters: { type: 'object' as const, properties: {} } },
    { name: 'kpi_dashboard', description: 'KPIs clés.', parameters: { type: 'object' as const, properties: {} } },
    { name: 'update_client', description: 'Modifier fiche client (email, téléphone, notes, VIP).', parameters: { type: 'object' as const, properties: { clientName: { type: 'string' }, email: { type: 'string' }, phone: { type: 'string' }, notes: { type: 'string' }, vipLevel: { type: 'string', enum: ['Standard', 'Silver', 'Gold', 'Platinum'] } }, required: ['clientName'] } },
    { name: 'delete_lead', description: 'Supprimer un lead du pipeline.', parameters: { type: 'object' as const, properties: { clientName: { type: 'string' } }, required: ['clientName'] } },
    { name: 'send_email', description: 'Envoyer un email à un client.', parameters: { type: 'object' as const, properties: { recipientName: { type: 'string' }, subject: { type: 'string' }, body: { type: 'string' } }, required: ['recipientName', 'body'] } },
    { name: 'schedule_meeting', description: 'Programmer un rendez-vous (visio ou physique).', parameters: { type: 'object' as const, properties: { title: { type: 'string' }, date: { type: 'string', description: 'YYYY-MM-DD' }, time: { type: 'string', description: 'HH:MM' }, clientName: { type: 'string' } }, required: ['title', 'date', 'time'] } },
];

/* ═══════════════════════════════════════════════════
   Route Map (navigate_to handler)
   ═══════════════════════════════════════════════════ */
const ROUTE_MAP: Record<string, string> = {
    dashboard: '/crm', accueil: '/crm', home: '/crm',
    pipeline: '/crm/pipeline', leads: '/crm/leads', prospects: '/crm/pipeline',
    clients: '/crm/clients', client: '/crm/clients', contacts: '/crm/contacts',
    voyages: '/crm/trips', voyage: '/crm/trips', trips: '/crm/trips',
    planning: '/crm/planning', calendrier: '/crm/planning',
    devis: '/crm/quotes', quotes: '/crm/quotes',
    factures: '/crm/invoices', invoices: '/crm/invoices',
    paiements: '/crm/payments', payments: '/crm/payments',
    mails: '/crm/mails', emails: '/crm/mails',
    messages: '/crm/messages', messagerie: '/crm/messages',
    taches: '/crm/tasks', tasks: '/crm/tasks',
    catalogue: '/crm/catalog', catalog: '/crm/catalog',
    fournisseurs: '/crm/suppliers', prestataires: '/crm/suppliers',
    parametres: '/crm/settings', settings: '/crm/settings',
};

function resolveRoute(section: string): string {
    const key = section.toLowerCase().trim().replace(/\s+/g, '-');
    if (ROUTE_MAP[key]) return ROUTE_MAP[key];
    for (const [k, v] of Object.entries(ROUTE_MAP)) {
        if (key.includes(k) || k.includes(key)) return v;
    }
    return `/crm/${key}`;
}

/* ═══════════════════════════════════════════════════
   Helper: Convert Float32 PCM to Int16 base64
   ═══════════════════════════════════════════════════ */
function float32ToBase64PCM(float32: Float32Array): string {
    const int16 = new Int16Array(float32.length);
    for (let i = 0; i < float32.length; i++) {
        const s = Math.max(-1, Math.min(1, float32[i]));
        int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    const bytes = new Uint8Array(int16.buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

/* ═══════════════════════════════════════════════════
   Helper: Decode base64 PCM to AudioBuffer & play
   ═══════════════════════════════════════════════════ */
function base64ToFloat32(base64: string): Float32Array {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    const int16 = new Int16Array(bytes.buffer);
    const float32 = new Float32Array(int16.length);
    for (let i = 0; i < int16.length; i++) {
        float32[i] = int16[i] / 0x8000;
    }
    return float32;
}

/* ═══════════════════════════════════════════════════
   Main Hook: useGeminiLive
   ═══════════════════════════════════════════════════ */

export function useGeminiLive(options?: UseVoiceAgentOptions): UseVoiceAgentReturn {
    const { user } = useAuth();
    const vertical = options?.vertical || 'travel';
    const pageContext = options?.pageContext || '';

    // ── State ──
    const [state, setState] = useState<VoiceState>('idle');
    const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [audioLevel, setAudioLevel] = useState(0);
    const [interimText, setInterimText] = useState('');
    const [micStatus, setMicStatus] = useState<DeviceStatus>('unknown');
    const [audioOutputStatus, setAudioOutputStatus] = useState<DeviceStatus>('ok');

    // ── Refs ──
    const wsRef = useRef<WebSocket | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const playbackContextRef = useRef<AudioContext | null>(null);
    const idCounterRef = useRef(0);
    const idTokenRef = useRef<string | null>(null);
    const audioQueueRef = useRef<Float32Array[]>([]);
    const isPlayingRef = useRef(false);

    // ── Build system prompt ──
    const firstName = user?.displayName?.split(' ')[0] || 'utilisateur';

    const baseRole = vertical === 'legal'
        ? "Tu es Luna, l'assistante vocale IA d'un cabinet d'avocats de prestige (Luna Legal). Tu parles à " + firstName + "."
        : "Tu es Luna, l'assistante vocale IA du CRM de voyage de luxe Luna Conciergerie. Tu parles à " + firstName + ".";

    const systemPrompt = `${baseRole}
Page actuelle: ${pageContext}.

RÈGLES STRICTES:
- Réponds en français, phrases COURTES (max 2 phrases).
- Agis directement avec les outils disponibles. Ne dis pas "je vais faire" — fais-le.
- Si une info critique manque → pose UNE question courte.
- Après chaque action, confirme brièvement.
- Sois chaleureux mais professionnel. Tutoie le user. ${vertical === 'legal' ? 'Utilise le vocabulaire juridique (dossiers, clients, facturation, audiences).' : 'Utilise le vocabulaire du voyage de luxe (voyages, devis, conciergerie VIP).'}

ROUTING VOCAL:
- "ouvre/affiche/montre" → open_record ou navigate_to.
- "envoie WhatsApp" → send_whatsapp.
- "programme un rendez-vous / call / réunion" → schedule_meeting.
- ${vertical === 'legal' ? '"crée un dossier"' : '"crée un voyage"'} → create_trip.
- "crée un client" → create_client.
- "crée un devis" → create_quote.
- "combien de CA" → kpi_dashboard.
- "cherche" → search_crm.
- "rapport du matin" → morning_report.`;

    // ── Fetch CRM data (tool execution) ──
    const fetchVoiceData = useCallback(async (tool: string, args: Record<string, any>): Promise<{ text: string; action?: ActionResult }> => {
        try {
            // Handle navigate_to locally
            if (tool === 'navigate_to') {
                const section = args.section || 'dashboard';
                const path = resolveRoute(section);
                if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('voice-agent:navigate', { detail: { path } }));
                }
                return { text: `Navigation vers ${section}.` };
            }

            let idToken = idTokenRef.current;
            if (!idToken && user) {
                idToken = await user.getIdToken(true);
                idTokenRef.current = idToken;
            }
            if (!idToken) return { text: 'Non authentifié.' };

            const res = await fetch('/api/crm/voice-data', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${idToken}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ tool, args, vertical }),
            });

            if (!res.ok) return { text: `Erreur ${res.status}.` };
            const data = await res.json();
            if (data.error && !data.success) return { text: `Erreur : ${data.error}` };
            if (data.success && data.action) return { text: data.message || 'Action effectuée.', action: data.action as ActionResult };

            return { text: data.message || data.summary || 'Données récupérées.' };
        } catch {
            return { text: 'Erreur technique.' };
        }
    }, [vertical, user]);

    // ── Continuous audio playback via ScriptProcessorNode (gapless) ──
    const playbackBufferRef = useRef<Float32Array[]>([]);
    const playbackNodeRef = useRef<ScriptProcessorNode | null>(null);
    const playbackBufIndexRef = useRef(0);
    const playbackBufOffsetRef = useRef(0);

    const ensurePlaybackRunning = useCallback(() => {
        if (playbackNodeRef.current) return; // Already running
        
        const ctx = playbackContextRef.current || new AudioContext({ sampleRate: 24000 });
        playbackContextRef.current = ctx;

        // Resume context (browsers require user gesture)
        if (ctx.state === 'suspended') ctx.resume();

        const node = ctx.createScriptProcessor(2048, 1, 1);
        playbackNodeRef.current = node;

        node.onaudioprocess = (e) => {
            const output = e.outputBuffer.getChannelData(0);
            let outputIdx = 0;

            while (outputIdx < output.length) {
                const chunks = playbackBufferRef.current;
                if (playbackBufIndexRef.current >= chunks.length) {
                    // No more data — fill silence
                    output.fill(0, outputIdx);
                    break;
                }

                const chunk = chunks[playbackBufIndexRef.current];
                const remaining = chunk.length - playbackBufOffsetRef.current;
                const toCopy = Math.min(remaining, output.length - outputIdx);

                for (let i = 0; i < toCopy; i++) {
                    output[outputIdx + i] = chunk[playbackBufOffsetRef.current + i];
                }

                outputIdx += toCopy;
                playbackBufOffsetRef.current += toCopy;

                if (playbackBufOffsetRef.current >= chunk.length) {
                    playbackBufIndexRef.current++;
                    playbackBufOffsetRef.current = 0;
                }
            }

            // Calculate RMS for audio level visualization
            let sum = 0;
            for (let i = 0; i < output.length; i++) sum += output[i] * output[i];
            const rms = Math.sqrt(sum / output.length);
            setAudioLevel(Math.min(1, rms * 5));

            // Check if we've finished playing everything
            if (playbackBufIndexRef.current >= playbackBufferRef.current.length && isPlayingRef.current) {
                // Wait a bit for more chunks before transitioning
                setTimeout(() => {
                    if (playbackBufIndexRef.current >= playbackBufferRef.current.length) {
                        isPlayingRef.current = false;
                        setState('listening');
                        setAudioLevel(0);
                    }
                }, 300);
            }
        };

        node.connect(ctx.destination);
    }, []);

    const playAudioQueue = useCallback(() => {
        // Move chunks from queue to playback buffer
        while (audioQueueRef.current.length > 0) {
            playbackBufferRef.current.push(audioQueueRef.current.shift()!);
        }
        
        if (!isPlayingRef.current && playbackBufferRef.current.length > playbackBufIndexRef.current) {
            isPlayingRef.current = true;
            setState('speaking');
        }

        ensurePlaybackRunning();
    }, [ensurePlaybackRunning]);

    // ── Handle incoming WebSocket messages ──
    const processMessage = useCallback((response: any) => {
        try {

            // ── Audio response from model ──
            if (response.serverContent?.modelTurn?.parts) {
                for (const part of response.serverContent.modelTurn.parts) {
                    if (part.inlineData?.data) {
                        const float32 = base64ToFloat32(part.inlineData.data);
                        audioQueueRef.current.push(float32);
                        playAudioQueue();
                    }
                }
            }

            // ── Input transcription (what user said) ──
            if (response.serverContent?.inputTranscription?.text) {
                const userText = response.serverContent.inputTranscription.text.trim();
                if (userText) {
                    setInterimText('');
                    setTranscript(prev => {
                        // Update last user entry or create new
                        const last = prev[prev.length - 1];
                        if (last && last.role === 'user' && Date.now() - last.timestamp < 3000) {
                            return [...prev.slice(0, -1), { ...last, text: userText }];
                        }
                        return [...prev, {
                            id: `user-${++idCounterRef.current}`,
                            role: 'user',
                            text: userText,
                            timestamp: Date.now()
                        }];
                    });
                }
            }

            // ── Output transcription (what model said) ──
            if (response.serverContent?.outputTranscription?.text) {
                const modelText = response.serverContent.outputTranscription.text.trim();
                if (modelText) {
                    setTranscript(prev => {
                        const last = prev[prev.length - 1];
                        if (last && last.role === 'model' && Date.now() - last.timestamp < 5000) {
                            return [...prev.slice(0, -1), { ...last, text: last.text + modelText }];
                        }
                        return [...prev, {
                            id: `model-${++idCounterRef.current}`,
                            role: 'model',
                            text: modelText,
                            timestamp: Date.now()
                        }];
                    });
                }
            }

            // ── Turn complete ──
            if (response.serverContent?.turnComplete) {
                if (!isPlayingRef.current) {
                    setState('listening');
                }
            }

            // ── Tool calls ──
            if (response.toolCall?.functionCalls) {
                setState('thinking');
                handleToolCalls(response.toolCall.functionCalls);
            }

            // ── Setup complete ──
            if (response.setupComplete) {
                console.log('[GeminiLive] ✅ Session ready');
                setState('listening');
            }

        } catch (err) {
            console.error('[GeminiLive] Message process error:', err);
        }
    }, [playAudioQueue]);

    // ── WebSocket message handler — handles Blob or text data ──
    const handleWsMessage = useCallback(async (event: MessageEvent) => {
        try {
            let text: string;
            if (event.data instanceof Blob) {
                text = await event.data.text();
            } else {
                text = typeof event.data === 'string' ? event.data : String(event.data);
            }
            const response = JSON.parse(text);
            processMessage(response);
        } catch (err) {
            console.error('[GeminiLive] Message parse error:', err, 'data type:', typeof event.data);
        }
    }, [processMessage]);

    // ── Handle tool calls from Gemini ──
    const handleToolCalls = useCallback(async (functionCalls: any[]) => {
        const ws = wsRef.current;
        if (!ws || ws.readyState !== WebSocket.OPEN) return;

        const functionResponses = [];

        for (const fc of functionCalls) {
            console.log(`[GeminiLive] 🔧 Tool call: ${fc.name}`, fc.args);

            const result = await fetchVoiceData(fc.name, fc.args || {});

            // Add to transcript
            setTranscript(prev => [...prev, {
                id: `tool-${++idCounterRef.current}`,
                role: 'model',
                text: `⚡ ${fc.name}`,
                timestamp: Date.now(),
                action: result.action
            }]);

            functionResponses.push({
                name: fc.name,
                id: fc.id,
                response: { result: { text: result.text } }
            });
        }

        // Send tool responses back to Gemini
        ws.send(JSON.stringify({
            toolResponse: { functionResponses }
        }));

        console.log('[GeminiLive] ✅ Tool responses sent');
    }, [fetchVoiceData]);

    // ── Start mic capture and send PCM chunks ──
    const startMicCapture = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    sampleRate: SAMPLE_RATE,
                    channelCount: 1,
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });
            mediaStreamRef.current = stream;
            setMicStatus('ok');

            const audioCtx = new AudioContext({ sampleRate: SAMPLE_RATE });
            audioContextRef.current = audioCtx;

            const source = audioCtx.createMediaStreamSource(stream);

            // Use ScriptProcessorNode for compatibility (AudioWorklet needs a separate file)
            const processor = audioCtx.createScriptProcessor(4096, 1, 1);
            processorRef.current = processor;

            processor.onaudioprocess = (e) => {
                const ws = wsRef.current;
                if (!ws || ws.readyState !== WebSocket.OPEN) return;

                const inputData = e.inputBuffer.getChannelData(0);

                // Calculate audio level for visualization
                const rms = Math.sqrt(inputData.reduce((sum, v) => sum + v * v, 0) / inputData.length);
                setAudioLevel(Math.min(1, rms * 8));

                // Send audio chunk to Gemini
                const base64Data = float32ToBase64PCM(inputData);
                ws.send(JSON.stringify({
                    realtimeInput: {
                        audio: {
                            data: base64Data,
                            mimeType: `audio/pcm;rate=${SAMPLE_RATE}`
                        }
                    }
                }));
            };

            source.connect(processor);
            processor.connect(audioCtx.destination);

        } catch (err: any) {
            console.error('[GeminiLive] Mic error:', err);
            if (err.name === 'NotAllowedError') setMicStatus('denied');
            else if (err.name === 'NotFoundError') setMicStatus('unavailable');
            else setMicStatus('unknown');
            throw err;
        }
    }, []);

    // ── Stop mic capture ──
    const stopMicCapture = useCallback(() => {
        if (processorRef.current) {
            processorRef.current.disconnect();
            processorRef.current = null;
        }
        if (audioContextRef.current) {
            audioContextRef.current.close().catch(() => {});
            audioContextRef.current = null;
        }
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(t => t.stop());
            mediaStreamRef.current = null;
        }
    }, []);

    // ── START: Connect WebSocket + start mic ──
    const start = useCallback(async () => {
        if (wsRef.current) return; // Already connected

        setState('connecting');
        setError(null);
        setTranscript([]);
        audioQueueRef.current = [];
        isPlayingRef.current = false;
        playbackBufferRef.current = [];
        playbackBufIndexRef.current = 0;
        playbackBufOffsetRef.current = 0;

        try {
            // 1. Get API key from ephemeral token endpoint
            let idToken = idTokenRef.current;
            if (!idToken && user) {
                idToken = await user.getIdToken(true);
                idTokenRef.current = idToken;
            }
            if (!idToken) throw new Error('Non authentifié');

            const tokenRes = await fetch('/api/crm/ephemeral-token', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${idToken}` },
            });
            if (!tokenRes.ok) throw new Error('Failed to get token');
            const { apiKey } = await tokenRes.json();

            // 2. Open WebSocket to Gemini Live
            const wsUrl = `${WS_BASE}?key=${apiKey}`;
            const ws = new WebSocket(wsUrl);
            wsRef.current = ws;

            // 3. Wait for WebSocket to open, then send config
            await new Promise<void>((resolve, reject) => {
                const timeout = setTimeout(() => reject(new Error('Connection timeout')), 15000);

                ws.onopen = () => {
                    console.log('[GeminiLive] WebSocket connected');
                    clearTimeout(timeout);

                    // Send configuration
                    const configMessage = {
                        setup: {
                            model: `models/${MODEL_NAME}`,
                            generationConfig: {
                                responseModalities: ['AUDIO'],
                                speechConfig: {
                                    voiceConfig: {
                                        prebuiltVoiceConfig: {
                                            voiceName: 'Aoede'
                                        }
                                    }
                                }
                            },
                            systemInstruction: {
                                parts: [{ text: systemPrompt }]
                            },
                            inputAudioTranscription: {},
                            outputAudioTranscription: {},
                            tools: [{
                                functionDeclarations: TRAVEL_TOOLS.map(t => ({
                                    name: t.name,
                                    description: t.description,
                                    parameters: t.parameters
                                }))
                            }]
                        }
                    };

                    ws.send(JSON.stringify(configMessage));
                    console.log('[GeminiLive] Config sent with model:', MODEL_NAME);
                    resolve();
                };

                ws.onerror = (err) => {
                    clearTimeout(timeout);
                    console.error('[GeminiLive] WebSocket error:', err);
                    reject(new Error('WebSocket connection failed'));
                };
            });

            // Set up persistent handlers (after open)
            ws.onmessage = handleWsMessage;

            ws.onerror = (err) => {
                console.error('[GeminiLive] WebSocket error:', err);
                setError('Erreur de connexion WebSocket');
                setState('error');
            };

            ws.onclose = (event) => {
                console.log('[GeminiLive] WebSocket closed:', event.code, event.reason);
                wsRef.current = null;
                stopMicCapture();
                setState('idle');
            };

            // 4. Start mic capture
            await startMicCapture();

        } catch (err: any) {
            console.error('[GeminiLive] Start error:', err);
            setError(err.message || 'Erreur de démarrage');
            setState('error');
            // Cleanup
            if (wsRef.current) {
                wsRef.current.close();
                wsRef.current = null;
            }
            stopMicCapture();
        }
    }, [user, systemPrompt, handleWsMessage, startMicCapture, stopMicCapture]);

    // ── STOP: Close WebSocket + stop mic ──
    const stop = useCallback(() => {
        stopMicCapture();

        // Stop any playing audio
        audioQueueRef.current = [];
        isPlayingRef.current = false;
        playbackBufferRef.current = [];
        playbackBufIndexRef.current = 0;
        playbackBufOffsetRef.current = 0;
        if (playbackNodeRef.current) {
            playbackNodeRef.current.disconnect();
            playbackNodeRef.current = null;
        }
        if (playbackContextRef.current) {
            playbackContextRef.current.close().catch(() => {});
            playbackContextRef.current = null;
        }

        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }

        setAudioLevel(0);
        setInterimText('');
        setState('idle');
        idTokenRef.current = null;
    }, [stopMicCapture]);

    // ── Send text message into the live session ──
    const sendText = useCallback((text: string) => {
        const ws = wsRef.current;
        if (!ws || ws.readyState !== WebSocket.OPEN || !text.trim()) return;

        // Add to transcript
        setTranscript(prev => [...prev, {
            id: `user-${++idCounterRef.current}`,
            role: 'user',
            text: text.trim(),
            timestamp: Date.now()
        }]);

        // Send as text input
        ws.send(JSON.stringify({
            clientContent: {
                turns: [{ role: 'user', parts: [{ text: text.trim() }] }],
                turnComplete: true
            }
        }));
    }, []);

    // ── Cleanup on unmount ──
    useEffect(() => {
        return () => {
            stopMicCapture();
            audioQueueRef.current = [];
            if (playbackContextRef.current) {
                playbackContextRef.current.close().catch(() => {});
            }
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, [stopMicCapture]);

    return {
        state,
        transcript,
        start,
        stop,
        sendText,
        isListening: state === 'listening',
        isSpeaking: state === 'speaking',
        error,
        audioLevel,
        interimText,
        micStatus,
        audioOutputStatus,
    };
}
