'use client';

import { ReactNode } from 'react';

/* ═══════════════════════════════════════════════════════
   CRM LAYOUT SYSTEM — Consistent spacing & alignment
   ═══════════════════════════════════════════════════════
   
   Usage:
     <CRMPage>
       <CRMPageHeader title="..." subtitle="...">
         <ActionButtons />
       </CRMPageHeader>
       <CRMPageTools>
         <SearchBar />
         <Filters />
       </CRMPageTools>
       <CRMPageContent>
         <CRMGrid>
           <CRMCard>...</CRMCard>
         </CRMGrid>
       </CRMPageContent>
     </CRMPage>
   
   Design tokens (px):
     Container max-width:  1600
     Container padding:    0 (handled by layout.tsx p-4/p-5)
     Section gap:          32 (space-y-8)
     Grid gap:             24 (gap-6)
     Card padding:         20 (p-5)
     Card radius:          24 (rounded-3xl on desktop,
                                rounded-2xl on mobile)
     Title size:           text-4xl font-light
     Subtitle:             text-sm text-muted
═══════════════════════════════════════════════════════ */

// ─── Page Container ───
interface CRMPageProps {
  children: ReactNode;
  className?: string;
  /** Use 'full' for pages that need full height (pipeline, mails) */
  mode?: 'default' | 'full';
}

export function CRMPage({ children, className = '', mode = 'default' }: CRMPageProps) {
  return (
    <div className="w-full h-full">
      <div
        className={`max-w-[1600px] mx-auto w-full pb-20 ${
          mode === 'full' ? 'h-full flex flex-col' : 'space-y-8'
        } ${className}`}
      >
        {children}
      </div>
    </div>
  );
}

// ─── Page Header ───
interface CRMPageHeaderProps {
  title: ReactNode;
  subtitle?: ReactNode;
  children?: ReactNode;
  /** Optional badge/tag next to the title */
  badge?: ReactNode;
}

export function CRMPageHeader({ title, subtitle, children, badge }: CRMPageHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <h1 className="text-4xl font-light text-[#2E2E2E] tracking-tight">{title}</h1>
          {badge}
        </div>
        {subtitle && (
          <p className="text-sm text-[#6B7280] mt-1 font-medium">{subtitle}</p>
        )}
      </div>
      {children && (
        <div className="flex items-center gap-3 flex-shrink-0">{children}</div>
      )}
    </div>
  );
}

// ─── Page Tools (search/filters bar) ───
interface CRMPageToolsProps {
  children: ReactNode;
  className?: string;
}

export function CRMPageTools({ children, className = '' }: CRMPageToolsProps) {
  return (
    <div className={`flex flex-col sm:flex-row items-start sm:items-center gap-3 ${className}`}>
      {children}
    </div>
  );
}

// ─── Search Bar ───
interface CRMSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function CRMSearchBar({ value, onChange, placeholder = 'Rechercher...', className = '' }: CRMSearchBarProps) {
  return (
    <div className={`relative flex-1 max-w-sm ${className}`}>
      <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF]" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
      </svg>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-4 py-2.5 bg-white rounded-2xl border border-[#E5E7EB] text-sm focus:outline-none focus:border-[#bcdeea] focus:ring-1 focus:ring-[#bcdeea]/30 shadow-sm transition-all placeholder:text-[#9CA3AF]"
      />
    </div>
  );
}

// ─── Content Section ───
interface CRMPageContentProps {
  children: ReactNode;
  className?: string;
}

export function CRMPageContent({ children, className = '' }: CRMPageContentProps) {
  return <div className={`flex-1 ${className}`}>{children}</div>;
}

// ─── Stats Grid (top KPI cards) ───
interface CRMStatsGridProps {
  children: ReactNode;
  cols?: 2 | 3 | 4 | 5;
}

export function CRMStatsGrid({ children, cols = 4 }: CRMStatsGridProps) {
  const colMap = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-3',
    4: 'grid-cols-2 md:grid-cols-4',
    5: 'grid-cols-2 md:grid-cols-5',
  };
  return <div className={`grid ${colMap[cols]} gap-4`}>{children}</div>;
}

// ─── Stat Card ───
interface CRMStatCardProps {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  trend?: { value: string; up: boolean };
}

export function CRMStatCard({ label, value, icon, trend }: CRMStatCardProps) {
  return (
    <div className="bg-white rounded-3xl border border-[#E5E7EB] p-5 flex items-center gap-4 shadow-sm">
      {icon && <div className="text-[#9CA3AF] shrink-0">{icon}</div>}
      <div className="min-w-0">
        <p className="text-[9px] font-bold text-[#9CA3AF] uppercase tracking-widest">{label}</p>
        <div className="flex items-center gap-2">
          <p className="text-xl font-bold text-[#2E2E2E] tracking-tight">{value}</p>
          {trend && (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              trend.up ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50'
            }`}>
              {trend.up ? '↑' : '↓'} {trend.value}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Content Grid ───
interface CRMGridProps {
  children: ReactNode;
  cols?: 1 | 2 | 3 | 4;
  className?: string;
}

export function CRMGrid({ children, cols = 3, className = '' }: CRMGridProps) {
  const colMap = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  };
  return <div className={`grid ${colMap[cols]} gap-6 ${className}`}>{children}</div>;
}

// ─── Card ───
interface CRMCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  interactive?: boolean;
}

export function CRMCard({ children, className = '', onClick, interactive }: CRMCardProps) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      onClick={onClick}
      className={`bg-white rounded-3xl border border-[#E5E7EB] p-5 shadow-sm ${
        interactive || onClick
          ? 'hover:shadow-md hover:border-[#bcdeea]/40 transition-all cursor-pointer'
          : ''
      } ${onClick ? 'text-left w-full' : ''} ${className}`}
    >
      {children}
    </Tag>
  );
}

// ─── Filter Pill ───
interface CRMFilterPillProps {
  label: string;
  active: boolean;
  onClick: () => void;
  color?: string;
}

export function CRMFilterPill({ label, active, onClick, color }: CRMFilterPillProps) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition-all whitespace-nowrap ${
        active
          ? color
            ? `text-[#2E2E2E]`
            : 'bg-[#2E2E2E] text-white'
          : 'text-[#6B7280] hover:bg-gray-50'
      }`}
      style={active && color ? { backgroundColor: color } : undefined}
    >
      {label}
    </button>
  );
}

// ─── Empty State ───
interface CRMEmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function CRMEmptyState({ icon, title, description, action }: CRMEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      {icon && <div className="text-[#9CA3AF] mb-4">{icon}</div>}
      <h3 className="text-lg font-bold text-[#2E2E2E] mb-2">{title}</h3>
      {description && <p className="text-sm text-[#6B7280] max-w-sm">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
