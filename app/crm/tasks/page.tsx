'use client';

import { useState, useEffect } from 'react';
import { Plus, MoreVertical, User, Calendar, X, Loader2 } from 'lucide-react';
import { CRMTask, getTasks, createTask, updateTask, deleteTask } from '@/src/lib/firebase/crm';
import { useAuth } from '@/src/contexts/AuthContext';

const COLUMNS = [
    { id: 'TODO' as const, label: 'À Faire', color: 'border-gray-300', bg: 'bg-gray-50' },
    { id: 'IN_PROGRESS' as const, label: 'En Cours', color: 'border-sky-400', bg: 'bg-sky-50/30' },
    { id: 'REVIEW' as const, label: 'En Revue', color: 'border-amber-400', bg: 'bg-amber-50/30' },
    { id: 'DONE' as const, label: 'Terminé', color: 'border-emerald-400', bg: 'bg-emerald-50/30' },
];

export default function TasksPage() {
    const { user, userProfile, tenantId } = useAuth();
    const [tasks, setTasks] = useState<CRMTask[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [newTask, setNewTask] = useState({ title: '', priority: 'MEDIUM' as CRMTask['priority'], dueDate: '', tags: '' });

    useEffect(() => { loadTasks(); }, []);

    const loadTasks = async () => {
        setLoading(true);
        try {
            const data = await getTasks(tenantId!);
            setTasks(data);
        } catch (e) { console.error(e); }
        setLoading(false);
    };

    const handleCreate = async () => {
        if (!newTask.title.trim()) return;
        await createTask(tenantId!, {
            title: newTask.title,
            assigneeId: user?.uid || '',
            assigneeName: userProfile?.displayName || user?.displayName || 'Agent',
            status: 'TODO',
            priority: newTask.priority,
            dueDate: newTask.dueDate || new Date().toISOString().split('T')[0],
            tags: newTask.tags ? newTask.tags.split(',').map(t => t.trim()) : [],
        });
        setNewTask({ title: '', priority: 'MEDIUM', dueDate: '', tags: '' });
        setShowModal(false);
        loadTasks();
    };

    const handleStatusChange = async (taskId: string, newStatus: CRMTask['status']) => {
        await updateTask(tenantId!, taskId, { status: newStatus });
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    };

    const handleDelete = async (taskId: string) => {
        await deleteTask(tenantId!, taskId);
        setTasks(prev => prev.filter(t => t.id !== taskId));
    };

    const getPriorityStyle = (priority: string) => {
        switch (priority) {
            case 'URGENT': return 'bg-red-50 text-red-600 border-red-200';
            case 'HIGH': return 'bg-orange-50 text-orange-600 border-orange-200';
            case 'MEDIUM': return 'bg-sky-50 text-sky-600 border-sky-200';
            case 'LOW': return 'bg-gray-100 text-gray-500 border-gray-200';
            default: return 'bg-gray-50 text-gray-500 border-gray-200';
        }
    };

    const tasksByStatus = (status: string) => tasks.filter(t => t.status === status);

    if (loading) return <div className="flex items-center justify-center h-96"><Loader2 className="animate-spin text-gray-400" size={32} /></div>;

    return (
        <div className="p-8 max-w-full mx-auto min-h-screen">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-serif font-light text-luna-charcoal mb-1">Tâches & Rappels</h1>
                    <p className="text-sm text-luna-text-muted">Organisez le travail de votre équipe en colonnes Kanban.</p>
                </div>
                <button onClick={() => setShowModal(true)} className="bg-gradient-to-r from-luna-charcoal to-gray-800 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:shadow-[0_6px_20px_rgba(0,0,0,0.2)] hover:-translate-y-0.5 transition-all flex items-center gap-2 shadow-[0_2px_20px_rgba(0,0,0,0.04)]">
                    <Plus size={16} /> Nouvelle Tâche
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {COLUMNS.map(col => (
                    <div key={col.id} className={`${col.bg} rounded-2xl p-4 min-h-[400px] border-t-4 ${col.color}`}>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-sm font-bold text-luna-charcoal uppercase tracking-wider">{col.label}</h2>
                            <span className="text-xs font-bold bg-white text-gray-500 px-2 py-0.5 rounded-full border border-gray-200 shadow-[0_2px_20px_rgba(0,0,0,0.04)]">
                                {tasksByStatus(col.id).length}
                            </span>
                        </div>
                        <div className="space-y-3">
                            {tasksByStatus(col.id).map(task => (
                                <div key={task.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow group">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${getPriorityStyle(task.priority)}`}>
                                            {task.priority}
                                        </span>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {col.id !== 'DONE' && (
                                                <button onClick={() => handleStatusChange(task.id!, COLUMNS[COLUMNS.findIndex(c => c.id === col.id) + 1]?.id || 'DONE')}
                                                    className="text-[10px] bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded font-bold hover:bg-emerald-100">→</button>
                                            )}
                                            <button onClick={() => handleDelete(task.id!)} className="text-gray-400 hover:text-red-500"><X size={12} /></button>
                                        </div>
                                    </div>
                                    <h3 className="text-sm font-bold text-luna-charcoal leading-snug mb-3">{task.title}</h3>
                                    <div className="flex flex-wrap gap-1 mb-3">
                                        {(task.tags || []).map((tag, i) => (
                                            <span key={i} className="text-[9px] font-bold bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded uppercase tracking-wider">{tag}</span>
                                        ))}
                                    </div>
                                    <div className="flex justify-between items-center pt-2 border-t border-gray-100 text-xs text-gray-500">
                                        <span className="flex items-center gap-1.5 font-medium"><User size={12} /> {task.assigneeName}</span>
                                        <span className="flex items-center gap-1.5 font-medium"><Calendar size={12} /> {task.dueDate?.slice(5)}</span>
                                    </div>
                                </div>
                            ))}
                            <button onClick={() => { setNewTask(prev => ({ ...prev, title: '' })); setShowModal(true); }}
                                className="w-full flex items-center justify-center gap-2 text-gray-400 hover:text-luna-charcoal hover:bg-white/60 py-3 rounded-xl border border-dashed border-gray-200 hover:border-luna-charcoal transition-colors text-sm font-medium">
                                <Plus size={16} /> Ajouter
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Create Task Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
                    <div className="bg-white/95 backdrop-blur-2xl rounded-3xl p-8 w-full max-w-md shadow-[0_25px_60px_rgba(0,0,0,0.12)] border border-white/50" onClick={e => e.stopPropagation()}>
                        <h2 className="text-lg font-serif font-light text-luna-charcoal mb-4">Nouvelle Tâche</h2>
                        <input value={newTask.title} onChange={e => setNewTask(p => ({ ...p, title: e.target.value }))}
                            placeholder="Titre de la tâche" className="w-full px-4 py-2.5 rounded-xl border border-gray-100 bg-gray-50/50 text-sm focus:bg-white focus:border-gray-300 focus:shadow-sm transition-all outline-none mb-3 focus:outline-none focus:border-luna-charcoal" autoFocus />
                        <select value={newTask.priority} onChange={e => setNewTask(p => ({ ...p, priority: e.target.value as any }))}
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-100 bg-gray-50/50 text-sm focus:bg-white focus:border-gray-300 focus:shadow-sm transition-all outline-none mb-3 focus:outline-none focus:border-luna-charcoal">
                            <option value="LOW">Basse</option><option value="MEDIUM">Moyenne</option><option value="HIGH">Haute</option><option value="URGENT">Urgente</option>
                        </select>
                        <input type="date" value={newTask.dueDate} onChange={e => setNewTask(p => ({ ...p, dueDate: e.target.value }))}
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-100 bg-gray-50/50 text-sm focus:bg-white focus:border-gray-300 focus:shadow-sm transition-all outline-none mb-3 focus:outline-none focus:border-luna-charcoal" />
                        <input value={newTask.tags} onChange={e => setNewTask(p => ({ ...p, tags: e.target.value }))}
                            placeholder="Tags (séparés par des virgules)" className="w-full px-4 py-2.5 rounded-xl border border-gray-100 bg-gray-50/50 text-sm focus:bg-white focus:border-gray-300 focus:shadow-sm transition-all outline-none mb-4 focus:outline-none focus:border-luna-charcoal" />
                        <div className="flex gap-3">
                            <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-100 bg-gray-50/50 text-sm focus:bg-white focus:border-gray-300 focus:shadow-sm transition-all outline-none font-medium text-gray-600 hover:bg-gray-50">Annuler</button>
                            <button onClick={handleCreate} className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-luna-charcoal to-gray-800 text-white text-sm font-medium shadow-[0_4px_14px_rgba(0,0,0,0.15)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.2)] hover:-translate-y-0.5 transition-all">Créer</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
