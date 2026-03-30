import type { BrochureData } from '@/src/features/pdfcreator/lib/types'

const LOCAL_BROCHURE_KEY = 'lune-local-brochure'
const HISTORY_PREFIX = 'lune-brochure-history'
const PRINT_PREFIX = 'lune-brochure-print'

export type BrochureVersion = {
  id: string
  label: string
  savedAt: number
  data: BrochureData
}

export function loadLocalBrochure(): BrochureData | null {
  if (typeof window === 'undefined') return null

  const raw = window.localStorage.getItem(LOCAL_BROCHURE_KEY)
  if (!raw) return null

  try {
    return JSON.parse(raw) as BrochureData
  } catch {
    return null
  }
}

export function saveLocalBrochure(data: BrochureData) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(LOCAL_BROCHURE_KEY, JSON.stringify(data))
}

export function ensureLocalBrochure(data: BrochureData) {
  const current = loadLocalBrochure()
  if (current) return current
  saveLocalBrochure(data)
  return data
}

function getHistoryKey(brochureId: string) {
  return `${HISTORY_PREFIX}:${brochureId}`
}

function getPrintKey(brochureId: string) {
  return `${PRINT_PREFIX}:${brochureId}`
}

export function loadBrochureVersions(brochureId: string) {
  if (typeof window === 'undefined') return [] as BrochureVersion[]

  const raw = window.localStorage.getItem(getHistoryKey(brochureId))
  if (!raw) return []

  try {
    return JSON.parse(raw) as BrochureVersion[]
  } catch {
    return []
  }
}

export function saveBrochureVersion(brochureId: string, data: BrochureData) {
  if (typeof window === 'undefined') return [] as BrochureVersion[]

  const nextEntry: BrochureVersion = {
    id: crypto.randomUUID(),
    label: data.cover.title || 'Brochure',
    savedAt: Date.now(),
    data: structuredClone(data),
  }

  const nextVersions = [nextEntry, ...loadBrochureVersions(brochureId)].slice(0, 3)
  window.localStorage.setItem(getHistoryKey(brochureId), JSON.stringify(nextVersions))
  return nextVersions
}

export function stageBrochureForPrint(brochureId: string, data: BrochureData) {
  if (typeof window === 'undefined') return
  window.sessionStorage.setItem(getPrintKey(brochureId), JSON.stringify(data))
}

export function loadStagedBrochureForPrint(brochureId: string) {
  if (typeof window === 'undefined') return null as BrochureData | null

  const raw = window.sessionStorage.getItem(getPrintKey(brochureId))
  if (!raw) return null

  try {
    return JSON.parse(raw) as BrochureData
  } catch {
    return null
  }
}
