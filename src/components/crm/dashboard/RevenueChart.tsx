import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { MoreVertical } from 'lucide-react';

interface RevenueChartProps {
    data: { name: string; revenue: number }[];
    title?: string;
}

export function RevenueChart({ data, title = "Performance Revenus" }: RevenueChartProps) {
    return (
        <div className="lg:col-span-2 glass-card-premium p-8 h-[450px] flex flex-col">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <h3 className="text-lg font-medium text-luna-charcoal uppercase tracking-tighter">{title}</h3>
                <button className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 hover:text-luna-charcoal transition-all">
                    <MoreVertical size={18} />
                </button>
            </div>
            <div className="flex-1 w-full relative mt-6">
                {data.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 500 }} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 500 }} dx={-10} />
                            <Tooltip
                                contentStyle={{ borderRadius: '24px', border: '1px solid #E5E7EB', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', fontWeight: 500, padding: '15px' }}
                                labelStyle={{ color: '#0B1220', marginBottom: '4px' }}
                                itemStyle={{ color: '#2E2E2E' }}
                                formatter={(v: any) => [`${Number(v).toLocaleString()}€`, 'Revenus']}
                                cursor={{ fill: 'transparent' }}
                            />
                            <Bar dataKey="revenue" fill="#5a8fa3" radius={[6, 6, 0, 0]} barSize={24} />
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">
                        <p className="text-label-sharp opacity-40 italic">Aucune donnée historique disponible</p>
                    </div>
                )}
            </div>
        </div>
    );
}
