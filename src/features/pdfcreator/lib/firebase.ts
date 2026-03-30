import { addDoc, collection, deleteDoc, doc, getDoc, onSnapshot, query, setDoc, where } from 'firebase/firestore'
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { signOut } from 'firebase/auth'
import { auth, db, storage } from '@/src/lib/firebase/client'
import type { BrochureData, SourcePdfAsset } from '@/src/features/pdfcreator/lib/types'

export type BrochureDocument = {
  id: string
  userId: string
  title: string
  data: BrochureData
  createdAt: number
  updatedAt: number
}

export type ExtractionJobDocument = {
  id: string
  brochureId: string
  userId: string
  sourcePdf: SourcePdfAsset
  status: 'uploaded' | 'processing' | 'ready' | 'failed'
  createdAt: number
  updatedAt: number
  error?: string
  rawText?: string
  pageCount?: number
}

export async function signOutUser() {
  await signOut(auth)
}

export async function uploadImage(userId: string, file: File) {
  const path = `pdfcreator/images/${userId}/${Date.now()}-${file.name}`
  const fileRef = ref(storage, path)
  await uploadBytes(fileRef, file)
  return getDownloadURL(fileRef)
}

export async function uploadBrochurePdf(userId: string, file: File) {
  const safeName = file.name.replace(/[^\w.-]+/g, '-')
  const storagePath = `pdfcreator/source-pdfs/${userId}/${Date.now()}-${safeName}`
  const fileRef = ref(storage, storagePath)
  await uploadBytes(fileRef, file, { contentType: file.type || 'application/pdf' })

  return {
    name: file.name,
    url: await getDownloadURL(fileRef),
    storagePath,
    size: file.size,
    uploadedAt: Date.now(),
  } as SourcePdfAsset
}

export async function createBrochureDoc(userId: string, data: BrochureData) {
  const refDoc = await addDoc(collection(db, 'pdfcreatorBrochures'), {
    userId,
    title: data.cover?.title || 'Untitled brochure',
    data,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  })
  return refDoc.id
}

export function listBrochures(
  userId: string,
  cb: (items: BrochureDocument[]) => void,
  onError?: (error: Error) => void
) {
  const q = query(collection(db, 'pdfcreatorBrochures'), where('userId', '==', userId))
  return onSnapshot(
    q,
    (snap) => {
      const items = snap.docs.map((snapshot) => ({ id: snapshot.id, ...snapshot.data() })) as BrochureDocument[]
      items.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
      cb(items)
    },
    (error) => {
      onError?.(error)
    }
  )
}

export async function getBrochureDoc(id: string) {
  const snapshot = await getDoc(doc(db, 'pdfcreatorBrochures', id))
  return snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as BrochureDocument) : null
}

export async function saveBrochureDoc(id: string, userId: string, data: BrochureData) {
  const current = await getBrochureDoc(id)
  await setDoc(
    doc(db, 'pdfcreatorBrochures', id),
    {
      userId,
      title: data.cover?.title || 'Untitled brochure',
      data,
      updatedAt: Date.now(),
      createdAt: current?.createdAt ?? Date.now(),
    },
    { merge: true }
  )
}

export async function deleteBrochureDoc(id: string) {
  await deleteDoc(doc(db, 'pdfcreatorBrochures', id))
}

export async function duplicateBrochureDoc(userId: string, id: string) {
  const current = await getBrochureDoc(id)
  if (!current) return null

  const copy = structuredClone(current.data)
  copy.cover.title = `${copy.cover.title} copy`
  return createBrochureDoc(userId, copy)
}

export async function createExtractionJob(job: Omit<ExtractionJobDocument, 'id' | 'createdAt' | 'updatedAt'>) {
  const now = Date.now()
  const refDoc = await addDoc(collection(db, 'pdfcreatorExtractionJobs'), {
    ...job,
    createdAt: now,
    updatedAt: now,
  })

  return refDoc.id
}

export async function updateExtractionJob(id: string, patch: Partial<Omit<ExtractionJobDocument, 'id'>>) {
  await setDoc(
    doc(db, 'pdfcreatorExtractionJobs', id),
    {
      ...patch,
      updatedAt: Date.now(),
    },
    { merge: true }
  )
}
