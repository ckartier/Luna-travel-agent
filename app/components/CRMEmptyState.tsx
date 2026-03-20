'use client';
import { motion } from 'framer-motion';
import { LucideIcon, Plus } from 'lucide-react';
import Link from 'next/link';

/**
 * CRM Empty State — shown when a collection has no items.
 * Premium design with icon, title, description, and optional CTA.
 */
export function CRMEmptyState({
    icon: Icon,
    title,
    description,
    actionLabel,
    actionHref,
    onAction,
}: {
    icon: LucideIcon;
    title: string;
    description: string;
    actionLabel?: string;
    actionHref?: string;
    onAction?: () => void;
}) {
    const button = actionLabel && (
        <motion.button
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            onClick={onAction}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-[11px] font-bold uppercase tracking-[0.2em] bg-[#bcdeea] text-[#2E2E2E] hover:bg-[#a5cadc] shadow-[0_6px_24px_-6px_rgba(185,218,233,0.5)] hover:shadow-[0_10px_32px_-6px_rgba(185,218,233,0.7)] hover:-translate-y-0.5 transition-all duration-300 cursor-pointer"
        >
            <Plus size={14} />
            {actionLabel}
        </motion.button>
    );

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center justify-center py-20 px-8"
        >
            {/* Decorative circle */}
            <div className="relative mb-8">
                <div className="w-24 h-24 rounded-[28px] bg-gradient-to-br from-gray-50 to-white border border-gray-100 flex items-center justify-center shadow-sm">
                    <Icon size={36} className="text-gray-200" strokeWidth={1.5} />
                </div>
                {/* Subtle glow */}
                <div className="absolute -inset-4 bg-[#bcdeea]/5 rounded-[36px] -z-10 blur-xl" />
            </div>

            <motion.h3
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15 }}
                className="text-xl font-light text-[#2E2E2E] tracking-tight mb-2 text-center"
            >
                {title}
            </motion.h3>

            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.25 }}
                className="text-sm text-gray-400 max-w-sm text-center leading-relaxed mb-8"
            >
                {description}
            </motion.p>

            {actionHref ? (
                <Link href={actionHref}>{button}</Link>
            ) : (
                button
            )}
        </motion.div>
    );
}
