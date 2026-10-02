import { FormEvent, useState } from 'react'
import { LogoTitle } from '../components/brand/LogoTitle'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { useLocation, useNavigate } from 'react-router-dom'
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
    <main className="grid min-h-screen place-items-center bg-[#0A0A0A] px-6 py-12 text-[#F5F5F5]">
      <section className="w-full max-w-md">
        <div className="mb-6 flex justify-center">
          <LogoTitle />
        </div>
        <Card className="border-white/10 bg-[#121212] p-8">
          <p className="text-xs uppercase tracking-widest text-[#A3A3A3]">Operator access</p>
          <h1 className="mt-2 text-2xl font-bold text-[#F5F5F5]">Tournament control</h1>
          <p className="mt-2 text-sm text-[#A3A3A3]">
            Sign in to manage registration, the draw, and live scoring.
          </p>
          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <label className="block text-sm text-[#A3A3A3]">
              Email
              <Input
                className="mt-2"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </label>
            <label className="block text-sm text-[#A3A3A3]">
              Password
              <Input
                className="mt-2"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </label>
            {error && (
              <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                {error}
              </p>
            )}
            <Button className="w-full h-11" type="submit" disabled={submitting}>
              {submitting ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>
        </Card>
      </section>
    </main>
  )
}
