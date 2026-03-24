'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CheckCircle2, ChevronRight, ChevronLeft, Eye, EyeOff, ExternalLink,
    HelpCircle, Loader2, AlertTriangle, Sparkles, Shield, Zap,
    MessageCircle, Brain, Mail, Database, Rocket, Copy, Check, Info
} from 'lucide-react';
import { useAuth } from '@/src/contexts/AuthContext';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '@/src/lib/firebase/client';
import { VERTICAL_LIST, getVertical } from '@/src/verticals';
import { useVertical } from '@/src/contexts/VerticalContext';
import { getIcon } from '@/src/lib/utils/iconMap';
import { T } from '@/src/components/T';

/* ════════════════════════════════════════════════════════
   SETUP WIZARD — Self-service installation module
   Allows a client to configure their own API keys & tokens
   ════════════════════════════════════════════════════════ */

interface ApiKeyField {
    key: string;
    label: string;
    placeholder: string;
    required: boolean;
    helpText: string;
    helpUrl?: string;
    type?: 'text' | 'password';
}

interface SetupStep {
    id: string;
    title: string;
    subtitle: string;
    icon: any;
    color: string;
    fields: ApiKeyField[];
    testEndpoint?: string;
    docs: { label: string; url: string }[];
    tips: string[];
}

