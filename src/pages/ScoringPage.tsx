import { useEffect, useState, useMemo } from 'react'
import { Plus, Minus, RotateCcw, Trophy, Check, Table as TableIcon } from 'lucide-react'
import { ConnectionBanner } from '../components/ConnectionBanner'
import { AdminSidebar } from '../components/AdminSidebar'
import { PlayerAvatar } from '../components/brand/PlayerAvatar'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { RackControl } from '../components/RackControl'
import { useConnectionStatus } from '../hooks/useConnectionStatus'
import { raceTarget, getMatchNumber, type BracketMatch, type BracketPlayer } from '../lib/tournament'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'

type MatchRow = BracketMatch & {
  id: string
  p1_racks: number
  p2_racks: number
}
type PlayerRow = BracketPlayer & { created_at: string; seed: number | null }

const roundLabels = ['', 'Round 1 (R32)', 'Round of 16', 'Quarter Finals', 'Semi Finals', 'Championship Final']

export function ScoringPage() {
  const [players, setPlayers] = useState<PlayerRow[]>([])
  const [matches, setMatches] = useState<MatchRow[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [activeRoundFilter, setActiveRoundFilter] = useState<number | 'all'>('all')
  const [busy, setBusy] = useState(false)
  const online = useConnectionStatus()

  const playerById = useMemo(() => new Map(players.map((p) => [p.id, p])), [players])

  const selected = useMemo(
    () => matches.find((m) => m.id === selectedId) ?? null,
    [matches, selectedId]
  )

  async function load() {
    const [{ data: playerData, error: playerError }, { data: matchData, error: matchError }] =
      await Promise.all([
        supabase.from('players').select('*').order('created_at'),
        supabase.from('matches').select('*').order('round').order('slot'),
      ])
    if (playerError || matchError) {
      toast.error(playerError?.message ?? matchError?.message ?? 'Could not load scoring data.')
      return
    }
    const rawMatches = (matchData ?? []) as MatchRow[]
    // Ensure match_number is populated
    const enrichedMatches = rawMatches.map((m) => ({
      ...m,
      match_number: m.match_number ?? getMatchNumber(m.round, m.slot),
    }))
    setPlayers((playerData ?? []) as PlayerRow[])
    setMatches(enrichedMatches)

    // Select the first live match if none selected
    if (!selectedId && enrichedMatches.length > 0) {
      const firstLive = enrichedMatches.find((m) => m.status === 'live')
      if (firstLive) setSelectedId(firstLive.id)
    }
  }

  useEffect(() => {
    void load()
    const channel = supabase
      .channel('scoring-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, () => {
        void load()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tournament' }, () => {
        void load()
      })
      .subscribe()
    return () => {
      void supabase.removeChannel(channel)
    }
  }, [])

  function nameFor(id: string | null) {
    return id ? playerById.get(id)?.name ?? 'Unknown player' : 'TBD'
  }

  function photoFor(id: string | null) {
    return id ? playerById.get(id)?.photo_url : null
  }

  async function updateTableNumber(matchId: string, newTable: number | null) {
    const match = matches.find((m) => m.id === matchId)
    if (!match) return

    // If changing a live match's table, check if occupied
    if (match.status === 'live' && newTable !== null) {
      const liveOccupant = matches.find(
        (m) => m.status === 'live' && m.table_number === newTable && m.id !== matchId
      )
      if (liveOccupant) {
        toast.error(
          `Table ${newTable} is in use by M${liveOccupant.match_number} (${nameFor(
            liveOccupant.player1_id
          )} vs ${nameFor(liveOccupant.player2_id)})`
        )
        return
      }
    }

    setBusy(true)
    const { error } = await supabase
      .from('matches')
      .update({ table_number: newTable })
      .eq('id', matchId)

    if (error) {
      toast.error(error.message)
    } else {
      toast.success(newTable ? `Match M${match.match_number} assigned to Table ${newTable}` : `Table unassigned`)
      await load()
    }
    setBusy(false)
  }

  async function startMatch(match: MatchRow) {
    if (!match.player1_id || !match.player2_id) {
      toast.error('Both player slots must be filled before starting this match.')
      return
    }

    if (!match.table_number) {
      toast.error('Please assign a table (Table 1–4) before starting the match.')
      return
    }

    // Check if table already has a live match
    const liveOccupant = matches.find(
      (m) => m.status === 'live' && m.table_number === match.table_number && m.id !== match.id
    )
    if (liveOccupant) {
      toast.error(
        `Table ${match.table_number} is already in use by M${liveOccupant.match_number} (${nameFor(
          liveOccupant.player1_id
        )} vs ${nameFor(liveOccupant.player2_id)})`
      )
      return
    }

    setBusy(true)
    const { error: matchError } = await supabase
      .from('matches')
      .update({ status: 'live' })
      .eq('id', match.id)
      .eq('status', 'pending')

    if (matchError) {
      toast.error(matchError.message)
    } else {
      await supabase
        .from('tournament')
        .update({ state: 'live', live_match_id: match.id })
        .eq('id', 1)

      setSelectedId(match.id)
      toast.success(`M${match.match_number} is now LIVE on Table ${match.table_number}`)
      await load()
    }
    setBusy(false)
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
        if (!window.confirm(`${winner} has reached the race target (${target} racks). Complete this match?`)) {
          return
        }
      }
    }
    setBusy(true)
    const { error } = await supabase.rpc('score_match', {
      p_match_id: selected.id,
      p_player_number: playerNumber,
      p_delta: delta,
    })
    if (error) {
      toast.error(error.message)
    } else if (delta === 1) {
      toast.success('Rack recorded.')
    }
    await load()
    setBusy(false)
  }

  async function reopen(match: MatchRow) {
    if (match.status !== 'done' || !window.confirm('Reopen this match and undo its advancement?')) return
    setBusy(true)
    if (match.round < 5) {
      const next = matches.find(
        (candidate) => candidate.round === match.round + 1 && candidate.slot === Math.floor(match.slot / 2)
      )
      if (!next || next.status !== 'pending') {
        toast.error('Cannot reopen because the next-round match has already started.')
        setBusy(false)
        return
      }
      const clearColumn = match.slot % 2 === 0 ? { player1_id: null } : { player2_id: null }
      const { error } = await supabase.from('matches').update(clearColumn).eq('id', next.id)
      if (error) {
        toast.error(error.message)
        setBusy(false)
        return
      }
    }
    const { error } = await supabase
      .from('matches')
      .update({ status: 'live', winner_id: null })
      .eq('id', match.id)
    if (error) {
      toast.error(error.message)
    } else {
      await supabase
        .from('tournament')
        .update({ state: 'live', live_match_id: match.id })
        .eq('id', 1)
      setSelectedId(match.id)
      toast.success('Match reopened.')
    }
    await load()
    setBusy(false)
  }

  async function autoAssignTables() {
    setBusy(true)
    const r1Pending = matches.filter((m) => m.round === 1 && m.status === 'pending')
    if (r1Pending.length === 0) {
      toast.error('No pending Round 1 matches to assign.')
      setBusy(false)
      return
    }

    // Auto-assign: M1->T1, M2->T2, M3->T3, M4->T4, M5->T1 ... (slot % 4) + 1
    const updates = r1Pending.map((m) => {
      const table = (m.slot % 4) + 1
      return supabase.from('matches').update({ table_number: table }).eq('id', m.id)
    })

    await Promise.all(updates)
    toast.success('Assigned Round 1 matches to Tables 1–4 in rotation.')
    await load()
    setBusy(false)
  }

  // Filtered matches for display
  const displayedMatches = useMemo(() => {
    if (activeRoundFilter === 'all') return matches
    return matches.filter((m) => m.round === activeRoundFilter)
  }, [matches, activeRoundFilter])

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-[#F5F5F5]">
      <ConnectionBanner online={online} />
      <div className="flex min-h-screen">
        <AdminSidebar current="scoring" />

        <div className="min-w-0 flex-1 flex flex-col">
          {/* Top Bar */}
          <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 bg-[#0A0A0A] px-6 py-4">
            <div>
              <p className="text-xs uppercase tracking-widest text-[#A3A3A3]">Tournament Operator</p>
              <h1 className="text-2xl font-bold text-[#F5F5F5]">Match Scoring & Control</h1>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="secondary"
                onClick={() => void autoAssignTables()}
                disabled={busy}
                className="text-xs"
              >
                <TableIcon size={14} /> Assign tables (R1 rotation)
              </Button>
            </div>
          </header>

          <div className="p-6 space-y-6 flex-1 max-w-[1600px] w-full mx-auto">
            {/* Tables Strip (Table 1 to 4) */}
            <section>
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-xs uppercase tracking-widest text-[#A3A3A3]">Club Tables Live Status</h2>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {[1, 2, 3, 4].map((tableNum) => {
                  const liveMatch = matches.find(
                    (m) => m.status === 'live' && m.table_number === tableNum
                  )
                  const isCurrentSelected = selected && selected.id === liveMatch?.id

                  return (
                    <div
                      key={tableNum}
                      onClick={() => {
                        if (liveMatch) setSelectedId(liveMatch.id)
                      }}
                      className={`rounded-lg border p-3.5 transition ${
                        liveMatch
                          ? `border-[#1E8F63] bg-[#121212] cursor-pointer ${
                              isCurrentSelected ? 'ring-1 ring-[#1E8F63]' : ''
                            }`
                          : 'border-white/10 bg-[#121212]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#F5F5F5]">Table {tableNum}</span>
                        {liveMatch ? (
                          <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-[#1E8F63]">
                            <span className="live-dot h-1.5 w-1.5 rounded-full bg-[#1E8F63]" />
                            LIVE · M{liveMatch.match_number}
                          </span>
                        ) : (
                          <span className="text-[10px] uppercase tracking-wider text-[#A3A3A3]">Free</span>
                        )}
                      </div>

                      {liveMatch ? (
                        <div className="mt-2.5 flex items-center justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-semibold text-[#F5F5F5]">
                              {nameFor(liveMatch.player1_id)}
                            </p>
                            <p className="truncate text-xs font-semibold text-[#F5F5F5]">
                              {nameFor(liveMatch.player2_id)}
                            </p>
                          </div>
                          <div className="shrink-0 text-right">
                            <span className="font-serif text-lg font-bold text-[#F5F5F5]">
                              {liveMatch.p1_racks} - {liveMatch.p2_racks}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <p className="mt-2 text-xs text-[#A3A3A3]">No active match playing</p>
                      )}
                    </div>
                  )
                })}
              </div>
            </section>

            {/* Main Area: Match List on Left, Active Scoring Panel on Right */}
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
              {/* Left Column: Filter Tabs + Match Rows */}
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
                  <div className="flex flex-wrap gap-1">
                    {(
                      [
                        { id: 'all', label: 'All (31)' },
                        { id: 1, label: 'R32 (16)' },
                        { id: 2, label: 'R16 (8)' },
                        { id: 3, label: 'QF (4)' },
                        { id: 4, label: 'SF (2)' },
                        { id: 5, label: 'Final (1)' },
                      ] as const
                    ).map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveRoundFilter(tab.id)}
                        className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                          activeRoundFilter === tab.id
                            ? 'bg-white/15 text-[#F5F5F5]'
                            : 'text-[#A3A3A3] hover:bg-white/5 hover:text-[#F5F5F5]'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                  <span className="text-xs text-[#A3A3A3]">
                    Showing {displayedMatches.length} matches
                  </span>
                </div>

                <div className="space-y-2.5">
                  {displayedMatches.map((match) => {
                    const isSelected = selectedId === match.id
                    const isLive = match.status === 'live'
                    const isDone = match.status === 'done'
                    const isFinal = match.round === 5
                    const p1 = playerById.get(match.player1_id ?? '')
                    const p2 = playerById.get(match.player2_id ?? '')

                    const p1Winner = isDone && match.winner_id === match.player1_id
                    const p2Winner = isDone && match.winner_id === match.player2_id

                    const borderClass = isLive
                      ? 'border-[#1E8F63]'
                      : isFinal
                        ? 'border-[#C9A24B]'
                        : isSelected
                          ? 'border-white/40'
                          : 'border-white/10'

                    return (
                      <div
                        key={match.id}
                        className={`rounded-lg border bg-[#121212] p-3 transition ${borderClass} ${
                          isSelected ? 'bg-white/[0.03]' : ''
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          {/* Match Info & Selectable Row */}
                          <div
                            className="flex flex-1 min-w-0 items-center gap-3 cursor-pointer"
                            onClick={() => setSelectedId(match.id)}
                          >
                            <span className="rounded bg-white/10 px-2 py-0.5 text-xs font-bold text-[#F5F5F5]">
                              M{match.match_number}
                            </span>
                            <span className="text-xs text-[#A3A3A3] hidden sm:inline">
                              {roundLabels[match.round]}
                            </span>

                            {/* Players & Score */}
                            <div className="flex min-w-0 flex-1 items-center gap-4">
                              <div className="flex min-w-0 flex-1 items-center gap-2">
                                <PlayerAvatar
                                  name={nameFor(match.player1_id)}
                                  photoUrl={p1?.photo_url}
                                  size="sm"
                                  state={p1Winner ? 'winner' : isDone ? 'eliminated' : 'normal'}
                                />
                                <span
                                  className={`truncate text-xs ${
                                    p1Winner ? 'font-semibold text-[#F5F5F5]' : isDone ? 'text-[#A3A3A3]' : 'text-[#F5F5F5]'
                                  }`}
                                >
                                  {nameFor(match.player1_id)}
                                </span>
                              </div>

                              <span className="font-serif text-sm font-bold tabular-nums">
                                <span className={p1Winner ? 'text-[#C9A24B]' : 'text-[#F5F5F5]'}>
                                  {match.p1_racks}
                                </span>
                                <span className="text-[#A3A3A3] mx-1">-</span>
                                <span className={p2Winner ? 'text-[#C9A24B]' : 'text-[#F5F5F5]'}>
                                  {match.p2_racks}
                                </span>
                              </span>

                              <div className="flex min-w-0 flex-1 items-center justify-end gap-2 text-right">
                                <span
                                  className={`truncate text-xs ${
                                    p2Winner ? 'font-semibold text-[#F5F5F5]' : isDone ? 'text-[#A3A3A3]' : 'text-[#F5F5F5]'
                                  }`}
                                >
                                  {nameFor(match.player2_id)}
                                </span>
                                <PlayerAvatar
                                  name={nameFor(match.player2_id)}
                                  photoUrl={p2?.photo_url}
                                  size="sm"
                                  state={p2Winner ? 'winner' : isDone ? 'eliminated' : 'normal'}
                                />
                              </div>
                            </div>
                          </div>

                          {/* Controls: Table Selector & Status / Action */}
                          <div className="flex items-center gap-2 shrink-0">
                            {/* Table Selector */}
                            <select
                              disabled={busy || isDone}
                              value={match.table_number ?? ''}
                              onChange={(e) => {
                                const val = e.target.value ? Number(e.target.value) : null
                                void updateTableNumber(match.id, val)
                              }}
                              className="rounded border border-white/10 bg-[#0A0A0A] px-2 py-1 text-xs text-[#F5F5F5] focus:outline-none focus:ring-1 focus:ring-white/40 disabled:opacity-50"
                            >
                              <option value="">Unassigned</option>
                              <option value="1">Table 1</option>
                              <option value="2">Table 2</option>
                              <option value="3">Table 3</option>
                              <option value="4">Table 4</option>
                            </select>

                            {/* Status or Start Button */}
                            {isLive ? (
                              <span className="inline-flex items-center gap-1 rounded bg-[#1E8F63]/10 px-2.5 py-1 text-[11px] font-semibold text-[#1E8F63]">
                                <span className="live-dot h-1.5 w-1.5 rounded-full bg-[#1E8F63]" />
                                LIVE
                              </span>
                            ) : isDone ? (
                              <span className="rounded bg-white/5 px-2.5 py-1 text-[11px] font-medium text-[#A3A3A3]">
                                DONE
                              </span>
                            ) : (
                              <Button
                                variant="secondary"
                                className="h-7 px-2.5 text-xs"
                                disabled={busy || !match.player1_id || !match.player2_id}
                                onClick={() => void startMatch(match)}
                              >
                                Start
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Right Column: Scoring Panel */}
              <div className="space-y-4">
                <Card className="p-6 sticky top-6 border-white/10 bg-[#121212]">
                  {selected ? (
                    <div>
                      {/* Match Header */}
                      <div className="flex items-center justify-between border-b border-white/10 pb-3">
                        <div>
                          <span className="rounded bg-white/10 px-2 py-0.5 text-xs font-bold text-[#F5F5F5]">
                            M{selected.match_number}
                          </span>
                          <span className="ml-2 text-xs uppercase tracking-wider text-[#A3A3A3]">
                            {roundLabels[selected.round]}
                          </span>
                        </div>
                        <div>
                          {selected.status === 'live' ? (
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1E8F63]">
                              <span className="live-dot h-2 w-2 rounded-full bg-[#1E8F63]" />
                              Table {selected.table_number} · LIVE
                            </span>
                          ) : selected.status === 'done' ? (
                            <span className="text-xs text-[#A3A3A3]">FINISHED</span>
                          ) : (
                            <span className="text-xs text-[#A3A3A3]">
                              {selected.table_number ? `Assigned: Table ${selected.table_number}` : 'Unassigned'}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Players & Live Score Card */}
                      <div className="mt-6 grid grid-cols-2 gap-4">
                        {/* Player 1 Box */}
                        <div
                          className={`rounded-xl border p-4 text-center ${
                            selected.winner_id === selected.player1_id
                              ? 'border-white/20 bg-white/5'
                              : 'border-white/10 bg-[#0A0A0A]'
                          }`}
                        >
                          <div className="mx-auto w-fit">
                            <PlayerAvatar
                              name={nameFor(selected.player1_id)}
                              photoUrl={photoFor(selected.player1_id)}
                              size="lg"
                              state={
                                selected.winner_id === selected.player1_id
                                  ? 'winner'
                                  : selected.status === 'done'
                                    ? 'eliminated'
                                    : 'normal'
                              }
                            />
                          </div>
                          <h3
                            className="mt-3 truncate text-sm font-semibold text-[#F5F5F5]"
                            title={nameFor(selected.player1_id)}
                          >
                            {nameFor(selected.player1_id)}
                          </h3>
                          <div
                            className={`mt-3 font-serif text-6xl font-bold tabular-nums ${
                              selected.winner_id === selected.player1_id
                                ? 'text-[#C9A24B]'
                                : 'text-[#F5F5F5]'
                            }`}
                          >
                            {selected.p1_racks}
                          </div>
                        </div>

                        {/* Player 2 Box */}
                        <div
                          className={`rounded-xl border p-4 text-center ${
                            selected.winner_id === selected.player2_id
                              ? 'border-white/20 bg-white/5'
                              : 'border-white/10 bg-[#0A0A0A]'
                          }`}
                        >
                          <div className="mx-auto w-fit">
                            <PlayerAvatar
                              name={nameFor(selected.player2_id)}
                              photoUrl={photoFor(selected.player2_id)}
                              size="lg"
                              state={
                                selected.winner_id === selected.player2_id
                                  ? 'winner'
                                  : selected.status === 'done'
                                    ? 'eliminated'
                                    : 'normal'
                              }
                            />
                          </div>
                          <h3
                            className="mt-3 truncate text-sm font-semibold text-[#F5F5F5]"
                            title={nameFor(selected.player2_id)}
                          >
                            {nameFor(selected.player2_id)}
                          </h3>
                          <div
                            className={`mt-3 font-serif text-6xl font-bold tabular-nums ${
                              selected.winner_id === selected.player2_id
                                ? 'text-[#C9A24B]'
                                : 'text-[#F5F5F5]'
                            }`}
                          >
                            {selected.p2_racks}
                          </div>
                        </div>
                      </div>

                      <p className="mt-4 text-center text-xs uppercase tracking-widest text-[#A3A3A3]">
                        {selected.round === 5
                          ? 'Championship Final · Best of 5 · Race to 3'
                          : `Round ${selected.round} · Best of 3 · Race to 2`}
                      </p>

                      {/* Actions according to status */}
                      {selected.status === 'pending' && (
                        <div className="mt-6 space-y-3">
                          <label className="block text-xs uppercase tracking-wider text-[#A3A3A3]">
                            Assign Table
                            <select
                              value={selected.table_number ?? ''}
                              onChange={(e) => {
                                const val = e.target.value ? Number(e.target.value) : null
                                void updateTableNumber(selected.id, val)
                              }}
                              className="mt-1.5 w-full rounded-lg border border-white/10 bg-[#0A0A0A] p-2.5 text-sm text-[#F5F5F5] focus:outline-none focus:ring-1 focus:ring-white/40"
                            >
                              <option value="">Choose Table...</option>
                              <option value="1">Table 1</option>
                              <option value="2">Table 2</option>
                              <option value="3">Table 3</option>
                              <option value="4">Table 4</option>
                            </select>
                          </label>

                          <Button
                            className="w-full h-11 text-sm"
                            disabled={busy || !selected.player1_id || !selected.player2_id}
                            onClick={() => void startMatch(selected)}
                          >
                            Start Match
                          </Button>
                        </div>
                      )}

                      {selected.status === 'live' && selected.round < 5 && (
                        <div className="mt-6 space-y-4">
                          <div className="grid grid-cols-2 gap-3">
                            <Button
                              className="h-20 flex-col text-base font-bold"
                              disabled={busy}
                              onClick={() => void score(1, 1)}
                            >
                              <Plus size={20} />
                              +1 Rack (P1)
                            </Button>
                            <Button
                              className="h-20 flex-col text-base font-bold"
                              disabled={busy}
                              onClick={() => void score(2, 1)}
                            >
                              <Plus size={20} />
                              +1 Rack (P2)
                            </Button>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <Button
                              variant="outline"
                              className="text-xs"
                              disabled={busy || selected.p1_racks === 0}
                              onClick={() => void score(1, -1)}
                            >
                              <Minus size={14} /> Undo P1
                            </Button>
                            <Button
                              variant="outline"
                              className="text-xs"
                              disabled={busy || selected.p2_racks === 0}
                              onClick={() => void score(2, -1)}
                            >
                              <Minus size={14} /> Undo P2
                            </Button>
                          </div>
                        </div>
                      )}

                      {selected.status === 'live' && selected.round >= 5 && (
                        <RackControl 
                          matchId={selected.id} 
                          player1Id={selected.player1_id!} 
                          player2Id={selected.player2_id!} 
                          p1Name={nameFor(selected.player1_id)} 
                          p2Name={nameFor(selected.player2_id)} 
                        />
                      )}

                      {selected.status === 'done' && (
                        <div className="mt-6 space-y-3">
                          <div className="flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 p-3 text-xs text-[#F5F5F5]">
                            <Trophy size={16} className="text-[#C9A24B]" />
                            <span>Winner: <strong>{nameFor(selected.winner_id)}</strong></span>
                          </div>
                          <Button
                            variant="outline"
                            className="w-full text-xs"
                            disabled={busy}
                            onClick={() => void reopen(selected)}
                          >
                            <RotateCcw size={14} /> Reopen Match
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="py-16 text-center text-[#A3A3A3]">
                      <TableIcon className="mx-auto mb-2 text-[#A3A3A3]/40" size={32} />
                      <p className="text-sm">Select a match to start scoring</p>
                    </div>
                  )}
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
