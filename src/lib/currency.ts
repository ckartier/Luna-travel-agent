/**
 * Multi-Currency Support Module
 * 
 * Provides currency definitions, formatting, and conversion utilities
 * for the Luna CRM. Used across quotes, invoices, catalog, and PDF generators.
 */

export interface CurrencyConfig {
    code: string;
    symbol: string;
    locale: string;
    position: 'before' | 'after';
    decimalDigits: number;
}

export const CURRENCIES: Record<string, CurrencyConfig> = {
    EUR: { code: 'EUR', symbol: '€', locale: 'fr-FR', position: 'after', decimalDigits: 2 },
    USD: { code: 'USD', symbol: '$', locale: 'en-US', position: 'before', decimalDigits: 2 },
    GBP: { code: 'GBP', symbol: '£', locale: 'en-GB', position: 'before', decimalDigits: 2 },
    CHF: { code: 'CHF', symbol: 'CHF', locale: 'fr-CH', position: 'after', decimalDigits: 2 },
    JPY: { code: 'JPY', symbol: '¥', locale: 'ja-JP', position: 'before', decimalDigits: 0 },
    MAD: { code: 'MAD', symbol: 'MAD', locale: 'fr-MA', position: 'after', decimalDigits: 2 },
    THB: { code: 'THB', symbol: '฿', locale: 'th-TH', position: 'before', decimalDigits: 2 },
    AED: { code: 'AED', symbol: 'AED', locale: 'ar-AE', position: 'after', decimalDigits: 2 },
    CAD: { code: 'CAD', symbol: 'CA$', locale: 'en-CA', position: 'before', decimalDigits: 2 },
    AUD: { code: 'AUD', symbol: 'A$', locale: 'en-AU', position: 'before', decimalDigits: 2 },
    MUR: { code: 'MUR', symbol: 'Rs', locale: 'en-MU', position: 'before', decimalDigits: 2 },
    XOF: { code: 'XOF', symbol: 'CFA', locale: 'fr-SN', position: 'after', decimalDigits: 0 },
    XPF: { code: 'XPF', symbol: 'F', locale: 'fr-PF', position: 'after', decimalDigits: 0 },
    ZAR: { code: 'ZAR', symbol: 'R', locale: 'en-ZA', position: 'before', decimalDigits: 2 },
    BRL: { code: 'BRL', symbol: 'R$', locale: 'pt-BR', position: 'before', decimalDigits: 2 },
    MXN: { code: 'MXN', symbol: 'MX$', locale: 'es-MX', position: 'before', decimalDigits: 2 },
};

/** Available currencies as array for selectors */
export const CURRENCY_LIST = Object.values(CURRENCIES);

/**
 * Format an amount with the correct currency symbol and locale.
 * 
 * @example formatPrice(1500, 'EUR') → "1 500 €"
 * @example formatPrice(1500, 'USD') → "$1,500"
 * @example formatPrice(150000, 'JPY') → "¥150,000"
 */
export function formatPrice(amount: number, currencyCode: string = 'EUR'): string {
    const config = CURRENCIES[currencyCode] || CURRENCIES.EUR;

    try {
        return new Intl.NumberFormat(config.locale, {
            style: 'currency',
            currency: config.code,
            minimumFractionDigits: config.decimalDigits,
            maximumFractionDigits: config.decimalDigits,
        }).format(amount);
    } catch {
        // Fallback if Intl fails
        const formatted = amount.toLocaleString('fr-FR', {
            minimumFractionDigits: config.decimalDigits,
            maximumFractionDigits: config.decimalDigits,
        });
        return config.position === 'before'
            ? `${config.symbol}${formatted}`
            : `${formatted} ${config.symbol}`;
    }
}

/**
 * Format a compact price (no decimals for round numbers).
 * Used in pipelines, cards, and summaries.
 * 
 * @example formatPriceCompact(1500, 'EUR') → "1 500 €"
 * @example formatPriceCompact(1500.50, 'EUR') → "1 500,50 €"
 */
export function formatPriceCompact(amount: number, currencyCode: string = 'EUR'): string {
    const config = CURRENCIES[currencyCode] || CURRENCIES.EUR;
    const isRound = amount === Math.floor(amount);

    try {
        return new Intl.NumberFormat(config.locale, {
            style: 'currency',
            currency: config.code,
            minimumFractionDigits: isRound ? 0 : config.decimalDigits,
            maximumFractionDigits: config.decimalDigits,
        }).format(amount);
    } catch {
        const formatted = amount.toLocaleString('fr-FR', {
            minimumFractionDigits: isRound ? 0 : config.decimalDigits,
            maximumFractionDigits: config.decimalDigits,
        });
        return config.position === 'before'
            ? `${config.symbol}${formatted}`
            : `${formatted} ${config.symbol}`;
    }
}

/**
 * Get just the currency symbol.
 */
export function getCurrencySymbol(currencyCode: string = 'EUR'): string {
    return (CURRENCIES[currencyCode] || CURRENCIES.EUR).symbol;
}

/**
 * Convert currency (uses European Central Bank rates via exchangerate-api).
 * Falls back gracefully if the API is unavailable.
 * 
 * Cache rates for 1 hour.
 */
const rateCache: Record<string, { rate: number; timestamp: number }> = {};
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

export async function convertCurrency(
    amount: number,
    from: string,
    to: string,
): Promise<{ converted: number; rate: number }> {
    if (from === to) return { converted: amount, rate: 1 };

    const cacheKey = `${from}_${to}`;
    const cached = rateCache[cacheKey];

    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return { converted: amount * cached.rate, rate: cached.rate };
    }

    try {
        const res = await fetch(
            `https://api.exchangerate-api.com/v4/latest/${from}`,
            { next: { revalidate: 3600 } }
        );
        const data = await res.json();
        const rate = data.rates?.[to];

        if (!rate) throw new Error(`Rate not found for ${from} → ${to}`);

        rateCache[cacheKey] = { rate, timestamp: Date.now() };
        return { converted: amount * rate, rate };
    } catch {
        // Fallback: return 1:1 with a warning
        console.warn(`[Currency] Failed to convert ${from} → ${to}, returning 1:1`);
        return { converted: amount, rate: 1 };
    }
}
