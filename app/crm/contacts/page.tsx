'use client';

import { useState, useEffect, useCallback } from 'react';
import { Users, Search, Star, Phone, Mail, RefreshCcw, X, Plus, ChevronRight, Plane, Calendar, Target, Clock, ExternalLink, Download, FileSpreadsheet, ArrowUpDown, Sparkles, Activity, Upload, FileUp, AlertCircle, CheckCircle2, Loader2, Briefcase } from 'lucide-react';
import { getContacts, createContact, getLeadsForContact, getTripsForContact, getActivitiesForContact, CRMContact, CRMLead, CRMTrip, CRMActivity } from '@/src/lib/firebase/crm';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useAuth } from '@/src/contexts/AuthContext';
import { useVertical } from '@/src/contexts/VerticalContext';
import { T } from '@/src/components/T';
import { CRMEmptyState } from '@/app/components/CRMEmptyState';

const VIP_COLORS: Record<string, string> = {
  Standard: 'bg-gray-50 text-gray-400 border-gray-100',
  Premium: 'bg-[#bcdeea]/15 text-[#5a8fa3] border-[#bcdeea]/25',
  Gold: 'bg-[#E2C8A9]/20 text-[#8B6E4E] border-[#E2C8A9]',
  Elite: 'bg-[#2E2E2E] text-white border-[#2E2E2E]',
};

// ── Column mapping helpers ──
interface ParsedRow { [key: string]: string }
interface ColumnMapping {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  vipLevel: string;
  preferences: string;
}

const COMMON_HEADERS: Record<keyof ColumnMapping, string[]> = {
  firstName: ['prénom', 'prenom', 'firstname', 'first name', 'first_name', 'given name', 'nom de naissance'],
  lastName: ['nom', 'lastname', 'last name', 'last_name', 'family name', 'nom de famille', 'surname'],
  email: ['email', 'e-mail', 'mail', 'courriel', 'adresse email', 'adresse e-mail', 'email address'],
  phone: ['téléphone', 'telephone', 'phone', 'tel', 'mobile', 'numéro', 'phone number', 'portable'],
  vipLevel: ['vip', 'niveau', 'level', 'statut', 'status', 'vip level', 'segment', 'catégorie', 'categorie'],
  preferences: ['préférences', 'preferences', 'tags', 'intérêts', 'interets', 'interests', 'hobbies'],
};

function autoMapColumns(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = { firstName: '', lastName: '', email: '', phone: '', vipLevel: '', preferences: '' };
  const normalizedHeaders = headers.map(h => h.toLowerCase().trim());

  for (const [field, synonyms] of Object.entries(COMMON_HEADERS)) {
    for (const syn of synonyms) {
      const idx = normalizedHeaders.findIndex(h => h.includes(syn));
      if (idx !== -1) {
        mapping[field as keyof ColumnMapping] = headers[idx];
        break;
      }
    }
  }
  // Fallback: if we have "nom" but no "prénom", try splitting "Nom complet" / "Nom Prénom"
  if (!mapping.firstName && !mapping.lastName) {
    const fullNameIdx = normalizedHeaders.findIndex(h => h.includes('nom complet') || h.includes('full name') || h.includes('name') || h.includes('nom'));
    if (fullNameIdx !== -1) mapping.lastName = headers[fullNameIdx];
  }
  return mapping;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if ((c === ',' || c === ';') && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += c;
    }
  }
  result.push(current.trim());
  return result;
}

