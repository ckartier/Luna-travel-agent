'use client';

import { useState } from 'react';
import { CURRENCY_LIST, CurrencyConfig } from '@/src/lib/currency';
import { ChevronDown } from 'lucide-react';

/**
 * CurrencySelector — Dropdown to pick a currency
 * Used in quotes, invoices, and trips forms.
 */
interface CurrencySelectorProps {
    value: string;
    onChange: (code: string) => void;
    className?: string;
}

export default function CurrencySelector({ value, onChange, className = '' }: CurrencySelectorProps) {
    const [open, setOpen] = useState(false);
    const selected = CURRENCY_LIST.find(c => c.code === value) || CURRENCY_LIST[0];

    return (
        <div className={`relative ${className}`}>
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm font-medium text-[#2E2E2E] hover:border-gray-300 transition-colors cursor-pointer min-w-[90px]"
            >
                <span className="text-xs text-gray-400">{selected.symbol}</span>
                <span>{selected.code}</span>
                <ChevronDown size={12} className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                    <div className="absolute z-50 mt-1 w-48 bg-white border border-gray-100 rounded-xl shadow-lg py-1 max-h-64 overflow-y-auto">
                        {CURRENCY_LIST.map(c => (
                            <button
                                key={c.code}
                                type="button"
                                onClick={() => { onChange(c.code); setOpen(false); }}
                                className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-gray-50 transition-colors cursor-pointer ${
                                    c.code === value ? 'bg-gray-50 font-bold text-[#2E2E2E]' : 'text-gray-600'
                                }`}
                            >
                                <span className="text-xs text-gray-400 w-8">{c.symbol}</span>
                                <span>{c.code}</span>
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
