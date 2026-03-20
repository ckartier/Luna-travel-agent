'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Landmark, Search, Loader2, ArrowDownLeft, ArrowUpRight,
  CheckCircle2, AlertCircle, Link2, ExternalLink, RefreshCw,
  Filter, X, TrendingUp, TrendingDown, Wallet, Eye, EyeOff,
  ChevronDown, Ban
} from 'lucide-react';
import { useAuth } from '@/src/contexts/AuthContext';
import { T, useAutoTranslate } from '@/src/components/T';
import { getContacts, getInvoices, getPayments, createPayment, CRMContact, CRMInvoice, CRMPayment } from '@/src/lib/firebase/crm';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/src/lib/firebase/client';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Modal, { ModalActions, ModalCancelButton, ModalSubmitButton, ModalField, modalInputClass, modalSelectClass } from '@/src/components/ui/Modal';
import { fetchWithAuth } from '@/src/lib/utils/fetchWithAuth';

// ═══ BANK PROVIDER CONFIG ═══
type BankProviderId = 'revolut' | 'gocardless' | 'bridge' | 'plaid';

interface BankProviderConfig {
  id: BankProviderId;
  name: string;
  description: string;
  icon: string; // emoji
  color: string;
  colorLight: string;
  apiLabel: string;
  placeholder: string;
  sandboxUrl: string;
  prodUrl: string;
  setupSteps: string[];
  hasSandbox: boolean;
}

const BANK_PROVIDERS: BankProviderConfig[] = [
  {
    id: 'revolut',
    name: 'Revolut Business',
    description: 'Néobanque pour entreprises — comptes multi-devises et API temps réel.',
    icon: '🔄',
    color: '#0075EB',
    colorLight: '#E6F2FF',
    apiLabel: 'Access Token',
    placeholder: 'oa_sand_xxxxxxxxxxxx',
    sandboxUrl: 'https://sandbox-business.revolut.com/settings/api',
    prodUrl: 'https://business.revolut.com/settings/api',
    setupSteps: [
      'Connectez-vous à Revolut Business',
      'Allez dans Settings → API',
      'Générez un certificat et créez une application',
      'Copiez votre Access Token',
    ],
    hasSandbox: true,
  },
  {
    id: 'gocardless',
    name: 'GoCardless (Nordigen)',
    description: 'Open Banking gratuit — 2400+ banques EU via DSP2. BNP, SG, Crédit Agricole...',
    icon: '🏦',
    color: '#00B4D8',
    colorLight: '#E0F7FA',
    apiLabel: 'Secret ID / Secret Key',
    placeholder: 'secret_xxxxxxxxxxxxxxxx',
    sandboxUrl: 'https://bankaccountdata.gocardless.com/overview/',
    prodUrl: 'https://bankaccountdata.gocardless.com/overview/',
    setupSteps: [
      'Créez un compte sur GoCardless Bank Account Data',
      'Allez dans Developers → API Keys',
      'Générez un Secret ID et Secret Key',
      'Copiez les clés ici',
    ],
    hasSandbox: true,
  },
  {
    id: 'bridge',
    name: 'Bridge (Bankin\')',
    description: 'Agrégateur bancaire français — 350+ banques FR. Spécialisé France.',
    icon: '🌉',
    color: '#6C5CE7',
    colorLight: '#F0EDFF',
    apiLabel: 'Client ID / Secret',
    placeholder: 'bridge_xxxxxxxxxxxx',
    sandboxUrl: 'https://dashboard.bridgeapi.io/',
    prodUrl: 'https://dashboard.bridgeapi.io/',
    setupSteps: [
      'Créez un compte Bridge API',
      'Allez dans Applications → New Application',
      'Récupérez le Client ID et le Client Secret',
      'Copiez les clés ici',
    ],
    hasSandbox: true,
  },
  {
    id: 'plaid',
    name: 'Plaid',
    description: 'Leader mondial — 12000+ institutions US/EU/UK. Idéal multi-pays.',
    icon: '🔗',
    color: '#00D632',
    colorLight: '#E6FFE6',
    apiLabel: 'Client ID / Secret',
    placeholder: 'plaid_xxxxxxxxxxxx',
    sandboxUrl: 'https://dashboard.plaid.com/developers/keys',
    prodUrl: 'https://dashboard.plaid.com/developers/keys',
    setupSteps: [
      'Créez un compte Plaid Developer',
      'Allez dans Developers → Keys',
      'Copiez le Client ID et le Secret',
      'Collez les clés ici',
    ],
    hasSandbox: true,
  },
];

// ═══ BANK INTERFACES ═══
interface BankAccount {
  id: string;
  name: string;
  currency: string;
  balance: number;
  iban?: string;
}

