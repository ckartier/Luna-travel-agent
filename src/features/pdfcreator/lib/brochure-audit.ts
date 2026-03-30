import { BrochureData } from '@/src/features/pdfcreator/lib/types'

export const sourcePdfPath = '/complete/LUNE - PARIS (experiences brochure 2026).pdf'

export type BrochureAuditIssue = {
  id: string
  sectionTitle: string
  itemName: string
  message: string
  kind: 'name' | 'description' | 'highlights' | 'pricing'
}

export type BrochureAuditSummary = {
  name: number
  description: number
  highlights: number
  pricing: number
}

function hasPlaceholder(value: string) {
  const normalized = value.trim()

  if (!normalized) return true

  return (
    normalized.includes('[highlight') ||
    normalized.includes('[Short description') ||
    normalized.includes('TBD') ||
    normalized.includes('placeholder') ||
    normalized.includes('truncated')
  )
}

export function getBrochureAuditIssues(brochure: BrochureData): BrochureAuditIssue[] {
  const issues: BrochureAuditIssue[] = []

  for (const section of brochure.sections) {
    for (const item of section.items) {
      const baseId = `${section.id}:${item.id}`

      if (hasPlaceholder(item.name) || item.name.trim() === 'The') {
        issues.push({
          id: `${baseId}:name`,
          sectionTitle: section.title,
          itemName: item.name || 'Untitled experience',
          message: 'Title is incomplete or still needs confirmation from the source PDF.',
          kind: 'name',
        })
      }

      if (hasPlaceholder(item.description)) {
        issues.push({
          id: `${baseId}:description`,
          sectionTitle: section.title,
          itemName: item.name || 'Untitled experience',
          message: 'Description is incomplete or still left as a placeholder.',
          kind: 'description',
        })
      }

      const placeholderHighlights = item.highlights.filter((highlight) => hasPlaceholder(highlight)).length
      if (placeholderHighlights > 0) {
        issues.push({
          id: `${baseId}:highlights`,
          sectionTitle: section.title,
          itemName: item.name || 'Untitled experience',
          message: `${placeholderHighlights} highlight(s) still need completion.`,
          kind: 'highlights',
        })
      }

      const incompletePricingRows = item.pricing.filter((row) =>
        hasPlaceholder(row.guests) || hasPlaceholder(row.duration) || hasPlaceholder(row.price)
      ).length

      if (incompletePricingRows > 0) {
        issues.push({
          id: `${baseId}:pricing`,
          sectionTitle: section.title,
          itemName: item.name || 'Untitled experience',
          message: `${incompletePricingRows} pricing row(s) are incomplete.`,
          kind: 'pricing',
        })
      }
    }
  }

  return issues
}

export function getBrochureAuditSummary(issues: BrochureAuditIssue[]): BrochureAuditSummary {
  return issues.reduce<BrochureAuditSummary>((summary, issue) => {
    summary[issue.kind] += 1
    return summary
  }, { name: 0, description: 0, highlights: 0, pricing: 0 })
}
