'use client'

export default function LoadingModal({
  open,
  eyebrow = 'LUNE',
  title,
  description,
}: {
  open: boolean
  eyebrow?: string
  title: string
  description: string
}) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/38 p-6 backdrop-blur-sm">
      <div className="loading-modal-panel w-full max-w-md rounded-[32px] border border-stone-200 bg-white p-8 text-center shadow-2xl">
        <p className="text-xs uppercase tracking-[0.3em] text-stone-500">{eyebrow}</p>
        <div className="mx-auto mt-5 flex h-16 w-16 items-center justify-center rounded-full border border-stone-200 bg-stone-50">
          <div className="loading-orbit relative h-8 w-8">
            <span className="loading-dot absolute left-1/2 top-0 h-3 w-3 -translate-x-1/2 rounded-full bg-stone-900" />
            <span className="absolute inset-[6px] rounded-full border border-stone-300" />
          </div>
        </div>
        <h2 className="mt-5 text-3xl font-semibold tracking-tight text-stone-900">{title}</h2>
        <p className="mt-3 text-sm leading-6 text-stone-600">{description}</p>
      </div>
    </div>
  )
}
