import { useEffect, useState } from 'react'
import { Bracket } from '../components/Bracket'
import type { BracketMatch, BracketPlayer } from '../lib/tournament'
import { supabase } from '../lib/supabase'

export function DisplayPage() {
  const [players, setPlayers] = useState<BracketPlayer[]>([])
  const [matches, setMatches] = useState<BracketMatch[]>([])

  useEffect(() => {
    async function loadBracket() {
      const [{ data: playerData }, { data: matchData }] = await Promise.all([
        supabase.from('players').select('id, name, photo_url').order('created_at'),
        supabase.from('matches').select('round, slot, player1_id, player2_id, best_of, status, winner_id').order('round').order('slot'),
      ])
      setPlayers((playerData ?? []) as BracketPlayer[])
      setMatches((matchData ?? []) as BracketMatch[])
    }
    void loadBracket()
  }, [])

  return (
    <main className="min-h-screen bg-ink px-6 py-12 text-chalk">
      <section className="mx-auto max-w-7xl">
        <p className="text-sm uppercase tracking-[0.35em] text-copper">GBC Solo</p>
        <h1 className="mt-4 font-display text-6xl md:text-8xl">Tournament display</h1>
        <p className="mt-5 max-w-xl text-lg text-white/60">Read-only bracket view. Live match scenes will be added in Step 6.</p>
        <div className="mt-12 overflow-x-auto rounded-2xl bg-chalk p-5 text-ink"><Bracket matches={matches} players={players} /></div>
      </section>
    </main>
  )
}
