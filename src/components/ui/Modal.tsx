'use client';

import { ReactNode, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    subtitle?: string;
    children: ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    showClose?: boolean;
}

const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
};

export default function Modal({
    isOpen,
    onClose,
    title,
    subtitle,
    children,
    size = 'md',
    showClose = true,
}: ModalProps) {
    // Close on Escape key
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) {
            document.addEventListener('keydown', handleEsc);
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.removeEventListener('keydown', handleEsc);
            document.body.style.overflow = '';
        };
    }, [isOpen, onClose]);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="absolute inset-0 bg-black/25 backdrop-blur-md"
                        onClick={onClose}
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 12 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 12 }}
                        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                        className={`relative ${sizeClasses[size]} w-full bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 overflow-hidden`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        {(title || showClose) && (
                            <div className="flex items-start justify-between px-8 pt-8 pb-2">
                                <div>
                                    {title && (
                                        <h2 className="text-xl font-medium text-luna-charcoal tracking-tight">
                                            {title}
                                        </h2>
                                    )}
                                    {subtitle && (
                                        <p className="text-sm text-luna-charcoal/40 mt-1 font-light">
                                            {subtitle}
                                        </p>
                                    )}
                                </div>
                                {showClose && (
                                    <button
                                        onClick={onClose}
                                        className="p-2 -mr-2 -mt-1 rounded-xl text-gray-300 hover:text-gray-500 hover:bg-gray-100/80 transition-all"
                                    >
                                        <X size={18} />
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Body */}
                        <div className="px-8 pb-8 pt-4 max-h-[75vh] overflow-y-auto">
                            {children}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

/* ── Shared Modal Sub-components ── */

export function ModalActions({
    children,
    className = '',
}: {
    children: ReactNode;
    className?: string;
}) {
    return (
        <div className={`flex gap-3 pt-6 ${className}`}>
            {children}
        </div>
    );
}

export function ModalCancelButton({
    onClick,
    children = 'Annuler',
}: {
    onClick: () => void;
    children?: ReactNode;
}) {
    return (
        <button
            onClick={onClick}
            className="flex-1 px-5 py-3 rounded-2xl bg-gray-50 text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-all border border-gray-100"
        >
            {children}
        </button>
    );
}

export function ModalSubmitButton({
    onClick,
    children = 'Créer',
    disabled = false,
}: {
    onClick: () => void;
    children?: ReactNode;
    disabled?: boolean;
}) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className="flex-1 px-5 py-3 rounded-2xl bg-luna-charcoal text-white text-sm font-medium hover:bg-black transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-black/10"
        >
            {children}
        </button>
    );
}

export function ModalField({
    label,
    children,
    className = '',
}: {
    label?: string;
    children: ReactNode;
    className?: string;
}) {
    return (
        <div className={`space-y-1.5 ${className}`}>
            {label && (
                <label className="text-xs font-semibold uppercase tracking-[0.12em] text-black">
                    {label}
                </label>
            )}
            {children}
        </div>
    );
}

export const modalInputClass =
    'w-full px-4 py-3 rounded-2xl border border-gray-100 bg-gray-50/50 text-sm text-luna-charcoal placeholder:text-gray-300 focus:bg-white focus:border-gray-300 focus:shadow-sm transition-all outline-none';

export const modalSelectClass =
    'w-full px-4 py-3 rounded-2xl border border-gray-100 bg-gray-50/50 text-sm text-luna-charcoal focus:bg-white focus:border-gray-300 focus:shadow-sm transition-all outline-none appearance-none cursor-pointer';