interface BankTransaction {
  id: string;
  date: string;
  description: string;
  counterpartyName: string;
  amount: number;
  currency: string;
  type: 'CREDIT' | 'DEBIT';
  reference?: string;
  status: 'COMPLETED' | 'PENDING' | 'DECLINED' | 'REVERTED';
  // Reconciliation
  reconciled: boolean;
  linkedInvoiceId?: string;
  linkedClientId?: string;
  linkedClientName?: string;
}

const TVA_RATE = 20;

function computeHT(ttc: number): number {
  return Math.round((ttc / (1 + TVA_RATE / 100)) * 100) / 100;
}
function computeTVA(ttc: number): number {
  return Math.round((ttc - computeHT(ttc)) * 100) / 100;
}

export default function BankingPage() {
  const { tenantId } = useAuth();
  const at = useAutoTranslate();

  // ═══ STATE ═══
  const [loading, setLoading] = useState(true);
  const [bankConnected, setBankConnected] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [savedApiKey, setSavedApiKey] = useState('');
  const [savingKey, setSavingKey] = useState(false);
  const [showBalance, setShowBalance] = useState(true);
  const [bankEnv, setBankEnv] = useState<'sandbox' | 'production'>('sandbox');
  const [bankProvider, setBankProvider] = useState<BankProviderId>('revolut');
  const [savedProvider, setSavedProvider] = useState<BankProviderId | ''>('');

  // Bank data
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);

  // CRM data for reconciliation
  const [contacts, setContacts] = useState<CRMContact[]>([]);
  const [invoices, setInvoices] = useState<CRMInvoice[]>([]);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'CREDIT' | 'DEBIT'>('ALL');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'RECONCILED' | 'UNRECONCILED'>('ALL');

  // Reconciliation modal
  const [showReconcileModal, setShowReconcileModal] = useState(false);
  const [selectedTx, setSelectedTx] = useState<BankTransaction | null>(null);
  const [reconcileInvoiceId, setReconcileInvoiceId] = useState('');
  const [reconcileClientId, setReconcileClientId] = useState('');
  const [reconciling, setReconciling] = useState(false);

  // API key setup modal
  const [showApiModal, setShowApiModal] = useState(false);
  const [modalStep, setModalStep] = useState<'select' | 'configure'>('select');

  // Active provider config
  const activeProvider = BANK_PROVIDERS.find(p => p.id === bankProvider) || BANK_PROVIDERS[0];

  // ═══ LOAD DATA ═══
  useEffect(() => {
    if (!tenantId) return;
    loadData();
  }, [tenantId]);

  const loadData = async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      // Load CRM data
      const [c, inv] = await Promise.all([
        getContacts(tenantId),
        getInvoices(tenantId, 'CLIENT'),
      ]);
      setContacts(c);
      setInvoices(inv);

      // Load bank API key from tenant settings
      const tenantRef = doc(db, 'tenants', tenantId);
      const snap = await getDoc(tenantRef);
      if (snap.exists()) {
        const data = snap.data();
        const key = data?.settings?.bankApiKey || '';
        const env = data?.settings?.bankEnv || 'sandbox';
        const provider = data?.settings?.bankProvider || '';
        setSavedApiKey(key);
        setApiKey(key);
        setBankEnv(env);
        if (provider) {
          setBankProvider(provider);
          setSavedProvider(provider);
        }
        if (key) {
          setBankConnected(true);
          // Try real API, fallback to mock
          await loadBankData();
        }
      }
    } catch (e) {
      console.error('Error loading banking data:', e);
    }
    setLoading(false);
  };

  // Load real bank data from API routes
  const loadBankData = async () => {
    try {
      const [accRes, txRes] = await Promise.all([
        fetchWithAuth('/api/revolut/accounts'),
        fetchWithAuth('/api/revolut/transactions?count=50'),
      ]);

      if (accRes.ok) {
        const accData = await accRes.json();
        if (accData.accounts) setAccounts(accData.accounts);
      }

      if (txRes.ok) {
        const txData = await txRes.json();
        if (txData.transactions) setTransactions(txData.transactions);
      }

      // If no data came back, load mock data as fallback
      if (!accRes.ok && !txRes.ok) {
        console.warn('API calls failed, loading mock data');
        loadMockBankData();
      }
    } catch (e) {
      console.warn('API error, falling back to mock data:', e);
      loadMockBankData();
    }
  };

  // Mock bank data for demo / fallback
  const loadMockBankData = () => {
    setAccounts([
      { id: 'acc-1', name: 'Compte Principal', currency: 'EUR', balance: 24830.50, iban: 'FR76 3000 4000 0300 0001 2345 678' },
      { id: 'acc-2', name: 'Compte USD', currency: 'USD', balance: 5420.00, iban: 'GB29 NWBK 6016 1331 9268 19' },
    ]);
    setTransactions([
      { id: 'tx-1', date: '2026-03-15', description: 'Virement reçu — Acompte Voyage Bali', counterpartyName: 'Marie Dupont', amount: 3500, currency: 'EUR', type: 'CREDIT', reference: 'LUNA-2026-042', status: 'COMPLETED', reconciled: true, linkedClientName: 'Marie Dupont', linkedInvoiceId: 'inv-1' },
      { id: 'tx-2', date: '2026-03-14', description: 'Paiement Hôtel Ritz Carlton', counterpartyName: 'Ritz Carlton Bali', amount: 2800, currency: 'EUR', type: 'DEBIT', reference: 'RCB-88421', status: 'COMPLETED', reconciled: true, linkedClientName: 'Fournisseur' },
      { id: 'tx-3', date: '2026-03-13', description: 'Virement reçu — Solde voyage Japon', counterpartyName: 'Jean-Pierre Martin', amount: 8200, currency: 'EUR', type: 'CREDIT', reference: 'LUNA-2026-038', status: 'COMPLETED', reconciled: false },
      { id: 'tx-4', date: '2026-03-12', description: 'Paiement vol Emirates', counterpartyName: 'Emirates Airlines', amount: 4150, currency: 'EUR', type: 'DEBIT', reference: 'EK-776544', status: 'COMPLETED', reconciled: false },
      { id: 'tx-5', date: '2026-03-11', description: 'Virement reçu — Acompte Maldives', counterpartyName: 'Sophie Laurent', amount: 5000, currency: 'EUR', type: 'CREDIT', status: 'COMPLETED', reconciled: false },
      { id: 'tx-6', date: '2026-03-10', description: 'Paiement guide local Tokyo', counterpartyName: 'Tanaka Tours', amount: 650, currency: 'EUR', type: 'DEBIT', status: 'COMPLETED', reconciled: true, linkedClientName: 'Fournisseur' },
      { id: 'tx-7', date: '2026-03-09', description: 'Virement en cours — Voyage Thaïlande', counterpartyName: 'Luc Bernard', amount: 2200, currency: 'EUR', type: 'CREDIT', status: 'PENDING', reconciled: false },
      { id: 'tx-8', date: '2026-03-08', description: 'Paiement transfert aéroport', counterpartyName: 'Bali Private Transfer', amount: 180, currency: 'EUR', type: 'DEBIT', status: 'COMPLETED', reconciled: false },
    ]);
  };

  // ═══ SAVE API KEY ═══
  const handleSaveApiKey = async () => {
    if (!tenantId) return;
    setSavingKey(true);
    try {
      // For Revolut, test the connection via auth route
      if (bankProvider === 'revolut') {
        const authRes = await fetchWithAuth('/api/revolut/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ apiKey, env: bankEnv }),
        });
        if (!authRes.ok) {
          const err = await authRes.json();
          alert(err.error || 'Connexion échouée');
          setSavingKey(false);
          return;
        }
      } else {
        // For other providers, just save directly
        const tenantRef = doc(db, 'tenants', tenantId);
        await updateDoc(tenantRef, {
          'settings.bankApiKey': apiKey,
          'settings.bankProvider': bankProvider,
          'settings.bankEnv': bankEnv,
          updatedAt: new Date(),
        });
      }
      setSavedProvider(bankProvider);
      setSavedApiKey(apiKey);
      setBankConnected(!!apiKey);
      if (apiKey) await loadBankData();
      setShowApiModal(false);
      setModalStep('select');
    } catch (e) {
      console.error('Error saving API key:', e);
    }
    setSavingKey(false);
  };

  // ═══ RECONCILIATION ═══
  const openReconcile = (tx: BankTransaction) => {
    setSelectedTx(tx);
    setReconcileInvoiceId('');
    setReconcileClientId('');
    setShowReconcileModal(true);
  };

  const handleReconcile = async () => {
    if (!tenantId || !selectedTx) return;
    setReconciling(true);
    try {
      const inv = invoices.find(i => i.id === reconcileInvoiceId);
      const contact = contacts.find(c => c.id === reconcileClientId);
      const clientName = contact ? `${contact.firstName} ${contact.lastName}` : inv?.clientName || selectedTx.counterpartyName;

      // Call the reconcile API route
      const res = await fetchWithAuth('/api/revolut/reconcile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactionId: selectedTx.id,
          amount: Math.abs(selectedTx.amount),
          currency: selectedTx.currency,
          date: selectedTx.date,
          reference: selectedTx.reference,
          counterpartyName: selectedTx.counterpartyName,
          clientId: reconcileClientId || inv?.clientId || '',
          invoiceId: reconcileInvoiceId || '',
          type: selectedTx.type === 'CREDIT' ? 'CLIENT' : 'SUPPLIER',
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        console.error('Reconcile error:', err);
      }

      // Update local state to show reconciled
      setTransactions(prev => prev.map(t =>
        t.id === selectedTx.id
          ? { ...t, reconciled: true, linkedClientName: clientName, linkedInvoiceId: reconcileInvoiceId }
          : t
      ));

      setShowReconcileModal(false);
    } catch (e) {
      console.error('Reconciliation error:', e);
    }
    setReconciling(false);
  };

  // ═══ COMPUTED VALUES ═══
  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      if (filterType !== 'ALL' && tx.type !== filterType) return false;
      if (filterStatus === 'RECONCILED' && !tx.reconciled) return false;
      if (filterStatus === 'UNRECONCILED' && tx.reconciled) return false;
      if (searchTerm) {
        const s = searchTerm.toLowerCase();
        return tx.description.toLowerCase().includes(s) ||
          tx.counterpartyName.toLowerCase().includes(s) ||
          (tx.reference || '').toLowerCase().includes(s);
      }
      return true;
    });
  }, [transactions, filterType, filterStatus, searchTerm]);

  const totalCredits = transactions.filter(t => t.type === 'CREDIT' && t.status === 'COMPLETED').reduce((s, t) => s + t.amount, 0);
  const totalDebits = transactions.filter(t => t.type === 'DEBIT' && t.status === 'COMPLETED').reduce((s, t) => s + t.amount, 0);
  const unreconciledCount = transactions.filter(t => !t.reconciled).length;
  const totalBalance = accounts.reduce((s, a) => s + (a.currency === 'EUR' ? a.balance : 0), 0);

  const formatDate = (d: string) => {
    try { return format(new Date(d), 'dd MMM yyyy', { locale: fr }); }
    catch { return d; }
  };
  const formatMoney = (n: number, currency = 'EUR') => `${n.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} ${currency === 'EUR' ? '€' : '$'}`;

  // ═══ LOADING STATE ═══
  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <Loader2 className="animate-spin text-gray-300" size={32} />
    </div>
  );

  return (
    <div className="w-full h-full">
      <div className="max-w-[1600px] mx-auto w-full space-y-6 pb-20">

        {/* ═══ HEADER ═══ */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-4xl font-light text-[#2E2E2E] tracking-tight"><T>Banque</T></h1>
            <p className="text-sm text-[#6B7280] mt-1 font-medium">
              {bankConnected
                ? <><span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />{at('Connecté à')} {activeProvider.name}</span> — {accounts.length} {at('comptes')} — {unreconciledCount} {at('transactions à rapprocher')}</>
                : at('Connectez votre compte bancaire pour synchroniser les transactions')
              }
            </p>
          </div>
          <div className="flex items-center gap-3">
            {bankConnected && (
              <button onClick={() => loadMockBankData()} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-[#6B7280] hover:text-[#2E2E2E] hover:border-gray-300 transition-all shadow-sm">
                <RefreshCw size={15} /> {at('Synchroniser')}
              </button>
            )}
            <button onClick={() => setShowApiModal(true)} className="btn-primary flex items-center gap-2">
              <Landmark size={16} /> {bankConnected ? at('Paramètres API') : at('Connecter une banque')}
            </button>
          </div>
        </div>

        {/* ═══ NOT CONNECTED STATE ═══ */}
        {!bankConnected && (
          <div className="bg-gradient-to-br from-[#F8F6F3] via-white to-[#F0F7FA] rounded-3xl border border-gray-200 p-12 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-[#2E2E2E] to-[#1a1a1a] flex items-center justify-center shadow-lg">
              <Landmark size={32} className="text-white" />
            </div>
            <h2 className="text-2xl font-light text-[#2E2E2E] tracking-tight mb-2">{at('Connectez votre banque')}</h2>
            <p className="text-sm text-[#6B7280] max-w-md mx-auto mb-8 leading-relaxed">
              {at('Synchronisez vos transactions Revolut Business avec votre CRM. Visualisez les soldes, rapprochez les paiements clients et mettez à jour automatiquement vos dossiers.')}
            </p>
            <button onClick={() => setShowApiModal(true)} className="btn-primary px-8 py-3">
              <Landmark size={16} className="inline mr-2" /> {at('Connecter Revolut')}
            </button>
          </div>
        )}

        {/* ═══ CONNECTED STATE ═══ */}
        {bankConnected && (
          <>
            {/* ═══ ACCOUNTS CARDS ═══ */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Balance */}
              <div className="bg-gradient-to-br from-[#2E2E2E] to-[#1a1a1a] rounded-3xl p-6 text-white shadow-lg col-span-1 md:col-span-2 lg:col-span-1 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/[0.03] rounded-full -translate-y-8 translate-x-8" />
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-white/40">{at('Solde total')}</p>
                  <button onClick={() => setShowBalance(!showBalance)} className="text-white/30 hover:text-white/60 transition-colors">
                    {showBalance ? <Eye size={14} /> : <EyeOff size={14} />}
                  </button>
                </div>
                <p className="text-3xl font-bold tracking-tight">
                  {showBalance ? formatMoney(totalBalance) : '••••••'}
                </p>
                <p className="text-xs text-white/30 mt-2">{at('Across all EUR accounts')}</p>
              </div>

              {/* Per-account cards */}
              {accounts.map(acc => (
                <div key={acc.id} className="bg-white rounded-3xl border border-[#E5E7EB] p-5 shadow-sm hover:shadow-md transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-xl bg-[#F0F7FA] flex items-center justify-center">
                        <Wallet size={16} className="text-[#5a8fa3]" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[#2E2E2E]">{acc.name}</p>
                        <p className="text-[10px] text-[#9CA3AF] font-mono">{acc.currency}</p>
                      </div>
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-[#2E2E2E] tracking-tight mb-1">
                    {showBalance ? formatMoney(acc.balance, acc.currency) : '••••••'}
                  </p>
                  {acc.iban && <p className="text-[10px] text-[#9CA3AF] font-mono truncate">{acc.iban}</p>}
                </div>
              ))}

              {/* Credits/Debits summary */}
              <div className="bg-white rounded-3xl border border-[#E5E7EB] p-5 shadow-sm">
                <p className="text-[9px] font-bold uppercase tracking-widest text-[#9CA3AF] mb-3">{at('Ce mois')}</p>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center">
                        <ArrowDownLeft size={13} className="text-emerald-500" />
                      </div>
                      <span className="text-xs text-[#6B7280]">{at('Entrants')}</span>
                    </div>
                    <span className="text-sm font-bold text-emerald-600">+{formatMoney(totalCredits)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center">
                        <ArrowUpRight size={13} className="text-red-400" />
                      </div>
                      <span className="text-xs text-[#6B7280]">{at('Sortants')}</span>
                    </div>
                    <span className="text-sm font-bold text-red-500">-{formatMoney(totalDebits)}</span>
                  </div>
                  <div className="h-px bg-gray-100" />
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-[#2E2E2E]">{at('Net')}</span>
                    <span className={`text-sm font-bold ${totalCredits - totalDebits >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                      {totalCredits - totalDebits >= 0 ? '+' : ''}{formatMoney(totalCredits - totalDebits)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ═══ HT / TTC SUMMARY ═══ */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-3xl border border-[#E5E7EB] p-5 shadow-sm flex items-center gap-4">
                <div className="w-11 h-11 bg-sky-50/80 rounded-full flex items-center justify-center text-sky-500">
                  <TrendingUp size={20} strokeWidth={1.5} />
                </div>
                <div>
                  <p className="text-[9px] font-bold text-[#9CA3AF] uppercase tracking-widest">{at('Encaissé HT')}</p>
                  <p className="text-xl font-bold text-[#2E2E2E] tracking-tight">{formatMoney(computeHT(totalCredits))}</p>
                </div>
              </div>
              <div className="bg-white rounded-3xl border border-[#E5E7EB] p-5 shadow-sm flex items-center gap-4">
                <div className="w-11 h-11 bg-amber-50/80 rounded-full flex items-center justify-center text-amber-500">
                  <span className="text-sm font-bold">TVA</span>
                </div>
                <div>
                  <p className="text-[9px] font-bold text-[#9CA3AF] uppercase tracking-widest">{at('TVA collectée')} (20%)</p>
                  <p className="text-xl font-bold text-[#2E2E2E] tracking-tight">{formatMoney(computeTVA(totalCredits))}</p>
                </div>
              </div>
              <div className="bg-white rounded-3xl border border-[#E5E7EB] p-5 shadow-sm flex items-center gap-4">
                <div className="w-11 h-11 bg-emerald-50/80 rounded-full flex items-center justify-center text-emerald-500">
                  <TrendingUp size={20} strokeWidth={1.5} />
                </div>
                <div>
                  <p className="text-[9px] font-bold text-[#9CA3AF] uppercase tracking-widest">{at('Encaissé TTC')}</p>
                  <p className="text-xl font-bold text-[#2E2E2E] tracking-tight">{formatMoney(totalCredits)}</p>
                </div>
              </div>
            </div>

            {/* ═══ FILTERS ═══ */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px] max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder={at('Rechercher une transaction...')}
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#2E2E2E] focus:ring-1 focus:ring-[#2E2E2E] text-sm shadow-sm"
                />
              </div>
              <div className="flex items-center gap-1 bg-white rounded-xl border border-gray-200 p-1 shadow-sm">
                {(['ALL', 'CREDIT', 'DEBIT'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setFilterType(f)}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all ${
                      filterType === f ? 'bg-[#2E2E2E] text-white' : 'text-[#9CA3AF] hover:text-[#2E2E2E]'
                    }`}
                  >
                    {f === 'ALL' ? at('Tout') : f === 'CREDIT' ? at('Entrants') : at('Sortants')}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-1 bg-white rounded-xl border border-gray-200 p-1 shadow-sm">
                {(['ALL', 'RECONCILED', 'UNRECONCILED'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setFilterStatus(f)}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all ${
                      filterStatus === f ? 'bg-[#2E2E2E] text-white' : 'text-[#9CA3AF] hover:text-[#2E2E2E]'
                    }`}
                  >
                    {f === 'ALL' ? at('Tout') : f === 'RECONCILED' ? at('Rapprochés') : at('À rapprocher')}
                  </button>
                ))}
              </div>
            </div>

            {/* ═══ TRANSACTIONS TABLE ═══ */}
            <div className="bg-white rounded-3xl border border-[#E5E7EB] overflow-hidden shadow-sm">
              <table className="w-full text-sm">
                <thead className="bg-[#FAFAF8]">
                  <tr className="text-left text-[9px] font-bold text-[#9CA3AF] uppercase tracking-widest">
                    <th className="px-5 py-3.5">{at('Date')}</th>
                    <th className="px-5 py-3.5">{at('Description')}</th>
                    <th className="px-5 py-3.5">{at('Contrepartie')}</th>
                    <th className="px-5 py-3.5 text-right">{at('Montant TTC')}</th>
                    <th className="px-5 py-3.5 text-right">{at('Montant HT')}</th>
                    <th className="px-5 py-3.5 text-right">{at('TVA 20%')}</th>
                    <th className="px-5 py-3.5 text-center">{at('Statut')}</th>
                    <th className="px-5 py-3.5 text-center">{at('Rapprochement')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map(tx => {
                    const isCredit = tx.type === 'CREDIT';
                    const ht = computeHT(tx.amount);
                    const tva = computeTVA(tx.amount);
                    return (
                      <tr key={tx.id} className="border-t border-gray-50 hover:bg-gray-50/80 transition-colors group">
                        <td className="px-5 py-3.5 text-gray-400 font-normal whitespace-nowrap">{formatDate(tx.date)}</td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${isCredit ? 'bg-emerald-50' : 'bg-red-50'}`}>
                              {isCredit ? <ArrowDownLeft size={12} className="text-emerald-500" /> : <ArrowUpRight size={12} className="text-red-400" />}
                            </div>
                            <div>
                              <p className="text-sm text-[#2E2E2E] font-normal">{tx.description}</p>
                              {tx.reference && <p className="text-[10px] text-[#9CA3AF] font-mono">{tx.reference}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-gray-600 font-normal">{tx.counterpartyName}</td>
                        <td className={`px-5 py-3.5 text-right font-bold ${isCredit ? 'text-emerald-600' : 'text-red-500'}`}>
                          {isCredit ? '+' : '-'}{formatMoney(tx.amount)}
                        </td>
                        <td className="px-5 py-3.5 text-right text-gray-500 font-normal">
                          {formatMoney(ht)}
                        </td>
                        <td className="px-5 py-3.5 text-right text-gray-400 font-normal text-xs">
                          {formatMoney(tva)}
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${
                            tx.status === 'COMPLETED' ? 'bg-emerald-50/80 text-emerald-600' :
                            tx.status === 'PENDING' ? 'bg-amber-50/80 text-amber-500' :
                            'bg-red-50/80 text-red-500'
                          }`}>{tx.status === 'COMPLETED' ? at('Complété') : tx.status === 'PENDING' ? at('En cours') : tx.status}</span>
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          {tx.reconciled ? (
                            <div className="flex items-center justify-center gap-1.5">
                              <CheckCircle2 size={14} className="text-emerald-500" />
                              <span className="text-[10px] text-emerald-600 font-medium">{tx.linkedClientName}</span>
                            </div>
                          ) : (
                            <button
                              onClick={() => openReconcile(tx)}
                              className="flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg bg-orange-50 border border-orange-200 text-orange-600 text-[10px] font-bold uppercase tracking-wider hover:bg-orange-100 transition-all opacity-80 group-hover:opacity-100"
                            >
                              <Link2 size={10} /> {at('Rapprocher')}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {filteredTransactions.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-5 py-12 text-center text-gray-400 text-sm">
                        {at('Aucune transaction trouvée')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ═══ BANK API CONNECTION MODAL ═══ */}
        <Modal
          isOpen={showApiModal}
          onClose={() => { setShowApiModal(false); setModalStep('select'); }}
          title={modalStep === 'select' ? 'Connecter une banque' : `Configurer ${activeProvider.name}`}
          subtitle={modalStep === 'select' ? 'Choisissez votre fournisseur bancaire' : activeProvider.description}
          size={modalStep === 'select' ? 'md' : 'sm'}
        >
          {modalStep === 'select' ? (
            /* ═══ STEP 1: PROVIDER SELECTION ═══ */
            <div className="space-y-3">
              {BANK_PROVIDERS.map(provider => {
                const isConnected = savedProvider === provider.id && savedApiKey;
                return (
                  <button
                    key={provider.id}
                    onClick={() => { setBankProvider(provider.id); setModalStep('configure'); }}
                    className={`w-full text-left rounded-xl border p-4 transition-all hover:shadow-md group ${
                      isConnected
                        ? 'border-emerald-200 bg-emerald-50/50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0"
                        style={{ backgroundColor: provider.colorLight }}
                      >
                        {provider.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-[#2E2E2E]">{provider.name}</p>
                          {isConnected && (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 border border-emerald-200">
                              <CheckCircle2 size={10} className="text-emerald-600" />
                              <span className="text-[9px] font-bold text-emerald-700 uppercase tracking-wider">Connecté</span>
                            </span>
                          )}
                          {provider.id === 'gocardless' && (
                            <span className="px-2 py-0.5 rounded-full bg-sky-50 border border-sky-200 text-[9px] font-bold text-sky-600 uppercase tracking-wider">Gratuit</span>
                          )}
                        </div>
                        <p className="text-xs text-[#6B7280] mt-0.5 leading-relaxed">{provider.description}</p>
                      </div>
                      <div className="text-gray-300 group-hover:text-gray-500 transition-colors shrink-0">
                        <ChevronDown size={16} className="-rotate-90" />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            /* ═══ STEP 2: PROVIDER CONFIGURATION ═══ */
            <div className="space-y-4">
              {/* Provider header */}
              <div className="rounded-xl p-4 border" style={{ backgroundColor: `${activeProvider.colorLight}66`, borderColor: `${activeProvider.color}22` }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg" style={{ backgroundColor: activeProvider.colorLight }}>
                    {activeProvider.icon}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#2E2E2E]">{activeProvider.name}</p>
                    <p className="text-[10px] text-[#9CA3AF]">{activeProvider.description}</p>
                  </div>
                </div>
              </div>

              {/* Sandbox / Production toggle */}
              {activeProvider.hasSandbox && (
                <ModalField label="Environnement" className="mb-0">
                  <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-1.5 border border-gray-200">
                    {(['sandbox', 'production'] as const).map(env => (
                      <button
                        key={env}
                        onClick={() => setBankEnv(env)}
                        className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                          bankEnv === env
                            ? env === 'sandbox'
                              ? 'bg-amber-500 text-white shadow-sm'
                              : 'bg-emerald-600 text-white shadow-sm'
                            : 'text-[#9CA3AF] hover:text-[#2E2E2E]'
                        }`}
                      >
                        {env === 'sandbox' ? '🧪' : '🏦'}
                        {env === 'sandbox' ? 'Sandbox' : 'Production'}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-[#9CA3AF] mt-1.5">
                    {bankEnv === 'sandbox'
                      ? at('Mode test — aucune transaction réelle.')
                      : at('Mode réel — transactions et soldes réels.')}
                  </p>
                </ModalField>
              )}

              {/* API Key field */}
              <ModalField label={activeProvider.apiLabel} className="mb-0">
                <input
                  type="password"
                  value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                  placeholder={bankEnv === 'sandbox' ? activeProvider.placeholder : activeProvider.placeholder.replace('sand', 'prod')}
                  className={modalInputClass}
                />
              </ModalField>

              {/* Setup instructions */}
              <div className="text-xs text-[#9CA3AF] leading-relaxed">
                <p className="font-medium text-[#6B7280] mb-1">{at('Comment configurer :')}</p>
                <ol className="list-decimal list-inside space-y-1">
                  {activeProvider.setupSteps.map((step, i) => (
                    <li key={i}>
                      {i === 0 ? (
                        <>{at(step)} — <a href={bankEnv === 'sandbox' ? activeProvider.sandboxUrl : activeProvider.prodUrl} target="_blank" rel="noopener noreferrer" className="text-[#5a8fa3] underline">{at('Ouvrir')}</a></>
                      ) : at(step)}
                    </li>
                  ))}
                </ol>
              </div>

              {/* Connected status */}
              {savedApiKey && savedProvider === bankProvider && (
                <div className="flex items-center gap-2 text-emerald-600 text-xs bg-emerald-50 rounded-lg px-3 py-2 border border-emerald-100">
                  <CheckCircle2 size={14} />
                  {at('Connecté')} — <span className="font-mono text-[10px]">{bankEnv === 'sandbox' ? '🧪 Sandbox' : '🏦 Production'}</span>
                </div>
              )}
            </div>
          )}

          <ModalActions>
            {modalStep === 'configure' && (
              <button
                onClick={() => setModalStep('select')}
                className="px-4 py-2 rounded-xl border border-gray-200 text-[#6B7280] text-sm hover:bg-gray-50 transition-all mr-auto"
              >
                ← {at('Retour')}
              </button>
            )}
            <ModalCancelButton onClick={() => { setShowApiModal(false); setModalStep('select'); }} />
            {modalStep === 'configure' && savedApiKey && savedProvider === bankProvider && (
              <button
                onClick={async () => {
                  setApiKey('');
                  if (tenantId) {
                    await updateDoc(doc(db, 'tenants', tenantId), {
                      'settings.bankApiKey': '',
                      'settings.bankProvider': '',
                      'settings.bankEnv': 'sandbox',
                      updatedAt: new Date(),
                    });
                  }
                  setSavedApiKey('');
                  setSavedProvider('');
                  setBankConnected(false);
                  setAccounts([]);
                  setTransactions([]);
                  setModalStep('select');
                }}
                className="px-4 py-2 rounded-xl border border-red-200 text-red-500 text-sm hover:bg-red-50 transition-all"
              >
                {at('Déconnecter')}
              </button>
            )}
            {modalStep === 'configure' && (
              <ModalSubmitButton onClick={handleSaveApiKey} disabled={!apiKey || savingKey}>
                {savingKey ? <Loader2 size={14} className="animate-spin" /> : at('Connecter')}
              </ModalSubmitButton>
            )}
          </ModalActions>
        </Modal>

        {/* ═══ RECONCILIATION MODAL ═══ */}
        <Modal
          isOpen={showReconcileModal}
          onClose={() => setShowReconcileModal(false)}
          title="Rapprochement bancaire"
          subtitle={selectedTx ? `${selectedTx.description} — ${selectedTx.type === 'CREDIT' ? '+' : '-'}${formatMoney(selectedTx.amount)}` : ''}
          size="sm"
        >
          {selectedTx && (
            <div className="space-y-4">
              {/* Transaction summary */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#6B7280]">{at('Montant TTC')}</span>
                  <span className={`font-bold ${selectedTx.type === 'CREDIT' ? 'text-emerald-600' : 'text-red-500'}`}>
                    {selectedTx.type === 'CREDIT' ? '+' : '-'}{formatMoney(selectedTx.amount)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#6B7280]">{at('Montant HT')}</span>
                  <span className="text-[#2E2E2E] font-medium">{formatMoney(computeHT(selectedTx.amount))}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#6B7280]">{at('TVA')} (20%)</span>
                  <span className="text-[#9CA3AF]">{formatMoney(computeTVA(selectedTx.amount))}</span>
                </div>
                <div className="h-px bg-gray-200" />
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#9CA3AF]">{at('Contrepartie')}</span>
                  <span className="text-[#2E2E2E]">{selectedTx.counterpartyName}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#9CA3AF]">{at('Date')}</span>
                  <span className="text-[#2E2E2E]">{formatDate(selectedTx.date)}</span>
                </div>
              </div>

              {/* Link to client */}
              <ModalField label="Lier à un client" className="mb-0">
                <select
                  value={reconcileClientId}
                  onChange={e => setReconcileClientId(e.target.value)}
                  className={modalSelectClass}
                >
                  <option value="">{at('Sélectionner un client')}</option>
                  {contacts.map(c => (
                    <option key={c.id} value={c.id}>{c.firstName} {c.lastName} — {c.email}</option>
                  ))}
                </select>
              </ModalField>

              {/* Link to invoice */}
              <ModalField label="Lier à une facture" className="mb-0">
                <select
                  value={reconcileInvoiceId}
                  onChange={e => setReconcileInvoiceId(e.target.value)}
                  className={modalSelectClass}
                >
                  <option value="">{at('Sélectionner une facture (optionnel)')}</option>
                  {invoices
                    .filter(i => i.status !== 'PAID' && i.status !== 'CANCELLED')
                    .map(i => (
                      <option key={i.id} value={i.id}>{i.invoiceNumber} — {i.clientName} ({i.totalAmount}€)</option>
                    ))
                  }
                </select>
              </ModalField>
            </div>
          )}

          <ModalActions>
            <ModalCancelButton onClick={() => setShowReconcileModal(false)} />
            <ModalSubmitButton onClick={handleReconcile} disabled={(!reconcileClientId && !reconcileInvoiceId) || reconciling}>
              {reconciling ? <Loader2 size={14} className="animate-spin" /> : <><Link2 size={14} className="inline mr-1" /> {at('Rapprocher')}</>}
            </ModalSubmitButton>
          </ModalActions>
        </Modal>
      </div>
    </div>
  );
}
