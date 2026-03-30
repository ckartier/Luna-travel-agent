'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ArrowLeft, Printer } from 'lucide-react'
import { useAuth } from '@/src/contexts/AuthContext'
import BrochurePreview from '@/src/features/pdfcreator/components/brochure-preview'
import LoadingModal from '@/src/features/pdfcreator/components/loading-modal'
import { getBrochureDoc } from '@/src/features/pdfcreator/lib/firebase'
import { defaultBrochure } from '@/src/features/pdfcreator/lib/full-brochure'
import { loadLocalBrochure, loadStagedBrochureForPrint } from '@/src/features/pdfcreator/lib/local-brochure'
import type { BrochureData } from '@/src/features/pdfcreator/lib/types'

export default function PdfCreatorPrintPage() {
  const params = useParams()
  const id = typeof params?.id === 'string' ? params.id : ''
  const { user, loading } = useAuth()
  const [brochure, setBrochure] = useState<BrochureData | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return

    const staged = loadStagedBrochureForPrint(id)
    if (staged) {
      setBrochure(staged)
      return
    }

    if (!loading && !user) {
      window.location.replace('/pdfcreator/login')
      return
    }

    if (id === 'local') {
      setBrochure(loadLocalBrochure() || defaultBrochure)
      return
    }

    if (loading || !user) return

    getBrochureDoc(id)
      .then((doc) => {
        setBrochure(doc?.data || defaultBrochure)
      })
      .catch((nextError: any) => {
        setError(nextError?.message || 'Unable to load the brochure for print.')
        setBrochure(defaultBrochure)
      })
  }, [id, loading, user])

  if (!brochure) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-stone-100 p-6">
        <LoadingModal
          open
          eyebrow="PDF Creator"
          title="Preparing print layout"
          description="Loading the brochure in the dedicated print page."
        />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-stone-100 text-stone-900">
      <div className="mx-auto max-w-7xl px-4 py-4 lg:px-6 print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[28px] border border-stone-200 bg-white px-5 py-4 shadow-sm">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-stone-500">Dedicated print page</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-stone-900">PDF export layout</h1>
            <p className="mt-2 text-sm leading-6 text-stone-600">
              This page is isolated from the editor, so pagination is more stable and the two-items-per-page layout is preserved.
            </p>
            {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={`/pdfcreator/${id}`} className="rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm font-medium">
              <ArrowLeft className="mr-2 inline h-4 w-4" />
              Back to editor
            </Link>
            <button onClick={() => window.print()} className="rounded-2xl bg-stone-900 px-4 py-3 text-sm font-medium text-white">
              <Printer className="mr-2 inline h-4 w-4" />
              Print PDF
            </button>
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-4 pb-10 lg:px-6">
        <BrochurePreview brochure={brochure} />
      </div>
    </main>
  )
}
