import { CRMTrip } from '@/src/lib/firebase/crm';
import { Calendar } from 'lucide-react';

interface GanttChartProps {
    trips: CRMTrip[];
    title?: string;
}

export function GanttChart({ trips, title = "Planning Chantiers" }: GanttChartProps) {
    // Only active ones
    const active = trips.filter(t => t.status === 'CONFIRMED' || t.status === 'IN_PROGRESS');
    
    // Sort by start date
    active.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    
    // Calculate global min and max dates for the timeline scale
    const now = new Date();
    const minDate = active.length > 0 
        ? new Date(Math.min(...active.map(t => new Date(t.startDate).getTime()), now.getTime() - 7 * 24 * 60 * 60 * 1000))
        : new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        
    const maxDate = active.length > 0
        ? new Date(Math.max(...active.map(t => new Date(t.endDate).getTime()), now.getTime() + 30 * 24 * 60 * 60 * 1000))
        : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        
    const totalDurationMs = maxDate.getTime() - minDate.getTime();
    
    const formatDate = (dateString: string) => {
        const d = new Date(dateString);
        return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
    };
    
    return (
        <div className="lg:col-span-2 glass-card-premium p-8 h-[450px] flex flex-col">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
                <h3 className="text-lg font-medium text-luna-charcoal uppercase tracking-tighter">{title}</h3>
                <button className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 hover:text-luna-charcoal transition-all">
                    <Calendar size={18} />
                </button>
            </div>
            <div className="w-full flex-1 overflow-y-auto no-scrollbar space-y-4 relative">
                {/* Timeline Grid Background */}
                <div className="absolute inset-0 pointer-events-none flex justify-between px-4">
                    {[0, 1, 2, 3, 4].map(i => (
                        <div key={i} className="w-px h-full bg-gray-100/50" />
                    ))}
                </div>

                {active.length > 0 ? (
                    active.map(t => {
                        const start = new Date(t.startDate).getTime();
                        const end = new Date(t.endDate).getTime();
                        
                        const leftPercent = Math.max(0, ((start - minDate.getTime()) / totalDurationMs) * 100);
                        const widthPercent = Math.min(100 - leftPercent, ((end - start) / totalDurationMs) * 100);
                        
                        return (
                            <div key={t.id} className="w-full relative py-2">
                                <div className="flex justify-between items-center mb-1 px-1">
                                    <h4 className="text-xs font-semibold text-luna-charcoal truncate pr-2">{t.title}</h4>
                                    <span className="text-[10px] text-gray-400 font-medium whitespace-nowrap">
                                        {formatDate(t.startDate)} - {formatDate(t.endDate)}
                                    </span>
                                </div>
                                <div className="w-full h-8 bg-gray-50 rounded-lg relative overflow-hidden border border-gray-100/50">
                                     <div 
                                        className="absolute top-0 bottom-0 rounded-lg bg-[#334155] shadow-sm transition-all duration-500 flex items-center px-2" 
                                        style={{ left: `${leftPercent}%`, width: `${Math.max(2, widthPercent)}%` }}
                                     >
                                         <span className="text-[10px] text-white/90 font-medium truncate">{t.clientName}</span>
                                     </div>
                                </div>
                            </div>
                        )
                    })
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-400 z-10 relative">
                        <p className="text-label-sharp opacity-40 italic">Aucun chantier en cours</p>
                    </div>
                )}
            </div>
        </div>
    );
}
