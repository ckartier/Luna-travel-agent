'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bug, Sparkles, AlertCircle, AlertTriangle, Info, Clock, User, Globe, Loader2, RefreshCw, CheckCircle2 } from 'lucide-react';

interface BugReport {
    id: string;
    title: string;
    description: string;
    severity: string;
    status: string;
    page: string;
    userName: string;
    userEmail: string;
    createdAt: string;
}

const SEVERITY_CONFIG: Record<string, { label: string; icon: any; color: string; bg: string }> = {
    critical: { label: 'Critique', icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50 border-red-200' },
    normal: { label: 'Normal', icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' },
    low: { label: 'Mineur', icon: Info, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' },
};

export default function BugReportsPage() {
    const [reports, setReports] = useState<BugReport[]>([]);
    const [loading, setLoading] = useState(true);
    const [analysis, setAnalysis] = useState<string | null>(null);
    const [analyzing, setAnalyzing] = useState(false);

    const fetchReports = () => {
        setLoading(true);
        fetch('/api/crm/bug-report')
            .then(r => r.json())
            .then(data => { setReports(Array.isArray(data) ? data : []); setLoading(false); })
            .catch(() => { setReports([]); setLoading(false); });
    };

    useEffect(() => { fetchReports(); }, []);

    const runAnalysis = async () => {
        setAnalyzing(true);
        try {
            const res = await fetch('/api/crm/bug-report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'analyze' }),
            });
            const data = await res.json();
            setAnalysis(data.analysis || 'Aucune analyse disponible.');
        } catch {
            setAnalysis('Erreur lors de l\'analyse.');
        } finally {
            setAnalyzing(false);
        }
    };

    const criticalCount = reports.filter(r => r.severity === 'critical').length;
    const openCount = reports.filter(r => r.status === 'open').length;

    return (
        <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-[28px] font-bold text-[#2E2E2E] tracking-tight">Bug Reports</h1>
                    <p className="text-[13px] text-gray-400 mt-1">{reports.length} rapports · {openCount} ouverts · {criticalCount} critiques</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={fetchReports}
                        className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-[12px] font-medium text-gray-500 hover:bg-gray-50 transition-all">
                        <RefreshCw size={14} /> Actualiser
                    </button>
                    <button onClick={runAnalysis} disabled={analyzing}
                        className="flex items-center gap-2 px-5 py-2.5 bg-[#2E2E2E] text-white rounded-xl text-[12px] font-bold hover:bg-black transition-all shadow-sm disabled:opacity-50">
                        {analyzing ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                        {analyzing ? 'Analyse en cours...' : 'Analyser avec Gemini'}
                    </button>
                </div>
            </div>

            {/* Gemini Analysis */}
            {analysis && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                    className="mb-8 p-6 bg-gradient-to-br from-violet-50 to-sky-50 border border-violet-200/50 rounded-2xl">
                    <div className="flex items-center gap-2 mb-4">
                        <Sparkles size={16} className="text-violet-500" />
                        <h3 className="text-[14px] font-bold text-[#2E2E2E]">Analyse Gemini</h3>
                    </div>
                    <div className="prose prose-sm max-w-none text-[13px] text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {analysis}
                    </div>
                </motion.div>
            )}

            {/* Reports list */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 size={24} className="animate-spin text-gray-300" />
                </div>
            ) : reports.length === 0 ? (
                <div className="text-center py-20">
                    <CheckCircle2 size={40} className="mx-auto text-emerald-300 mb-4" />
                    <p className="text-[16px] font-bold text-[#2E2E2E]">Aucun bug signalé</p>
                    <p className="text-[13px] text-gray-400 mt-1">Tout fonctionne parfaitement ! 🎉</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {reports.map((report, i) => {
                        const sev = SEVERITY_CONFIG[report.severity] || SEVERITY_CONFIG.normal;
                        const SevIcon = sev.icon;
                        const date = report.createdAt ? new Date(report.createdAt) : null;

                        return (
                            <motion.div key={report.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.03 }}
                                className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition-all duration-300"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${sev.bg} ${sev.color}`}>
                                                <SevIcon size={10} /> {sev.label}
                                            </span>
                                            <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                                report.status === 'open' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-gray-50 text-gray-400 border border-gray-200'
                                            }`}>
                                                {report.status === 'open' ? 'Ouvert' : 'Résolu'}
                                            </span>
                                        </div>
                                        <h4 className="text-[14px] font-bold text-[#2E2E2E] mb-1">{report.title}</h4>
                                        <p className="text-[12px] text-gray-500 leading-relaxed">{report.description}</p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        {date && (
                                            <div className="flex items-center gap-1 text-[10px] text-gray-400 mb-1">
                                                <Clock size={10} />
                                                {date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        )}
                                        {report.userName && (
                                            <div className="flex items-center gap-1 text-[10px] text-gray-400">
                                                <User size={10} /> {report.userName}
                                            </div>
                                        )}
                                        {report.page && (
                                            <div className="flex items-center gap-1 text-[10px] text-gray-300 mt-0.5">
                                                <Globe size={10} /> {report.page}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
