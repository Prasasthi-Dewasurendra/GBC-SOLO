import { useEffect, useState } from 'react'
import { Bracket } from '../components/Bracket'
import { LogoTitle } from '../components/brand/LogoTitle'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { buildBracket, type BracketMatch, type BracketPlayer } from '../lib/tournament'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'

type PlayerRow = BracketPlayer & { seed: number | null; created_at: string }

export function DrawPage() {
  const [players, setPlayers] = useState<PlayerRow[]>([])
  const [matches, setMatches] = useState<BracketMatch[]>([])
  const [state, setState] = useState('registration')
  const [busy, setBusy] = useState(true)

  useEffect(() => {
    async function load() {
      setBusy(true)
      const [{ data: playerData, error: playerError }, { data: tournamentData, error: tournamentError }] = await Promise.all([
        supabase.from('players').select('*').order('created_at'),
        supabase.from('tournament').select('state').eq('id', 1).single(),
      ])
      if (playerError || tournamentError) {
        toast.error(playerError?.message ?? tournamentError?.message ?? 'Could not load tournament data.')
        setBusy(false)
        return
      }
      setPlayers((playerData ?? []) as PlayerRow[])
      setState(tournamentData.state)
      if (tournamentData.state !== 'registration') {
        const { data: matchData, error: matchError } = await supabase.from('matches').select('round, slot, player1_id, player2_id, best_of, status, winner_id').order('round').order('slot')
        if (matchError) toast.error(matchError.message)
        else setMatches((matchData ?? []) as BracketMatch[])
      }
      setBusy(false)
    }
    void load()
  }, [])

  function redraw() {
    if (players.length !== 32) {
      toast.error('Register exactly 32 players before drawing the bracket.')
      return
    }
    setMatches(buildBracket(players))
  }

  async function confirmDraw() {
    if (players.length !== 32 || matches.length !== 31) {
      toast.error('Create a complete 32-player preview before confirming.')
      return
    }
    if (!window.confirm('Confirm this draw? The bracket will be locked for scoring.')) return
    setBusy(true)
    const { error: deleteError } = await supabase.from('matches').delete().gte('round', 1)
    if (deleteError) {
      toast.error(deleteError.message)
      setBusy(false)
      return
    }
    const { error: insertError } = await supabase.from('matches').insert(matches)
    if (insertError) {
      toast.error(insertError.message)
      setBusy(false)
      return
    }
    const { error: stateError } = await supabase.from('tournament').update({ state: 'drawn' }).eq('id', 1)
    if (stateError) toast.error(stateError.message)
    else setState('drawn')
    setBusy(false)
  }

  return <main className="min-h-screen bg-felt-gradient text-warm"><header className="flex items-center justify-between border-b border-gold/20 bg-surface/70 px-6 py-5 backdrop-blur-xl md:px-10"><LogoTitle /><a className="rounded-xl border border-gold/25 px-4 py-2 text-sm font-semibold text-goldLight transition hover:bg-gold/10" href="/admin">Back to registration</a></header><section className="mx-auto max-w-[1500px] px-6 py-10 md:px-10"><div className="mb-8 flex flex-wrap items-end justify-between gap-5"><div><div className="flex items-center gap-3"><p className="text-xs uppercase tracking-[0.28em] text-gold">Tournament draw</p><Badge tone={state === 'registration' ? 'pending' : 'done'}>{state === 'registration' ? 'Preview' : 'Locked'}</Badge></div><h1 className="mt-3 font-display text-5xl md:text-6xl">The bracket</h1><p className="mt-3 text-muted">{players.length} of 32 players registered. Every match is best of 3 except the Final.</p></div><div className="flex gap-2">{state === 'registration' && <><Button variant="outline" onClick={redraw} disabled={busy}>Redraw</Button><Button onClick={() => void confirmDraw()} disabled={busy || matches.length !== 31}>Confirm draw</Button></>}{state !== 'registration' && <Badge tone="done">Draw confirmed</Badge>}</div></div>{matches.length ? <Card className="overflow-hidden p-5"><div className="overflow-x-auto"><Bracket matches={matches} players={players} /></div></Card> : <Card className="grid min-h-72 place-items-center border-dashed p-16 text-center"><div><h2 className="font-display text-3xl">Ready for the draw</h2><p className="mt-2 text-muted">Register exactly 32 players, then generate a preview.</p></div></Card>}</section>
  </main>
}
