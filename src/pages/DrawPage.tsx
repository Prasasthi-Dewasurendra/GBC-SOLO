import { useEffect, useState } from 'react'
import { Bracket } from '../components/Bracket'
import { AdminSidebar } from '../components/AdminSidebar'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { buildBracket, getMatchNumber, type BracketMatch, type BracketPlayer } from '../lib/tournament'
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
        const { data: matchData, error: matchError } = await supabase
          .from('matches')
          .select('id, round, slot, match_number, player1_id, player2_id, best_of, status, winner_id, table_number')
          .order('round')
          .order('slot')
        if (matchError) {
          toast.error(matchError.message)
        } else {
          const raw = (matchData ?? []) as BracketMatch[]
          setMatches(raw.map((m) => ({ ...m, match_number: m.match_number ?? getMatchNumber(m.round, m.slot) })))
        }
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
    if (players.length !== 32 || matches.length !== 32) {
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
    else {
      setState('drawn')
      toast.success('Tournament draw confirmed and locked.')
    }
    setBusy(false)
  }

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-[#F5F5F5]">
      <div className="flex min-h-screen">
        <AdminSidebar current="draw" />

        <div className="min-w-0 flex-1 flex flex-col">
          <header className="flex items-center justify-between border-b border-white/10 bg-[#0A0A0A] px-6 py-5 md:px-10">
            <div>
              <p className="text-xs uppercase tracking-widest text-[#A3A3A3]">Operator desk</p>
              <h1 className="text-2xl font-bold text-[#F5F5F5]">Tournament Draw</h1>
            </div>
            <div className="flex items-center gap-3">
              {state === 'registration' ? (
                <>
                  <Button variant="secondary" onClick={redraw} disabled={busy || players.length !== 32}>
                    Generate Preview
                  </Button>
                  <Button onClick={() => void confirmDraw()} disabled={busy || matches.length !== 32}>
                    Confirm Draw
                  </Button>
                </>
              ) : (
                <Badge tone="done">Draw locked</Badge>
              )}
            </div>
          </header>

          <section className="mx-auto max-w-[1600px] w-full px-6 py-8 md:px-10 flex-1 space-y-6">
            <div className="flex flex-wrap items-end justify-between gap-5">
              <div>
                <div className="flex items-center gap-3">
                  <span className="text-xs uppercase tracking-wider text-[#A3A3A3]">Bracket Status</span>
                  <Badge tone={state === 'registration' ? 'pending' : 'done'}>
                    {state === 'registration' ? 'Preview' : 'Confirmed'}
                  </Badge>
                </div>
                <h2 className="mt-2 text-3xl font-bold text-[#F5F5F5]">32-Player Single Elimination</h2>
                <p className="mt-1 text-sm text-[#A3A3A3]">
                  {players.length} of 32 players registered. Best of 3 frames, Final is Best of 5.
                </p>
              </div>
            </div>

            {matches.length ? (
              <Card className="overflow-hidden border-white/10 bg-[#121212] p-5">
                <div className="overflow-x-auto">
                  <Bracket matches={matches} players={players} />
                </div>
              </Card>
            ) : (
              <Card className="grid min-h-72 place-items-center border-dashed border-white/10 bg-[#121212] p-16 text-center">
                <div>
                  <h3 className="text-2xl font-bold text-[#F5F5F5]">Ready for the draw</h3>
                  <p className="mt-2 text-sm text-[#A3A3A3]">
                    {players.length < 32
                      ? `Register ${32 - players.length} more players to generate the 32-player bracket.`
                      : 'Click "Generate Preview" above to shuffle and draw the bracket.'}
                  </p>
                </div>
              </Card>
            )}
          </section>
        </div>
      </div>
    </main>
  )
}
