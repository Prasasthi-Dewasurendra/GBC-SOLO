import { supabase } from '../lib/supabase'

export function AdminPage() {
  async function signOut() {
    await supabase.auth.signOut()
  }

  return (
    <main className="min-h-screen bg-chalk text-ink">
      <header className="flex items-center justify-between border-b border-ink/10 px-6 py-5 md:px-10">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-felt">GBC Solo</p>
          <h1 className="font-display text-3xl">Tournament control</h1>
        </div>
        <button className="rounded-lg border border-ink/20 px-4 py-2 text-sm font-semibold transition hover:bg-ink hover:text-chalk" onClick={signOut}>Sign out</button>
      </header>
      <section className="mx-auto max-w-5xl px-6 py-12 md:px-10">
        <div className="rounded-2xl bg-felt p-8 text-chalk shadow-xl shadow-felt/20">
          <p className="text-sm uppercase tracking-[0.24em] text-copper">Step 1 ready</p>
          <h2 className="mt-3 font-display text-4xl">Your tournament desk</h2>
          <p className="mt-4 max-w-xl leading-7 text-white/70">Player registration, the draw, and live scoring will appear here as we build the next steps.</p>
        </div>
      </section>
    </main>
  )
}
