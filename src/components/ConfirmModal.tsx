'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  open: boolean;
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function ConfirmModal({
  open,
  title = 'Confirmer la suppression',
  message = 'Cette action est irréversible.',
  confirmLabel = 'Supprimer',
  cancelLabel = 'Annuler',
  onConfirm,
  onCancel,
  loading = false,
}: ConfirmModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-[#2E2E2E]/40 backdrop-blur-sm"
            onClick={onCancel}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.15 }}
            className="relative z-10 bg-white rounded-2xl w-full max-w-sm shadow-[0_8px_30px_rgba(0,0,0,0.12)] overflow-hidden"
          >
            {/* Header */}
            <div className="px-6 pt-6 pb-4 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
                <AlertTriangle size={18} className="text-[#da3832]" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-medium text-[#2E2E2E] tracking-tight">{title}</h3>
                <p className="text-sm text-[#6B7280] mt-1 leading-relaxed">{message}</p>
              </div>
              <button onClick={onCancel} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-[#6B7280] transition-colors shrink-0">
                <X size={16} />
              </button>
            </div>

            {/* Actions */}
            <div className="px-6 pb-6 pt-2 flex gap-3">
              <button
                onClick={onCancel}
                disabled={loading}
                className="flex-1 py-3 px-4 rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] text-sm font-medium text-[#6B7280] hover:bg-gray-100 transition-all disabled:opacity-50"
              >
                {cancelLabel}
              </button>
              <button
                onClick={onConfirm}
                disabled={loading}
                className="flex-1 py-3 px-4 rounded-xl bg-[#da3832] hover:bg-[#c22f2a] text-white text-sm font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  confirmLabel
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
