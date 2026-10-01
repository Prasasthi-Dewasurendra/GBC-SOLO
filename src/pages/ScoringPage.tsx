import { useEffect, useState } from 'react'
import { Bracket } from '../components/Bracket'
import { ConnectionBanner } from '../components/ConnectionBanner'
import { useConnectionStatus } from '../hooks/useConnectionStatus'
import { downloadCsv } from '../lib/csv'
import { raceTarget, type BracketMatch, type BracketPlayer } from '../lib/tournament'
import { supabase } from '../lib/supabase'

type MatchRow = BracketMatch & {
  id: string
  p1_racks: number
  p2_racks: number
}

type PlayerRow = BracketPlayer & { created_at: string; seed: number | null }

export function ScoringPage() {
  const [players, setPlayers] = useState<PlayerRow[]>([])
  const [matches, setMatches] = useState<MatchRow[]>([])
  const [liveMatchId, setLiveMatchId] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const online = useConnectionStatus()
  const selected = matches.find((match) => match.id === selectedId) ?? null
  const playerById = new Map(players.map((player) => [player.id, player]))

  async function load() {
    const [{ data: playerData, error: playerError }, { data: matchData, error: matchError }, { data: tournamentData, error: tournamentError }] = await Promise.all([
      supabase.from('players').select('*').order('created_at'),
      supabase.from('matches').select('*').order('round').order('slot'),
      supabase.from('tournament').select('live_match_id').eq('id', 1).single(),
    ])
    if (playerError || matchError || tournamentError) {
      setMessage(playerError?.message ?? matchError?.message ?? tournamentError?.message ?? 'Could not load scoring data.')
      return
    }
    const nextMatches = (matchData ?? []) as MatchRow[]
    setPlayers((playerData ?? []) as PlayerRow[])
    setMatches(nextMatches)
    setLiveMatchId(tournamentData.live_match_id)
    if (!selectedId && tournamentData.live_match_id) setSelectedId(tournamentData.live_match_id)
  }

  useEffect(() => {
    void load()
    const channel = supabase.channel('scoring-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, () => { void load() })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tournament' }, () => { void load() })
      .subscribe()
    return () => { void supabase.removeChannel(channel) }
  }, [])

  async function startMatch(match: MatchRow) {
    if (!match.player1_id || !match.player2_id) {
      setMessage('This match is waiting for both players to advance.')
      return
    }
    if (liveMatchId && liveMatchId !== match.id) {
      setMessage('Finish the current live match before starting another one.')
      return
    }
    setBusy(true)
    setMessage(null)
    const { error: matchError } = await supabase.from('matches').update({ status: 'live' }).eq('id', match.id).eq('status', 'pending')
    if (matchError) setMessage(matchError.message)
    else {
      const { error: tournamentError } = await supabase.from('tournament').update({ state: 'live', live_match_id: match.id }).eq('id', 1)
      if (tournamentError) setMessage(tournamentError.message)
      else setSelectedId(match.id)
    }
    setBusy(false)
    await load()
  }

  async function score(playerNumber: 1 | 2, delta: 1 | -1) {
    if (!selected) return
    if (delta === 1) {
      const nextP1 = selected.p1_racks + (playerNumber === 1 ? 1 : 0)
      const nextP2 = selected.p2_racks + (playerNumber === 2 ? 1 : 0)
      const target = raceTarget(selected.best_of)
      if ((nextP1 >= target && nextP1 > nextP2) || (nextP2 >= target && nextP2 > nextP1)) {
        const winner = playerById.get(playerNumber === 1 ? selected.player1_id ?? '' : selected.player2_id ?? '')?.name ?? 'Player'
        if (!window.confirm(`${winner} has reached the race target. Complete this match?`)) return
      }
    }
    setBusy(true)
    setMessage(null)
    const { error } = await supabase.rpc('score_match', { p_match_id: selected.id, p_player_number: playerNumber, p_delta: delta })
    if (error) setMessage(error.message)
    await load()
    setBusy(false)
  }

  async function reopen(match: MatchRow) {
    if (match.status !== 'done') return
    if (!window.confirm('Reopen this match and undo its advancement?')) return
    setBusy(true)
    setMessage(null)
    if (match.round < 5) {
      const next = matches.find((candidate) => candidate.round === match.round + 1 && candidate.slot === Math.floor(match.slot / 2))
      if (!next || next.status !== 'pending') {
        setMessage('This match cannot be reopened because the next-round match has started.')
        setBusy(false)
        return
      }
      const clearColumn = match.slot % 2 === 0 ? { player1_id: null } : { player2_id: null }
      const { error } = await supabase.from('matches').update(clearColumn).eq('id', next.id)
      if (error) {
        setMessage(error.message)
        setBusy(false)
        return
      }
    }
    const { error: reopenError } = await supabase.from('matches').update({ status: 'live', winner_id: null }).eq('id', match.id)
    if (reopenError) setMessage(reopenError.message)
    else {
      await supabase.from('tournament').update({ state: 'live', live_match_id: match.id }).eq('id', 1)
      setSelectedId(match.id)
    }
    await load()
    setBusy(false)
  }

  function nameFor(id: string | null) {
    return id ? playerById.get(id)?.name ?? 'Unknown player' : 'Waiting'
  }

  function exportResults() {
    downloadCsv('gbc-solo-results.csv', ['Round', 'Match', 'Player 1', 'Player 2', 'Player 1 Racks', 'Player 2 Racks', 'Status', 'Winner'], matches.map((match) => [match.round, match.slot + 1, nameFor(match.player1_id), nameFor(match.player2_id), match.p1_racks, match.p2_racks, match.status, nameFor(match.winner_id)]))
  }

  return <main className="min-h-screen bg-chalk text-ink"><ConnectionBanner online={online} />
    <header className="flex items-center justify-between border-b border-ink/10 px-6 py-5 md:px-10"><div><p className="text-xs uppercase tracking-[0.28em] text-felt">GBC Solo</p><h1 className="font-display text-3xl">Live scoring</h1></div><div className="flex gap-2"><button className="rounded-lg border border-ink/20 px-4 py-2 text-sm font-semibold" onClick={exportResults}>Export results</button><a className="rounded-lg border border-ink/20 px-4 py-2 text-sm font-semibold" href="/admin/draw">View draw</a></div></header>
    <section className="mx-auto max-w-7xl px-6 py-10 md:px-10"><div className="mb-8"><p className="text-sm uppercase tracking-[0.24em] text-felt">Operator desk</p><h2 className="font-display text-5xl">Run the matches</h2><p className="mt-2 text-ink/60">Select a match below, then start it when the players are at the table.</p></div>{message && <p className="mb-5 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-800">{message}</p>}<div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]"><div className="overflow-x-auto rounded-2xl bg-white/50 p-4"><Bracket matches={matches} players={players} onMatchClick={(match) => setSelectedId(matches.find((candidate) => candidate.round === match.round && candidate.slot === match.slot)?.id ?? null)} /></div><aside className="h-fit rounded-2xl bg-felt p-6 text-chalk"><p className="text-xs uppercase tracking-[0.24em] text-copper">Selected match</p>{selected ? <><h3 className="mt-3 font-display text-3xl">{nameFor(selected.player1_id)} <span className="text-copper">vs</span> {nameFor(selected.player2_id)}</h3><p className="mt-2 text-sm text-white/60">{selected.round === 5 ? 'Final · Best of 5' : `Round ${selected.round} · Best of 3`} · Race to {raceTarget(selected.best_of)}</p><div className="my-6 grid grid-cols-2 gap-3 text-center"><div className="rounded-lg bg-black/20 p-4"><p className="truncate text-sm text-white/60">{nameFor(selected.player1_id)}</p><strong className="text-6xl">{selected.p1_racks}</strong></div><div className="rounded-lg bg-black/20 p-4"><p className="truncate text-sm text-white/60">{nameFor(selected.player2_id)}</p><strong className="text-6xl">{selected.p2_racks}</strong></div></div>{selected.status === 'pending' && <button className="w-full rounded-lg bg-copper px-4 py-3 font-bold text-ink disabled:opacity-50" disabled={busy || !selected.player1_id || !selected.player2_id} onClick={() => void startMatch(selected)}>Start match</button>}{selected.status === 'live' && <div className="space-y-3"><p className="text-center text-sm font-semibold text-copper">LIVE · Race to {raceTarget(selected.best_of)}</p><div className="grid grid-cols-2 gap-2"><button className="rounded-lg bg-copper px-3 py-4 text-lg font-bold text-ink disabled:opacity-50" disabled={busy} onClick={() => void score(1, 1)}>+1 Rack<br /><span className="text-xs">{nameFor(selected.player1_id)}</span></button><button className="rounded-lg bg-copper px-3 py-4 text-lg font-bold text-ink disabled:opacity-50" onClick={() => void score(2, 1)}>+1 Rack<br /><span className="text-xs">{nameFor(selected.player2_id)}</span></button></div><div className="grid grid-cols-2 gap-2"><button className="rounded-lg border border-white/20 px-3 py-2 text-sm disabled:opacity-50" disabled={busy || selected.p1_racks === 0} onClick={() => void score(1, -1)}>Undo P1</button><button className="rounded-lg border border-white/20 px-3 py-2 text-sm disabled:opacity-50" disabled={busy || selected.p2_racks === 0} onClick={() => void score(2, -1)}>Undo P2</button></div></div>}{selected.status === 'done' && <div><p className="rounded-lg bg-white/10 p-3 text-center font-semibold">Winner: {nameFor(selected.winner_id)}</p><button className="mt-3 w-full rounded-lg border border-white/20 px-4 py-2 text-sm disabled:opacity-50" disabled={busy} onClick={() => void reopen(selected)}>Reopen match</button></div>}</> : <p className="mt-4 text-sm text-white/60">Click a match in the bracket to inspect it.</p>}</aside></div></section>
  </main>
}
