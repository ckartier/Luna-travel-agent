'use client';

import { useState, useEffect, useRef } from 'react';
import { Upload, FileText, Trash2, Loader2, AlertTriangle, Shield, Download, Plus, Search, X } from 'lucide-react';
import { CRMDocument, getAllDocuments, createDocument, deleteDocument, getContacts, CRMContact } from '@/src/lib/firebase/crm';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/src/lib/firebase/client';
import { useAuth } from '@/src/contexts/AuthContext';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import ConfirmModal from '@/src/components/ConfirmModal';
import { T } from '@/src/components/T';

export default function DocumentsPage() {
  const { user, userProfile, tenantId } = useAuth();
  const [documents, setDocuments] = useState<CRMDocument[]>([]);
  const [contacts, setContacts] = useState<CRMContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [newDoc, setNewDoc] = useState({ clientId: '', type: 'OTHER' as CRMDocument['type'], name: '', expiryDate: '' });
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Phase 1: Load documents first → instant render
      const docs = await getAllDocuments(tenantId!);
      setDocuments(docs);
      setLoading(false);

      // Phase 2: Load contacts in background (for upload modal)
      const cts = await getContacts(tenantId!);
      setContacts(cts);
    } catch (e) { console.error(e); setLoading(false); }
  };

  const handleUpload = async (file: File) => {
    if (!newDoc.clientId || !newDoc.name) return;
    setUploading(true);
    try {
      // Upload to Firebase Storage
      const storageRef = ref(storage, `documents/${user?.uid}/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const fileUrl = await getDownloadURL(storageRef);

      await createDocument(tenantId!, {
        clientId: newDoc.clientId,
        type: newDoc.type,
        name: newDoc.name || file.name,
        fileUrl,
        size: file.size,
        uploadedBy: userProfile?.displayName || user?.displayName || 'Agent',
        expiryDate: newDoc.expiryDate || undefined,
      });
      setShowUpload(false);
      setNewDoc({ clientId: '', type: 'OTHER', name: '', expiryDate: '' });
      await loadData();
    } catch (e) { console.error('Upload error:', e); }
    setUploading(false);
  };

  const handleDelete = async (docId: string) => {
    if (!tenantId) return;
    try {
      await deleteDocument(tenantId, docId);
      setDocuments(prev => prev.filter(d => d.id !== docId));
    } catch (err) {
      console.error('Delete document error:', err);
    }
    setDeleteTarget(null);
  };

  const formatDate = (d: any) => {
    try {
      const date = d instanceof Date ? d : d?.toDate?.() || new Date(d);
      return format(date, 'dd MMM yyyy', { locale: fr });
    } catch { return '-'; }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  const getTypeStyle = (type: string) => {
    switch (type) {
      case 'PASSPORT': return 'bg-blue-50 text-blue-600 border-blue-200';
      case 'VISA': return 'bg-[#bcdeea]/15 text-[#5a8fa3] border-purple-200';
      case 'CONTRACT': return 'bg-amber-50 text-amber-600 border-amber-200';
      case 'TICKET': return 'bg-emerald-50 text-emerald-600 border-emerald-200';
      default: return 'bg-gray-100 text-gray-500 border-gray-200';
    }
  };

  const filteredDocs = documents.filter(d => {
    const matchSearch = d.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchType = selectedType === 'ALL' || d.type === selectedType;
    return matchSearch && matchType;
  });

  // Check for expiring documents
  const expiringDocs = documents.filter(d => {
    if (!d.expiryDate) return false;
    const exp = new Date(d.expiryDate);
    const now = new Date();
    const diff = (exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return diff <= 90 && diff > 0;
  });

  if (loading) return <div className="flex items-center justify-center h-96"><Loader2 className="animate-spin text-gray-400" size={32} /></div>;

  return (
    <div className="w-full h-full">
      <div className="max-w-[1600px] mx-auto w-full space-y-8  pb-20">
        <div className="flex justify-between items-center mb-6 relative z-10">
          <div>
            <h1 className="text-4xl font-light text-[#2E2E2E] tracking-tight"><T>Coffre-fort Documents</T></h1>
            <p className="text-sm text-[#6B7280] mt-1 font-medium"><T>Stockez et gérez les documents de vos clients en toute sécurité.</T></p>
          </div>
          <button onClick={() => setShowUpload(true)} className="bg-luna-charcoal hover:bg-gray-800 text-white px-5 py-2.5 rounded-xl text-sm font-normal transition-all flex items-center gap-2 ">
            <Upload size={16} /> <T>Uploader</T>
          </button>
        </div>

        {/* Expiry warning */}
        {expiringDocs.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-start gap-3">
            <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={18} />
            <div>
              <p className="text-sm font-normal text-amber-700">{expiringDocs.length} document(s) expirent dans moins de 90 jours</p>
              <p className="text-xs text-amber-600 mt-1">{expiringDocs.map(d => d.name).join(', ')}</p>
            </div>
          </div>
        )}



        {/* Filters */}
        <div className="flex gap-3 mb-6">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <input type="text" placeholder="Chercher..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-2 rounded-xl border border-gray-100 bg-gray-50/50 text-sm focus:bg-white focus:border-gray-300 focus:shadow-sm transition-all outline-none focus:outline-none focus:border-luna-charcoal" />
          </div>
          <select value={selectedType} onChange={e => setSelectedType(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-100 bg-gray-50/50 text-sm focus:bg-white focus:border-gray-300 focus:shadow-sm transition-all outline-none focus:outline-none focus:border-luna-charcoal">
            <option value="ALL"><T>Tous les types</T></option>
            <option value="PASSPORT">Passeport</option>
            <option value="VISA">Visa</option>
            <option value="CONTRACT">Contrat</option>
            <option value="TICKET">Billet</option>
            <option value="OTHER">Autre</option>
          </select>
        </div>

        {/* Documents grid */}
        {filteredDocs.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Shield size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm"><T>Aucun document. Uploadez votre premier fichier.</T></p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDocs.map(doc => (
              <div key={doc.id} className="bg-white/70 backdrop-blur-sm rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow group">
                <div className="flex items-start justify-between mb-3">
                  <span className={`text-[12px] font-normal uppercase tracking-wider px-2 py-0.5 rounded border ${getTypeStyle(doc.type)}`}>{doc.type}</span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <a href={doc.fileUrl} target="_blank" rel="noopener" className="text-gray-400 hover:text-sky-500"><Download size={14} /></a>
                    <button onClick={() => setDeleteTarget(doc.id!)} className="text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
                  </div>
                </div>
                <div className="flex items-center gap-3 mb-3">
                  <FileText size={20} className="text-gray-400" />
                  <h3 className="text-sm font-normal text-luna-charcoal truncate">{doc.name}</h3>
                </div>
                <div className="text-xs text-gray-500 space-y-1">
                  <p>Taille: {formatSize(doc.size)}</p>
                  <p>Uploadé: {formatDate(doc.createdAt)}</p>
                  {doc.expiryDate && <p className="text-amber-600 font-normal">Expire: {formatDate(doc.expiryDate)}</p>}
                  <p>Par: {doc.uploadedBy}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Upload Modal */}
        {showUpload && (
          <div className="fixed inset-0 bg-luna-charcoal/60 backdrop-blur-xl z-50 flex items-center justify-center p-4" onClick={() => setShowUpload(false)}>
            <div className="bg-white backdrop-blur-2xl rounded-[24px] w-full max-w-md shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
              {/* Luna Header */}
              <div className="p-8 pb-5 bg-luna-charcoal text-white">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-lg font-light tracking-tight"><T>Uploader un document</T></h2>
                    <p className="text-[#b9dae9] text-xs mt-1 font-medium">Coffre-fort sécurisé Luna</p>
                  </div>
                </div>
              </div>
              <div className="p-8">
                <select value={newDoc.clientId} onChange={e => setNewDoc(p => ({ ...p, clientId: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-100 bg-gray-50/50 text-sm focus:bg-white focus:border-gray-300 focus:shadow-sm transition-all outline-none mb-3 focus:outline-none focus:border-luna-charcoal">
                  <option value=""><T>Sélectionner un client</T></option>
                  {contacts.map(c => <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>)}
                </select>
                <input value={newDoc.name} onChange={e => setNewDoc(p => ({ ...p, name: e.target.value }))}
                  placeholder="Nom du document" className="w-full px-4 py-2.5 rounded-xl border border-gray-100 bg-gray-50/50 text-sm focus:bg-white focus:border-gray-300 focus:shadow-sm transition-all outline-none mb-3 focus:outline-none focus:border-luna-charcoal" />
                <select value={newDoc.type} onChange={e => setNewDoc(p => ({ ...p, type: e.target.value as any }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-100 bg-gray-50/50 text-sm focus:bg-white focus:border-gray-300 focus:shadow-sm transition-all outline-none mb-3 focus:outline-none focus:border-luna-charcoal">
                  <option value="PASSPORT">Passeport</option><option value="VISA">Visa</option>
                  <option value="CONTRACT">Contrat</option><option value="TICKET">Billet</option><option value="OTHER">Autre</option>
                </select>
                <input type="date" value={newDoc.expiryDate} onChange={e => setNewDoc(p => ({ ...p, expiryDate: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-100 bg-gray-50/50 text-sm focus:bg-white focus:border-gray-300 focus:shadow-sm transition-all outline-none mb-4 focus:outline-none focus:border-luna-charcoal" placeholder="Date d'expiration (optionnel)" />
                <input ref={fileRef} type="file" className="hidden" onChange={e => { if (e.target.files?.[0]) handleUpload(e.target.files[0]); }} />
                <div className="flex gap-3">
                  <button onClick={() => setShowUpload(false)} className="flex-1 px-4 py-3 rounded-2xl border border-gray-100 bg-gray-50 text-sm font-normal text-gray-600 hover:bg-gray-100 transition-all"><T>Annuler</T></button>
                  <button onClick={() => fileRef.current?.click()} disabled={!newDoc.clientId || !newDoc.name || uploading}
                    className="flex-1 px-4 py-3 rounded-2xl bg-luna-charcoal hover:bg-gray-800 text-white text-sm font-normal transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                    {uploading ? <><Loader2 size={14} className="animate-spin" /> Envoi...</> : <><Upload size={14} /> Choisir fichier</>}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <ConfirmModal
          open={!!deleteTarget}
          title="Supprimer ce document ?"
          message="Le document sera supprimé définitivement."
          onConfirm={() => deleteTarget && handleDelete(deleteTarget)}
          onCancel={() => setDeleteTarget(null)}
        />
      </div>
    </div>
  );
}
