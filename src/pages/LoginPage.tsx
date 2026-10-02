import { FormEvent, useState } from 'react'
import { LogoTitle } from '../components/brand/LogoTitle'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
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
    <main className="grid min-h-screen place-items-center bg-felt-gradient px-6 py-12 text-warm">
      <section className="w-full max-w-md"><div className="mb-6 flex justify-center"><LogoTitle /></div><Card className="p-8">
        <p className="text-xs uppercase tracking-[0.28em] text-gold">Operator access</p>
        <h1 className="mt-3 font-display text-3xl">Tournament control</h1>
        <p className="mt-3 text-sm leading-6 text-muted">Sign in to manage registration, the draw, and live scoring.</p>
        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <label className="block text-sm text-muted">
            Email
            <Input className="mt-2" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </label>
          <label className="block text-sm text-muted">
            Password
            <Input className="mt-2" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
          </label>
          {error && <p className="rounded-lg border border-goldDark/50 bg-goldDark/15 px-3 py-2 text-sm text-gold">{error}</p>}
          <Button className="w-full" type="submit" disabled={submitting}>
            {submitting ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>
      </Card></section>
    </main>
  )
}
