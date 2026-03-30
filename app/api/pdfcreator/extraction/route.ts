import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json(
    {
      ok: false,
      message: 'The OCR pipeline is not configured yet on datarnivore hosting.',
    },
    { status: 501 }
  )
}
