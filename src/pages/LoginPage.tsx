import { FormEvent, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)

    const { error: loginError } = await supabase.auth.signInWithPassword({ email, password })

    if (loginError) {
      setError(loginError.message)
      setSubmitting(false)
      return
    }

    const destination = (location.state as { from?: string } | null)?.from ?? '/admin'
    navigate(destination, { replace: true })
  }

  return (
    <main className="grid min-h-screen place-items-center bg-ink px-6 py-12 text-chalk">
      <section className="w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.06] p-8 shadow-2xl shadow-black/20">
        <p className="mb-3 text-sm uppercase tracking-[0.28em] text-copper">GBC Solo</p>
        <h1 className="font-display text-4xl">Tournament control</h1>
        <p className="mt-3 text-sm leading-6 text-white/65">Sign in with the club administrator account to manage the draw and scoring.</p>
        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <label className="block text-sm text-white/75">
            Email
            <input className="mt-2 w-full rounded-lg border border-white/15 bg-black/20 px-3 py-2.5 text-chalk outline-none ring-copper focus:ring-2" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </label>
          <label className="block text-sm text-white/75">
            Password
            <input className="mt-2 w-full rounded-lg border border-white/15 bg-black/20 px-3 py-2.5 text-chalk outline-none ring-copper focus:ring-2" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
          </label>
          {error && <p className="rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-2 text-sm text-red-200">{error}</p>}
          <button className="w-full rounded-lg bg-copper px-4 py-3 font-semibold text-ink transition hover:bg-[#e5a66b] disabled:cursor-not-allowed disabled:opacity-60" type="submit" disabled={submitting}>
            {submitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </section>
    </main>
  )
}
