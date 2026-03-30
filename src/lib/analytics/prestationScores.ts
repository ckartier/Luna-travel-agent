type TripLikeForPrestationScore = {
    amount?: unknown;
    totalClientPrice?: unknown;
    commissionAmount?: unknown;
    selectedItems?: unknown;
};

export type PrestationScore = {
    key: string;
    name: string;
    type: string;
    salesCount: number;
    totalQuantity: number;
    gainVente: number;
    estimatedGain: number;
    score: number;
};

function toSafeNumber(value: unknown): number {
    if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
    if (typeof value === 'string') {
        const parsed = Number(value.replace(/[^\d.-]/g, ''));
        return Number.isFinite(parsed) ? parsed : 0;
    }
    return 0;
}

function normalizeType(value: unknown): string {
    const raw = String(value || 'OTHER').trim();
    return raw ? raw.toUpperCase() : 'OTHER';
}

function normalizeName(value: unknown): string {
    const raw = String(value || '').trim();
    return raw || 'Prestation';
}

function buildPrestationKey(name: string, type: string): string {
    return `${type}::${name.toLowerCase()}`;
}

export function computePrestationScoresFromTrips(
    trips: TripLikeForPrestationScore[],
): PrestationScore[] {
    const map = new Map<string, PrestationScore>();

    for (const trip of trips) {
        const tripTotal = toSafeNumber(trip.totalClientPrice ?? trip.amount);
        const tripCommission = toSafeNumber(trip.commissionAmount);
        const rawItems = Array.isArray(trip.selectedItems) ? trip.selectedItems : [];
        if (rawItems.length === 0) continue;

        for (const raw of rawItems) {
            const item = (raw || {}) as Record<string, unknown>;
            const name = normalizeName(item.description ?? item.name ?? item.title);
            const type = normalizeType(item.type);
            const key = buildPrestationKey(name, type);

            const quantity = Math.max(1, toSafeNumber(item.quantity) || 1);
            const unitPrice = toSafeNumber(item.unitPrice ?? item.clientPrice ?? item.price);
            const explicitTotal = toSafeNumber(item.total);
            const lineTotal = explicitTotal > 0 ? explicitTotal : Number((unitPrice * quantity).toFixed(2));
            const estimatedGain =
                tripTotal > 0 && tripCommission > 0
                    ? Number((tripCommission * (lineTotal / tripTotal)).toFixed(2))
                    : 0;

            const previous =
                map.get(key) ||
                ({
                    key,
                    name,
                    type,
                    salesCount: 0,
                    totalQuantity: 0,
                    gainVente: 0,
                    estimatedGain: 0,
                    score: 0,
                } satisfies PrestationScore);

            previous.salesCount += 1;
            previous.totalQuantity += quantity;
            previous.gainVente += lineTotal;
            previous.estimatedGain += estimatedGain;
            map.set(key, previous);
        }
    }

    const rows = Array.from(map.values()).map((row) => ({
        ...row,
        gainVente: Number(row.gainVente.toFixed(2)),
        estimatedGain: Number(row.estimatedGain.toFixed(2)),
    }));

    if (rows.length === 0) return rows;

    const maxSales = Math.max(...rows.map((r) => r.salesCount), 1);
    const maxWeightedGain = Math.max(
        ...rows.map((r) => (r.estimatedGain > 0 ? r.estimatedGain : r.gainVente)),
        1,
    );

    for (const row of rows) {
        const weightedGain = row.estimatedGain > 0 ? row.estimatedGain : row.gainVente;
        const gainPart = weightedGain / maxWeightedGain;
        const salesPart = row.salesCount / maxSales;
        row.score = Math.round((gainPart * 0.7 + salesPart * 0.3) * 100);
    }

    rows.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        if (b.gainVente !== a.gainVente) return b.gainVente - a.gainVente;
        return b.salesCount - a.salesCount;
    });

    return rows;
}

