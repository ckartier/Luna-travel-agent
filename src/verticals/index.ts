/**
 * Luna Multi-Vertical System — Registry
 *
 * Central registry of all available verticals.
 * Add new verticals by importing their config and adding to VERTICALS.
 */

import type { VerticalConfig } from './types';
import { travelVertical } from './travel';
import { propertyVertical } from './property';
import { eventsVertical } from './events';
import { legalVertical } from './legal';
import { monumVertical } from './monum';

// ═══ REGISTRY ═══
export const VERTICALS: Record<string, VerticalConfig> = {
    travel: travelVertical,
    property: propertyVertical,
    events: eventsVertical,
    legal: legalVertical,
    monum: monumVertical,
};

export const DEFAULT_VERTICAL = 'travel';

export const VERTICAL_LIST = Object.values(VERTICALS);

/**
 * Get a vertical config by ID.
 * Falls back to the travel vertical if not found.
 */
export function getVertical(id?: string | null): VerticalConfig {
    if (!id) return VERTICALS[DEFAULT_VERTICAL];
    return VERTICALS[id] || VERTICALS[DEFAULT_VERTICAL];
}

// Re-export types
export type { VerticalConfig, LocalizedString } from './types';
