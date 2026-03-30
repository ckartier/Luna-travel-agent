export type PricingRow = { guests: string; duration: string; price: string }
export type SourcePdfAsset = {
  name: string
  url: string
  storagePath: string
  size: number
  uploadedAt: number
}

export type ExtractionStatus = 'idle' | 'uploaded' | 'processing' | 'ready' | 'failed'

export type ExtractionResult = {
  status: ExtractionStatus
  requestedAt?: number
  completedAt?: number
  error?: string
  rawText?: string
  pageCount?: number
}

export type Experience = {
  id: string
  name: string
  hero: string
  description: string
  image: string
  highlights: string[]
  pricing: PricingRow[]
  note: string
}
export type BrochureSection = { id: string; title: string; items: Experience[] }
export type BrochureData = {
  brand: string
  logo: string
  city: string
  year: string
  sourcePdf?: SourcePdfAsset | null
  extraction?: ExtractionResult | null
  cover: { title: string; intro: string; image: string }
  contact: { name: string; phone: string; email: string; instagram: string; locations: string }
  sections: BrochureSection[]
}
