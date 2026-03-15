/**
 * Luna — Maps icon string names to Lucide React components.
 * Used by the vertical config system to dynamically render icons.
 */

import {
    LayoutDashboard, Mail, Trello, Calendar, Users, Plane, UsersRound,
    FileSignature, FileText, CreditCard, Hotel, Palette, Map, BarChart3,
    Wrench, Settings, Home, Building2, Plug, Sparkles, PartyPopper,
    TrendingUp, Target, PlaneTakeoff, Star, Globe, Menu, X,
    ChevronDown, ChevronLeft, ChevronRight, Lock, Crown,
    Scale, Gavel, BookOpen, Briefcase, ScrollText, FileSearch,
    type LucideIcon,
} from 'lucide-react';

const ICON_MAP: Record<string, LucideIcon> = {
    LayoutDashboard,
    Mail,
    Trello,
    Calendar,
    Users,
    Plane,
    UsersRound,
    FileSignature,
    FileText,
    CreditCard,
    Hotel,
    Palette,
    Map,
    BarChart3,
    Wrench,
    Settings,
    Home,
    Building2,
    Plug,
    Sparkles,
    PartyPopper,
    TrendingUp,
    Target,
    PlaneTakeoff,
    Star,
    Globe,
    Menu,
    X,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Lock,
    Crown,
    Scale,
    Gavel,
    BookOpen,
    Briefcase,
    ScrollText,
    FileSearch,
};

/**
 * Get a Lucide icon component by name string.
 * Falls back to LayoutDashboard if not found.
 */
export function getIcon(name: string): LucideIcon {
    return ICON_MAP[name] || LayoutDashboard;
}
