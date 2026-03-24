import { getIcon } from '@/src/lib/utils/iconMap';
import { useVertical } from '@/src/contexts/VerticalContext';

interface KPIData {
    value: string;
    trend: string;
}

export function KPICard({ title, value, trend, icon: Icon, variant }: any) {
    return (
        <div className="glass-card-premium p-6">
            <div className="flex justify-between items-start mb-6">
                <Icon size={20} className="text-gray-400" />
                <div className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">
                    {trend}
                </div>
            </div>
            <div>
                <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-1">{title}</p>
                <h3 className="text-2xl font-medium text-luna-charcoal tracking-tight">{value}</h3>
            </div>
        </div>
    );
}

export function KPIGrid({ data, kpiVariants }: { data: Record<string, KPIData>, kpiVariants: string[] }) {
    const { vertical, vt } = useVertical();
    
    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {vertical.dashboardWidgets.map((widget, i) => {
                const widgetData = data[widget.dataKey];
                const WidgetIcon = getIcon(widget.icon);
                return (
                    <KPICard
                        key={widget.id}
                        title={vt(widget.title)}
                        value={widgetData?.value || '0'}
                        trend={widgetData?.trend || ''}
                        icon={WidgetIcon}
                        variant={kpiVariants[i % kpiVariants.length]}
                    />
                );
            })}
        </div>
    );
}
