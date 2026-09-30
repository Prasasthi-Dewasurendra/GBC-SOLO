import { useParams } from 'react-router-dom'

export function CapturePage() {
  const { playerId } = useParams<{ playerId: string }>()

  return (
    <main className="grid min-h-screen place-items-center bg-chalk px-6 text-center text-ink">
      <section className="max-w-md">
        <p className="text-sm uppercase tracking-[0.28em] text-felt">GBC Solo</p>
        <h1 className="mt-4 font-display text-5xl">Remote photo capture</h1>
        <p className="mt-4 text-ink/65">Phone capture for player {playerId ?? 'unknown'} will be enabled in Step 3.</p>
      </section>
    </main>
  )
}
