import { useEffect, useState } from 'react'
import { Minus, Plus, Radio, Trophy } from 'lucide-react'
import { Bracket } from '../components/Bracket'
import { ConnectionBanner } from '../components/ConnectionBanner'
import { LogoTitle } from '../components/brand/LogoTitle'
import { LiveBadge } from '../components/brand/LiveBadge'
import { PlayerAvatar } from '../components/brand/PlayerAvatar'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { useConnectionStatus } from '../hooks/useConnectionStatus'
import { downloadCsv } from '../lib/csv'
import { raceTarget, type BracketMatch, type BracketPlayer } from '../lib/tournament'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'

type MatchRow = BracketMatch & { id: string; p1_racks: number; p2_racks: number; table_number: number | null }
type PlayerRow = BracketPlayer & { created_at: string; seed: number | null }

export function ScoringPage() {
  const [players, setPlayers] = useState<PlayerRow[]>([])
  const [matches, setMatches] = useState<MatchRow[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selectedTable, setSelectedTable] = useState(1)
  const [busy, setBusy] = useState(false)
  const online = useConnectionStatus()
  const selected = matches.find((match) => match.id === selectedId) ?? null
  const playerById = new Map(players.map((player) => [player.id, player]))

  async function load() {
    const [{ data: playerData, error: playerError }, { data: matchData, error: matchError }] = await Promise.all([
      supabase.from('players').select('*').order('created_at'),
      supabase.from('matches').select('*').order('round').order('slot'),
    ])
    if (playerError || matchError) { toast.error(playerError?.message ?? matchError?.message ?? 'Could not load scoring data.'); return }
    const nextMatches = (matchData ?? []) as MatchRow[]
    setPlayers((playerData ?? []) as PlayerRow[])
    setMatches(nextMatches)
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
    if (!match.player1_id || !match.player2_id) { toast.error('This match is waiting for both players to advance.'); return }
    if (matches.some((candidate) => candidate.status === 'live' && candidate.table_number === selectedTable)) { toast.error(`Table ${selectedTable} already has a live match.`); return }
    setBusy(true)
    const { error: matchError } = await supabase.from('matches').update({ status: 'live', table_number: selectedTable }).eq('id', match.id).eq('status', 'pending')
    if (matchError) toast.error(matchError.message)
    else {
      const { error } = await supabase.from('tournament').update({ state: 'live', live_match_id: match.id }).eq('id', 1)
      if (error) toast.error(error.message)
      else { setSelectedId(match.id); toast.success(`Match is live on Table ${selectedTable}.`) }
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
        const winnerId = playerNumber === 1 ? selected.player1_id : selected.player2_id
        const winner = playerById.get(winnerId ?? '')?.name ?? 'Player'
        if (!window.confirm(`${winner} has reached the race target. Complete this match?`)) return
      }
    }
    setBusy(true)
    const { error } = await supabase.rpc('score_match', { p_match_id: selected.id, p_player_number: playerNumber, p_delta: delta })
    if (error) toast.error(error.message)
    else if (delta === 1) toast.success('Rack recorded.')
    await load()
    setBusy(false)
  }

  async function reopen(match: MatchRow) {
    if (match.status !== 'done' || !window.confirm('Reopen this match and undo its advancement?')) return
    setBusy(true)
    if (match.round < 5) {
      const next = matches.find((candidate) => candidate.round === match.round + 1 && candidate.slot === Math.floor(match.slot / 2))
      if (!next || next.status !== 'pending') { toast.error('This match cannot be reopened because the next-round match has started.'); setBusy(false); return }
      const clearColumn = match.slot % 2 === 0 ? { player1_id: null } : { player2_id: null }
      const { error } = await supabase.from('matches').update(clearColumn).eq('id', next.id)
      if (error) { toast.error(error.message); setBusy(false); return }
    }
    const { error } = await supabase.from('matches').update({ status: 'live', winner_id: null }).eq('id', match.id)
    if (error) toast.error(error.message)
    else { await supabase.from('tournament').update({ state: 'live', live_match_id: match.id }).eq('id', 1); setSelectedId(match.id); toast.success('Match reopened.') }
    await load()
    setBusy(false)
  }

  function nameFor(id: string | null) { return id ? playerById.get(id)?.name ?? 'Unknown player' : 'Waiting' }
  function exportResults() { downloadCsv('gbc-solo-results.csv', ['Round', 'Match', 'Player 1', 'Player 2', 'Player 1 Racks', 'Player 2 Racks', 'Status', 'Winner'], matches.map((match) => [match.round, match.slot + 1, nameFor(match.player1_id), nameFor(match.player2_id), match.p1_racks, match.p2_racks, match.status, nameFor(match.winner_id)])) }

  return <main className="min-h-screen bg-felt-gradient text-warm"><ConnectionBanner online={online} /><header className="flex flex-wrap items-center justify-between gap-4 border-b border-gold/20 bg-surface/70 px-6 py-5 backdrop-blur-xl md:px-10"><LogoTitle /><div className="flex gap-2"><Button variant="outline" onClick={exportResults}>Export results</Button><a className="rounded-xl border border-gold/25 px-4 py-2 text-sm font-semibold text-goldLight" href="/admin/draw">View draw</a></div></header><section className="mx-auto max-w-[1500px] space-y-8 px-6 py-8 md:px-10"><div><p className="text-xs uppercase tracking-[0.3em] text-gold">Operator desk · Four tables</p><h1 className="mt-2 font-display text-5xl">Run the matches</h1><p className="mt-3 text-muted">Select a match, assign a table, and score all four tables at the same time.</p></div><div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_30rem]"><Card className="overflow-hidden p-4"><div className="overflow-x-auto"><Bracket matches={matches} players={players} onMatchClick={(match) => { const found = matches.find((candidate) => candidate.round === match.round && candidate.slot === match.slot); setSelectedId(found?.id ?? null); if (found?.table_number) setSelectedTable(found.table_number) }} /></div></Card><Card className={selected?.status === 'live' ? 'border-live/50 shadow-live' : 'p-6'} tone={selected?.status === 'live' ? 'live' : 'default'}><div className="p-2"><div className="flex items-center justify-between"><p className="text-xs uppercase tracking-[0.28em] text-gold">Selected match</p>{selected?.status === 'live' && <LiveBadge />}{selected?.status === 'done' && <Badge tone="done">Done</Badge>}</div>{selected ? <><div className="mt-5 flex items-center justify-center gap-3 text-center"><div className="min-w-0 flex-1"><PlayerAvatar photoUrl={playerById.get(selected.player1_id ?? '')?.photo_url} name={nameFor(selected.player1_id)} size="lg" ring={selected.status === 'live' ? 'green' : 'gold'} /><h2 className="mt-3 truncate font-display text-xl text-warm" title={nameFor(selected.player1_id)}>{nameFor(selected.player1_id)}</h2></div><span className="font-display text-xl text-muted">vs</span><div className="min-w-0 flex-1"><PlayerAvatar photoUrl={playerById.get(selected.player2_id ?? '')?.photo_url} name={nameFor(selected.player2_id)} size="lg" ring={selected.status === 'live' ? 'green' : 'gold'} /><h2 className="mt-3 truncate font-display text-xl text-warm" title={nameFor(selected.player2_id)}>{nameFor(selected.player2_id)}</h2></div></div><div className="my-6 grid grid-cols-2 gap-3 text-center"><div className="rounded-2xl border border-gold/20 bg-ink/60 p-4"><p className="text-xs uppercase tracking-[0.16em] text-muted">{nameFor(selected.player1_id)}</p><strong className="font-display text-7xl tabular-nums text-goldLight">{selected.p1_racks}</strong></div><div className="rounded-2xl border border-gold/20 bg-ink/60 p-4"><p className="text-xs uppercase tracking-[0.16em] text-muted">{nameFor(selected.player2_id)}</p><strong className="font-display text-7xl tabular-nums text-goldLight">{selected.p2_racks}</strong></div></div><p className="text-center text-xs uppercase tracking-[0.2em] text-muted">{selected.round === 5 ? 'FINAL · Best of 5 · Race to 3' : `Round ${selected.round} · Best of 3 · Race to 2`}</p>{selected.status === 'pending' && <div className="mt-5 space-y-3"><label className="block text-xs uppercase tracking-[0.18em] text-muted">Assign table<select className="mt-2 min-h-11 w-full rounded-xl border border-gold/20 bg-ink px-3 text-warm focus:border-gold focus:outline-none" value={selectedTable} onChange={(event) => setSelectedTable(Number(event.target.value))}>{[1, 2, 3, 4].map((table) => <option key={table} value={table}>Table {table}{matches.some((candidate) => candidate.status === 'live' && candidate.table_number === table) ? ' · Live' : ''}</option>)}</select></label><Button className="w-full" disabled={busy || !selected.player1_id || !selected.player2_id} onClick={() => void startMatch(selected)}>Start on Table {selectedTable}</Button></div>}{selected.status === 'live' && <div className="mt-5 space-y-3"><p className="text-center text-xs uppercase tracking-[0.2em] text-glow">Table {selected.table_number} · Live scoring</p><div className="grid grid-cols-2 gap-3"><Button className="min-h-24 flex-col text-lg" disabled={busy} onClick={() => void score(1, 1)}><Plus size={25} /> +1 RACK</Button><Button className="min-h-24 flex-col text-lg" disabled={busy} onClick={() => void score(2, 1)}><Plus size={25} /> +1 RACK</Button></div><div className="grid grid-cols-2 gap-3"><Button variant="ghost" disabled={busy || selected.p1_racks === 0} onClick={() => void score(1, -1)}><Minus size={15} /> Undo P1</Button><Button variant="ghost" disabled={busy || selected.p2_racks === 0} onClick={() => void score(2, -1)}><Minus size={15} /> Undo P2</Button></div></div>}{selected.status === 'done' && <div className="mt-5 space-y-3"><div className="flex items-center justify-center gap-2 rounded-xl border border-gold/40 bg-gold/10 p-3 text-goldLight"><Trophy size={17} /> Winner: {nameFor(selected.winner_id)}</div><Button variant="outline" className="w-full" disabled={busy} onClick={() => void reopen(selected)}>Reopen match</Button></div>}</> : <div className="grid min-h-96 place-items-center text-center"><Radio className="mx-auto text-gold" size={32} /><p className="mt-3 text-muted">Click a match card to inspect it.</p></div>}</div></Card></div></section></main>
}
