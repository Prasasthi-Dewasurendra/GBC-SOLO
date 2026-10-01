import { useEffect, useState } from 'react'
import { Bracket } from '../components/Bracket'
import { buildBracket, type BracketMatch, type BracketPlayer } from '../lib/tournament'
import { supabase } from '../lib/supabase'

type PlayerRow = BracketPlayer & { seed: number | null; created_at: string }

export function DrawPage() {
  const [players, setPlayers] = useState<PlayerRow[]>([])
  const [matches, setMatches] = useState<BracketMatch[]>([])
  const [state, setState] = useState('registration')
  const [busy, setBusy] = useState(true)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      setBusy(true)
      const [{ data: playerData, error: playerError }, { data: tournamentData, error: tournamentError }] = await Promise.all([
        supabase.from('players').select('*').order('created_at'),
        supabase.from('tournament').select('state').eq('id', 1).single(),
      ])
      if (playerError || tournamentError) {
        setMessage(playerError?.message ?? tournamentError?.message ?? 'Could not load tournament data.')
        setBusy(false)
        return
      }
      setPlayers((playerData ?? []) as PlayerRow[])
      setState(tournamentData.state)
      if (tournamentData.state !== 'registration') {
        const { data: matchData, error: matchError } = await supabase.from('matches').select('round, slot, player1_id, player2_id, best_of, status, winner_id').order('round').order('slot')
        if (matchError) setMessage(matchError.message)
        else setMatches((matchData ?? []) as BracketMatch[])
      }
      setBusy(false)
    }
    void load()
  }, [])

  function redraw() {
    if (players.length !== 32) {
      setMessage('Register exactly 32 players before drawing the bracket.')
      return
    }
    setMatches(buildBracket(players))
    setMessage(null)
  }

  async function confirmDraw() {
    if (players.length !== 32 || matches.length !== 31) {
      setMessage('Create a complete 32-player preview before confirming.')
      return
    }
    if (!window.confirm('Confirm this draw? The bracket will be locked for scoring.')) return
    setBusy(true)
    setMessage(null)
    const { error: deleteError } = await supabase.from('matches').delete().gte('round', 1)
    if (deleteError) {
      setMessage(deleteError.message)
      setBusy(false)
      return
    }
    const { error: insertError } = await supabase.from('matches').insert(matches)
    if (insertError) {
      setMessage(insertError.message)
      setBusy(false)
      return
    }
    const { error: stateError } = await supabase.from('tournament').update({ state: 'drawn' }).eq('id', 1)
    if (stateError) setMessage(stateError.message)
    else setState('drawn')
    setBusy(false)
  }

  return <main className="min-h-screen bg-chalk text-ink">
    <header className="flex items-center justify-between border-b border-ink/10 px-6 py-5 md:px-10"><div><p className="text-xs uppercase tracking-[0.28em] text-felt">GBC Solo</p><h1 className="font-display text-3xl">Tournament draw</h1></div><a className="rounded-lg border border-ink/20 px-4 py-2 text-sm font-semibold" href="/admin">Back to registration</a></header>
    <section className="mx-auto max-w-7xl px-6 py-10 md:px-10"><div className="mb-8 flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm uppercase tracking-[0.24em] text-felt">{state === 'registration' ? 'Preview mode' : 'Draw confirmed'}</p><h2 className="font-display text-5xl">The bracket</h2><p className="mt-2 text-ink/60">{players.length} of 32 players registered.</p></div><div className="flex gap-2">{state === 'registration' && <><button className="rounded-lg border border-ink/20 px-4 py-2 font-semibold" onClick={redraw} disabled={busy}>Redraw</button><button className="rounded-lg bg-felt px-4 py-2 font-semibold text-chalk" onClick={() => void confirmDraw()} disabled={busy || matches.length !== 31}>Confirm draw</button></>}{state !== 'registration' && <span className="rounded-lg bg-felt px-4 py-2 font-semibold text-chalk">Locked</span>}</div></div>{message && <p className="mb-5 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-800">{message}</p>}{matches.length ? <div className="overflow-x-auto"><Bracket matches={matches} players={players} /></div> : <div className="rounded-2xl border border-dashed border-ink/20 p-16 text-center"><h3 className="font-display text-3xl">Ready for the draw</h3><p className="mt-2 text-ink/60">Register 32 players, then generate a preview.</p></div>}</section>
  </main>
}
