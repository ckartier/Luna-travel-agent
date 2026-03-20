'use client';
import { motion } from 'framer-motion';

/**
 * CRM Skeleton loader — premium shimmer animation.
 * Use `variant` to match the page layout:
 *   - "cards"   → grid of card skeletons (contacts, suppliers)
 *   - "table"   → table rows skeleton (invoices, quotes)
 *   - "kanban"  → kanban columns skeleton (pipeline)
 *   - "list"    → simple list skeleton (trips, activities)
 */

function Shimmer({ className = '', style }: { className?: string; style?: React.CSSProperties }) {
    return (
        <div className={`relative overflow-hidden rounded-[20px] bg-gray-100/60 ${className}`} style={style}>
            <div
                className="absolute inset-0"
                style={{
                    background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.5) 50%, transparent 100%)',
                    backgroundSize: '200% 100%',
                    animation: 'shimmer 1.8s ease-in-out infinite',
                }}
            />
        </div>
    );
}

export function CRMSkeleton({ variant = 'cards', rows = 6 }: { variant?: 'cards' | 'table' | 'kanban' | 'list'; rows?: number }) {
    return (
        <>
            <style>{`@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>

            {/* Header skeleton */}
            <div className="flex items-center justify-between mb-8">
                <div className="space-y-2">
                    <Shimmer className="h-8 w-48" />
                    <Shimmer className="h-4 w-64" />
                </div>
                <div className="flex gap-3">
                    <Shimmer className="h-10 w-32 rounded-xl" />
                    <Shimmer className="h-10 w-10 rounded-xl" />
                </div>
            </div>

            {/* Search bar skeleton */}
            <Shimmer className="h-12 w-full max-w-md mb-8 rounded-full" />

            {variant === 'cards' && (
                <div className="space-y-4">
                    {Array.from({ length: rows }).map((_, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: i * 0.05 }}
                            className="flex items-center gap-6 p-6 rounded-[32px] border border-gray-50 bg-white/40"
                        >
                            <Shimmer className="w-14 h-14 rounded-[20px] shrink-0" />
                            <div className="flex-1 space-y-2">
                                <Shimmer className="h-4 w-40" />
                                <Shimmer className="h-3 w-56" />
                            </div>
                            <Shimmer className="h-6 w-16 rounded-full" />
                            <Shimmer className="w-10 h-10 rounded-2xl" />
                        </motion.div>
                    ))}
                </div>
            )}

            {variant === 'table' && (
                <div className="border border-gray-100 rounded-[20px] overflow-hidden bg-white/40">
                    {/* Table header */}
                    <div className="flex items-center gap-4 px-6 py-4 border-b border-gray-50 bg-gray-50/30">
                        {[120, 180, 100, 80, 100].map((w, i) => (
                            <Shimmer key={i} className="h-3 rounded-lg" style={{ width: w }} />
                        ))}
                    </div>
                    {/* Table rows */}
                    {Array.from({ length: rows }).map((_, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: i * 0.04 }}
                            className="flex items-center gap-4 px-6 py-5 border-b border-gray-50 last:border-0"
                        >
                            <Shimmer className="h-4 w-24" />
                            <Shimmer className="h-4 w-36 flex-1" />
                            <Shimmer className="h-4 w-20" />
                            <Shimmer className="h-6 w-20 rounded-full" />
                            <Shimmer className="h-4 w-24" />
                        </motion.div>
                    ))}
                </div>
            )}

            {variant === 'kanban' && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Array.from({ length: 4 }).map((_, col) => (
                        <div key={col} className="space-y-3">
                            <Shimmer className="h-6 w-28 mb-4 rounded-xl" />
                            {Array.from({ length: col === 0 ? 3 : col === 1 ? 2 : 1 }).map((_, row) => (
                                <motion.div
                                    key={row}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: (col * 3 + row) * 0.05 }}
                                    className="p-5 rounded-[20px] border border-gray-50 bg-white/40 space-y-3"
                                >
                                    <Shimmer className="h-4 w-full" />
                                    <Shimmer className="h-3 w-3/4" />
                                    <div className="flex gap-2 pt-1">
                                        <Shimmer className="h-5 w-16 rounded-full" />
                                        <Shimmer className="h-5 w-12 rounded-full" />
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    ))}
                </div>
            )}

            {variant === 'list' && (
                <div className="space-y-3">
                    {Array.from({ length: rows }).map((_, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: i * 0.04 }}
                            className="flex items-center gap-5 p-5 rounded-[24px] border border-gray-50 bg-white/40"
                        >
                            <Shimmer className="w-10 h-10 rounded-xl shrink-0" />
                            <div className="flex-1 space-y-2">
                                <Shimmer className="h-4 w-48" />
                                <Shimmer className="h-3 w-32" />
                            </div>
                            <Shimmer className="h-6 w-20 rounded-full" />
                        </motion.div>
                    ))}
                </div>
            )}
        </>
    );
}
