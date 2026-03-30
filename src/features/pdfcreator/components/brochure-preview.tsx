'use client'
import { useEffect, useRef } from 'react'
import { BrochureData, Experience } from '@/src/features/pdfcreator/lib/types'

function chunkItems<T>(items: T[], size: number) {
  const chunks: T[][] = []
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size))
  }
  return chunks
}

function isPlaceholderHighlight(value: string) {
  const normalized = value.trim().toLowerCase()
  return normalized.startsWith('[highlight')
}

function ExperienceCard({
  item,
  index,
  compact = false,
  printMode = false,
  isActive = false,
}: {
  item: Experience
  index: number
  compact?: boolean
  printMode?: boolean
  isActive?: boolean
}) {
  const visibleHighlights = item.highlights.filter((highlight) => !isPlaceholderHighlight(highlight))

  return (
    <article
      data-preview-experience-id={item.id}
      className={`overflow-hidden rounded-[28px] border border-stone-200 bg-white ${
        printMode ? 'print-experience grid grid-cols-[150px_1fr]' : compact ? '' : 'lg:grid lg:grid-cols-[320px_1fr]'
      } ${isActive && !printMode ? 'preview-focus-card ring-2 ring-stone-900/10' : ''} ${
        !printMode ? 'transition-all duration-300 ease-out' : ''
      }`}
    >
      <div className="bg-stone-100">
        {item.image ? (
          <img
            src={item.image}
            alt={item.name}
            className={`w-full object-cover ${printMode ? 'h-full min-h-[220px]' : compact ? 'h-52' : 'h-full min-h-[280px]'}`}
          />
        ) : (
          <div className={`flex items-center justify-center bg-stone-100 text-stone-400 ${printMode ? 'h-full min-h-[220px]' : compact ? 'h-52' : 'h-full min-h-[280px]'}`}>
            No image
          </div>
        )}
      </div>
      <div className={printMode ? 'p-4' : 'p-6 lg:p-8'}>
        <div className={`mb-3 flex items-center gap-3 text-xs uppercase tracking-[0.28em] text-stone-500 ${printMode ? 'print-meta' : ''}`}>
          <span>{String(index + 1).padStart(2, '0')}</span>
          <div className="h-px flex-1 bg-stone-200" />
        </div>
        <h3 className={`${printMode ? 'print-title text-[20px] leading-[1.05]' : 'text-2xl'} font-semibold tracking-tight text-stone-900`}>
          {item.name}
        </h3>
        <p className={`mt-2 font-medium text-stone-500 ${printMode ? 'print-hero text-[11px] leading-4' : 'text-sm'}`}>{item.hero}</p>
        <p className={`mt-2 text-stone-700 ${printMode ? 'print-copy text-[10.5px] leading-[1.42]' : 'text-sm leading-7'}`}>{item.description}</p>
        <div className={`mt-3 flex flex-wrap gap-2 ${printMode ? 'print-badges gap-1.5' : ''}`}>
          {visibleHighlights.slice(0, printMode ? 4 : visibleHighlights.length).map((highlight, highlightIndex) => (
            <span
              key={highlightIndex}
              className={`rounded-full border border-stone-300 uppercase tracking-[0.18em] text-stone-600 ${
                printMode ? 'px-2 py-1 text-[9px]' : 'px-3 py-1 text-[11px]'
              }`}
            >
              {highlight}
            </span>
          ))}
        </div>
        <div className={`mt-4 overflow-hidden rounded-[18px] border border-stone-200 ${printMode ? 'print-table' : ''}`}>
          <table className={`w-full border-collapse ${printMode ? 'text-[10px]' : 'text-sm'}`}>
            <thead>
              <tr className="bg-[var(--sand)] text-left text-stone-600">
                <th className={printMode ? 'px-2.5 py-2 font-medium' : 'px-4 py-3 font-medium'}>Guests</th>
                <th className={printMode ? 'px-2.5 py-2 font-medium' : 'px-4 py-3 font-medium'}>Duration</th>
                <th className={printMode ? 'px-2.5 py-2 font-medium' : 'px-4 py-3 font-medium'}>Price</th>
              </tr>
            </thead>
            <tbody>
              {item.pricing.slice(0, printMode ? 4 : item.pricing.length).map((row, pricingIndex) => (
                <tr key={pricingIndex} className="border-t border-stone-200">
                  <td className={printMode ? 'px-2.5 py-2' : 'px-4 py-3'}>{row.guests}</td>
                  <td className={printMode ? 'px-2.5 py-2' : 'px-4 py-3'}>{row.duration}</td>
                  <td className={`${printMode ? 'px-2.5 py-2' : 'px-4 py-3'} font-medium`}>{row.price}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {item.note ? (
          <p className={`mt-3 text-stone-500 ${printMode ? 'print-note text-[10px] leading-4' : 'text-sm'}`}>{item.note}</p>
        ) : null}
      </div>
    </article>
  )
}

export default function BrochurePreview({
  brochure,
  compact = false,
  activeSectionId,
  activeExperienceId,
}: {
  brochure: BrochureData
  compact?: boolean
  activeSectionId?: string
  activeExperienceId?: string
}) {
  return <BrochurePreviewInner brochure={brochure} compact={compact} activeSectionId={activeSectionId} activeExperienceId={activeExperienceId} />
}

export function BrochurePreviewInner({
  brochure,
  compact = false,
  activeSectionId,
  activeExperienceId,
}: {
  brochure: BrochureData
  compact?: boolean
  activeSectionId?: string
  activeExperienceId?: string
}) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const sectionPages = brochure.sections.flatMap((section) =>
    chunkItems(section.items, 2).map((items, pageIndex) => ({
      id: `${section.id}-${pageIndex}`,
      sectionTitle: section.title,
      items,
      offset: pageIndex * 2,
      }))
  )

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const target =
      (activeExperienceId
        ? container.querySelector<HTMLElement>(`[data-preview-experience-id="${activeExperienceId}"]`)
        : null) ||
      (activeSectionId
        ? container.querySelector<HTMLElement>(`[data-preview-section-id="${activeSectionId}"]`)
        : null)

    if (!target) return

    target.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' })
  }, [activeSectionId, activeExperienceId])

  return (
    <div ref={containerRef}>
      <div className="screen-only space-y-6 print:space-y-4">
        <section className="print-page overflow-hidden rounded-[32px] border border-stone-200 bg-[var(--paper)] shadow-sm">
          <div className="border-b border-[var(--line)] bg-[var(--sand)] px-8 py-4 text-xs uppercase tracking-[0.28em] text-[var(--ink)]">
            {brochure.brand} · {brochure.city} · {brochure.year}
          </div>
          <div className={`grid gap-8 px-8 py-8 ${compact ? 'xl:grid-cols-1' : 'lg:grid-cols-[1fr_320px]'}`}>
            <div>
              <div className="flex max-w-[260px] flex-col items-start">
                {brochure.logo ? (
                  <img src={brochure.logo} alt={brochure.brand} className="block h-14 w-auto max-w-[220px] object-contain object-left" />
                ) : null}
                <p className="mt-2 text-xs uppercase tracking-[0.34em] text-stone-500">Private Travel Design</p>
              </div>
              <h1 className="mt-4 max-w-[10ch] text-5xl font-semibold leading-none tracking-tight text-stone-900 lg:text-6xl">
                {brochure.city}
                <br />
                {brochure.cover.title}
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-stone-700">{brochure.cover.intro}</p>
            </div>
            <aside className={`rounded-[28px] border border-stone-200 bg-stone-50 p-6 ${compact ? 'hidden' : ''}`}>
              <p className="text-xs uppercase tracking-[0.24em] text-stone-500">Contact</p>
              <div className="mt-5 space-y-3 text-sm text-stone-700">
                <p className="font-medium text-stone-900">{brochure.contact.name}</p>
                <p>{brochure.contact.locations}</p>
                <p>{brochure.contact.phone}</p>
                <p>{brochure.contact.email}</p>
                <p>{brochure.contact.instagram}</p>
              </div>
            </aside>
          </div>
          <div className="px-8 pb-8">
            <img
              src={brochure.cover.image}
              alt={brochure.cover.title}
              className={`${compact ? 'h-[260px]' : 'h-[380px]'} w-full rounded-[28px] border border-stone-200 object-cover`}
            />
          </div>
        </section>
        {brochure.sections.map((section) => (
          <section
            key={section.id}
            data-preview-section-id={section.id}
            className={`print-page space-y-5 rounded-[32px] border border-stone-200 bg-[var(--paper)] p-6 shadow-sm transition-all duration-300 ease-out ${
              activeSectionId === section.id ? 'preview-focus-card ring-2 ring-stone-900/10' : ''
            }`}
          >
            <div className="border-b border-[var(--line)] pb-4">
              <p className="text-xs uppercase tracking-[0.28em] text-stone-500">Collection</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-stone-900">{section.title}</h2>
            </div>
            <div className="space-y-5">
              {section.items.map((item, index) => (
                <ExperienceCard
                  key={item.id}
                  item={item}
                  index={index}
                  compact={compact}
                  isActive={activeExperienceId === item.id}
                />
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="print-only">
        <section className="print-page print-cover-page overflow-hidden bg-[var(--paper)]">
          <div className="border-b border-[var(--line)] bg-[var(--sand)] px-6 py-3 text-[10px] uppercase tracking-[0.28em] text-[var(--ink)]">
            {brochure.brand} · {brochure.city} · {brochure.year}
          </div>
          <div className="grid gap-5 px-6 py-6 grid-cols-[1fr_220px]">
            <div>
              <div className="flex max-w-[220px] flex-col items-start">
                {brochure.logo ? (
                  <img src={brochure.logo} alt={brochure.brand} className="block h-12 w-auto max-w-[190px] object-contain object-left" />
                ) : null}
                <p className="mt-2 text-[10px] uppercase tracking-[0.34em] text-stone-500">Private Travel Design</p>
              </div>
              <h1 className="mt-3 max-w-[10ch] text-[42px] font-semibold leading-[0.95] tracking-tight text-stone-900">
                {brochure.city}
                <br />
                {brochure.cover.title}
              </h1>
              <p className="mt-4 text-[13px] leading-6 text-stone-700">{brochure.cover.intro}</p>
            </div>
            <aside className="rounded-[20px] border border-stone-200 bg-stone-50 p-4">
              <p className="text-[10px] uppercase tracking-[0.24em] text-stone-500">Contact</p>
              <div className="mt-4 space-y-2 text-[12px] leading-5 text-stone-700">
                <p className="font-medium text-stone-900">{brochure.contact.name}</p>
                <p>{brochure.contact.locations}</p>
                <p>{brochure.contact.phone}</p>
                <p>{brochure.contact.email}</p>
                <p>{brochure.contact.instagram}</p>
              </div>
            </aside>
          </div>
          <div className="px-6 pb-6">
            <img src={brochure.cover.image} alt={brochure.cover.title} className="h-[132mm] w-full rounded-[24px] border border-stone-200 object-cover" />
          </div>
        </section>

        {sectionPages.map((page) => (
          <section key={page.id} className="print-page print-two-up-page bg-[var(--paper)] px-5 py-4">
            <div className="mb-3 flex items-end justify-between border-b border-[var(--line)] pb-3">
              <div>
                <p className="text-[10px] uppercase tracking-[0.28em] text-stone-500">Collection</p>
                <h2 className="mt-1 text-[26px] font-semibold tracking-tight text-stone-900">{page.sectionTitle}</h2>
              </div>
              <p className="text-[10px] uppercase tracking-[0.22em] text-stone-500">
                {page.offset + 1} - {page.offset + page.items.length}
              </p>
            </div>
            <div className="space-y-4">
              {page.items.map((item, index) => (
                <ExperienceCard key={item.id} item={item} index={page.offset + index} printMode />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