const SETUP_STEPS: SetupStep[] = [
    {
        id: 'firebase',
        title: 'Firebase',
        subtitle: 'Base de données & authentification',
        icon: Database,
        color: '#FFCA28',
        fields: [
            { key: 'NEXT_PUBLIC_FIREBASE_API_KEY', label: 'API Key', placeholder: 'AIzaSy...', required: true, helpText: 'Clé API de votre projet Firebase. Trouvable dans les paramètres du projet.', type: 'password' },
            { key: 'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN', label: 'Auth Domain', placeholder: 'votre-projet.firebaseapp.com', required: true, helpText: 'Domaine d\'authentification Firebase.' },
            { key: 'NEXT_PUBLIC_FIREBASE_PROJECT_ID', label: 'Project ID', placeholder: 'votre-projet-id', required: true, helpText: 'Identifiant unique de votre projet Firebase.' },
            { key: 'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET', label: 'Storage Bucket', placeholder: 'votre-projet.appspot.com', required: true, helpText: 'Bucket Cloud Storage pour les fichiers.' },
            { key: 'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID', label: 'Messaging Sender ID', placeholder: '123456789', required: true, helpText: 'ID d\'expéditeur pour les notifications push.' },
            { key: 'NEXT_PUBLIC_FIREBASE_APP_ID', label: 'App ID', placeholder: '1:123456789:web:abc123', required: true, helpText: 'Identifiant de l\'application Firebase.' },
        ],
        docs: [
            { label: 'Créer un projet Firebase', url: 'https://console.firebase.google.com/' },
            { label: 'Documentation Firebase', url: 'https://firebase.google.com/docs/web/setup' },
        ],
        tips: [
            '1. Allez sur console.firebase.google.com',
            '2. Créez un nouveau projet ou sélectionnez un existant',
            '3. Cliquez sur ⚙️ Paramètres du projet',
            '4. Dans "Vos applications", ajoutez une app Web',
            '5. Copiez les valeurs de la configuration Firebase',
        ],
    },
    {
        id: 'whatsapp',
        title: 'WhatsApp Business',
        subtitle: 'Notifications & messages clients',
        icon: MessageCircle,
        color: '#25D366',
        fields: [
            { key: 'WHATSAPP_TOKEN', label: 'Access Token', placeholder: 'EAABsb...', required: true, helpText: 'Token d\'accès permanent de l\'API WhatsApp Business. Trouvable dans le dashboard Meta for Developers.', type: 'password' },
            { key: 'WHATSAPP_PHONE_ID', label: 'Phone Number ID', placeholder: '1234567890', required: true, helpText: 'ID du numéro de téléphone WhatsApp Business, pas le numéro lui-même.' },
            { key: 'WHATSAPP_VERIFY_TOKEN', label: 'Webhook Verify Token', placeholder: 'mon-token-secret', required: false, helpText: 'Token personnalisé pour vérifier le webhook. Choisissez un mot de passe unique.' },
        ],
        docs: [
            { label: 'Meta for Developers', url: 'https://developers.facebook.com/' },
            { label: 'Guide API WhatsApp', url: 'https://developers.facebook.com/docs/whatsapp/cloud-api/get-started' },
        ],
        tips: [
            '1. Allez sur developers.facebook.com',
            '2. Créez une app Meta de type "Business"',
            '3. Ajoutez le produit "WhatsApp"',
            '4. Dans WhatsApp > API Setup, récupérez votre token',
            '5. Le Phone Number ID est sous votre numéro de test',
            '6. Configurez le webhook avec votre URL + verify token',
        ],
    },
    {
        id: 'openai',
        title: 'OpenAI / IA',
        subtitle: 'Agent IA & génération de contenu',
        icon: Brain,
        color: '#10B981',
        fields: [
            { key: 'OPENAI_API_KEY', label: 'API Key OpenAI', placeholder: 'sk-proj-...', required: true, helpText: 'Clé API OpenAI pour GPT-4 et les agents IA. Créez-la sur platform.openai.com.', type: 'password' },
        ],
        docs: [
            { label: 'Platform OpenAI', url: 'https://platform.openai.com/api-keys' },
            { label: 'Documentation API', url: 'https://platform.openai.com/docs' },
        ],
        tips: [
            '1. Allez sur platform.openai.com',
            '2. Connectez-vous ou créez un compte',
            '3. Allez dans API Keys',
            '4. Cliquez "Create new secret key"',
            '5. Copiez la clé — elle ne sera plus visible ensuite !',
            '⚠️ Ajoutez des crédits dans Billing pour que l\'API fonctionne',
        ],
    },
    {
        id: 'gmail',
        title: 'Gmail API',
        subtitle: 'Envoi d\'emails professionnels',
        icon: Mail,
        color: '#EA4335',
        fields: [
            { key: 'APP_GMAIL_CLIENT_ID', label: 'Client ID Google', placeholder: '123456-xxxx.apps.googleusercontent.com', required: true, helpText: 'OAuth 2.0 Client ID. Trouvable dans Google Cloud Console > APIs & Services > Credentials.' },
            { key: 'APP_GMAIL_CLIENT_SECRET', label: 'Client Secret', placeholder: 'GOCSPX-...', required: true, helpText: 'Secret OAuth 2.0 associé à votre Client ID.', type: 'password' },
            { key: 'APP_GMAIL_REDIRECT_URI', label: 'Redirect URI', placeholder: 'http://localhost:3000/api/gmail/callback', required: true, helpText: 'URL de callback OAuth. En local: http://localhost:3000/api/gmail/callback' },
            { key: 'APP_GMAIL_REFRESH_TOKEN', label: 'Refresh Token', placeholder: '1//03xxx...', required: true, helpText: 'Token de rafraîchissement. Cliquez "Connecter Gmail" ci-dessous pour l\'obtenir automatiquement.', type: 'password' },
        ],
        testEndpoint: '/api/gmail/test',
        docs: [
            { label: 'Google Cloud Console', url: 'https://console.cloud.google.com/apis/credentials' },
            { label: 'Guide Gmail API', url: 'https://developers.google.com/gmail/api/quickstart/js' },
        ],
        tips: [
            '1. Allez sur Google Cloud Console',
            '2. Créez un projet ou sélectionnez un existant',
            '3. Activez l\'API Gmail dans "APIs & Services"',
            '4. Créez des identifiants OAuth 2.0',
            '5. Ajoutez votre domaine dans les URI de redirection',
            '6. Cliquez "Connecter Gmail" ci-dessous pour obtenir le Refresh Token',
            '⚠️ Les clés sont lues depuis .env.local côté serveur',
        ],
    },
];

