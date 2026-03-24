import { T } from '@/src/components/T';
import { CRMActivity } from '@/src/lib/firebase/crm';

interface ActivityFeedProps {
    activities: CRMActivity[];
    title?: string;
}

export function ActivityFeed({ activities, title = "Conciergerie" }: ActivityFeedProps) {
    return (
        <div className="glass-card-premium p-8 flex flex-col h-[450px]">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <h3 className="text-lg font-medium text-luna-charcoal uppercase tracking-tighter">
                    <T>{title}</T>
                </h3>
                <span className="text-[10px] font-medium bg-indigo-50/50 text-indigo-600 px-3 py-1 rounded-full">
                    {activities.length}
                </span>
            </div>
            <div className="space-y-4 flex-1 overflow-y-auto no-scrollbar pt-6">
                {activities.length === 0 ? (
                    <p className="text-label-sharp opacity-40 italic flex-1 flex items-center justify-center">
                        <T>Flux à jour</T>
                    </p>
                ) : activities.map(activity => (
                    <div key={activity.id} className="p-4 rounded-3xl bg-gray-50/50 border border-gray-100/50 hover:bg-white transition-all cursor-pointer group">
                        <div className="flex items-center gap-4">
                            <div className={`w-2 h-2 rounded-full ${activity.type === 'urgent' ? 'bg-rose-500' : 'bg-indigo-400'}`} />
                            <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-medium text-luna-charcoal uppercase tracking-tight truncate">{activity.title}</h4>
                                <p className="text-[10px] text-gray-400 font-medium uppercase tracking-widest mt-1">{activity.time}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
