'use client'
import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import { startTransition } from 'react'
import { ArrowDown, ArrowUp, Check, Copy, Eye, FileDown, History, ImagePlus, LogOut, PencilLine, Plus, RotateCcw, Save, Sparkles, Trash2, UploadCloud, X } from 'lucide-react'
import { BrochureData, BrochureSection, Experience } from '@/src/features/pdfcreator/lib/types'
import { createExtractionJob, signOutUser, updateExtractionJob, uploadBrochurePdf, uploadImage } from '@/src/features/pdfcreator/lib/firebase'
import { getBrochureAuditIssues, getBrochureAuditSummary, sourcePdfPath } from '@/src/features/pdfcreator/lib/brochure-audit'
import { useAuth } from '@/src/contexts/AuthContext'
import BrochurePreview from '@/src/features/pdfcreator/components/brochure-preview'
import LoadingModal from '@/src/features/pdfcreator/components/loading-modal'
import { BrochureVersion, loadBrochureVersions, stageBrochureForPrint } from '@/src/features/pdfcreator/lib/local-brochure'

function uid() { return crypto.randomUUID() }

async function fileToDataUrl(file: File) {
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error('Unable to read the file.'))
    reader.readAsDataURL(file)
  })
}

async function loadImageFromFile(file: File) {
  const dataUrl = await fileToDataUrl(file)
  return await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Unable to load the image.'))
    image.src = dataUrl
  })
}

async function compressImage(file: File, options: { maxWidth: number; maxHeight: number; quality: number }) {
  const image = await loadImageFromFile(file)
  const ratio = Math.min(options.maxWidth / image.width, options.maxHeight / image.height, 1)
  const width = Math.max(1, Math.round(image.width * ratio))
  const height = Math.max(1, Math.round(image.height * ratio))

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const context = canvas.getContext('2d')
  if (!context) {
    throw new Error('Unable to prepare image compression.')
  }

  context.drawImage(image, 0, 0, width, height)

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, 'image/jpeg', options.quality)
  })

  if (!blob) {
    throw new Error('Unable to compress the image.')
  }

  const compressedFile = new File([blob], file.name.replace(/\.[^.]+$/, '') + '.jpg', { type: 'image/jpeg' })
  const dataUrl = await fileToDataUrl(compressedFile)

  return {
    file: compressedFile,
    dataUrl,
    width,
    height,
    sizeKb: Math.round(blob.size / 1024),
  }
}

const LOGO_DOWNLOADS = [
  { label: 'SVG', href: '/branding/lune-logo.svg' },
  { label: 'PNG', href: '/branding/lune-logo.png' },
  { label: 'WEBP', href: '/branding/lune-logo.webp' },
]

function estimateEmbeddedMediaWeightKb(brochure: BrochureData) {
  const sources = [
    brochure.logo,
    brochure.cover.image,
    ...brochure.sections.flatMap((section) => section.items.map((item) => item.image)),
  ].filter(Boolean)

  return Math.round(
    sources.reduce((total, source) => {
      if (!source.startsWith('data:')) return total
      const payload = source.split(',')[1] || ''
      return total + (payload.length * 3) / 4 / 1024
    }, 0)
  )
}

