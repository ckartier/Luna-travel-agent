'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AlertCircle, ArrowRight, CheckCircle2, Loader2 } from 'lucide-react'
import { useAuth } from '@/src/contexts/AuthContext'
import { sendPasswordReset, signUpWithEmail } from '@/src/lib/firebase/auth'

export default function PdfCreatorLoginPage() {
  const router = useRouter()
  const { user, loading, login, loginWithGoogle } = useAuth()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && user) {
      router.replace('/pdfcreator')
    }
  }, [loading, router, user])

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    setNotice(null)

    try {
      if (mode === 'signup') {
        const result = await signUpWithEmail(email, password, name.trim() || 'PDF Creator User')
        if (result.error) {
          setError(result.error)
          return
        }
      } else {
        const result = await login(email, password)
        if (result.error) {
          setError(result.error)
          return
        }
      }
    } finally {
      setSubmitting(false)
    }
  }

  async function handleGoogle() {
    setSubmitting(true)
    setError(null)
    setNotice(null)
    try {
      const result = await loginWithGoogle()
      if (result.error) {
        setError(result.error)
      }
    } finally {
      setSubmitting(false)
    }
  }

  async function handleResetPassword() {
    if (!email) {
      setError('Enter your email before requesting a reset link.')
      return
    }

    const result = await sendPasswordReset(email)
    if (result.error) {
      setError(result.error)
      return
    }

    setError(null)
    setNotice(`Reset link sent to ${email}`)
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#f7f4ef,transparent_28%),linear-gradient(180deg,#f5efe7_0%,#efe7de_100%)] px-6 py-10 text-stone-900">
      <div className="mx-auto max-w-5xl">
        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="rounded-[32px] border border-stone-200 bg-white/70 p-8 shadow-[0_24px_80px_rgba(68,52,42,0.08)] backdrop-blur">
            <p className="text-xs uppercase tracking-[0.34em] text-stone-500">Datarnivore</p>
            <h1 className="mt-4 max-w-[11ch] text-5xl font-semibold leading-[0.94] tracking-[-0.05em] text-stone-900">
              PDF Creator
              <br />
              Workspace
            </h1>
            <p className="mt-5 max-w-xl text-[15px] leading-8 text-stone-600">
              Manage brochure edits, preview the print layout, upload source PDFs, and export clean A4 documents from one focused workspace.
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <div className="rounded-[22px] border border-stone-200 bg-white p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-stone-500">Edit</p>
                <p className="mt-2 text-sm leading-6 text-stone-700">Sections, experiences, images, pricing, and brand assets.</p>
              </div>
              <div className="rounded-[22px] border border-stone-200 bg-white p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-stone-500">Preview</p>
                <p className="mt-2 text-sm leading-6 text-stone-700">Fast live preview with print-safe pagination.</p>
              </div>
              <div className="rounded-[22px] border border-stone-200 bg-white p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-stone-500">Export</p>
                <p className="mt-2 text-sm leading-6 text-stone-700">Email-friendly PDF workflow and source-file tracking.</p>
              </div>
            </div>
          </section>

          <section className="rounded-[32px] border border-stone-200 bg-white p-8 shadow-[0_24px_80px_rgba(68,52,42,0.1)]">
            <div className="mb-6 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-stone-500">Secure access</p>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight text-stone-900">
                  {mode === 'login' ? 'Sign in' : 'Create account'}
                </h2>
              </div>
              <img src="/branding/lune-logo.png" alt="LUNE" className="h-10 w-auto object-contain" />
            </div>

            <div className="mb-5 inline-flex rounded-full border border-stone-200 bg-stone-50 p-1">
              <button
                type="button"
                onClick={() => setMode('login')}
                className={`rounded-full px-4 py-2 text-sm transition ${mode === 'login' ? 'bg-stone-900 text-white' : 'text-stone-600'}`}
              >
                Sign in
              </button>
              <button
                type="button"
                onClick={() => setMode('signup')}
                className={`rounded-full px-4 py-2 text-sm transition ${mode === 'signup' ? 'bg-stone-900 text-white' : 'text-stone-600'}`}
              >
                Create account
              </button>
            </div>

            {error ? (
              <div className="mb-4 flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            ) : null}

            {notice ? (
              <div className="mb-4 flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                {notice}
              </div>
            ) : null}

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' ? (
                <input
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Full name"
                  className="w-full rounded-2xl border border-stone-300 px-4 py-3"
                  required
                />
              ) : null}

              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Email"
                className="w-full rounded-2xl border border-stone-300 px-4 py-3"
                required
              />

              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Password"
                className="w-full rounded-2xl border border-stone-300 px-4 py-3"
                required
              />

              <button
                type="submit"
                disabled={submitting}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-stone-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-stone-800 disabled:opacity-50"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                {mode === 'login' ? 'Sign in to PDF Creator' : 'Create PDF Creator account'}
              </button>
            </form>

            <div className="my-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-stone-200" />
              <span className="text-xs uppercase tracking-[0.2em] text-stone-400">or</span>
              <div className="h-px flex-1 bg-stone-200" />
            </div>

            <button
              type="button"
              onClick={handleGoogle}
              disabled={submitting}
              className="flex w-full items-center justify-center gap-3 rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-700 transition hover:bg-stone-50 disabled:opacity-50"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Continue with Google
            </button>

            <button
              type="button"
              onClick={handleResetPassword}
              className="mt-4 text-sm text-stone-500 transition hover:text-stone-900"
            >
              Forgot password?
            </button>

            <div className="mt-8 border-t border-stone-200 pt-5">
              <Link href="/login/travel" className="text-sm text-stone-500 transition hover:text-stone-900">
                Back to Luna travel login
              </Link>
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}
