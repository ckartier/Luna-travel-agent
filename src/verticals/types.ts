/**
 * Luna Multi-Vertical System — Type Definitions
 * 
 * Each vertical defines how the platform adapts its vocabulary,
 * navigation, AI agent behavior, and dashboard for a specific industry.
 */

import type { LunaLocale } from '@/src/lib/i18n/translations';

// ═══ LOCALIZED STRING ═══
export type LocalizedString = Partial<Record<LunaLocale, string>> & { fr: string };

// ═══ SIDEBAR LINK ═══
export interface VerticalNavLink {
    /** i18n key or display name */
    name: LocalizedString;
    /** Route path (e.g. '/crm/pipeline') */
    href: string;
    /** Lucide icon name */
    icon: string;
    /** Feature key for access gating */
    featureKey?: string;
}

// ═══ SIDEBAR SECTION ═══
export interface VerticalNavSection {
    label: LocalizedString | '';
    collapsible: boolean;
    links: VerticalNavLink[];
}

// ═══ AI AGENT CONFIG ═══
export interface VerticalAIAgent {
    name: LocalizedString;
    subtitle: LocalizedString;
    /** System prompt prefix injected before every AI request */
    systemPromptPrefix: string;
}

// ═══ DASHBOARD WIDGET ═══
export interface VerticalDashboardWidget {
    id: string;
    title: LocalizedString;
    icon: string;
    /** What data source to use (revenue, leads, contacts, activeTrips) */
    dataKey: 'revenue' | 'leads' | 'contacts' | 'activeTrips';
}

// ═══ PIPELINE STAGE ═══
export interface VerticalPipelineStage {
    id: string;
    label: LocalizedString;
}

// ═══ ENTITY VOCABULARY ═══
export interface VerticalEntities {
    /** What "Trip" is called in this vertical */
    trip: LocalizedString;
    tripPlural: LocalizedString;
    /** What "Supplier" is called */
    supplier: LocalizedString;
    supplierPlural: LocalizedString;
    /** What "Traveler" / participant is called */
    participant: LocalizedString;
    participantPlural: LocalizedString;
    /** What "Booking" is called */
    booking: LocalizedString;
    bookingPlural: LocalizedString;
    /** What "Itinerary" is called */
    itinerary: LocalizedString;
    /** What "Destination" is called */
    destination: LocalizedString;
}

// ═══ BRANDING ═══
export interface VerticalBranding {
    /** App name displayed in sidebar & meta */
    appName: string;
    /** Short tagline */
    tagline: LocalizedString;
    /** Meta title template */
    metaTitle: string;
    /** Meta description */
    metaDescription: LocalizedString;
}

// ═══ MAIN VERTICAL CONFIG ═══
export interface VerticalConfig {
    /** Unique identifier */
    id: string;
    /** Display name */
    name: string;
    /** Short description */
    description: LocalizedString;
    /** Default Lucide icon name */
    icon: string;
    /**
     * Primary accent color (hex). Defaults to Luna teal #5a8fa3 if not set.
     * Used in sidebar active states, buttons, CTAs, and badges.
     */
    accentColor?: string;
    /** Secondary lighter shade of accentColor (e.g. for backgrounds) */
    accentColorLight?: string;

    /** Branding / White-label */
    branding: VerticalBranding;

    /** Sidebar navigation sections */
    sidebar: VerticalNavSection[];

    /** AI Agent configuration */
    aiAgent: VerticalAIAgent;

    /** Entity vocabulary */
    entities: VerticalEntities;

    /** Dashboard KPI widgets */
    dashboardWidgets: VerticalDashboardWidget[];

    /** Pipeline stages */
    pipelineStages: VerticalPipelineStage[];

    /**
     * Translation overrides — keys from AUTO_DICT that this vertical
     * wants to replace. Only overridden keys need to be specified.
     */
    translationOverrides: Record<string, Partial<Record<LunaLocale, string>>>;
}
