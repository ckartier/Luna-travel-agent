'use client';

import { Calendar, Clock, CheckCircle2, PhoneCall, Mail, AlertTriangle, MessageSquare } from 'lucide-react';

const activities = [
    { id: 1, type: 'urgent', title: 'Relancer M. Dupont (Devis Maldives)', time: 'Aujourd\'hui, 10:00', icon: AlertTriangle, color: 'red' },
    { id: 2, type: 'call', title: 'Appel découverte : Lune de Miel Bali', time: 'Aujourd\'hui, 14:30', icon: PhoneCall, color: 'blue' },
    { id: 3, type: 'email', title: 'Envoyer sélection hôtels à Sophie Robert', time: 'Aujourd\'hui, 16:00', icon: Mail, color: 'purple' },
    { id: 4, type: 'done', title: 'Vérification dispo One&Only Le Saint Géran', time: 'Hier, 18:45', icon: CheckCircle2, color: 'emerald' },
    { id: 5, type: 'meeting', title: 'Point visio avec partenaire local (Japon)', time: 'Hier, 11:00', icon: Calendar, color: 'amber' },
    { id: 6, type: 'message', title: 'WhatsApp reçu : "Validation du devis NY"', time: 'Lundi, 09:15', icon: MessageSquare, color: 'emerald' },
];

export default function CRMActivities() {
    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Activités & Tâches</h1>
                    <p className="text-gray-500 font-medium mt-1">Votre ligne du temps pour ne rater aucune opportunité.</p>
                </div>
                <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-xl shadow-lg shadow-blue-500/30 transition-all flex items-center gap-2">
                    + Nouvelle Tâche
                </button>
            </div>

            <div className="relative">
                {/* Timeline Line */}
                <div className="absolute left-8 top-4 bottom-4 w-px bg-gray-200" />

                <div className="space-y-6 relative z-10">
                    {activities.map((activity) => {
                        const Icon = activity.icon;
                        const colorMap: any = {
                            red: 'bg-red-100 text-red-600 border-red-200',
                            blue: 'bg-blue-100 text-blue-600 border-blue-200',
                            purple: 'bg-purple-100 text-purple-600 border-purple-200',
                            emerald: 'bg-emerald-100 text-emerald-600 border-emerald-200',
                            amber: 'bg-amber-100 text-amber-600 border-amber-200',
                        };

                        const isDone = activity.type === 'done';

                        return (
                            <div key={activity.id} className="flex gap-6 items-start group">
                                <div className={`w-16 h-16 rounded-2xl border-2 flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 shadow-sm ${colorMap[activity.color]} ${isDone ? 'opacity-60 bg-gray-100 border-gray-200 text-gray-400' : 'bg-white'}`}>
                                    <Icon size={24} />
                                </div>

                                <div className={`flex-1 bg-white p-5 rounded-2xl border ${isDone ? 'border-gray-100 opacity-60' : 'border-gray-200 shadow-sm'} transition-all hover:shadow-md hover:border-blue-200`}>
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className={`font-bold text-lg ${isDone ? 'text-gray-500 line-through' : 'text-gray-900'}`}>{activity.title}</h3>
                                        <span className="flex items-center gap-1.5 text-xs font-bold text-gray-400 uppercase tracking-widest bg-gray-50 px-3 py-1 rounded-lg">
                                            <Clock size={14} /> {activity.time}
                                        </span>
                                    </div>
                                    {!isDone && (
                                        <div className="flex gap-3 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button className="text-xs font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-4 py-2 rounded-lg transition-colors">Marquer Fait</button>
                                            <button className="text-xs font-bold text-gray-500 bg-gray-50 hover:bg-gray-100 px-4 py-2 rounded-lg transition-colors">Reporter</button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
