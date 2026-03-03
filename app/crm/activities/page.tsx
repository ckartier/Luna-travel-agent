'use client';

import { useState, useEffect } from 'react';
import { Calendar, Clock, CheckCircle2, PhoneCall, Mail, AlertTriangle, MessageSquare, RefreshCcw, X, Plus } from 'lucide-react';
import { getActivities, createActivity, updateActivityStatus, CRMActivity } from '@/src/lib/firebase/crm';

const iconMap: Record<string, any> = {
    'AlertTriangle': AlertTriangle,
    'PhoneCall': PhoneCall,
    'Mail': Mail,
    'CheckCircle2': CheckCircle2,
    'Calendar': Calendar,
    'MessageSquare': MessageSquare
};

export default function CRMActivities() {
    const [activities, setActivities] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newTask, setNewTask] = useState({
        title: '',
        time: '',
        type: 'normal' as CRMActivity['type'],
        color: 'gray' as CRMActivity['color'],
        iconName: 'Calendar'
    });

    const loadActivities = async () => {
        setLoading(true);
        try {
            const data = await getActivities();
            const formatted = data.map(a => ({
                ...a,
                icon: iconMap[a.iconName] || Calendar
            }));
            setActivities(formatted);
        } catch (error) {
            console.error("Failed to load activities", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadActivities();
    }, []);

    const handleAddTask = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await createActivity({
                title: newTask.title,
                time: newTask.time,
                type: newTask.type,
                color: newTask.color,
                status: 'PENDING',
                iconName: newTask.iconName
            });
            setIsModalOpen(false);
            setNewTask({ title: '', time: '', type: 'normal', color: 'gray', iconName: 'Calendar' });
            loadActivities();
        } catch (error) {
            console.error("Failed to add task", error);
        }
    };

    const handleMarkDone = async (id: string) => {
        try {
            await updateActivityStatus(id, 'DONE');
            loadActivities();
        } catch (error) {
            console.error("Failed to update task", error);
        }
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="font-serif text-3xl font-semibold text-luna-charcoal tracking-tight">Activités & Tâches</h1>
                    <p className="text-luna-text-muted font-normal mt-1">Votre ligne du temps pour ne rater aucune opportunité.</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={loadActivities} className="bg-white border border-luna-warm-gray/30 hover:bg-luna-cream text-luna-charcoal font-medium px-4 py-2.5 rounded-xl shadow-sm transition-all flex items-center gap-2">
                        <RefreshCcw size={18} className={loading ? "animate-spin text-luna-accent" : "text-luna-text-muted"} />
                    </button>
                    <button onClick={() => setIsModalOpen(true)} className="bg-luna-charcoal hover:bg-[#1a1a1a] text-luna-cream font-medium px-6 py-2.5 rounded-xl shadow-lg transition-all flex items-center gap-2 text-sm">
                        + Nouvelle Tâche
                    </button>
                </div>
            </div>

            <div className="relative">
                {/* Timeline Line */}
                <div className="absolute left-8 top-4 bottom-4 w-px bg-luna-warm-gray/30" />

                <div className="space-y-6 relative z-10">
                    {activities.map((activity) => {
                        const Icon = activity.icon;
                        const colorMap: Record<string, string> = {
                            red: 'bg-red-100 text-red-600 border-red-200',
                            blue: 'bg-blue-100 text-blue-600 border-blue-200',
                            purple: 'bg-purple-100 text-purple-600 border-purple-200',
                            emerald: 'bg-emerald-100 text-emerald-600 border-emerald-200',
                            amber: 'bg-amber-100 text-amber-600 border-amber-200',
                            gray: 'bg-gray-100 text-gray-600 border-gray-200',
                        };

                        const isDone = activity.status === 'DONE' || activity.type === 'done';

                        return (
                            <div key={activity.id} className="flex gap-6 items-start group">
                                <div className={`w-16 h-16 rounded-2xl border-2 flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 shadow-sm ${colorMap[activity.color]} ${isDone ? 'opacity-60 bg-gray-100 border-gray-200 text-gray-400' : 'bg-white'}`}>
                                    <Icon size={24} />
                                </div>

                                <div className={`flex-1 bg-white p-5 rounded-2xl border ${isDone ? 'border-luna-warm-gray/15 opacity-60' : 'border-luna-warm-gray/20 shadow-sm'} transition-all hover:shadow-md hover:border-luna-accent/30`}>
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className={`font-bold text-lg ${isDone ? 'text-gray-500 line-through' : 'text-gray-900'}`}>{activity.title}</h3>
                                        <span className="flex items-center gap-1.5 text-xs font-bold text-gray-400 uppercase tracking-widest bg-gray-50 px-3 py-1 rounded-lg">
                                            <Clock size={14} /> {activity.time}
                                        </span>
                                    </div>
                                    {!isDone && (
                                        <div className="flex gap-3 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => handleMarkDone(activity.id)} className="text-xs font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-4 py-2 rounded-lg transition-colors">Marquer Fait</button>
                                            <button className="text-xs font-bold text-gray-500 bg-gray-50 hover:bg-gray-100 px-4 py-2 rounded-lg transition-colors">Reporter</button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Modal Ajout Activité */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-luna-charcoal/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-lg shadow-luxury overflow-hidden">
                        <div className="flex justify-between items-center p-6 border-b border-luna-warm-gray/20 bg-luna-cream">
                            <h2 className="font-serif text-xl font-semibold text-luna-charcoal">Nouvelle Tâche</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-luna-text-muted hover:text-luna-charcoal p-2"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleAddTask} className="p-6 space-y-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Titre de l'action</label>
                                <input type="text" placeholder="Ex: Appeler Sophie Robert..." required className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-luna-accent/30 font-medium text-gray-900" value={newTask.title} onChange={e => setNewTask({ ...newTask, title: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Date / Heure prévue</label>
                                    <input type="text" placeholder="Ex: Demain, 14:00" required className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-luna-accent/30 font-medium text-gray-900" value={newTask.time} onChange={e => setNewTask({ ...newTask, time: e.target.value })} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Type / Urgent</label>
                                    <select className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-luna-accent/30 font-medium text-gray-900 appearance-none bg-white" value={newTask.type} onChange={e => setNewTask({ ...newTask, type: e.target.value as CRMActivity['type'] })}>
                                        <option value="normal">Normal</option>
                                        <option value="urgent">Urgent</option>
                                        <option value="call">Appel</option>
                                        <option value="email">Email</option>
                                        <option value="meeting">Réunion / RDV</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Couleur Catégorie</label>
                                    <select className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-luna-accent/30 font-medium text-gray-900 appearance-none bg-white" value={newTask.color} onChange={e => setNewTask({ ...newTask, color: e.target.value as CRMActivity['color'] })}>
                                        <option value="gray">Gris (Défaut)</option>
                                        <option value="red">Rouge (Alerte)</option>
                                        <option value="blue">Bleu (Appel)</option>
                                        <option value="purple">Violet (Projet)</option>
                                        <option value="amber">Orange (Attente)</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Icône Représentative</label>
                                    <select className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-luna-accent/30 font-medium text-gray-900 appearance-none bg-white" value={newTask.iconName} onChange={e => setNewTask({ ...newTask, iconName: e.target.value })}>
                                        <option value="Calendar">Calendrier</option>
                                        <option value="PhoneCall">Téléphone</option>
                                        <option value="Mail">Email</option>
                                        <option value="AlertTriangle">Attention (!)</option>
                                        <option value="MessageSquare">Message</option>
                                    </select>
                                </div>
                            </div>
                            <div className="pt-4 flex justify-end gap-3">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl text-luna-charcoal font-medium hover:bg-luna-cream transition-colors">Annuler</button>
                                <button type="submit" className="bg-luna-charcoal hover:bg-[#1a1a1a] text-luna-cream font-medium px-6 py-2.5 rounded-xl shadow-lg transition-all">Sauvegarder</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
