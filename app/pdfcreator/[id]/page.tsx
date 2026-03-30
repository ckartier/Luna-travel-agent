'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/src/contexts/AuthContext'
import { getBrochureDoc, saveBrochureDoc } from '@/src/features/pdfcreator/lib/firebase'
import { defaultBrochure } from '@/src/features/pdfcreator/lib/full-brochure'
import { loadLocalBrochure, saveBrochureVersion, saveLocalBrochure } from '@/src/features/pdfcreator/lib/local-brochure'
import BrochureEditor from '@/src/features/pdfcreator/components/brochure-editor'
import LoadingModal from '@/src/features/pdfcreator/components/loading-modal'

export default function PdfCreatorDetailPage() {
  const params = useParams()
  const id = typeof params?.id === 'string' ? params.id : ''
  const router = useRouter()
  const { user, loading } = useAuth()
  const [brochure, setBrochure] = useState<any | null>(null)
  const [meta, setMeta] = useState<any | null>(null)
  const [storageMode, setStorageMode] = useState<'remote' | 'local'>('remote')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return

    if (!loading && !user) {
      router.replace('/pdfcreator/login')
      return
    }

    if (id === 'local') {
      const localBrochure = loadLocalBrochure() || defaultBrochure
      setStorageMode('local')
      setMeta({ id: 'local', title: localBrochure.cover.title })
      setBrochure(localBrochure)
      return
    }

    if (loading || !user) return

    getBrochureDoc(id)
      .then((doc) => {
        if (!doc) {
          setBrochure(defaultBrochure)
          setMeta({ id, title: defaultBrochure.cover.title })
          return
        }
        setMeta(doc)
        setBrochure(doc.data)
      })
      .catch((nextError: any) => {
        const localBrochure = loadLocalBrochure() || defaultBrochure
        setStorageMode('local')
        setError(nextError?.message || 'The synced brochure is unavailable. The local draft is open instead.')
        setMeta({ id: 'local', title: localBrochure.cover.title })
        setBrochure(localBrochure)
      })
  }, [id, loading, user])

  if (loading || !brochure || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-stone-100 p-6">
        <LoadingModal
          open
          eyebrow="PDF Creator"
          title="Loading editor"
          description="Preparing the brochure..."
        />
      </main>
    )
  }

  return (
    <BrochureEditor
      brochureId={String(meta?.id || id)}
      brochure={brochure}
      storageMode={storageMode}
      statusMessage={error}
      onChange={(next) => {
        setBrochure(next)
        if (storageMode === 'local') {
          saveLocalBrochure(next)
        }
      }}
      onSave={async (next) => {
        if (storageMode === 'local' || !user) {
          saveLocalBrochure(next)
          saveBrochureVersion(String(meta?.id || id), next)
          return
        }

        await saveBrochureDoc(id, user.uid, next)
        saveBrochureVersion(String(meta?.id || id), next)
      }}
      onBack={() => router.push('/pdfcreator')}
    />
  )
}