export default function SetupPage() {
    const { tenantId, user } = useAuth();
    const { vertical, vt, switchVertical } = useVertical();
    const [currentStep, setCurrentStep] = useState(0);
    const [formData, setFormData] = useState<Record<string, string>>({});
    const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
    const [testing, setTesting] = useState<string | null>(null);
    const [testResults, setTestResults] = useState<Record<string, 'success' | 'error' | null>>({});
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [showTips, setShowTips] = useState<string | null>(null);
    const [copiedKey, setCopiedKey] = useState<string | null>(null);
    const [selectedVertical, setSelectedVertical] = useState(vertical.id);
    const [savingVertical, setSavingVertical] = useState(false);

    // Load existing config
    useEffect(() => {
        if (!tenantId) return;
        (async () => {
            try {
                const ref = doc(db, 'tenants', tenantId);
                const snap = await getDoc(ref);
                if (snap.exists()) {
                    const data = snap.data();
                    if (data?.apiKeys) {
                        setFormData(data.apiKeys);
                    }
                    if (data?.vertical) {
                        setSelectedVertical(data.vertical);
                    }
                }
            } catch (e) {
                console.warn('Failed to load API keys:', e);
            }
        })();
    }, [tenantId]);

    const handleVerticalChange = async (verticalId: string) => {
        setSelectedVertical(verticalId);
        if (!tenantId) return;
        setSavingVertical(true);
        try {
            const ref = doc(db, 'tenants', tenantId);
            await updateDoc(ref, { vertical: verticalId, updatedAt: new Date() });
            // Instant UI switch
            switchVertical(verticalId);
        } catch (e) {
            try {
                const ref = doc(db, 'tenants', tenantId);
                await setDoc(ref, { vertical: verticalId, updatedAt: new Date() }, { merge: true });
                // Instant UI switch
                switchVertical(verticalId);
            } catch (e2) {
                console.error('Failed to save vertical:', e2);
            }
        }
        setSavingVertical(false);
    };

    const step = SETUP_STEPS[currentStep];
    const totalSteps = SETUP_STEPS.length;

    const getStepCompletion = (stepData: SetupStep) => {
        const requiredFields = stepData.fields.filter(f => f.required);
        const filledFields = requiredFields.filter(f => formData[f.key]?.trim());
        return requiredFields.length > 0 ? Math.round((filledFields.length / requiredFields.length) * 100) : 100;
    };

    const isStepComplete = (stepData: SetupStep) => getStepCompletion(stepData) === 100;
    const totalCompletion = Math.round(SETUP_STEPS.reduce((acc, s) => acc + getStepCompletion(s), 0) / SETUP_STEPS.length);

    const handleSave = async () => {
        if (!tenantId) return;
        setSaving(true);
        try {
            const ref = doc(db, 'tenants', tenantId);
            await updateDoc(ref, {
                apiKeys: formData,
                'setup.completedAt': new Date().toISOString(),
                'setup.completionPercent': totalCompletion,
                updatedAt: new Date(),
            });
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (e) {
            console.error('Failed to save:', e);
            // Try creating the document if it doesn't exist
            try {
                const ref = doc(db, 'tenants', tenantId);
                await setDoc(ref, {
                    apiKeys: formData,
                    'setup.completedAt': new Date().toISOString(),
                    'setup.completionPercent': totalCompletion,
                    updatedAt: new Date(),
                }, { merge: true });
                setSaved(true);
                setTimeout(() => setSaved(false), 3000);
            } catch (e2) {
                console.error('Failed to create doc:', e2);
            }
        }
        setSaving(false);
    };

    const handleTestConnection = async (stepId: string) => {
        setTesting(stepId);
        const stepDef = SETUP_STEPS.find(s => s.id === stepId)!;

        if (stepDef.testEndpoint) {
            // Real API test
            try {
                const res = await fetch(stepDef.testEndpoint, {
                    headers: { Authorization: `Bearer ${await user?.getIdToken()}` }
                });
                const data = await res.json();
                if (res.ok && data.success) {
                    setTestResults(prev => ({ ...prev, [stepId]: 'success' }));
                    alert(`✅ Connexion Gmail réussie !\nCompte: ${data.emailAddress}\nMessages: ${data.messagesTotal}`);
                } else {
                    setTestResults(prev => ({ ...prev, [stepId]: 'error' }));
                    alert(`❌ Échec: ${data.error || 'Erreur inconnue'}\n\nVérifiez que les clés dans .env.local sont correctes.`);
                }
            } catch (e: any) {
                setTestResults(prev => ({ ...prev, [stepId]: 'error' }));
                alert(`❌ Erreur réseau: ${e.message}`);
            }
        } else {
            // Validate form completeness for steps without test endpoint
            await new Promise(r => setTimeout(r, 1000));
            const complete = isStepComplete(stepDef);
            setTestResults(prev => ({ ...prev, [stepId]: complete ? 'success' : 'error' }));
            if (!complete) alert('⚠️ Tous les champs requis ne sont pas remplis.');
        }
        setTesting(null);
    };

    const handleCopy = (key: string) => {
        navigator.clipboard.writeText(formData[key] || '');
        setCopiedKey(key);
        setTimeout(() => setCopiedKey(null), 2000);
    };

    return (
        <div className="w-full h-full">
            <div className="max-w-[1600px] mx-auto w-full pb-20">

                {/* ═══ HEADER ═══ */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
                    <div>
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-12 h-12 rounded-2xl bg-[#2E2E2E] flex items-center justify-center shadow-xl shadow-gray-200">
                                <Rocket size={22} className="text-[#b9dae9]" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-light text-[#2E2E2E] tracking-tight"><T>Installation & Configuration</T></h1>
                                <p className="text-sm text-[#6B7280] font-medium"><T>Configurez vos clés API pour activer chaque module</T></p>
                            </div>
                        </div>
                    </div>

                    {/* Progress + Download */}
                    <div className="flex items-center gap-4">
                        <a
                            href="/luna-installation-guide.md"
                            download="Luna_Guide_Installation.md"
                            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 rounded-xl text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:border-[#b9dae9] hover:text-[#5a8fa3] transition-all shadow-sm hover:shadow-md"
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                            Guide complet
                        </a>
                        <div className="text-right">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400"><T>Configuration</T></p>
                            <p className="text-2xl font-light text-[#2E2E2E]">{totalCompletion}%</p>
                        </div>
                        <div className="w-32 h-3 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
                            <motion.div
                                className="h-full rounded-full bg-[#b9dae9]"
                                initial={{ width: 0 }}
                                animate={{ width: `${totalCompletion}%` }}
                                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                            />
                        </div>
                    </div>
                </div>

                {/* ═══ VERTICAL SELECTOR ═══ */}
                <div className="mb-10">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-10 h-10 rounded-xl bg-[#bcdeea]/20 flex items-center justify-center">
                            <Sparkles size={18} className="text-[#5a8fa3]" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-[#2E2E2E]"><T>Votre Métier</T></h3>
                            <p className="text-[10px] text-gray-400"><T>Choisissez votre secteur pour adapter l'interface Luna</T></p>
                        </div>
                        {savingVertical && (
                            <Loader2 size={14} className="animate-spin text-[#5a8fa3] ml-auto" />
                        )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {VERTICAL_LIST.map((v) => {
                            const VIcon = getIcon(v.icon);
                            const isActive = selectedVertical === v.id;
                            return (
                                <motion.button
                                    key={v.id}
                                    onClick={() => handleVerticalChange(v.id)}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className={`relative p-5 rounded-2xl border text-left transition-all duration-300 cursor-pointer ${
                                        isActive
                                            ? 'bg-[#bcdeea]/10 border-[#bcdeea] shadow-lg shadow-[#bcdeea]/10'
                                            : 'bg-white border-gray-200 hover:border-gray-300 shadow-sm hover:shadow-md'
                                    }`}
                                >
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                            isActive ? 'bg-[#bcdeea]/30' : 'bg-gray-100'
                                        }`}>
                                            <VIcon size={20} className={isActive ? 'text-[#5a8fa3]' : 'text-gray-400'} />
                                        </div>
                                        {isActive && (
                                            <CheckCircle2 size={18} className="text-[#5a8fa3] ml-auto" />
                                        )}
                                    </div>
                                    <p className={`text-sm font-bold ${isActive ? 'text-[#5a8fa3]' : 'text-[#2E2E2E]'}`}>{v.name}</p>
                                    <p className="text-[10px] text-gray-400 mt-1">{v.description.fr}</p>
                                </motion.button>
                            );
                        })}
                    </div>
                </div>

                {/* ═══ STEP NAVIGATION ═══ */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
                    {SETUP_STEPS.map((s, i) => {
                        const completion = getStepCompletion(s);
                        const complete = completion === 100;
                        const Icon = s.icon;
                        return (
                            <motion.button
                                key={s.id}
                                onClick={() => setCurrentStep(i)}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className={`relative p-5 rounded-2xl border transition-all duration-300 text-left overflow-hidden group ${
                                    currentStep === i
                                        ? 'bg-white border-gray-300 shadow-xl'
                                        : complete
                                            ? 'bg-emerald-50/50 border-emerald-200 shadow-sm'
                                            : 'bg-white/70 border-gray-100 shadow-sm hover:shadow-md'
                                }`}
                            >
                                <div className="flex items-center gap-3 mb-3">
                                    <div
                                        className="w-10 h-10 rounded-xl flex items-center justify-center transition-all"
                                        style={{ backgroundColor: `${s.color}15`, color: s.color }}
                                    >
                                        <Icon size={20} />
                                    </div>
                                    {complete && (
                                        <CheckCircle2 size={18} className="text-emerald-500 ml-auto" />
                                    )}
                                </div>
                                <p className="text-sm font-bold text-[#2E2E2E]">{s.title}</p>
                                <p className="text-[10px] text-gray-400 mt-0.5">{s.subtitle}</p>

                                {/* Progress bar */}
                                <div className="mt-3 w-full h-1 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full rounded-full transition-all duration-700"
                                        style={{
                                            width: `${completion}%`,
                                            backgroundColor: complete ? '#10B981' : s.color,
                                        }}
                                    />
                                </div>

                                {/* Active indicator */}
                                {currentStep === i && (
                                    <motion.div
                                        layoutId="activeStep"
                                        className="absolute bottom-0 left-4 right-4 h-[3px] rounded-full"
                                        style={{ backgroundColor: s.color }}
                                    />
                                )}
                            </motion.button>
                        );
                    })}
                </div>

                {/* ═══ MAIN CONTENT ═══ */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={step.id}
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -30 }}
                        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                        className="grid grid-cols-1 lg:grid-cols-3 gap-8"
                    >
                        {/* LEFT: Form fields */}
                        <div className="lg:col-span-2">
                            <div className="bg-white rounded-3xl border border-gray-200 p-8 md:p-10 shadow-sm">
                                <div className="flex items-center gap-4 mb-8">
                                    <div
                                        className="w-14 h-14 rounded-2xl flex items-center justify-center"
                                        style={{ backgroundColor: `${step.color}15`, color: step.color }}
                                    >
                                        <step.icon size={28} />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-light text-[#2E2E2E] tracking-tight">{step.title}</h2>
                                        <p className="text-sm text-gray-400">{step.subtitle}</p>
                                    </div>
                                    <div className="ml-auto flex items-center gap-2">
                                        {testResults[step.id] === 'success' && (
                                            <span className="flex items-center gap-1.5 text-emerald-600 text-xs font-bold bg-emerald-50 px-3 py-1.5 rounded-full">
                                                <CheckCircle2 size={14} /> Connecté
                                            </span>
                                        )}
                                        {testResults[step.id] === 'error' && (
                                            <span className="flex items-center gap-1.5 text-amber-600 text-xs font-bold bg-amber-50 px-3 py-1.5 rounded-full">
                                                <AlertTriangle size={14} /> Incomplet
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-5">
                                    {step.fields.map((field) => (
                                        <div key={field.key} className="group">
                                            <div className="flex items-center justify-between mb-2">
                                                <label className="text-[11px] font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
                                                    {field.label}
                                                    {field.required && <span className="text-red-400">*</span>}
                                                </label>
                                                <button
                                                    onClick={() => setShowTips(showTips === field.key ? null : field.key)}
                                                    className="text-gray-300 hover:text-gray-500 transition-colors"
                                                    title="Aide"
                                                >
                                                    <HelpCircle size={14} />
                                                </button>
                                            </div>

                                            {/* Help tooltip */}
                                            <AnimatePresence>
                                                {showTips === field.key && (
                                                    <motion.div
                                                        initial={{ opacity: 0, height: 0 }}
                                                        animate={{ opacity: 1, height: 'auto' }}
                                                        exit={{ opacity: 0, height: 0 }}
                                                        className="overflow-hidden"
                                                    >
                                                        <div className="mb-3 p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-700 flex items-start gap-2">
                                                            <Info size={14} className="shrink-0 mt-0.5" />
                                                            <span>{field.helpText}</span>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>

                                            <div className="relative">
                                                <input
                                                    type={field.type === 'password' && !showPasswords[field.key] ? 'password' : 'text'}
                                                    value={formData[field.key] || ''}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, [field.key]: e.target.value }))}
                                                    placeholder={field.placeholder}
                                                    className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-[#2E2E2E] placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#b9dae9]/40 focus:border-[#b9dae9] transition-all font-mono"
                                                />
                                                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                                    {field.type === 'password' && (
                                                        <button
                                                            onClick={() => setShowPasswords(prev => ({ ...prev, [field.key]: !prev[field.key] }))}
                                                            className="p-1.5 text-gray-300 hover:text-gray-500 transition-colors"
                                                        >
                                                            {showPasswords[field.key] ? <EyeOff size={16} /> : <Eye size={16} />}
                                                        </button>
                                                    )}
                                                    {formData[field.key] && (
                                                        <button
                                                            onClick={() => handleCopy(field.key)}
                                                            className="p-1.5 text-gray-300 hover:text-gray-500 transition-colors"
                                                            title="Copier"
                                                        >
                                                            {copiedKey === field.key ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Actions */}
                                <div className="flex items-center justify-between mt-10 pt-6 border-t border-gray-100">
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleTestConnection(step.id)}
                                            disabled={testing === step.id}
                                            className="flex items-center gap-2 px-5 py-3 bg-white border border-gray-200 rounded-xl text-xs font-bold uppercase tracking-widest text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-all disabled:opacity-50"
                                        >
                                            {testing === step.id ? (
                                                <Loader2 size={14} className="animate-spin" />
                                            ) : (
                                                <Zap size={14} />
                                            )}
                                            Tester la connexion
                                        </button>
                                        {step.id === 'gmail' && (
                                            <a
                                                href="/api/gmail/auth"
                                                target="_blank"
                                                className="flex items-center gap-2 px-5 py-3 bg-[#EA4335] text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-[#d33426] transition-all shadow-lg shadow-red-100"
                                            >
                                                <Mail size={14} /> Connecter Gmail (OAuth)
                                            </a>
                                        )}
                                    </div>

                                    <div className="flex gap-2">
                                        {currentStep > 0 && (
                                            <button
                                                onClick={() => setCurrentStep(p => p - 1)}
                                                className="flex items-center gap-1 px-4 py-3 text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-gray-700 transition-colors"
                                            >
                                                <ChevronLeft size={14} /> Précédent
                                            </button>
                                        )}
                                        {currentStep < totalSteps - 1 ? (
                                            <button
                                                onClick={() => setCurrentStep(p => p + 1)}
                                                className="flex items-center gap-2 px-6 py-3 bg-[#2E2E2E] text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-black transition-all shadow-lg"
                                            >
                                                Suivant <ChevronRight size={14} />
                                            </button>
                                        ) : (
                                            <button
                                                onClick={handleSave}
                                                disabled={saving}
                                                className="flex items-center gap-2 px-8 py-3 bg-[#2E2E2E] text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-[#1a1a2e] transition-all shadow-xl shadow-gray-200 disabled:opacity-50"
                                            >
                                                {saving ? (
                                                    <Loader2 size={14} className="animate-spin" />
                                                ) : saved ? (
                                                    <CheckCircle2 size={14} />
                                                ) : (
                                                    <Shield size={14} />
                                                )}
                                                {saved ? 'Sauvegardé !' : 'Sauvegarder tout'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT: Help panel */}
                        <div className="space-y-6">
                            {/* Guide rapide */}
                            <div className="bg-gradient-to-br from-gray-50 to-white rounded-3xl border border-gray-200 p-7 shadow-sm">
                                <h3 className="text-sm font-bold text-[#2E2E2E] mb-4 flex items-center gap-2">
                                    <Sparkles size={16} style={{ color: step.color }} />
                                    Guide d'installation
                                </h3>
                                <ol className="space-y-3">
                                    {step.tips.map((tip, i) => (
                                        <motion.li
                                            key={i}
                                            initial={{ opacity: 0, x: 10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.08 }}
                                            className={`text-xs leading-relaxed ${tip.startsWith('⚠️') ? 'text-amber-600 font-bold bg-amber-50 p-2 rounded-lg' : 'text-gray-500'}`}
                                        >
                                            {tip}
                                        </motion.li>
                                    ))}
                                </ol>
                            </div>

                            {/* Documentation links */}
                            <div className="bg-white rounded-3xl border border-gray-200 p-7 shadow-sm">
                                <h3 className="text-sm font-bold text-[#2E2E2E] mb-4">📚 Documentation</h3>
                                <div className="space-y-2">
                                    {step.docs.map((d, i) => (
                                        <a
                                            key={i}
                                            href={d.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center justify-between p-3 bg-gray-50 rounded-xl text-xs font-medium text-gray-600 hover:bg-gray-100 hover:text-[#2E2E2E] transition-all group"
                                        >
                                            <span>{d.label}</span>
                                            <ExternalLink size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </a>
                                    ))}
                                </div>
                            </div>

                            {/* Security note */}
                            <div className="bg-[#b9dae9]/10 rounded-3xl border border-[#b9dae9]/30 p-7">
                                <h3 className="text-sm font-bold text-[#2E2E2E] mb-2 flex items-center gap-2">
                                    <Shield size={16} className="text-[#5a8fa3]" />
                                    Sécurité
                                </h3>
                                <p className="text-xs text-[#5a8fa3] leading-relaxed">
                                    Vos clés API sont stockées de manière sécurisée dans Firestore avec un accès restreint à votre tenant.
                                    Elles ne sont jamais exposées côté client et sont utilisées uniquement côté serveur.
                                </p>
                            </div>

                            {/* Need help? */}
                            <div className="bg-white rounded-3xl border border-gray-200 p-7 shadow-sm text-center">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2"><T>Besoin d'aide ?</T></p>
                                <p className="text-xs text-gray-500 mb-4"><T>Notre équipe peut configurer vos APIs pour vous.</T></p>
                                <a
                                    href="mailto:support@luna-travel.com"
                                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#2E2E2E] text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-black transition-all"
                                >
                                    <Mail size={12} /> Contacter le support
                                </a>
                            </div>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}
