import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

(async () => {
    try {
        let bytes = 0;
        const session = await ai.live.connect({
            model: 'gemini-2.5-flash-native-audio-latest',
            config: {
                responseModalities: ['AUDIO'],
                systemInstruction: { parts: [{ text: `Tu es l'Assistant Vocal de l'application Luna CRM. Tu parles en français avec un ton extrêmement professionnel, élégant, mais direct.
Si l'utilisateur est un cabinet d'avocats, donne-lui du "Maître".

Ton rôle :
- Aider l'utilisateur à naviguer dans le CRM, chercher des informations juridiques, et gérer ses dossiers.
- Créer des tâches ou des rappels.
- Analyser des requêtes complexes en droit ou en voyage selon le contexte.

Règles ABSOLUES d'interaction vocale :
1. DÉBIT ET LONGUEUR : Tes réponses vocales DOIVENT être courtes et fluides (2-3 phrases maximum). Jamais de longs monologues.
2. PROACTIVITÉ : Tu ne dois jamais laisser un blanc après avoir donné une information. Termine TOUJOURS par une question de relance courte et polie.
   - Exemples : "Que faisons-nous ensuite ?", "Souhaitez-vous que j'approfondisse ce point ?", "Est-ce clair pour vous, Maître ?"
3. CONFIRMATION : Confirme brièvement les actions effectuées avant de demander la suite ("C'est noté, la tâche est créée. Autre chose ?").
4. ACTIONS : Utilise les outils à ta disposition dès que possible.

L'objectif est d'avoir une vraie conversation naturelle, comme au téléphone.` }] }
            },
            callbacks: {
                onopen: async () => {
                    console.log("Opened! (Waiting for connect to resolve...)");
                },
                onmessage: (msg) => {
                    const keys = Object.keys(msg);
                    const serverContent = msg.serverContent;
                    if (serverContent?.modelTurn?.parts) {
                        for (const p of serverContent.modelTurn.parts) {
                            if (p.inlineData) {
                                bytes += p.inlineData.data.length;
                            }
                            if (p.text) {
                                console.log("Text received:", p.text);
                            }
                        }
                    }
                    if (serverContent?.turnComplete) {
                        console.log("Turn Complete. Audio bytes:", bytes);
                        process.exit(0);
                    }
                },
                onerror: (e) => console.log("error", e),
                onclose: (e) => { console.log("closes", e); }
            }
        });
        console.log("Connected. Sending simulated audio...");
        console.log("Connected. Sending initial message...");
        session.sendClientContent({
            turns: [{ role: "user", parts: [{ text: "Bonjour ! Répète le mot test." }] }],
            turnComplete: true
        });

        setTimeout(() => { console.log("Timeout, exiting"); process.exit(1); }, 10000);
    } catch (e) {
        console.error("ERROR:", e);
    }
})();