export default function CRMContacts() {
  const { tenantId } = useAuth();
  const { vertical, vEntity, vt } = useVertical();
  const isLegal = vertical.id === 'legal';
  const [contacts, setContacts] = useState<CRMContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'vip'>('name');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<CRMContact | null>(null);
  const [contactLeads, setContactLeads] = useState<CRMLead[]>([]);
  const [contactTrips, setContactTrips] = useState<CRMTrip[]>([]);
  const [contactActivities, setContactActivities] = useState<CRMActivity[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [newContact, setNewContact] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    communicationPreference: 'EMAIL' as CRMContact['communicationPreference'],
    vipLevel: 'Standard' as CRMContact['vipLevel'], preferences: ''
  });

  // ── Import State ──
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importStep, setImportStep] = useState<'upload' | 'mapping' | 'importing' | 'done'>('upload');
  const [importHeaders, setImportHeaders] = useState<string[]>([]);
  const [importRows, setImportRows] = useState<ParsedRow[]>([]);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({ firstName: '', lastName: '', email: '', phone: '', vipLevel: '', preferences: '' });
  const [importProgress, setImportProgress] = useState({ total: 0, done: 0, skipped: 0, errors: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const loadContacts = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    try { setContacts(await getContacts(tenantId)); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [tenantId]);

  useEffect(() => { loadContacts(); }, [loadContacts]);

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createContact(tenantId!, {
        firstName: newContact.firstName, lastName: newContact.lastName,
        email: newContact.email, phone: newContact.phone,
        communicationPreference: newContact.communicationPreference,
        vipLevel: newContact.vipLevel,
        preferences: newContact.preferences.split(',').map(p => p.trim()).filter(Boolean),
      });
      setIsModalOpen(false);
      setNewContact({ firstName: '', lastName: '', email: '', phone: '', communicationPreference: 'EMAIL', vipLevel: 'Standard', preferences: '' });
      loadContacts();
    } catch (e) { console.error(e); }
  };

  const openContactDetail = async (contact: CRMContact) => {
    setSelectedContact(contact);
    setLoadingDetails(true);
    try {
      const [leads, trips, activities] = await Promise.all([
        getLeadsForContact(tenantId!, contact.id!),
        getTripsForContact(tenantId!, contact.id!),
        getActivitiesForContact(tenantId!, contact.id!),
      ]);
      setContactLeads(leads);
      setContactTrips(trips);
      setContactActivities(activities);
    } catch (e) { console.error(e); }
    finally { setLoadingDetails(false); }
  };

  const filtered = contacts.filter(c => {
    const q = search.toLowerCase();
    return `${c.firstName} ${c.lastName}`.toLowerCase().includes(q) || c.email.toLowerCase().includes(q);
  }).sort((a, b) => {
    if (sortBy === 'name') return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
    if (sortBy === 'vip') {
      const vipOrder: Record<string, number> = { Elite: 0, VIP: 1, Premium: 2, Standard: 3 };
      return (vipOrder[a.vipLevel] ?? 4) - (vipOrder[b.vipLevel] ?? 4);
    }
    if (sortBy === 'date') {
      const aDate = a.createdAt instanceof Date ? a.createdAt.getTime() : (a.createdAt as any)?.toMillis?.() || 0;
      const bDate = b.createdAt instanceof Date ? b.createdAt.getTime() : (b.createdAt as any)?.toMillis?.() || 0;
      return bDate - aDate;
    }
    return 0;
  });

  const exportContactsCSV = () => {
    const headers = ['Prénom', 'Nom', 'Email', 'Téléphone', 'Niveau VIP', 'Préférences'];
    const rows = contacts.map(c => [
      c.firstName, c.lastName, c.email, c.phone || '', c.vipLevel, (c.preferences || []).join('; ')
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${(v || '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contacts_luna_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportAllDataCSV = async () => {
    const allRows: string[][] = [];
    const headers = [vt('Prénom'), vt('Nom'), 'Email', vt('Téléphone'), 'VIP', vt('Préférences'), vEntity('leadPlural'), vEntity('tripPlural'), vt('Activités')];
    for (const c of contacts) {
      try {
        const [leads, trips, activities] = await Promise.all([
          getLeadsForContact(tenantId!, c.id!),
          getTripsForContact(tenantId!, c.id!),
          getActivitiesForContact(tenantId!, c.id!),
        ]);
        allRows.push([
          c.firstName, c.lastName, c.email, c.phone || '', c.vipLevel,
          (c.preferences || []).join('; '),
          leads.map(l => `${l.destination} (${l.status})`).join(' | '),
          trips.map(t => `${t.title} ${t.startDate}-${t.endDate} ${t.amount}€`).join(' | '),
          activities.map(a => `${a.title} (${a.status})`).join(' | '),
        ]);
      } catch { allRows.push([c.firstName, c.lastName, c.email, c.phone || '', c.vipLevel, '', '', '', '']); }
    }
    const csv = [headers, ...allRows].map(r => r.map(v => `"${(v || '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `export_complet_luna_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Import Handlers ──
  const handleFileSelect = async (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    try {
      if (ext === 'csv' || ext === 'txt') {
        const text = await file.text();
        const lines = text.split(/\r?\n/).filter(l => l.trim());
        if (lines.length < 2) { alert('Le fichier ne contient pas assez de lignes.'); return; }
        const headers = parseCSVLine(lines[0]);
        const rows: ParsedRow[] = lines.slice(1).map(line => {
          const vals = parseCSVLine(line);
          const row: ParsedRow = {};
          headers.forEach((h, i) => { row[h] = vals[i] || ''; });
          return row;
        });
        setImportHeaders(headers);
        setImportRows(rows);
        setColumnMapping(autoMapColumns(headers));
        setImportStep('mapping');
      } else if (ext === 'xlsx' || ext === 'xls') {
        // Load ExcelJS dynamically
        const ExcelJS = await import('exceljs');
        const workbook = new ExcelJS.Workbook();
        const data = await file.arrayBuffer();
        await workbook.xlsx.load(data);
        const ws = workbook.worksheets[0];
        if (!ws || ws.rowCount < 2) { alert('Le fichier Excel est vide.'); return; }
        
        // Extract headers from first row
        const headerRow = ws.getRow(1);
        const headers: string[] = [];
        headerRow.eachCell((cell, colNumber) => {
          headers[colNumber - 1] = String(cell.value ?? '');
        });
        
        // Extract data rows
        const rows: ParsedRow[] = [];
        ws.eachRow((row, rowNumber) => {
          if (rowNumber === 1) return; // Skip header
          const r: ParsedRow = {};
          row.eachCell((cell, colNumber) => {
            const header = headers[colNumber - 1];
            if (header) r[header] = String(cell.value ?? '');
          });
          // Fill missing headers with empty string
          headers.forEach(h => { if (!(h in r)) r[h] = ''; });
          rows.push(r);
        });
        
        setImportHeaders(headers.filter(Boolean));
        setImportRows(rows);
        setColumnMapping(autoMapColumns(headers.filter(Boolean)));
        setImportStep('mapping');
      } else {
        alert('Format non supporté. Utilisez .csv ou .xlsx');
      }
    } catch (err) {
      console.error('Import parse error:', err);
      alert('Erreur lors de la lecture du fichier.');
    }
  };

  const handleImport = async () => {
    if (!tenantId) return;
    setImportStep('importing');
    const total = importRows.length;
    let done = 0, skipped = 0, errors = 0;
    setImportProgress({ total, done: 0, skipped: 0, errors: 0 });

    const existingEmails = new Set(contacts.map(c => c.email.toLowerCase().trim()));

    for (const row of importRows) {
      try {
        const firstName = (row[columnMapping.firstName] || '').trim();
        const lastName = (row[columnMapping.lastName] || '').trim();
        const email = (row[columnMapping.email] || '').trim();
        const phone = (row[columnMapping.phone] || '').trim();
        const vipRaw = (row[columnMapping.vipLevel] || '').trim();
        const prefsRaw = (row[columnMapping.preferences] || '').trim();

        // If no name at all, try splitting last name field
        let fn = firstName;
        let ln = lastName;
        if (!fn && ln) {
          const parts = ln.split(/\s+/);
          if (parts.length >= 2) { fn = parts[0]; ln = parts.slice(1).join(' '); }
        }

        if (!fn && !ln) { skipped++; done++; setImportProgress({ total, done, skipped, errors }); continue; }

        // Duplicate check by email
        if (email && existingEmails.has(email.toLowerCase())) {
          skipped++; done++; setImportProgress({ total, done, skipped, errors }); continue;
        }

        // Normalize VIP level
        let vipLevel: CRMContact['vipLevel'] = 'Standard';
        const vipLower = vipRaw.toLowerCase();
        if (vipLower.includes('elite') || vipLower.includes('black')) vipLevel = 'Elite';
        else if (vipLower.includes('vip') || vipLower.includes('platinum')) vipLevel = 'VIP';
        else if (vipLower.includes('premium') || vipLower.includes('gold')) vipLevel = 'Premium';

        const preferences = prefsRaw ? prefsRaw.split(/[,;|]/).map(p => p.trim()).filter(Boolean) : [];

        await createContact(tenantId, {
          firstName: fn || 'Inconnu',
          lastName: ln || '',
          email: email || `import-${Date.now()}-${done}@luna.travel`,
          phone: phone || undefined,
          vipLevel,
          preferences,
        });

        if (email) existingEmails.add(email.toLowerCase());
        done++;
        setImportProgress({ total, done, skipped, errors });
      } catch (err) {
        console.error('Import row error:', err);
        errors++; done++;
        setImportProgress({ total, done, skipped, errors });
      }
    }

    setImportStep('done');
    loadContacts();
  };

  const resetImport = () => {
    setImportStep('upload');
    setImportHeaders([]);
    setImportRows([]);
    setColumnMapping({ firstName: '', lastName: '', email: '', phone: '', vipLevel: '', preferences: '' });
    setImportProgress({ total: 0, done: 0, skipped: 0, errors: 0 });
  };

  const closeImport = () => {
    setIsImportOpen(false);
    resetImport();
  };

  return (
    <div className="w-full h-full">
      <div className="flex h-full gap-0 max-w-[1600px] mx-auto w-full  pb-20">
        {/* Main list */}
        <div className={`flex-1 flex flex-col ${selectedContact ? 'hidden md:flex' : ''} space-y-6 md:space-y-8`}>
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="space-y-1">
              <h1 className="text-4xl font-light text-[#2E2E2E] tracking-tight"><T>{vEntity('participantPlural')}</T></h1>
              <p className="text-sm text-[#6B7280] mt-1 font-medium"><T>Gestion Relation Client 360°</T> • <span className="text-[#5a8fa3]">{contacts.length} {vEntity('participantPlural')}</span></p>
            </div>
            <div className="flex items-center gap-3 w-full lg:w-auto">
              <button onClick={() => setIsImportOpen(true)} className="inline-flex items-center justify-center px-5 py-2.5 rounded-[12px] text-[14px] font-medium transition-colors cursor-pointer border border-[#E5E7EB] bg-white text-[#2E2E2E] hover:bg-[#F5F5F5] gap-2 flex-1 lg:flex-none">
                <Upload size={18} /> <span className="uppercase tracking-widest">Importer</span>
              </button>
              <button onClick={() => setIsModalOpen(true)} className="inline-flex items-center justify-center px-5 py-2.5 rounded-[12px] text-[14px] font-medium transition-colors cursor-pointer border-none gap-2 flex-1 lg:flex-none" style={{ backgroundColor: '#bcdeea', color: '#2E2E2E' }}>
                <Plus size={18} /> <span className="uppercase tracking-widest">Nouveau Contact</span>
              </button>
            </div>
          </div>

          {/* Toolbar */}
          <div className="flex flex-col xl:flex-row gap-4">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher par nom, email..."
                className="w-full pl-14 pr-6 py-4 rounded-[24px] border border-gray-100 bg-white/60 backdrop-blur-sm focus:bg-white focus:shadow-2xl focus:shadow-gray-100 transition-all outline-none text-sm font-sans"
              />
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              <div className="flex items-center gap-1 bg-white/50 border border-gray-100 rounded-[28px] p-1 shadow-sm">
                {[
                  { id: 'name', label: 'NOM' },
                  { id: 'date', label: 'RÉCENT' },
                  { id: 'vip', label: 'VIP' }
                ].map(sort => (
                  <button
                    key={sort.id}
                    onClick={() => setSortBy(sort.id as any)}
                    className={`px-6 py-2.5 rounded-[24px] text-[9px] font-semibold tracking-widest transition-all ${sortBy === sort.id ? 'bg-luna-charcoal text-white shadow-lg' : 'text-gray-400 hover:text-gray-700'}`}
                  >
                    {sort.label}
                  </button>
                ))}
              </div>

              <button onClick={exportContactsCSV} title="Exporter CSV" className="p-3.5 bg-white border border-gray-100 text-gray-400 hover:text-[#5a8fa3] rounded-2xl shadow-sm transition-all">
                <Download size={18} />
              </button>
              <button onClick={loadContacts} className="p-3.5 bg-white border border-gray-100 text-gray-400 hover:text-[#5a8fa3] rounded-2xl shadow-sm transition-all">
                <RefreshCcw size={18} className={loading ? "animate-spin" : ""} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 pr-2 no-scrollbar">
            {filtered.map(contact => (
              <motion.div key={contact.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                onClick={() => openContactDetail(contact)}
                className={`flex items-center gap-6 p-6 rounded-[32px] border bg-white/60 backdrop-blur-md shadow-sm cursor-pointer transition-all hover:shadow-xl hover:bg-white
                ${selectedContact?.id === contact.id ? 'ring-2 ring-[#bcdeea]/40 border-[#bcdeea]/40 bg-white shadow-lg' : 'border-gray-50 hover:border-[#bcdeea]/30'}`}>
                <div className="w-14 h-14 rounded-[20px] bg-gradient-to-br from-gray-50 to-white border border-gray-100 flex items-center justify-center text-gray-500 font-normal text-lg shadow-sm group-hover:scale-105 transition-transform">
                  {contact.firstName[0]}{contact.lastName[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <Link href={`/crm/clients/${contact.id}`} onClick={e => e.stopPropagation()} className="font-bold text-sm text-luna-charcoal tracking-tight block hover:text-[#5a8fa3] transition-colors uppercase truncate">{contact.firstName} {contact.lastName}</Link>
                  <div className="flex items-center gap-3 mt-1.5">
                    <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider truncate">{contact.email}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">{contact.phone || 'NO TEL'}</p>
                  </div>
                </div>
                <span className={`text-[9px] px-4 py-1.5 rounded-full font-semibold uppercase tracking-widest border transition-all ${VIP_COLORS[contact.vipLevel]}`}>{contact.vipLevel}</span>
                <div className={`p-3 rounded-2xl transition-all ${selectedContact?.id === contact.id ? 'bg-[#5a8fa3] text-white' : 'bg-gray-50 text-gray-300'}`}>
                  <ChevronRight size={18} />
                </div>
              </motion.div>
            ))}
            {filtered.length === 0 && !loading && (
              <CRMEmptyState
                icon={Users}
                title="Aucun contact trouvé"
                description="Ajustez vos filtres ou lancez une nouvelle recherche."
              />
            )}
          </div>
        </div>

        {/* 360° Detail Panel */}
        <AnimatePresence>
          {selectedContact && (
            <motion.div
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 50, opacity: 0 }}
              className="w-full md:w-[450px] md:ml-8 bg-white/60 backdrop-blur-3xl rounded-[24px] border border-white shadow-[0_4px_16px_rgba(0,0,0,0.06)] flex flex-col overflow-hidden relative"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-50/20 to-emerald-50/10 rounded-bl-full -z-10" />

              {/* Header */}
              <div className="p-10 border-b border-gray-50">
                <div className="flex items-start justify-between mb-8">
                  <div className="flex items-center gap-5">
                    <div className="w-16 h-16 rounded-[24px] bg-gradient-to-br from-luna-charcoal to-black text-white flex items-center justify-center text-xl font-normal shadow-xl">
                      {selectedContact.firstName[0]}{selectedContact.lastName[0]}
                    </div>
                    <div className="space-y-1">
                      <Link href={`/crm/clients/${selectedContact.id}`} className="text-xl font-normal text-luna-charcoal uppercase tracking-tighter hover:text-[#5a8fa3] transition-colors block leading-tight">{selectedContact.firstName} {selectedContact.lastName}</Link>
                      <span className={`text-[8px] px-3 py-1 rounded-full font-semibold border uppercase tracking-widest inline-block ${VIP_COLORS[selectedContact.vipLevel]}`}>{selectedContact.vipLevel}</span>
                    </div>
                  </div>
                  <button onClick={() => setSelectedContact(null)} className="p-3 hover:bg-gray-100 rounded-2xl transition-all text-gray-400"><X size={20} /></button>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <div className="flex items-center gap-3 p-4 bg-gray-50/50 rounded-2xl border border-gray-50 text-xs font-sans text-gray-500 overflow-hidden">
                    <Mail size={16} className="text-[#5a8fa3] shrink-0" />
                    <a href={`mailto:${selectedContact.email}`} className="truncate hover:text-[#5a8fa3] transition-colors">{selectedContact.email}</a>
                  </div>
                  {selectedContact.phone && (
                    <div className="flex items-center gap-3 p-4 bg-gray-50/50 rounded-2xl border border-gray-50 text-xs font-sans text-gray-500 overflow-hidden">
                      <Phone size={16} className="text-emerald-500 shrink-0" />
                      <span className="truncate">{selectedContact.phone}</span>
                    </div>
                  )}
                </div>

                {selectedContact.preferences.length > 0 && (
                  <div className="flex gap-2 mt-6 flex-wrap">
                    {selectedContact.preferences.map((p, i) => (
                      <span key={i} className="text-[9px] font-semibold uppercase tracking-widest text-[#5a8fa3] bg-[#bcdeea]/10 px-3 py-1.5 rounded-xl border border-[#bcdeea]/20">{p}</span>
                    ))}
                  </div>
                )}

                {selectedContact.profileAnalysis && (
                  <div className="mt-8 p-6 bg-[#bcdeea]/10 border border-[#bcdeea]/15 rounded-[24px] relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform"><Sparkles size={40} className="text-[#5a8fa3]" /></div>
                    <h4 className="text-[10px] font-semibold text-[#5a8fa3] uppercase tracking-widest mb-3 flex items-center gap-2">
                      <Activity size={12} /> Luna Intelligence Agent
                    </h4>
                    <p className="text-sm text-[#2E2E2E]/80 leading-relaxed font-sans italic">{selectedContact.profileAnalysis}</p>
                  </div>
                )}
              </div>

              {/* Linked data */}
              <div className="flex-1 overflow-y-auto p-10 space-y-10 no-scrollbar">
                {loadingDetails ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <Activity className="animate-spin text-[#5a8fa3]" size={32} />
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Syncing CRM 360° Data...</p>
                  </div>
                ) : (
                  <>
                    {/* Trips / Dossiers */}
                    <div>
                      <h4 className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-6 flex items-center gap-2">
                        {isLegal ? <Briefcase size={14} /> : <Plane size={14} />} {vEntity('tripPlural')} <T>en cours</T> ({contactTrips.length})
                      </h4>
                      {contactTrips.length === 0 ? (
                        <p className="text-xs text-gray-300 font-sans italic"><T>Aucun</T> {vEntity('trip').toLowerCase()} <T>actif</T></p>
                      ) : (
                        <div className="space-y-3">
                          {contactTrips.map(trip => (
                            <Link href={isLegal ? `/crm/dossiers` : `/crm/trips/${trip.id}/itinerary`} key={trip.id} className="flex items-center justify-between p-5 rounded-[24px] bg-gray-50/50 border border-gray-100 hover:border-indigo-200 hover:bg-white transition-all group">
                              <div className="flex items-center gap-4 min-w-0">
                                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                                  {isLegal ? <Briefcase size={18} className="text-[#A07850]" /> : <Plane size={18} className="text-[#5a8fa3]" />}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-bold text-luna-charcoal uppercase truncate">{trip.title}</p>
                                  <p className="text-[11px] text-gray-400 font-sans">{trip.startDate} • {trip.amount.toLocaleString()} €</p>
                                </div>
                              </div>
                              <ChevronRight size={18} className="text-gray-300 group-hover:text-[#5a8fa3] group-hover:translate-x-1 transition-all" />
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Activities */}
                    <div>
                      <h4 className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-6 flex items-center gap-2">
                        <Calendar size={14} /> Tâches & Suivi ({contactActivities.length})
                      </h4>
                      {contactActivities.length === 0 ? (
                        <p className="text-xs text-gray-300 font-sans italic">Aucun rappel</p>
                      ) : (
                        <div className="space-y-3">
                          {contactActivities.map(act => (
                            <div key={act.id} className="flex items-center justify-between p-5 rounded-[24px] bg-gray-50/50 border border-gray-100">
                              <div className="flex items-center gap-4 min-w-0">
                                <div className={`w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm`}>
                                  <Clock size={16} className={act.status === 'DONE' ? 'text-emerald-500' : 'text-amber-500'} />
                                </div>
                                <div className="min-w-0">
                                  <p className={`text-sm font-bold truncate uppercase ${act.status === 'DONE' ? 'text-gray-300 line-through' : 'text-luna-charcoal'}`}>{act.title}</p>
                                  <p className="text-[11px] text-gray-400 font-sans">{act.time}</p>
                                </div>
                              </div>
                              <span className={`text-[8px] font-semibold uppercase tracking-widest px-2 py-1 rounded-lg ${act.status === 'DONE' ? 'bg-[#bcdeea]/15 text-[#5a8fa3]' : 'bg-amber-50 text-amber-600'}`}>{act.status}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Full profile button */}
                    <Link href={`/crm/clients/${selectedContact.id}`} className="btn-expert btn-expert-primary !py-4 w-full flex items-center justify-center gap-3">
                      <Users size={18} />
                      <span className="uppercase tracking-widest">Accéder au profil 360°</span>
                    </Link>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Add Contact Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-luna-charcoal/60 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-[24px] w-full max-w-2xl shadow-[0_25px_80px_rgba(0,0,0,0.12)] overflow-hidden relative">
              {/* Luna Header */}
              <div className="p-10 md:p-12 pb-6 bg-luna-charcoal text-white">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-light tracking-tight"><T>Nouveau Contact</T></h2>
                    <p className="text-[#b9dae9] text-xs mt-1 font-medium">Enregistrement CRM Luna 2026</p>
                  </div>
                  <button onClick={() => setIsModalOpen(false)} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-all"><X size={24} /></button>
                </div>
              </div>
              <div className="p-10 md:p-14 pt-8">
                <form onSubmit={handleAddContact} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2"><T>Prénom</T></label>
                      <input type="text" required className="w-full px-6 py-4 rounded-[20px] bg-gray-50 border-none focus:ring-2 focus:ring-indigo-100 focus:bg-white transition-all text-sm font-sans"
                        value={newContact.firstName} onChange={e => setNewContact({ ...newContact, firstName: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2"><T>Nom</T></label>
                      <input type="text" required className="w-full px-6 py-4 rounded-[20px] bg-gray-50 border-none focus:ring-2 focus:ring-indigo-100 focus:bg-white transition-all text-sm font-sans"
                        value={newContact.lastName} onChange={e => setNewContact({ ...newContact, lastName: e.target.value })} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2">Email Identity</label>
                    <input type="email" required className="w-full px-6 py-4 rounded-[20px] bg-gray-50 border-none focus:ring-2 focus:ring-indigo-100 focus:bg-white transition-all text-sm font-sans"
                      value={newContact.email} onChange={e => setNewContact({ ...newContact, email: e.target.value })} />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2"><T>Téléphone (International)</T></label>
                      <input type="text" className="w-full px-6 py-4 rounded-[20px] bg-gray-50 border-none focus:ring-2 focus:ring-indigo-100 focus:bg-white transition-all text-sm font-sans"
                        value={newContact.phone} onChange={e => setNewContact({ ...newContact, phone: e.target.value })} placeholder="+33..." />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2">Segmentation VIP</label>
                      <select className="w-full px-6 py-4 rounded-[20px] bg-gray-50 border-none focus:ring-2 focus:ring-indigo-100 focus:bg-white transition-all text-sm font-sans outline-none"
                        value={newContact.vipLevel} onChange={e => setNewContact({ ...newContact, vipLevel: e.target.value as CRMContact['vipLevel'] })}>
                        <option value="Standard">Standard</option>
                        <option value="Premium">Premium</option>
                        <option value="VIP">VIP Platinum</option>
                        <option value="Elite">Elite Black Card</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2">Préférences (tags)</label>
                    <input type="text" placeholder={isLegal ? 'Ex: Droit pénal, Famille, Commercial...' : 'Ex: Luxe, Aventure, Gastronomie...'} className="w-full px-6 py-4 rounded-[20px] bg-gray-50 border-none focus:ring-2 focus:ring-indigo-100 focus:bg-white transition-all text-sm font-sans"
                      value={newContact.preferences} onChange={e => setNewContact({ ...newContact, preferences: e.target.value })} />
                  </div>

                  <div className="pt-8 flex gap-6">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="btn-expert btn-expert-glass flex-1 font-bold">Annuler</button>
                    <button type="submit" className="btn-expert btn-expert-primary flex-[2] font-bold uppercase tracking-widest">Enregistrer le Contact</button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}

        {/* ═══ IMPORT CSV/EXCEL MODAL ═══ */}
        {isImportOpen && (
          <div className="fixed inset-0 bg-luna-charcoal/60 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-[24px] w-full max-w-3xl border border-[#E5E7EB] overflow-hidden">
              {/* Luna Header */}
              <div className="p-8 md:p-10 pb-5 bg-luna-charcoal text-white rounded-t-[24px]">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-light tracking-tight">Importer des contacts</h2>
                    <p className="text-[#b9dae9] text-xs mt-1 font-medium">CSV ou Excel (.xlsx) — les doublons sont détectés par email</p>
                  </div>
                  <button onClick={closeImport} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-all">
                    <X size={20} />
                  </button>
                </div>
              </div>
              <div className="p-8 md:p-10">

                {/* Step 1: Upload */}
                {importStep === 'upload' && (
                  <div
                    className={`border-2 border-dashed rounded-[16px] p-12 text-center transition-all cursor-pointer ${isDragging ? 'border-[#bcdeea] bg-[#bcdeea]/10' : 'border-[#E5E7EB] hover:border-[#bcdeea] hover:bg-[#F8FAFC]'
                      }`}
                    onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={e => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files[0]) handleFileSelect(e.dataTransfer.files[0]); }}
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = '.csv,.xlsx,.xls';
                      input.onchange = (e: any) => { if (e.target.files[0]) handleFileSelect(e.target.files[0]); };
                      input.click();
                    }}
                  >
                    <FileUp size={40} className="mx-auto text-[#bcdeea] mb-4" />
                    <p className="text-[15px] font-medium text-[#2E2E2E] mb-2">Glissez votre fichier ici</p>
                    <p className="text-[13px] text-[#6B7280]">ou cliquez pour sélectionner un fichier .csv ou .xlsx</p>
                    <div className="flex items-center justify-center gap-4 mt-6">
                      <span className="px-3 py-1.5 rounded-[8px] bg-[#D3E8E3] text-[12px] font-medium text-[#2E2E2E]">.CSV</span>
                      <span className="px-3 py-1.5 rounded-[8px] bg-[#E3E2F3] text-[12px] font-medium text-[#2E2E2E]">.XLSX</span>
                      <span className="px-3 py-1.5 rounded-[8px] bg-[#E6D2BD] text-[12px] font-medium text-[#2E2E2E]">.XLS</span>
                    </div>
                  </div>
                )}

                {/* Step 2: Column Mapping + Preview */}
                {importStep === 'mapping' && (
                  <div className="space-y-6">
                    <div className="p-4 rounded-[12px] bg-[#D3E8E3]/30 border border-[#D3E8E3] flex items-center gap-3">
                      <CheckCircle2 size={18} className="text-[#2E2E2E]" />
                      <span className="text-[14px] text-[#2E2E2E] font-medium">{importRows.length} lignes détectées — vérifiez le mapping ci-dessous</span>
                    </div>

                    {/* Mapping grid */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {([
                        { key: 'firstName', label: 'Prénom', required: true },
                        { key: 'lastName', label: 'Nom', required: true },
                        { key: 'email', label: 'Email', required: false },
                        { key: 'phone', label: 'Téléphone', required: false },
                        { key: 'vipLevel', label: 'Niveau VIP', required: false },
                        { key: 'preferences', label: 'Préférences', required: false },
                      ] as { key: keyof ColumnMapping; label: string; required: boolean }[]).map(field => (
                        <div key={field.key}>
                          <label className="text-[12px] font-medium text-[#2E2E2E] mb-1.5 block">
                            {field.label} {field.required && <span className="text-[#da3832]">*</span>}
                          </label>
                          <select
                            className="w-full px-3 py-2.5 rounded-[12px] border border-[#E5E7EB] bg-white text-[14px] text-[#2E2E2E] outline-none focus:border-[#bcdeea] transition-colors"
                            value={columnMapping[field.key]}
                            onChange={e => setColumnMapping(prev => ({ ...prev, [field.key]: e.target.value }))}
                          >
                            <option value="">— Ignorer —</option>
                            {importHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                          </select>
                        </div>
                      ))}
                    </div>

                    {/* Preview table */}
                    <div className="border border-[#E5E7EB] rounded-[12px] overflow-hidden">
                      <div className="text-[12px] font-medium text-[#6B7280] px-4 py-2 bg-[#F8FAFC] border-b border-[#E5E7EB]">Aperçu (5 premières lignes)</div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-[13px]">
                          <thead>
                            <tr className="border-b border-[#E5E7EB] bg-[#F8FAFC]">
                              <th className="px-4 py-2 text-left text-[11px] font-medium text-[#6B7280] uppercase">Prénom</th>
                              <th className="px-4 py-2 text-left text-[11px] font-medium text-[#6B7280] uppercase">Nom</th>
                              <th className="px-4 py-2 text-left text-[11px] font-medium text-[#6B7280] uppercase">Email</th>
                              <th className="px-4 py-2 text-left text-[11px] font-medium text-[#6B7280] uppercase">Tél</th>
                            </tr>
                          </thead>
                          <tbody>
                            {importRows.slice(0, 5).map((row, i) => (
                              <tr key={i} className="border-b border-[#F3F4F6] last:border-0">
                                <td className="px-4 py-2.5 text-[#2E2E2E]">{row[columnMapping.firstName] || '—'}</td>
                                <td className="px-4 py-2.5 text-[#2E2E2E]">{row[columnMapping.lastName] || '—'}</td>
                                <td className="px-4 py-2.5 text-[#6B7280]">{row[columnMapping.email] || '—'}</td>
                                <td className="px-4 py-2.5 text-[#6B7280]">{row[columnMapping.phone] || '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="flex gap-4 pt-4">
                      <button onClick={resetImport} className="flex-1 px-5 py-3 rounded-[12px] border border-[#E5E7EB] text-[14px] font-medium text-[#2E2E2E] hover:bg-[#F5F5F5] transition-colors cursor-pointer">Retour</button>
                      <button
                        onClick={handleImport}
                        disabled={!columnMapping.firstName && !columnMapping.lastName}
                        className="flex-[2] px-5 py-3 rounded-[12px] text-[14px] font-medium transition-colors cursor-pointer border-none disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ backgroundColor: '#bcdeea', color: '#2E2E2E' }}
                      >Importer {importRows.length} contacts</button>
                    </div>
                  </div>
                )}

                {/* Step 3: Importing */}
                {importStep === 'importing' && (
                  <div className="text-center py-10 space-y-6">
                    <Loader2 size={40} className="mx-auto text-[#bcdeea] animate-spin" />
                    <div>
                      <p className="text-[16px] font-medium text-[#2E2E2E]">Import en cours...</p>
                      <p className="text-[14px] text-[#6B7280] mt-1">{importProgress.done} / {importProgress.total}</p>
                    </div>
                    <div className="w-full bg-[#F3F4F6] rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all duration-300"
                        style={{ width: `${importProgress.total ? (importProgress.done / importProgress.total) * 100 : 0}%`, backgroundColor: '#bcdeea' }}
                      />
                    </div>
                    {importProgress.skipped > 0 && (
                      <p className="text-[12px] text-[#6B7280]">{importProgress.skipped} doublons ignorés</p>
                    )}
                  </div>
                )}

                {/* Step 4: Done */}
                {importStep === 'done' && (
                  <div className="text-center py-10 space-y-6">
                    <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center" style={{ backgroundColor: '#D3E8E3' }}>
                      <CheckCircle2 size={32} className="text-[#2E2E2E]" />
                    </div>
                    <div>
                      <p className="text-[18px] font-medium text-[#2E2E2E]">Import terminé !</p>
                      <div className="flex items-center justify-center gap-6 mt-4">
                        <div className="text-center">
                          <p className="text-[24px] font-medium text-[#2E2E2E]">{importProgress.done - importProgress.skipped - importProgress.errors}</p>
                          <p className="text-[12px] text-[#6B7280]">Importés</p>
                        </div>
                        {importProgress.skipped > 0 && (
                          <div className="text-center">
                            <p className="text-[24px] font-medium text-[#E6D2BD]">{importProgress.skipped}</p>
                            <p className="text-[12px] text-[#6B7280]">Doublons</p>
                          </div>
                        )}
                        {importProgress.errors > 0 && (
                          <div className="text-center">
                            <p className="text-[24px] font-medium text-[#da3832]">{importProgress.errors}</p>
                            <p className="text-[12px] text-[#6B7280]">Erreurs</p>
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={closeImport}
                      className="px-8 py-3 rounded-[12px] text-[14px] font-medium transition-colors cursor-pointer border-none"
                      style={{ backgroundColor: '#bcdeea', color: '#2E2E2E' }}
                    >Fermer</button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
