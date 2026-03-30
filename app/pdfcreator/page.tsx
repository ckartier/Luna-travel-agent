'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Copy, LogOut, Plus, Trash2 } from 'lucide-react'
import { useAuth } from '@/src/contexts/AuthContext'
import { createBrochureDoc, deleteBrochureDoc, duplicateBrochureDoc, listBrochures, signOutUser, type BrochureDocument } from '@/src/features/pdfcreator/lib/firebase'
import { defaultBrochure } from '@/src/features/pdfcreator/lib/full-brochure'
import { ensureLocalBrochure } from '@/src/features/pdfcreator/lib/local-brochure'
import LoadingModal from '@/src/features/pdfcreator/components/loading-modal'

export default function PdfCreatorHomePage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [items, setItems] = useState<BrochureDocument[]>([])
  const [busy, setBusy] = useState(false)
  const [resolved, setResolved] = useState(false)
  const [bootstrapping, setBootstrapping] = useState(false)
  const [mode, setMode] = useState<'remote' | 'local'>('remote')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/pdfcreator/login')
      return
    }

    if (!user) return

    const timeout = window.setTimeout(() => {
      setMode('local')
      setResolved(true)
      setError('The synced workspace is temporarily unavailable. Opening the local draft.')
    }, 1200)

    const unsubscribe = listBrochures(
      user.uid,
      (nextItems) => {
        window.clearTimeout(timeout)
        setItems(nextItems)
        setResolved(true)
      },
      (nextError) => {
        window.clearTimeout(timeout)
        setMode('local')
        setResolved(true)
        setError(nextError.message || 'The synced workspace is temporarily unavailable.')
      }
    )

    return () => {
      window.clearTimeout(timeout)
      unsubscribe?.()
    }
  }, [user])

  useEffect(() => {
    if (loading || !resolved || bootstrapping) return

    if (!user) return

    if (mode === 'local') {
      router.replace('/pdfcreator/login')
      return
    }

    if (items.length > 0) {
      router.replace(`/pdfcreator/${items[0].id}`)
      return
    }

    let cancelled = false

    async function bootstrapBrochure() {
      if (!user) return
      setBootstrapping(true)
      try {
        const id = await createBrochureDoc(user.uid, defaultBrochure)
        if (!cancelled) {
          router.replace(`/pdfcreator/${id}`)
        }
      } catch (nextError: any) {
        ensureLocalBrochure(defaultBrochure)
        if (!cancelled) {
          setMode('local')
          setError(nextError?.message || 'Unable to prepare the synced brochure. Opening the local draft instead.')
          router.replace('/pdfcreator/login')
        }
      }
    }

    bootstrapBrochure().finally(() => {
      if (!cancelled) {
        setBootstrapping(false)
      }
    })

    return () => {
      cancelled = true
    }
  }, [bootstrapping, items, loading, mode, resolved, router, user])

  async function createItem() {
    if (!user) return
    setBusy(true)
    try {
      const id = await createBrochureDoc(user.uid, defaultBrochure)
      router.push(`/pdfcreator/${id}`)
    } finally {
      setBusy(false)
    }
  }

  async function duplicateItem(id: string) {
    if (!user) return
    await duplicateBrochureDoc(user.uid, id)
  }

  async function deleteItem(id: string) {
    if (!window.confirm('Delete this brochure?')) return
    await deleteBrochureDoc(id)
  }

  if (loading || !resolved || bootstrapping || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-stone-100 p-6">
        <LoadingModal
          open
          eyebrow="PDF Creator"
          title="Loading brochure"
          description={bootstrapping ? 'Creating the default brochure...' : 'Opening the latest brochure...'}
        />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-stone-100 p-6 md:p-8">
      <LoadingModal
        open={busy}
        eyebrow="PDF Creator"
        title="Creating brochure"
        description="Preparing a new brochure with the default content."
      />
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-stone-500">Datarnivore / PDF Creator</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight text-stone-900">Brochures</h1>
          </div>
          <div className="flex gap-2">
            <button onClick={createItem} className="rounded-2xl bg-stone-900 px-4 py-3 text-sm font-medium text-white">
              <Plus className="mr-2 inline h-4 w-4" />
              New brochure
            </button>
            <button onClick={signOutUser} className="rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm">
              <LogOut className="mr-2 inline h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
        {error ? <p className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{error}</p> : null}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <article key={item.id} className="rounded-[28px] border border-stone-200 bg-white p-5 shadow-sm">
              <p className="text-xs uppercase tracking-[0.2em] text-stone-500">Brochure</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-stone-900">{item.title || 'Untitled brochure'}</h2>
              <p className="mt-2 text-sm text-stone-600">{new Date(item.updatedAt || item.createdAt || Date.now()).toLocaleString()}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Link href={`/pdfcreator/${item.id}`} className="rounded-2xl bg-stone-900 px-4 py-3 text-sm font-medium text-white">
                  Open
                </Link>
                <button onClick={() => duplicateItem(item.id)} className="rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm">
                  <Copy className="mr-2 inline h-4 w-4" />
                  Duplicate
                </button>
                <button onClick={() => deleteItem(item.id)} className="rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm">
                  <Trash2 className="mr-2 inline h-4 w-4" />
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  )
}
