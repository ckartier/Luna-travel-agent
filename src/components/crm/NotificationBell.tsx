'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, BellRing, X, Check, AlertTriangle, RefreshCw, Zap } from 'lucide-react';
import { getAllSupplierBookings, getSuppliers, CRMSupplier, getOpenReminders, CRMReminder } from '@/src/lib/firebase/crm';
import { useAuth } from '@/src/contexts/AuthContext';
import { useAutoTranslate } from '@/src/components/T';

interface SupplierAlert {
    id: string;
    type: 'CONFIRMED' | 'CANCELLED' | 'CANCELLED_LATE';
    prestationName: string;
    supplierName: string;
    date: string;
    timestamp: Date;
    bookingId: string;
    seen: boolean;
}

interface WorkflowAlert {
    id: string;
    title: string;
    dueDate: string;
    priority: string;
    tripId?: string;
    seen: boolean;
}

export function NotificationBell() {
    const { tenantId } = useAuth();
    const tx = useAutoTranslate();
    const [alerts, setAlerts] = useState<SupplierAlert[]>([]);
    const [workflowAlerts, setWorkflowAlerts] = useState<WorkflowAlert[]>([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [toastAlert, setToastAlert] = useState<SupplierAlert | null>(null);
    const [pollMap, setPollMap] = useState<Map<string, string>>(new Map());
    const [suppliers, setSuppliers] = useState<CRMSupplier[]>([]);
    const [initialized, setInitialized] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Auto-close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        };

        if (showDropdown) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showDropdown]);

    // Load suppliers once
    useEffect(() => {
        if (!tenantId) return;
        getSuppliers(tenantId).then(s => setSuppliers(s)).catch(() => { });
    }, [tenantId]);

    const refreshWorkflowAlerts = useCallback(async () => {
        if (!tenantId) return;
        try {
            const reminders = await getOpenReminders(tenantId);
            const scoped = reminders.filter((r: CRMReminder) => (r.source || '') === 'pro-workflow');
            setWorkflowAlerts((prev) => {
                const seenById = new Map(prev.map((a) => [a.id, a.seen]));
                return scoped.slice(0, 20).map((r) => ({
                    id: String(r.id || ''),
                    title: String(r.title || tx('Rappel')),
                    dueDate: String(r.dueDate || ''),
                    priority: String(r.priority || 'medium'),
                    tripId: typeof r.tripId === 'string' ? r.tripId : undefined,
                    seen: seenById.get(String(r.id || '')) || false,
                }));
            });
        } catch (e) {
            console.error('[NotificationBell] Workflow alerts error:', e);
        }
    }, [tenantId, tx]);

    // Initialize poll map
    const initPollMap = useCallback(async () => {
        if (!tenantId) return;
        try {
            const bookings = await getAllSupplierBookings(tenantId);
            const map = new Map<string, string>();
            bookings.forEach(b => {
                if (b.id) {
                    map.set(b.id, b.status);
                    if ((b as any).supplierResponse?.respondedAt) {
                        map.set(`resp_${b.id}`, 'responded');
                    }
                }
            });
            setPollMap(map);

            // On init, check for any bookings with supplierResponse that we haven't seen
            // This catches responses that came in while we were away
            const existingAlerts: SupplierAlert[] = [];
            bookings.forEach(b => {
                if (b.id && (b as any).supplierResponse?.respondedAt) {
                    const respondedAt = (b as any).supplierResponse.respondedAt;
                    const responseTime = respondedAt?.toDate ? respondedAt.toDate() : new Date(respondedAt);
                    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);

                    // Show alerts for responses within the last 5 minutes
                    if (responseTime > fiveMinAgo) {
                        const sup = suppliers.find(s => s.id === b.supplierId);
                        existingAlerts.push({
                            id: `${b.id}-init`,
                            type: b.status as any,
                            prestationName: b.prestationName,
                            supplierName: sup?.name || (b as any).supplierResponse?.respondedBy || 'Prestataire',
                            date: b.date,
                            timestamp: responseTime,
                            bookingId: b.id,
                            seen: false,
                        });
                    }
                }
            });
            if (existingAlerts.length > 0) {
                setAlerts(existingAlerts);
            }
            await refreshWorkflowAlerts();
            setInitialized(true);
        } catch (e) {
            console.error('[NotificationBell] Init error:', e);
        }
    }, [tenantId, suppliers, refreshWorkflowAlerts]);

    useEffect(() => {
        if (tenantId && suppliers.length > 0 && !initialized) {
            initPollMap();
        }
    }, [tenantId, suppliers, initialized, initPollMap]);

    // Request browser notifications
    useEffect(() => {
        if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }, []);

    // ═══ POLL every 15 seconds ═══
    useEffect(() => {
        if (!tenantId || !initialized) return;
        const interval = setInterval(async () => {
            try {
                const fresh = await getAllSupplierBookings(tenantId);
                const newAlerts: SupplierAlert[] = [];

                fresh.forEach(b => {
                    if (!b.id) return;
                    // Detect actual new WhatsApp response
                    const hasNewResponse = (b as any).supplierResponse?.respondedAt &&
                        !pollMap.has(`resp_${b.id}`);

                    // Only trigger if there's a NEW supplier response OR if the status changed AND there's a response
                    // This prevents manual clicks on "Valider" in the dashboard from triggering the false "WhatsApp" alert
                    if (hasNewResponse) {
                        const sup = suppliers.find(s => s.id === b.supplierId);
                        newAlerts.push({
                            id: `${b.id}-${Date.now()}`,
                            type: b.status as any,
                            prestationName: b.prestationName,
                            supplierName: sup?.name || (b as any).supplierResponse?.respondedBy || 'Prestataire',
                            date: b.date,
                            timestamp: new Date(),
                            bookingId: b.id,
                            seen: false,
                        });

                        // Browser notification
                        if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
                            new Notification(
                                `${b.status === 'CONFIRMED' ? '✅' : '❌'} ${sup?.name || 'Prestataire'}`,
                                {
                                    body: `${b.prestationName} — ${b.status === 'CONFIRMED' ? 'Confirmé via WhatsApp' : 'Refusé via WhatsApp'}`,
                                    icon: '/favicon.ico',
                                }
                            );
                        }
                    }
                });

                // Update poll map
                const newMap = new Map<string, string>();
                fresh.forEach(b => {
                    if (b.id) {
                        newMap.set(b.id, b.status);
                        if ((b as any).supplierResponse?.respondedAt) {
                            newMap.set(`resp_${b.id}`, 'responded');
                        }
                    }
                });
                setPollMap(newMap);

                if (newAlerts.length > 0) {
                    setAlerts(prev => [...newAlerts, ...prev].slice(0, 30));
                    setToastAlert(newAlerts[0]);
                    setTimeout(() => setToastAlert(null), 10000);
                    try { new Audio('/notification.wav').play().catch(() => { }); } catch { }
                }
                await refreshWorkflowAlerts();
            } catch { /* silent */ }
        }, 15000);

        return () => clearInterval(interval);
    }, [tenantId, initialized, pollMap, suppliers, refreshWorkflowAlerts]);

    const unseenCount = alerts.filter(a => !a.seen).length + workflowAlerts.filter(a => !a.seen).length;

    return (
        <>
            {/* ═══ TOAST NOTIFICATION ═══ */}
            <AnimatePresence>
                {toastAlert && (
                    <motion.div
                        initial={{ opacity: 0, y: -30, x: 30 }}
                        animate={{ opacity: 1, y: 0, x: 0 }}
                        exit={{ opacity: 0, y: -30, x: 30 }}
                        className={`fixed top-20 right-6 z-[200] w-96 p-5 rounded-2xl shadow-2xl border backdrop-blur-xl
                            ${toastAlert.type === 'CONFIRMED' ? 'bg-emerald-50/95 border-emerald-300' :
                                toastAlert.type === 'CANCELLED_LATE' ? 'bg-red-50/95 border-red-300' :
                                    'bg-rose-50/95 border-rose-300'}`}
                    >
                        <div className="flex items-start gap-3">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white text-lg shrink-0 shadow-lg
                                ${toastAlert.type === 'CONFIRMED' ? 'bg-gradient-to-br from-emerald-400 to-green-500' :
                                    toastAlert.type === 'CANCELLED_LATE' ? 'bg-gradient-to-br from-red-500 to-red-600' :
                                        'bg-gradient-to-br from-rose-400 to-red-500'}`}>
                                {toastAlert.type === 'CONFIRMED' ? <Check size={22} /> :
                                    toastAlert.type === 'CANCELLED_LATE' ? <AlertTriangle size={22} /> : <X size={22} />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm text-luna-charcoal">
                                    {toastAlert.type === 'CONFIRMED' ? `📱 ${tx('Prestataire a confirmé via WhatsApp !')}` :
                                        toastAlert.type === 'CANCELLED_LATE' ? `⚠️ ${tx('ANNULATION TARDIVE !')}` :
                                            `📱 ${tx('Prestataire a refusé')}`}
                                </p>
                                <p className="text-sm text-luna-text-muted mt-1">
                                    <strong>{toastAlert.supplierName}</strong> — {toastAlert.prestationName}
                                </p>
                                <p className="text-xs text-luna-text-muted mt-1">📅 {toastAlert.date}</p>
                            </div>
                            <button onClick={() => setToastAlert(null)} className="p-1.5 rounded-xl hover:bg-white/60 transition-all shrink-0">
                                <X size={16} />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ═══ BELL BUTTON (fixed position — next to search) ═══ */}
            <div className="fixed top-[68px] right-3 md:top-6 md:right-3 z-[150]" ref={dropdownRef}>
                <div className="relative">
                    <button
                        onClick={() => setShowDropdown(!showDropdown)}
                        className={`p-2.5 rounded-2xl border transition-all duration-300 shadow-sm hover:shadow-md
                            ${unseenCount > 0
                                ? 'bg-orange-50 border-orange-200 hover:bg-orange-100'
                                : 'bg-white/90 border-gray-100 hover:bg-white'
                            } backdrop-blur-xl`}
                    >
                        {unseenCount > 0 ? (
                            <BellRing size={18} className="text-orange-500" />
                        ) : (
                            <Bell size={18} className="text-gray-400" />
                        )}
                        {unseenCount > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-red-500 text-white text-[11px] rounded-full flex items-center justify-center font-bold shadow-lg shadow-red-200 animate-bounce">
                                {unseenCount}
                            </span>
                        )}
                    </button>

                    {/* ═══ DROPDOWN ═══ */}
                    <AnimatePresence>
                        {showDropdown && (
                            <motion.div
                                initial={{ opacity: 0, y: -8, scale: 0.96 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -8, scale: 0.96 }}
                                className="absolute right-0 top-14 w-96 bg-white/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden"
                            >
                                <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-amber-50/50 to-orange-50/30">
                                    <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center shadow-sm">
                                            <Zap size={14} className="text-white" />
                                        </div>
                                        <span className="text-sm font-semibold text-luna-charcoal">{tx('Alertes CRM')}</span>
                                        {unseenCount > 0 && (
                                            <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-600 text-[10px] font-bold">{unseenCount} nouveau{unseenCount > 1 ? 'x' : ''}</span>
                                        )}
                                    </div>
                                    {(alerts.length > 0 || workflowAlerts.length > 0) && (
                                        <button
                                            onClick={() => {
                                                setAlerts(prev => prev.map(a => ({ ...a, seen: true })));
                                                setWorkflowAlerts(prev => prev.map(a => ({ ...a, seen: true })));
                                            }}
                                            className="text-xs text-orange-500 hover:text-orange-600 font-medium hover:underline"
                                        >
                                            {tx('Tout marquer lu')}
                                        </button>
                                    )}
                                </div>
                                <div className="max-h-80 overflow-y-auto">
                                    {alerts.length === 0 && workflowAlerts.length === 0 ? (
                                        <div className="p-8 text-center">
                                            <Bell size={24} className="text-gray-200 mx-auto mb-2" />
                                            <p className="text-sm text-luna-text-muted">{tx('Aucune alerte pour le moment')}</p>
                                            <p className="text-xs text-luna-text-muted/60 mt-1">{tx('Les réponses WhatsApp et les rappels pro apparaîtront ici')}</p>
                                        </div>
                                    ) : (
                                        <>
                                            {workflowAlerts.map((alert) => (
                                                <div
                                                    key={`workflow-${alert.id}`}
                                                    className={`p-4 border-b border-gray-50 cursor-pointer hover:bg-gray-50/50 transition-all ${!alert.seen ? 'bg-sky-50/35' : ''}`}
                                                    onClick={() => {
                                                        setWorkflowAlerts((prev) => prev.map((a) => a.id === alert.id ? { ...a, seen: true } : a));
                                                        setShowDropdown(false);
                                                        window.location.href = alert.tripId
                                                            ? `/crm/pro-requests/${encodeURIComponent(alert.tripId)}`
                                                            : '/crm/planning';
                                                    }}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm shrink-0 bg-gradient-to-br from-sky-500 to-cyan-600">
                                                            <AlertTriangle size={16} />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-sm font-medium text-luna-charcoal">{tx('Alerte Workflow Pro')}</span>
                                                                {!alert.seen && <span className="w-2.5 h-2.5 bg-sky-400 rounded-full animate-pulse" />}
                                                            </div>
                                                            <p className="text-xs text-luna-text-muted mt-0.5 truncate">{alert.title}</p>
                                                            <p className="text-[10px] text-luna-text-muted/60 mt-0.5">
                                                                {tx('Échéance')}: {alert.dueDate || 'N/A'} · {tx('Priorité')}: {alert.priority}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            {alerts.map(alert => (
                                                <div
                                                    key={alert.id}
                                                    className={`p-4 border-b border-gray-50 cursor-pointer hover:bg-gray-50/50 transition-all
                                                        ${!alert.seen ? 'bg-amber-50/30' : ''}`}
                                                    onClick={() => {
                                                        setAlerts(prev => prev.map(a => a.id === alert.id ? { ...a, seen: true } : a));
                                                        setShowDropdown(false);
                                                        // Navigate to the planning page
                                                        window.location.href = '/crm/planning/suppliers';
                                                    }}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm shrink-0
                                                            ${alert.type === 'CONFIRMED' ? 'bg-emerald-500' :
                                                                alert.type === 'CANCELLED_LATE' ? 'bg-red-600' : 'bg-rose-500'}`}>
                                                            {alert.type === 'CONFIRMED' ? <Check size={16} /> :
                                                                alert.type === 'CANCELLED_LATE' ? <AlertTriangle size={16} /> : <X size={16} />}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-sm font-medium text-luna-charcoal">{alert.supplierName}</span>
                                                                {!alert.seen && <span className="w-2.5 h-2.5 bg-amber-400 rounded-full animate-pulse" />}
                                                            </div>
                                                            <p className="text-xs text-luna-text-muted mt-0.5 truncate">
                                                                {alert.type === 'CONFIRMED' ? `✅ ${tx('A confirmé')}` :
                                                                    alert.type === 'CANCELLED_LATE' ? `⚠️ ${tx('Annul. tardive')}` : `❌ ${tx('A refusé')}`} — {alert.prestationName}
                                                            </p>
                                                            <p className="text-[10px] text-luna-text-muted/60 mt-0.5">
                                                                {alert.timestamp.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} · {alert.date}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </>
                                    )}
                                </div>
                                <div className="p-3 border-t border-gray-100 bg-gray-50/30">
                                    <p className="text-[10px] text-center text-luna-text-muted flex items-center justify-center gap-1">
                                        <RefreshCw size={10} className="animate-spin" style={{ animationDuration: '3s' }} />
                                        {tx('Actualisation auto toutes les 15 secondes')}
                                    </p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </>
    );
}