export default function BrochureEditor({ brochureId, brochure, onChange, onSave, onBack, storageMode = 'remote', statusMessage = '' }: { brochureId: string; brochure: BrochureData; onChange: (data: BrochureData)=>void; onSave: (data: BrochureData)=>Promise<void>; onBack: ()=>void; storageMode?: 'remote' | 'local'; statusMessage?: string }) {
  const { user } = useAuth()
  const [saving, setSaving] = useState(false)
  const [tab, setTab] = useState<'edit'|'preview'>('edit')
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [pdfViewerOpen, setPdfViewerOpen] = useState(false)
  const [uploadingCover, setUploadingCover] = useState(false)
  const [uploadingPdf, setUploadingPdf] = useState(false)
  const [extractingPdf, setExtractingPdf] = useState(false)
  const [lastSavedAt, setLastSavedAt] = useState<string>('')
  const [activeModal, setActiveModal] = useState<'save' | 'cover' | 'logo' | 'pdf' | 'extraction' | ''>('')
  const [versions, setVersions] = useState<BrochureVersion[]>([])
  const [versionsOpen, setVersionsOpen] = useState(false)
  const [activeSectionId, setActiveSectionId] = useState<string>('')
  const [activeExperienceId, setActiveExperienceId] = useState<string>('')

  const stats = useMemo(() => ({ sections: brochure.sections.length, items: brochure.sections.reduce((sum, s) => sum + s.items.length, 0) }), [brochure])
  const auditIssues = useMemo(() => getBrochureAuditIssues(brochure), [brochure])
  const auditSummary = useMemo(() => getBrochureAuditSummary(auditIssues), [auditIssues])
  const deferredBrochure = useDeferredValue(brochure)
  const embeddedMediaWeightKb = useMemo(() => estimateEmbeddedMediaWeightKb(brochure), [brochure])

  useEffect(() => {
    setVersions(loadBrochureVersions(brochureId))
  }, [brochureId])

  async function persistBrochure(nextBrochure: BrochureData, successMessage: string) {
    await onSave(nextBrochure)
    setVersions(loadBrochureVersions(brochureId))
    setLastSavedAt(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }))
    setNotice(successMessage)
  }

  async function save() {
    setActiveModal('save')
    setSaving(true)
    setError('')
    setNotice('')
    try {
      await persistBrochure(brochure, storageMode === 'local' ? 'Local draft saved.' : 'Brochure synced.')
    } catch (nextError: any) {
      setError(nextError?.message || 'Unable to save the brochure.')
    } finally {
      setSaving(false)
      setActiveModal('')
    }
  }
  function exportJson() {
    const blob = new Blob([JSON.stringify(brochure, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'lune-brochure.json'; a.click(); URL.revokeObjectURL(url)
  }
  function addSection() {
    onChange({ ...brochure, sections: [...brochure.sections, { id: uid(), title: 'New section', items: [] }] })
  }
  function updateSection(sectionId: string, next: BrochureSection) {
    onChange({ ...brochure, sections: brochure.sections.map((s)=>s.id===sectionId?next:s) })
  }
  function deleteSection(sectionId: string) {
    onChange({ ...brochure, sections: brochure.sections.filter((s)=>s.id!==sectionId) })
  }

  function restoreVersion(version: BrochureVersion) {
    onChange(version.data)
    setNotice(`Version restored: ${new Date(version.savedAt).toLocaleString('en-GB')}`)
    setVersionsOpen(false)
  }

  async function uploadCover(file: File) {
    setActiveModal('cover')
    setUploadingCover(true)
    setError('')
    try {
      const optimized = await compressImage(file, { maxWidth: 1500, maxHeight: 1500, quality: 0.66 })
      const url = user && storageMode === 'remote' ? await uploadImage(user.uid, optimized.file) : optimized.dataUrl
      onChange({ ...brochure, cover: { ...brochure.cover, image: url } })
      setNotice(`Cover image optimized (${optimized.width}x${optimized.height}, ${optimized.sizeKb} KB).`)
    } catch (nextError: any) {
      setError(nextError?.message || 'Unable to upload the cover image.')
    } finally {
      setUploadingCover(false)
      setActiveModal('')
    }
  }

  async function uploadLogo(file: File) {
    setActiveModal('logo')
    setError('')
    try {
      const optimized = await compressImage(file, { maxWidth: 900, maxHeight: 320, quality: 0.9 })
      onChange({ ...brochure, logo: optimized.dataUrl })
      setNotice(`Logo optimized (${optimized.width}x${optimized.height}, ${optimized.sizeKb} KB).`)
    } catch (nextError: any) {
      setError(nextError?.message || 'Unable to upload the logo.')
    } finally {
      setActiveModal('')
    }
  }

  async function uploadSourcePdf(file: File) {
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setError('Please upload a PDF file.')
      return
    }

    setActiveModal('pdf')
    setUploadingPdf(true)
    setError('')
    setNotice('')

    try {
      if (user && storageMode === 'remote') {
        const sourcePdf = await uploadBrochurePdf(user.uid, file)
        const nextBrochure = {
          ...brochure,
          sourcePdf,
          extraction: {
            status: 'uploaded' as const,
            requestedAt: Date.now(),
          },
        }
        onChange(nextBrochure)
        await persistBrochure(nextBrochure, 'Source PDF uploaded and synced.')
      } else {
        const sourcePdf = {
          name: file.name,
          url: await fileToDataUrl(file),
          storagePath: '',
          size: file.size,
          uploadedAt: Date.now(),
        }
        const nextBrochure = {
          ...brochure,
          sourcePdf,
          extraction: {
            status: 'uploaded' as const,
            requestedAt: Date.now(),
          },
        }
        onChange(nextBrochure)
        await persistBrochure(nextBrochure, 'Source PDF stored locally.')
      }
    } catch (nextError: any) {
      setError(nextError?.message || 'Unable to upload the source PDF.')
    } finally {
      setUploadingPdf(false)
      setActiveModal('')
    }
  }

  async function requestPdfExtraction() {
    if (!brochure.sourcePdf) {
      setError('Upload a source PDF before starting extraction.')
      return
    }

    const processingBrochure = {
      ...brochure,
      extraction: {
        ...brochure.extraction,
        status: 'processing' as const,
        requestedAt: Date.now(),
        error: '',
      },
    }

    setActiveModal('extraction')
    setExtractingPdf(true)
    setError('')
    setNotice('')
    onChange(processingBrochure)

    try {
      if (user && storageMode === 'remote') {
        const jobId = await createExtractionJob({
          brochureId,
          userId: user.uid,
          sourcePdf: brochure.sourcePdf,
          status: 'processing',
        })

        const response = await fetch('/api/pdfcreator/extraction', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jobId,
            brochureId,
            sourcePdf: brochure.sourcePdf,
          }),
        })

        if (!response.ok) {
          const payload = await response.json().catch(() => null)
          const message = payload?.message || 'The OCR backend is not configured yet.'
          await updateExtractionJob(jobId, { status: 'failed', error: message })
          const failedBrochure = {
            ...processingBrochure,
            extraction: {
              ...processingBrochure.extraction,
              status: 'failed' as const,
              error: message,
            },
          }
          onChange(failedBrochure)
          await persistBrochure(failedBrochure, 'Extraction request saved, but OCR is not configured yet.')
          return
        }
      } else {
        const localPending = {
          ...processingBrochure,
          extraction: {
            ...processingBrochure.extraction,
            status: 'failed' as const,
            error: 'OCR processing requires Firebase sync and server credentials.',
          },
        }
        onChange(localPending)
        await persistBrochure(localPending, 'PDF stored locally. OCR will be available once the server pipeline is configured.')
        return
      }
    } catch (nextError: any) {
      setError(nextError?.message || 'Unable to queue the extraction job.')
    } finally {
      setExtractingPdf(false)
      setActiveModal('')
    }
  }

  function openDedicatedPrintPage() {
    stageBrochureForPrint(brochureId, brochure)
    startTransition(() => {
      window.open(`/pdfcreator/${brochureId}/print`, '_blank', 'noopener,noreferrer')
    })
  }

  return (
    <div className="editor-shell min-h-screen text-stone-900">
      <LoadingModal
        open={activeModal === 'save' || activeModal === 'cover' || activeModal === 'logo' || activeModal === 'pdf' || activeModal === 'extraction'}
        eyebrow="LUNE Editor"
        title={
          activeModal === 'cover'
            ? 'Optimizing image'
            : activeModal === 'logo'
              ? 'Updating logo'
              : activeModal === 'pdf'
                ? 'Uploading source PDF'
                : activeModal === 'extraction'
                  ? 'Preparing extraction'
                  : 'Saving changes'
        }
        description={
          activeModal === 'cover'
            ? 'Compressing the image and updating the brochure.'
            : activeModal === 'logo'
              ? 'Compressing the logo and refreshing the brand identity.'
              : activeModal === 'pdf'
                ? 'Uploading the source PDF and syncing the brochure metadata.'
                : activeModal === 'extraction'
                  ? 'Creating the extraction job and preparing the OCR pipeline.'
                  : 'Saving your changes and preparing the PDF workflow.'
        }
      />
      <header className="sticky top-0 z-20 border-b border-stone-200 bg-white/80 backdrop-blur-xl no-print">
        <div className="mx-auto flex max-w-[1700px] items-center justify-between gap-4 px-4 py-4 lg:px-6">
          <div>
            <p className="text-xs uppercase tracking-[0.32em] text-stone-500">LUNE Studio</p>
            <h1 className="text-[1.9rem] font-semibold tracking-[-0.04em]">Brochure editor</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={onBack} className="rounded-2xl border border-stone-300 bg-white/90 px-4 py-3 text-sm font-medium transition hover:-translate-y-0.5 hover:border-stone-400">Back</button>
            <button onClick={save} className="save-cta rounded-2xl bg-stone-900 px-4 py-3 text-sm font-medium text-white shadow-[0_10px_30px_rgba(41,31,26,0.18)] transition hover:-translate-y-0.5 hover:bg-stone-800"><Save className="mr-2 inline h-4 w-4" />{saving ? 'Saving...' : 'Save'}</button>
            <button onClick={() => setVersionsOpen(true)} className="rounded-2xl border border-stone-300 bg-white/90 px-4 py-3 text-sm font-medium transition hover:-translate-y-0.5 hover:border-stone-400"><History className="mr-2 inline h-4 w-4" />History</button>
            <button onClick={exportJson} className="rounded-2xl border border-stone-300 bg-white/90 px-4 py-3 text-sm font-medium transition hover:-translate-y-0.5 hover:border-stone-400"><FileDown className="mr-2 inline h-4 w-4" />Export JSON</button>
            <button onClick={() => setPdfViewerOpen(true)} className="rounded-2xl border border-stone-300 bg-white/90 px-4 py-3 text-sm font-medium transition hover:-translate-y-0.5 hover:border-stone-400"><Eye className="mr-2 inline h-4 w-4" />PDF viewer</button>
            <a href={sourcePdfPath} target="_blank" rel="noreferrer" className="rounded-2xl border border-stone-300 bg-white/90 px-4 py-3 text-sm font-medium transition hover:-translate-y-0.5 hover:border-stone-400">Source PDF</a>
            <button onClick={signOutUser} className="rounded-2xl border border-stone-300 bg-white/90 px-4 py-3 text-sm font-medium transition hover:-translate-y-0.5 hover:border-stone-400"><LogOut className="mr-2 inline h-4 w-4" />Logout</button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1700px] px-4 py-6 lg:px-6">
        <section className="subtle-shine mb-6 overflow-hidden rounded-[32px] border border-stone-200 bg-[linear-gradient(135deg,#f7f3ec_0%,#ffffff_38%,#efe8de_100%)] shadow-[0_24px_70px_rgba(76,58,49,0.08)] no-print">
          <div className="grid gap-6 px-6 py-6 lg:grid-cols-[1.2fr_0.8fr] lg:px-8 lg:py-7">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white/80 px-3 py-2 text-xs uppercase tracking-[0.28em] text-stone-500">
                <Sparkles className="h-3.5 w-3.5" />
                PDF workflow
              </div>
              <h2 className="mt-4 max-w-2xl text-[2.1rem] font-semibold leading-[1.02] tracking-[-0.05em] text-stone-900 lg:text-[3.3rem]">
                Edit the content, review the layout, then validate the PDF before export.
              </h2>
              <p className="mt-4 max-w-2xl text-[15px] leading-8 text-stone-600 lg:text-base">
                The full workflow is now wired inside the editor: content, images, audit, compact preview, and full-screen PDF review before export.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <button onClick={() => setPdfViewerOpen(true)} className="rounded-2xl bg-stone-900 px-5 py-3 text-sm font-medium text-white">
                  <Eye className="mr-2 inline h-4 w-4" />
                  Open PDF viewer
                </button>
                <button onClick={save} className="rounded-2xl border border-stone-300 bg-white px-5 py-3 text-sm">
                  <PencilLine className="mr-2 inline h-4 w-4" />
                  Save now
                </button>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <MetricCard label="Sections" value={String(stats.sections)} hint="editable blocks" />
              <MetricCard label="Experiences" value={String(stats.items)} hint="experience cards" />
              <MetricCard label="Audit" value={String(auditIssues.length)} hint="items to complete" />
              <MetricCard label="Status" value={storageMode === 'local' ? 'Local' : 'Sync'} hint={lastSavedAt ? `saved at ${lastSavedAt}` : 'ready to save'} />
            </div>
          </div>
        </section>
        {storageMode === 'local' || statusMessage || notice || error ? (
          <div className="mb-6 space-y-3 no-print">
            {storageMode === 'local' ? <div className="rounded-[24px] border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">You are working in the local draft. Changes stay in this browser until synced storage is available again.</div> : null}
            {statusMessage ? <div className="rounded-[24px] border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">{statusMessage}</div> : null}
            {notice ? <div className="rounded-[24px] border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-700"><Check className="mr-2 inline h-4 w-4" />{notice}</div> : null}
            {error ? <div className="rounded-[24px] border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">{error}</div> : null}
          </div>
        ) : null}
        <div className="mb-6 grid gap-4 lg:grid-cols-[220px_220px_1fr] no-print">
          <Stat label="Sections" value={stats.sections} />
          <Stat label="Experiences" value={stats.items} />
          <div className="rounded-3xl border border-stone-200 bg-white p-4 shadow-sm">
            <p className="text-xs uppercase tracking-[0.24em] text-stone-500">Mode</p>
            <div className="mt-3 flex gap-2">
              <button onClick={()=>setTab('edit')} className={`rounded-full px-3 py-2 text-sm ${tab==='edit'?'bg-stone-900 text-white':'border border-stone-300 bg-white'}`}>Edit</button>
              <button onClick={()=>setTab('preview')} className={`rounded-full px-3 py-2 text-sm ${tab==='preview'?'bg-stone-900 text-white':'border border-stone-300 bg-white'}`}>Preview</button>
            </div>
            <p className="mt-3 text-sm text-stone-600">{storageMode === 'local' ? 'Local mode' : 'Synced mode'}</p>
          </div>
        </div>
        <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4 no-print">
          <MetricCard label="Preview" value="Live" hint="updates with low-latency sync" />
          <MetricCard label="Focus" value={activeExperienceId ? 'Locked' : activeSectionId ? 'Section' : 'Auto'} hint="preview follows your current edit" />
          <MetricCard label="Print" value="A4" hint="two experiences per page" />
          <MetricCard label="Media" value={`${embeddedMediaWeightKb} KB`} hint="estimated embedded image payload" />
        </div>

        <div className="grid gap-6 xl:grid-cols-[620px_1fr]">
          <div className={`${tab === 'preview' ? 'hidden xl:block' : ''} space-y-6 no-print`}>
            <section className="editor-panel rounded-[28px] p-5">
              <h3 className="text-lg font-semibold tracking-tight text-stone-900">Brand and cover</h3>
              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <input className="rounded-2xl border border-stone-300 px-4 py-3" value={brochure.brand} onChange={(e)=>onChange({ ...brochure, brand: e.target.value })} placeholder="Brand" />
                <input className="rounded-2xl border border-stone-300 px-4 py-3" value={brochure.logo || ''} onChange={(e)=>onChange({ ...brochure, logo: e.target.value })} placeholder="Logo URL" />
                <input className="rounded-2xl border border-stone-300 px-4 py-3" value={brochure.city} onChange={(e)=>onChange({ ...brochure, city: e.target.value })} placeholder="City" />
                <input className="rounded-2xl border border-stone-300 px-4 py-3" value={brochure.year} onChange={(e)=>onChange({ ...brochure, year: e.target.value })} placeholder="Year" />
                <div className="overflow-hidden rounded-[24px] border border-stone-200 bg-white px-4 py-4 lg:col-span-2">
                  {brochure.logo ? <img src={brochure.logo} alt={brochure.brand} className="h-12 w-auto object-contain" /> : <div className="text-sm text-stone-400">No logo</div>}
                </div>
                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-stone-300 bg-stone-50 px-4 py-4 text-sm lg:col-span-2">
                  <UploadCloud className="h-4 w-4" /> Upload logo
                  <input type="file" accept="image/*" className="hidden" onChange={(e)=>e.target.files?.[0] && uploadLogo(e.target.files[0])} />
                </label>
                <div className="flex flex-wrap gap-2 lg:col-span-2">
                  {LOGO_DOWNLOADS.map((asset) => (
                    <a key={asset.label} href={asset.href} download className="rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm">
                      Download {asset.label}
                    </a>
                  ))}
                  <button onClick={() => onChange({ ...brochure, logo: '/branding/lune-logo.png' })} className="rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm">
                    Reset to provided logo
                  </button>
                </div>
                <input className="rounded-2xl border border-stone-300 px-4 py-3" value={brochure.cover.title} onChange={(e)=>onChange({ ...brochure, cover: { ...brochure.cover, title: e.target.value } })} placeholder="Title" />
                <textarea className="min-h-[120px] rounded-2xl border border-stone-300 px-4 py-3 lg:col-span-2" value={brochure.cover.intro} onChange={(e)=>onChange({ ...brochure, cover: { ...brochure.cover, intro: e.target.value } })} placeholder="Intro" />
                <input className="rounded-2xl border border-stone-300 px-4 py-3 lg:col-span-2" value={brochure.cover.image} onChange={(e)=>onChange({ ...brochure, cover: { ...brochure.cover, image: e.target.value } })} placeholder="Cover image URL" />
                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-stone-300 bg-stone-50 px-4 py-4 text-sm lg:col-span-2">
                  <UploadCloud className="h-4 w-4" /> {uploadingCover ? 'Uploading...' : 'Upload cover image'}
                  <input type="file" accept="image/*" className="hidden" onChange={(e)=>e.target.files?.[0] && uploadCover(e.target.files[0])} />
                </label>
                <button onClick={() => onChange({ ...brochure, cover: { ...brochure.cover, image: '' } })} className="rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm lg:col-span-2">Remove cover image</button>
                <div className="overflow-hidden rounded-[24px] border border-stone-200 bg-white lg:col-span-2">
                  {brochure.cover.image ? <img src={brochure.cover.image} alt={brochure.cover.title} className="h-56 w-full object-cover" /> : <div className="flex h-56 items-center justify-center bg-stone-100 text-sm text-stone-400">No cover image</div>}
                </div>
              </div>
            </section>
            <section className="editor-panel rounded-[28px] p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <h3 className="text-lg font-semibold tracking-tight text-stone-900">Source PDF and extraction</h3>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-600">
                    Upload the client PDF, keep it attached to the brochure, and track the extraction status in one place. The OCR processor can be connected as soon as the server credentials are available.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-stone-300 bg-stone-50 px-4 py-3 text-sm">
                    <UploadCloud className="h-4 w-4" />
                    {uploadingPdf ? 'Uploading PDF...' : 'Upload PDF'}
                    <input type="file" accept="application/pdf,.pdf" className="hidden" onChange={(e) => e.target.files?.[0] && uploadSourcePdf(e.target.files[0])} />
                  </label>
                  <button onClick={requestPdfExtraction} disabled={!brochure.sourcePdf || extractingPdf} className="rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm disabled:opacity-40">
                    {extractingPdf ? 'Queuing extraction...' : 'Run extraction'}
                  </button>
                </div>
              </div>
              <div className="mt-5 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                <div className="rounded-[24px] border border-stone-200 bg-white p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-stone-500">Stored PDF</p>
                  {brochure.sourcePdf ? (
                    <>
                      <p className="mt-3 text-base font-medium text-stone-900">{brochure.sourcePdf.name}</p>
                      <p className="mt-2 text-sm leading-6 text-stone-600">
                        {Math.round(brochure.sourcePdf.size / 1024)} KB · {new Date(brochure.sourcePdf.uploadedAt).toLocaleString('en-GB')}
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <a href={brochure.sourcePdf.url} target="_blank" rel="noreferrer" className="rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm">
                          Open source PDF
                        </a>
                      </div>
                    </>
                  ) : (
                    <p className="mt-3 text-sm leading-6 text-stone-500">No PDF uploaded yet.</p>
                  )}
                </div>
                <div className="rounded-[24px] border border-stone-200 bg-white p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-stone-500">Extraction status</p>
                  <p className="mt-3 text-base font-medium text-stone-900">
                    {brochure.extraction?.status ? brochure.extraction.status.toUpperCase() : 'IDLE'}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-stone-600">
                    {brochure.extraction?.error || 'The extraction workflow is ready. Connect the server OCR credentials to process scanned PDFs automatically.'}
                  </p>
                </div>
              </div>
              {brochure.extraction?.rawText ? (
                <div className="mt-4 rounded-[24px] border border-stone-200 bg-white p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-stone-500">Extracted text</p>
                  <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap text-sm leading-6 text-stone-700">{brochure.extraction.rawText}</pre>
                </div>
              ) : null}
            </section>
            <section className="editor-panel rounded-[28px] p-5">
              <h3 className="text-lg font-semibold tracking-tight text-stone-900">Contact</h3>
              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                {(['name','locations','phone','email','instagram'] as const).map((key)=><input key={key} className={`rounded-2xl border border-stone-300 px-4 py-3 ${key==='instagram'?'lg:col-span-2':''}`} value={brochure.contact[key]} onChange={(e)=>onChange({ ...brochure, contact: { ...brochure.contact, [key]: e.target.value } })} placeholder={key} />)}
              </div>
            </section>
            <details className="editor-panel rounded-[28px] p-5">
              <summary className="flex cursor-pointer list-none items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold tracking-tight text-stone-900">Content audit</h3>
                  <p className="mt-1 text-sm leading-6 text-stone-600">
                    {auditIssues.length === 0 ? 'No placeholders detected in the brochure.' : `${auditIssues.length} item(s) still need completion.`}
                  </p>
                </div>
                <span className="rounded-full border border-stone-300 bg-white px-3 py-2 text-sm">Open</span>
              </summary>
              <div className="mt-4 flex justify-end">
                <a href={sourcePdfPath} target="_blank" rel="noreferrer" className="rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm">Source PDF</a>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-4">
                <AuditStat label="Titles" value={auditSummary.name} />
                <AuditStat label="Descriptions" value={auditSummary.description} />
                <AuditStat label="Highlights" value={auditSummary.highlights} />
                <AuditStat label="Pricing" value={auditSummary.pricing} />
              </div>
              {auditIssues.length > 0 ? (
                <div className="mt-4 space-y-3">
                  {auditIssues.map((issue) => (
                    <div key={issue.id} className="rounded-[20px] border border-stone-200 bg-white px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-stone-500">{issue.sectionTitle}</p>
                      <p className="mt-1 text-sm font-medium text-stone-900">{issue.itemName}</p>
                      <p className="mt-1 text-sm text-stone-600">{issue.message}</p>
                    </div>
                  ))}
                </div>
              ) : null}
            </details>
            <div className="flex items-center justify-between"><h2 className="text-xl font-semibold tracking-tight">Sections</h2><button onClick={addSection} className="rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm font-medium"><Plus className="mr-2 inline h-4 w-4" />Add section</button></div>
            {brochure.sections.map((section) => <SectionEditor key={section.id} section={section} onUpdate={(next)=>updateSection(section.id, next)} onDelete={()=>deleteSection(section.id)} userId={user?.uid || ''} canUploadRemotely={storageMode === 'remote'} activeSectionId={activeSectionId} activeExperienceId={activeExperienceId} onSelectSection={(sectionId)=>{ setActiveSectionId(sectionId); setActiveExperienceId('') }} onSelectExperience={(sectionId, experienceId)=>{ setActiveSectionId(sectionId); setActiveExperienceId(experienceId) }} />)}
          </div>
          <div className={tab === 'edit' ? 'hidden xl:block' : ''}>
            <div className="floating-preview xl:sticky xl:top-24 xl:self-start">
              <div className="mb-3 flex items-center justify-between rounded-[22px] border border-stone-200 bg-white/80 px-4 py-3 text-sm shadow-sm backdrop-blur no-print">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.24em] text-stone-500">Live preview</p>
                  <p className="mt-1 text-sm font-medium text-stone-900">The preview follows the section you are editing.</p>
                </div>
                <div className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-emerald-700">
                  Fast sync
                </div>
              </div>
              <div className="preview-shell rounded-[28px] border border-stone-200 bg-white/72 p-3 shadow-[0_24px_60px_rgba(77,59,48,0.08)] backdrop-blur">
                <div className="preview-scroll max-h-[calc(100vh-9.5rem)] overflow-auto rounded-[22px]">
                  <BrochurePreview brochure={deferredBrochure} compact activeSectionId={activeSectionId} activeExperienceId={activeExperienceId} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {versionsOpen ? (
        <div className="fixed inset-0 z-40 bg-stone-950/65 p-4 backdrop-blur-sm">
          <div className="mx-auto flex h-full max-w-3xl flex-col overflow-hidden rounded-[32px] bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-stone-200 px-6 py-4">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-stone-500">Version history</p>
                <h2 className="mt-1 text-2xl font-semibold tracking-tight text-stone-900">Last 3 saved versions</h2>
              </div>
              <button onClick={() => setVersionsOpen(false)} className="rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm"><X className="mr-2 inline h-4 w-4" />Close</button>
            </div>
            <div className="flex-1 overflow-auto bg-stone-100 p-6">
              <div className="space-y-3">
                {versions.length > 0 ? versions.map((version) => (
                  <div key={version.id} className="flex flex-wrap items-center justify-between gap-3 rounded-[24px] border border-stone-200 bg-white px-5 py-4">
                    <div>
                      <p className="text-sm font-medium text-stone-900">{version.label}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.18em] text-stone-500">{new Date(version.savedAt).toLocaleString('en-GB')}</p>
                    </div>
                    <button onClick={() => restoreVersion(version)} className="rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm">
                      <RotateCcw className="mr-2 inline h-4 w-4" />
                      Restore
                    </button>
                  </div>
                )) : (
                  <div className="rounded-[24px] border border-dashed border-stone-300 bg-white px-5 py-5 text-sm text-stone-500">
                    No previous versions yet. Save the brochure to create the history.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
      {pdfViewerOpen ? (
        <div className="pdf-modal-shell fixed inset-0 z-40 bg-stone-950/65 p-4 backdrop-blur-sm">
          <div className="pdf-modal-frame mx-auto flex h-full max-w-7xl flex-col overflow-hidden rounded-[32px] bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-stone-200 px-6 py-4 no-print">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-stone-500">PDF validation</p>
                <h2 className="mt-1 text-2xl font-semibold tracking-tight text-stone-900">Viewer before export</h2>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setPdfViewerOpen(false)} className="rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm"><X className="mr-2 inline h-4 w-4" />Close</button>
                <button onClick={openDedicatedPrintPage} className="rounded-2xl bg-stone-900 px-4 py-3 text-sm font-medium text-white">Open print page</button>
              </div>
            </div>
            <div className="pdf-modal-body flex-1 overflow-auto bg-stone-100 p-6">
              <div className="mb-4 rounded-[24px] border border-stone-200 bg-white px-5 py-4 no-print">
                <p className="text-xs uppercase tracking-[0.24em] text-stone-500">Email-safe export</p>
                <p className="mt-2 text-sm leading-6 text-stone-700">
                  Uploaded images are optimized to keep the PDF lighter. Open the dedicated print page for stable pagination, then print in A4 at 100% scale with headers and footers disabled.
                </p>
              </div>
              <BrochurePreview brochure={brochure} />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return <div className="rounded-3xl border border-stone-200 bg-white/92 p-4 shadow-sm backdrop-blur"><p className="text-xs uppercase tracking-[0.24em] text-stone-500">{label}</p><p className="mt-2 text-3xl font-semibold tracking-tight text-stone-900">{value}</p></div>
}

function MetricCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-[24px] border border-stone-200 bg-white/85 p-4 shadow-sm backdrop-blur">
      <p className="text-xs uppercase tracking-[0.22em] text-stone-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-stone-900">{value}</p>
      <p className="mt-1 text-sm text-stone-600">{hint}</p>
    </div>
  )
}

function AuditStat({ label, value }: { label: string; value: number }) {
  return <div className="rounded-[20px] border border-stone-200 bg-white p-4"><p className="text-xs uppercase tracking-[0.2em] text-stone-500">{label}</p><p className="mt-2 text-2xl font-semibold tracking-tight text-stone-900">{value}</p></div>
}

function SectionEditor({ section, onUpdate, onDelete, userId, canUploadRemotely, activeSectionId, activeExperienceId, onSelectSection, onSelectExperience }: { section: BrochureSection; onUpdate: (s: BrochureSection)=>void; onDelete: ()=>void; userId: string; canUploadRemotely: boolean; activeSectionId: string; activeExperienceId: string; onSelectSection: (sectionId: string)=>void; onSelectExperience: (sectionId: string, experienceId: string)=>void }) {
  const [open, setOpen] = useState(true)
  const [openItemId, setOpenItemId] = useState<string | null>(null)
  function addItem() {
    const item: Experience = { id: uid(), name: 'New experience', hero: 'Short hero', description: '', image: '', highlights: ['[highlight 1]'], pricing: [{ guests: '', duration: '', price: '' }], note: '' }
    onUpdate({ ...section, items: [...section.items, item] })
  }
  function updateItem(id: string, next: Experience) { onUpdate({ ...section, items: section.items.map((item)=>item.id===id?next:item) }) }
  function removeItem(id: string) { onUpdate({ ...section, items: section.items.filter((item)=>item.id!==id) }) }
  function duplicateItem(id: string) {
    const index = section.items.findIndex((i)=>i.id===id); if (index<0) return
    const copy = structuredClone(section.items[index]); copy.id = uid(); copy.name = `${copy.name} copy`
    const next=[...section.items]; next.splice(index+1,0,copy); onUpdate({ ...section, items: next })
  }
  function moveItem(id: string, dir: number) {
    const index = section.items.findIndex((i)=>i.id===id); const target = index+dir; if (index<0||target<0||target>=section.items.length) return
    const next=[...section.items]; const [moved]=next.splice(index,1); next.splice(target,0,moved); onUpdate({ ...section, items: next })
  }
  return (
    <section className={`editor-panel rounded-[28px] p-5 transition-all duration-300 ${activeSectionId === section.id && !activeExperienceId ? 'ring-2 ring-stone-900/10' : ''}`}>
      <div className="mb-4 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 flex-1">
          <input
            className="w-full min-w-0 rounded-2xl border border-stone-300 px-4 py-3 text-xl font-semibold tracking-tight"
            value={section.title}
            onChange={(e)=>onUpdate({ ...section, title: e.target.value })}
            onFocus={() => onSelectSection(section.id)}
          />
          <p className="mt-3 text-sm leading-6 text-stone-600">{section.items.length} experience(s)</p>
        </div>
        <div className="flex w-full flex-wrap gap-2 xl:w-auto xl:justify-end">
          <button onClick={() => setOpen(!open)} className="rounded-2xl border border-stone-300 px-3 py-2 text-sm">{open ? 'Collapse' : 'Open'}</button>
          <button onClick={addItem} className="rounded-2xl border border-stone-300 px-3 py-2 text-sm"><Plus className="mr-1 inline h-4 w-4" />Add item</button>
          <button onClick={onDelete} className="rounded-2xl border border-stone-300 px-3 py-2 text-sm"><Trash2 className="mr-1 inline h-4 w-4" />Delete section</button>
        </div>
      </div>
      {open ? <div className="space-y-4">{section.items.map((item, index) => <ExperienceEditor key={item.id} item={item} onUpdate={(next)=>updateItem(item.id,next)} onDelete={()=>removeItem(item.id)} onDuplicate={()=>duplicateItem(item.id)} onMoveUp={()=>moveItem(item.id,-1)} onMoveDown={()=>moveItem(item.id,1)} canMoveUp={index>0} canMoveDown={index<section.items.length-1} userId={userId} canUploadRemotely={canUploadRemotely} isActive={activeExperienceId === item.id} isOpen={openItemId === item.id} onSelect={() => { setOpenItemId(item.id); onSelectExperience(section.id, item.id) }} onClose={() => { setOpenItemId(null); onSelectSection(section.id) }} />)}</div> : null}
    </section>
  )
}

function ExperienceEditor({ item, onUpdate, onDelete, onDuplicate, onMoveUp, onMoveDown, canMoveUp, canMoveDown, userId, canUploadRemotely, isActive, isOpen, onSelect, onClose }: { item: Experience; onUpdate: (i: Experience)=>void; onDelete: ()=>void; onDuplicate: ()=>void; onMoveUp: ()=>void; onMoveDown: ()=>void; canMoveUp: boolean; canMoveDown: boolean; userId: string; canUploadRemotely: boolean; isActive: boolean; isOpen: boolean; onSelect: ()=>void; onClose: ()=>void }) {
  const [uploading, setUploading] = useState(false)
  const [uploadHint, setUploadHint] = useState('')
  async function handleUpload(file?: File) {
    if (!file) return
    setUploading(true)
    try {
      const optimized = await compressImage(file, { maxWidth: 1320, maxHeight: 1320, quality: 0.62 })
      const url = userId && canUploadRemotely ? await uploadImage(userId, optimized.file) : optimized.dataUrl
      setUploadHint(`Image optimized: ${optimized.width}x${optimized.height}, ${optimized.sizeKb} KB`)
      onUpdate({ ...item, image: url })
    } finally {
      setUploading(false)
    }
  }
  return (
    <div className={`rounded-[24px] border bg-white p-4 shadow-sm transition-all duration-300 ${isActive ? 'border-stone-900/20 ring-2 ring-stone-900/10' : 'border-stone-200'}`} onFocusCapture={onSelect}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h4 className="text-lg font-semibold tracking-tight text-stone-900">{item.name || 'Untitled experience'}</h4>
          <p className="mt-1 text-[15px] leading-6 text-stone-600">{item.hero || 'No subtitle'}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => {
            if (isOpen) {
              onClose()
              return
            }
            onSelect()
          }} className="rounded-2xl border border-stone-300 px-3 py-2 text-sm">{isOpen ? 'Close editor' : 'Edit'}</button>
          <IconButton onClick={onMoveUp} disabled={!canMoveUp}><ArrowUp className="h-4 w-4" /></IconButton><IconButton onClick={onMoveDown} disabled={!canMoveDown}><ArrowDown className="h-4 w-4" /></IconButton><IconButton onClick={onDuplicate}><Copy className="h-4 w-4" /></IconButton><IconButton onClick={onDelete}><Trash2 className="h-4 w-4" /></IconButton>
        </div>
      </div>
      <div className={`editor-expand ${isOpen ? 'editor-expand--open' : ''}`}>
        <div className="editor-expand-inner">
          <div className="grid items-stretch gap-4 xl:grid-cols-[minmax(0,1.02fr)_minmax(0,0.98fr)]">
            <div className="flex h-full min-h-[100%] flex-col gap-4 rounded-[22px] border border-stone-200 bg-stone-50/70 p-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-stone-500">Content</p>
                <p className="mt-1 text-sm text-stone-600">Main text, image source and note.</p>
              </div>
              <input className="w-full rounded-2xl border border-stone-300 px-4 py-3" value={item.name} onChange={(e)=>onUpdate({ ...item, name: e.target.value })} placeholder="Name" />
              <input className="w-full rounded-2xl border border-stone-300 px-4 py-3" value={item.hero} onChange={(e)=>onUpdate({ ...item, hero: e.target.value })} placeholder="Hero text" />
              <textarea className="min-h-[220px] w-full flex-1 rounded-2xl border border-stone-300 px-4 py-3" value={item.description} onChange={(e)=>onUpdate({ ...item, description: e.target.value })} placeholder="Description" />
              <input className="w-full rounded-2xl border border-stone-300 px-4 py-3" value={item.image} onChange={(e)=>onUpdate({ ...item, image: e.target.value })} placeholder="Image URL" />
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-stone-300 bg-stone-50 px-4 py-4 text-sm"><ImagePlus className="h-4 w-4" />{uploading ? 'Upload...' : 'Upload image'}<input type="file" accept="image/*" className="hidden" onChange={(e)=>handleUpload(e.target.files?.[0])} /></label>
              <p className="text-xs leading-5 text-stone-500">{uploadHint || 'Uploaded images are automatically compressed to keep the PDF email-friendly.'}</p>
              <button onClick={() => onUpdate({ ...item, image: '' })} className="rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm">Remove image</button>
              <input className="w-full rounded-2xl border border-stone-300 px-4 py-3" value={item.note} onChange={(e)=>onUpdate({ ...item, note: e.target.value })} placeholder="Note" />
            </div>
            <div className="flex h-full min-h-[100%] flex-col gap-4 rounded-[22px] border border-stone-200 bg-stone-50/70 p-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-stone-500">Structure</p>
                <p className="mt-1 text-sm text-stone-600">Visual preview, highlights and pricing.</p>
              </div>
              {item.image ? <img src={item.image} alt={item.name} className="h-72 w-full rounded-[20px] border border-stone-200 object-cover" /> : <div className="flex h-72 items-center justify-center rounded-[20px] border border-stone-200 bg-stone-100 text-stone-400">No image</div>}
              <div className="rounded-[20px] border border-stone-200 bg-white p-4"><p className="mb-3 text-xs uppercase tracking-[0.2em] text-stone-500">Highlights</p><div className="space-y-2">{item.highlights.map((h, i)=><div key={i} className="flex gap-2"><input className="w-full rounded-2xl border border-stone-300 px-4 py-3" value={h} onChange={(e)=>{ const next=[...item.highlights]; next[i]=e.target.value; onUpdate({ ...item, highlights: next }) }} /><button onClick={()=>onUpdate({ ...item, highlights: item.highlights.filter((_, index) => index !== i) })} className="rounded-2xl border border-stone-300 px-3 py-3 text-sm">Remove</button></div>)}<button onClick={()=>onUpdate({ ...item, highlights:[...item.highlights,'[highlight]'] })} className="rounded-2xl border border-stone-300 px-4 py-2 text-sm">Add highlight</button></div></div>
              <div className="flex-1 rounded-[20px] border border-stone-200 bg-white p-4"><p className="mb-3 text-xs uppercase tracking-[0.2em] text-stone-500">Pricing</p><div className="space-y-2">{item.pricing.map((row,i)=><div key={i} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2"><input className="rounded-2xl border border-stone-300 px-3 py-3" value={row.guests} onChange={(e)=>{ const next=[...item.pricing]; next[i]={ ...row, guests:e.target.value}; onUpdate({ ...item, pricing: next }) }} placeholder="Guests" /><input className="rounded-2xl border border-stone-300 px-3 py-3" value={row.duration} onChange={(e)=>{ const next=[...item.pricing]; next[i]={ ...row, duration:e.target.value}; onUpdate({ ...item, pricing: next }) }} placeholder="Duration" /><input className="rounded-2xl border border-stone-300 px-3 py-3" value={row.price} onChange={(e)=>{ const next=[...item.pricing]; next[i]={ ...row, price:e.target.value}; onUpdate({ ...item, pricing: next }) }} placeholder="Price" /><button onClick={()=>onUpdate({ ...item, pricing: item.pricing.filter((_, index) => index !== i) })} className="rounded-2xl border border-stone-300 px-3 py-3 text-sm">Remove</button></div>)}<button onClick={()=>onUpdate({ ...item, pricing:[...item.pricing,{ guests:'', duration:'', price:''}] })} className="rounded-2xl border border-stone-300 px-4 py-2 text-sm">Add price row</button></div></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function IconButton({ children, onClick, disabled=false }: { children: React.ReactNode; onClick: ()=>void; disabled?: boolean }) {
  return <button onClick={onClick} disabled={disabled} className="rounded-2xl border border-stone-300 px-3 py-2 text-stone-700 disabled:opacity-40">{children}</button>
}
