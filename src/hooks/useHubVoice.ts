'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

export type VoiceState = 'idle' | 'connecting' | 'listening' | 'thinking' | 'speaking' | 'error';

export function useHubVoice() {
    const [voiceState, setVoiceState] = useState<VoiceState>('idle');
    const [transcript, setTranscript] = useState<{ role: string; text: string }[]>([]);
    const [audioLevel, setAudioLevel] = useState(0);
    const wsRef = useRef<WebSocket | null>(null);
    const mediaRef = useRef<MediaStream | null>(null);
    const audioCtxRef = useRef<AudioContext | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const playbackCtxRef = useRef<AudioContext | null>(null);
    const playbackNodeRef = useRef<ScriptProcessorNode | null>(null);
    const playbackBufRef = useRef<Float32Array[]>([]);
    const pbIdxRef = useRef(0);
    const pbOffRef = useRef(0);
    const isPlayingRef = useRef(false);
    const SR = 16000;

    const f32ToB64 = (f: Float32Array): string => {
        const i16 = new Int16Array(f.length);
        for (let i = 0; i < f.length; i++) { const s = Math.max(-1, Math.min(1, f[i])); i16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF; }
        const b = new Uint8Array(i16.buffer); let r = ''; for (let i = 0; i < b.length; i++) r += String.fromCharCode(b[i]); return btoa(r);
    };
    const b64ToF32 = (b: string): Float32Array => {
        const d = atob(b); const u = new Uint8Array(d.length); for (let i = 0; i < d.length; i++) u[i] = d.charCodeAt(i);
        const i16 = new Int16Array(u.buffer); const f = new Float32Array(i16.length); for (let i = 0; i < i16.length; i++) f[i] = i16[i] / 0x8000; return f;
    };

    const ensurePlayback = useCallback(() => {
        if (playbackNodeRef.current) return;
        const ctx = playbackCtxRef.current || new AudioContext({ sampleRate: 24000 }); playbackCtxRef.current = ctx;
        if (ctx.state === 'suspended') ctx.resume();
        const nd = ctx.createScriptProcessor(2048, 1, 1); playbackNodeRef.current = nd;
        nd.onaudioprocess = (e) => {
            const o = e.outputBuffer.getChannelData(0); let oi = 0;
            while (oi < o.length) { if (pbIdxRef.current >= playbackBufRef.current.length) { o.fill(0, oi); break; }
                const c = playbackBufRef.current[pbIdxRef.current]; const rem = c.length - pbOffRef.current; const cp = Math.min(rem, o.length - oi);
                for (let i = 0; i < cp; i++) o[oi + i] = c[pbOffRef.current + i]; oi += cp; pbOffRef.current += cp;
                if (pbOffRef.current >= c.length) { pbIdxRef.current++; pbOffRef.current = 0; }
            }
            let s = 0; for (let i = 0; i < o.length; i++) s += o[i] * o[i]; setAudioLevel(Math.min(1, Math.sqrt(s / o.length) * 5));
            if (pbIdxRef.current >= playbackBufRef.current.length && isPlayingRef.current)
                setTimeout(() => { if (pbIdxRef.current >= playbackBufRef.current.length) { isPlayingRef.current = false; setVoiceState('listening'); setAudioLevel(0); } }, 300);
        };
        nd.connect(ctx.destination);
    }, []);

    const start = useCallback(async () => {
        if (wsRef.current) return;
        setVoiceState('connecting'); setTranscript([]); playbackBufRef.current = []; pbIdxRef.current = 0; pbOffRef.current = 0; isPlayingRef.current = false;
        try {
            const tkRes = await fetch('/api/crm/ephemeral-token', { method: 'POST' });
            if (!tkRes.ok) throw new Error('Token failed');
            const { apiKey } = await tkRes.json();
            const ws = new WebSocket(`wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${apiKey}`);
            wsRef.current = ws;
            await new Promise<void>((res, rej) => {
                const to = setTimeout(() => rej(new Error('Timeout')), 15000);
                ws.onopen = () => { clearTimeout(to);
                    ws.send(JSON.stringify({
                        setup: { model: 'models/gemini-2.5-flash-native-audio-preview-12-2025',
                            generationConfig: { responseModalities: ['AUDIO'], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Aoede' } } } },
                            systemInstruction: { parts: [{ text: `Tu es l'assistant vocal du Hub de Contrôle Datarnivore. Tu supervises 2 CRM SaaS: Luna Travel (voyage de luxe) et Le Droit Agent (avocats). Réponds en français, phrases COURTES. Tutoie l'utilisateur. Tu peux expliquer l'état de santé des CRM, les bugs, proposer des actions. Tu peux aussi aider avec le site builder. Sois proactif et professionnel.` }] },
                            inputAudioTranscription: {}, outputAudioTranscription: {},
                        }
                    })); res();
                };
                ws.onerror = () => { clearTimeout(to); rej(new Error('WS error')); };
            });
            ws.onmessage = async (ev) => {
                let txt: string; if (ev.data instanceof Blob) txt = await ev.data.text(); else txt = typeof ev.data === 'string' ? ev.data : String(ev.data);
                const r = JSON.parse(txt);
                if (r.serverContent?.modelTurn?.parts) for (const p of r.serverContent.modelTurn.parts) if (p.inlineData?.data) { playbackBufRef.current.push(b64ToF32(p.inlineData.data)); if (!isPlayingRef.current) { isPlayingRef.current = true; setVoiceState('speaking'); } ensurePlayback(); }
                if (r.serverContent?.inputTranscription?.text) { const t = r.serverContent.inputTranscription.text.trim(); if (t) setTranscript(p => { const l = p[p.length-1]; if (l?.role === 'user') return [...p.slice(0,-1), { role:'user', text: t }]; return [...p, { role:'user', text: t }]; }); }
                if (r.serverContent?.outputTranscription?.text) { const t = r.serverContent.outputTranscription.text.trim(); if (t) setTranscript(p => { const l = p[p.length-1]; if (l?.role === 'model') return [...p.slice(0,-1), { role:'model', text: l.text + t }]; return [...p, { role:'model', text: t }]; }); }
                if (r.serverContent?.turnComplete && !isPlayingRef.current) setVoiceState('listening');
                if (r.setupComplete) setVoiceState('listening');
            };
            ws.onerror = () => setVoiceState('error');
            ws.onclose = () => { wsRef.current = null; stopMic(); setVoiceState('idle'); };
            const stream = await navigator.mediaDevices.getUserMedia({ audio: { sampleRate: SR, channelCount: 1, echoCancellation: true, noiseSuppression: true } });
            mediaRef.current = stream; const actx = new AudioContext({ sampleRate: SR }); audioCtxRef.current = actx;
            const src = actx.createMediaStreamSource(stream); const proc = actx.createScriptProcessor(4096, 1, 1); processorRef.current = proc;
            proc.onaudioprocess = (e) => { const w = wsRef.current; if (!w || w.readyState !== WebSocket.OPEN) return; const inp = e.inputBuffer.getChannelData(0);
                setAudioLevel(Math.min(1, Math.sqrt(inp.reduce((s,v)=>s+v*v,0)/inp.length)*8));
                w.send(JSON.stringify({ realtimeInput: { audio: { data: f32ToB64(inp), mimeType: `audio/pcm;rate=${SR}` } } }));
            };
            src.connect(proc); proc.connect(actx.destination);
        } catch { setVoiceState('error'); if (wsRef.current) { wsRef.current.close(); wsRef.current = null; } stopMic(); }
    }, [ensurePlayback]);

    const stopMic = useCallback(() => {
        processorRef.current?.disconnect(); processorRef.current = null;
        audioCtxRef.current?.close().catch(()=>{}); audioCtxRef.current = null;
        mediaRef.current?.getTracks().forEach(t=>t.stop()); mediaRef.current = null;
    }, []);

    const stop = useCallback(() => {
        stopMic(); playbackBufRef.current = []; pbIdxRef.current = 0; pbOffRef.current = 0; isPlayingRef.current = false;
        if (playbackNodeRef.current) { playbackNodeRef.current.disconnect(); playbackNodeRef.current = null; }
        if (playbackCtxRef.current) { playbackCtxRef.current.close().catch(()=>{}); playbackCtxRef.current = null; }
        if (wsRef.current) { wsRef.current.close(); wsRef.current = null; }
        setAudioLevel(0); setVoiceState('idle');
    }, [stopMic]);

    return { voiceState, transcript, audioLevel, start, stop };
}
