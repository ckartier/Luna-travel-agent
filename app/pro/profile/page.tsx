'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowLeft, Loader2, LogOut, Save, BadgeEuro, Percent, Languages } from 'lucide-react';
import { useAuth } from '@/src/contexts/AuthContext';
import { updateUserProfile } from '@/src/lib/firebase/crm';
import { LOCALE_LABELS, type LunaLocale } from '@/src/lib/i18n/translations';
import { detectProAuthLocale, PRO_AUTH_LOCALE_STORAGE_KEY } from '@/src/lib/i18n/proAuth';
import { PRO_PROFILE_COPY } from '@/src/lib/i18n/proProfile';

export default function ProProfilePage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, userProfile, loading, logout, refreshProfile } = useAuth();
    const [saving, setSaving] = useState(false);
    const [loggingOut, setLoggingOut] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState('');
    const [proLocale, setProLocale] = useState<LunaLocale>('fr');
    const [form, setForm] = useState({
        displayName: '',
        agency: '',
        phone: '',
        bio: '',
        currency: 'EUR',
        defaultCommissionRate: '12',
        minimumTripBudget: '',
        targetAverageTicket: '',
    });
    const copy = PRO_PROFILE_COPY[proLocale];

    useEffect(() => {
        const resolved = detectProAuthLocale(searchParams?.get('lang'));
        setProLocale(resolved);
        if (typeof window !== 'undefined') {
            window.localStorage.setItem(PRO_AUTH_LOCALE_STORAGE_KEY, resolved);
        }
    }, [searchParams]);

    const handleProLocaleChange = (locale: LunaLocale) => {
        setProLocale(locale);
        if (typeof window !== 'undefined') {
            window.localStorage.setItem(PRO_AUTH_LOCALE_STORAGE_KEY, locale);
        }
    };

    const parseOptionalNumber = (value: string): number | undefined => {
        const trimmed = value.trim();
        if (!trimmed) return undefined;
        const numberValue = Number(trimmed);
        return Number.isFinite(numberValue) ? numberValue : undefined;
    };

    useEffect(() => {
        if (!userProfile) return;
        setForm({
            displayName: userProfile.displayName || '',
            agency: userProfile.agency || '',
            phone: userProfile.phone || '',
            bio: userProfile.bio || '',
            currency: userProfile.proPricing?.currency || 'EUR',
            defaultCommissionRate:
                typeof userProfile.proPricing?.defaultCommissionRate === 'number'
                    ? String(userProfile.proPricing.defaultCommissionRate)
                    : '12',
            minimumTripBudget:
                typeof userProfile.proPricing?.minimumTripBudget === 'number'
                    ? String(userProfile.proPricing.minimumTripBudget)
                    : '',
            targetAverageTicket:
                typeof userProfile.proPricing?.targetAverageTicket === 'number'
                    ? String(userProfile.proPricing.targetAverageTicket)
                    : '',
        });
    }, [userProfile]);

    const handleSave = async () => {
        if (!user) return;
        setError('');
        setSaved(false);
        setSaving(true);
        try {
            const commissionNumber = Number(form.defaultCommissionRate || '0');
            await updateUserProfile(user.uid, {
                displayName: form.displayName.trim() || copy.defaultUser,
                agency: form.agency.trim(),
                phone: form.phone.trim(),
                bio: form.bio.trim(),
                proPricing: {
                    currency: (form.currency || 'EUR').trim().toUpperCase(),
                    defaultCommissionRate: Number.isFinite(commissionNumber) ? Math.max(0, Math.min(100, commissionNumber)) : 0,
                    minimumTripBudget: parseOptionalNumber(form.minimumTripBudget),
                    targetAverageTicket: parseOptionalNumber(form.targetAverageTicket),
                },
            });
            await refreshProfile();
            setSaved(true);
            setTimeout(() => setSaved(false), 2500);
        } catch {
            setError(copy.saveError);
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = async () => {
        setLoggingOut(true);
        try {
            await logout();
            router.replace(`/login/pro?lang=${proLocale}`);
        } finally {
            setLoggingOut(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-[#5a8fa3]" />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6">
                <div className="max-w-xl w-full bg-white border border-gray-200 rounded-2xl p-8">
                    <h1 className="text-2xl text-[#1f2937] mb-3">{copy.unauthTitle}</h1>
                    <p className="text-sm text-gray-600 mb-6">
                        {copy.unauthSubtitle}
                    </p>
                    <Link href={`/login/pro?lang=${proLocale}`} className="px-4 py-2 rounded-lg bg-[#1f2937] text-white text-sm inline-flex">
                        {copy.login}
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f6f7f9] px-4 md:px-10 py-8">
            <div className="max-w-[900px] mx-auto space-y-6">
                <section className="bg-white border border-gray-200 rounded-2xl p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#2c667b] inline-flex items-center gap-1.5">
                        <Languages size={12} /> {copy.languageSelector}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                        {Object.entries(LOCALE_LABELS).map(([code, meta]) => {
                            const locale = code as LunaLocale;
                            const active = locale === proLocale;
                            return (
                                <button
                                    key={locale}
                                    type="button"
                                    onClick={() => handleProLocaleChange(locale)}
                                    className={`rounded-lg border px-2 py-1.5 text-center transition-colors ${active ? 'border-[#5a8fa3] bg-[#f4f9fb] text-[#2c667b]' : 'border-gray-200 bg-white text-gray-500 hover:border-[#5a8fa3]/35'}`}
                                >
                                    <span className="text-[11px]">{meta.flag}</span>{' '}
                                    <span className="text-[10px] font-semibold uppercase tracking-wider">{locale}</span>
                                </button>
                            );
                        })}
                    </div>
                </section>

                <header className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <p className="text-[11px] uppercase tracking-[0.25em] font-bold text-[#5a8fa3]">{copy.headerBadge}</p>
                            <h1 className="text-2xl md:text-3xl text-[#111827] mt-2">{copy.headerTitle}</h1>
                            <p className="text-sm text-gray-600 mt-2">
                                {copy.headerSubtitle}
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Link href={`/pro/travel?lang=${proLocale}`} className="px-4 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-50 inline-flex items-center gap-2">
                                <ArrowLeft size={14} /> {copy.backProSpace}
                            </Link>
                            <button
                                type="button"
                                onClick={handleLogout}
                                disabled={loggingOut}
                                className="px-4 py-2 text-sm rounded-lg bg-[#1f2937] text-white hover:bg-black inline-flex items-center gap-2 disabled:opacity-60"
                            >
                                {loggingOut ? <Loader2 size={14} className="animate-spin" /> : <LogOut size={14} />}
                                {loggingOut ? copy.logoutLoading : copy.logout}
                            </button>
                        </div>
                    </div>
                </header>

                <section className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <label className="text-sm text-gray-700">
                            {copy.displayNameLabel}
                            <input
                                value={form.displayName}
                                onChange={(e) => setForm((prev) => ({ ...prev, displayName: e.target.value }))}
                                className="mt-2 w-full px-4 py-3 rounded-xl border border-gray-300 text-sm outline-none focus:border-[#5a8fa3]"
                                placeholder={copy.displayNamePlaceholder}
                            />
                        </label>
                        <label className="text-sm text-gray-700">
                            {copy.emailLabel}
                            <input
                                value={userProfile?.email || user.email || ''}
                                disabled
                                className="mt-2 w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-500"
                            />
                        </label>
                        <label className="text-sm text-gray-700">
                            {copy.agencyLabel}
                            <input
                                value={form.agency}
                                onChange={(e) => setForm((prev) => ({ ...prev, agency: e.target.value }))}
                                className="mt-2 w-full px-4 py-3 rounded-xl border border-gray-300 text-sm outline-none focus:border-[#5a8fa3]"
                                placeholder={copy.agencyPlaceholder}
                            />
                        </label>
                        <label className="text-sm text-gray-700">
                            {copy.phoneLabel}
                            <input
                                value={form.phone}
                                onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                                className="mt-2 w-full px-4 py-3 rounded-xl border border-gray-300 text-sm outline-none focus:border-[#5a8fa3]"
                                placeholder={copy.phonePlaceholder}
                            />
                        </label>
                    </div>

                    <label className="text-sm text-gray-700 block">
                        {copy.bioLabel}
                        <textarea
                            value={form.bio}
                            onChange={(e) => setForm((prev) => ({ ...prev, bio: e.target.value }))}
                            className="mt-2 w-full min-h-[140px] px-4 py-3 rounded-xl border border-gray-300 text-sm outline-none focus:border-[#5a8fa3]"
                            placeholder={copy.bioPlaceholder}
                        />
                    </label>

                    <div id="pricing" className="pt-3 border-t border-gray-200">
                        <p className="text-[11px] uppercase tracking-[0.2em] text-gray-500 font-semibold mb-4">{copy.pricingTitle}</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <label className="text-sm text-gray-700">
                                {copy.currencyLabel}
                                <input
                                    value={form.currency}
                                    onChange={(e) => setForm((prev) => ({ ...prev, currency: e.target.value }))}
                                    className="mt-2 w-full px-4 py-3 rounded-xl border border-gray-300 text-sm outline-none focus:border-[#5a8fa3]"
                                    placeholder={copy.currencyPlaceholder}
                                />
                            </label>
                            <label className="text-sm text-gray-700">
                                {copy.commissionDefaultLabel}
                                <input
                                    type="number"
                                    min={0}
                                    max={100}
                                    value={form.defaultCommissionRate}
                                    onChange={(e) => setForm((prev) => ({ ...prev, defaultCommissionRate: e.target.value }))}
                                    className="mt-2 w-full px-4 py-3 rounded-xl border border-gray-300 text-sm outline-none focus:border-[#5a8fa3]"
                                />
                            </label>
                            <label className="text-sm text-gray-700">
                                {copy.minBudgetLabel}
                                <input
                                    type="number"
                                    min={0}
                                    value={form.minimumTripBudget}
                                    onChange={(e) => setForm((prev) => ({ ...prev, minimumTripBudget: e.target.value }))}
                                    className="mt-2 w-full px-4 py-3 rounded-xl border border-gray-300 text-sm outline-none focus:border-[#5a8fa3]"
                                    placeholder={copy.minBudgetPlaceholder}
                                />
                            </label>
                            <label className="text-sm text-gray-700">
                                {copy.targetTicketLabel}
                                <input
                                    type="number"
                                    min={0}
                                    value={form.targetAverageTicket}
                                    onChange={(e) => setForm((prev) => ({ ...prev, targetAverageTicket: e.target.value }))}
                                    className="mt-2 w-full px-4 py-3 rounded-xl border border-gray-300 text-sm outline-none focus:border-[#5a8fa3]"
                                    placeholder={copy.targetTicketPlaceholder}
                                />
                            </label>
                        </div>
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                                <p className="text-[11px] text-gray-500 inline-flex items-center gap-1.5"><Percent size={12} /> {copy.commissionCard}</p>
                                <p className="text-sm font-semibold text-[#111827] mt-1">{form.defaultCommissionRate || '0'}%</p>
                            </div>
                            <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                                <p className="text-[11px] text-gray-500 inline-flex items-center gap-1.5"><BadgeEuro size={12} /> {copy.minBudgetCard}</p>
                                <p className="text-sm font-semibold text-[#111827] mt-1">{form.minimumTripBudget || '-'} {form.currency || 'EUR'}</p>
                            </div>
                            <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                                <p className="text-[11px] text-gray-500 inline-flex items-center gap-1.5"><BadgeEuro size={12} /> {copy.targetTicketCard}</p>
                                <p className="text-sm font-semibold text-[#111827] mt-1">{form.targetAverageTicket || '-'} {form.currency || 'EUR'}</p>
                            </div>
                        </div>
                    </div>

                    {error ? (
                        <p className="text-sm text-red-600">{error}</p>
                    ) : null}
                    {saved ? (
                        <p className="text-sm text-emerald-700">{copy.saveSuccess}</p>
                    ) : null}

                    <div className="pt-2">
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={saving}
                            className="px-5 py-3 rounded-xl bg-[#5a8fa3] text-white text-sm font-semibold hover:bg-[#477d90] inline-flex items-center gap-2 disabled:opacity-60"
                        >
                            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                            {saving ? copy.saving : copy.save}
                        </button>
                    </div>
                </section>
            </div>
        </div>
    );
}
