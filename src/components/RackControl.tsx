import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { getBallColor } from '../lib/balls'
import { Button } from './ui/Button'
import { RotateCcw } from 'lucide-react'
import { toast } from 'sonner'

type Event = { ball: number; player_id: string }

export function RackControl({ matchId, player1Id, player2Id, p1Name, p2Name }: { matchId: string; player1Id: string; player2Id: string; p1Name: string; p2Name: string }) {
  const [rack, setRack] = useState<{ id: string; events: Event[] } | null>(null)
  const [busy, setBusy] = useState(false)

  async function loadRack() {
    const { data } = await supabase
      .from('racks')
      .select('id, events')
      .eq('match_id', matchId)
      .eq('status', 'playing')
      .order('rack_number', { ascending: false })
      .limit(1)
      .single()
    setRack(data || null)
  }

  useEffect(() => {
    void loadRack()
    const channel = supabase.channel(`rack-${matchId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'racks', filter: `match_id=eq.${matchId}` }, () => {
        void loadRack()
      })
      .subscribe()
    return () => { void supabase.removeChannel(channel) }
  }, [matchId])

  async function startRack() {
    setBusy(true)
    const { error } = await supabase.rpc('start_rack', { p_match_id: matchId })
    if (error) toast.error(error.message)
    setBusy(false)
  }

  async function potBall(ball: number, playerId: string) {
    if (!rack) return
    setBusy(true)
    const { error } = await supabase.rpc('pot_ball', { p_rack_id: rack.id, p_ball: ball, p_player_id: playerId })
    if (error) toast.error(error.message)
    setBusy(false)
  }

  async function undoLast() {
    if (!rack) return
    setBusy(true)
    const { error } = await supabase.rpc('undo_last', { p_rack_id: rack.id })
    if (error) toast.error(error.message)
    setBusy(false)
  }

  async function finishRack(winnerId: string, playerNumber: number) {
    if (!rack) return
    if (!window.confirm('Are you sure you want to end this rack?')) return
    setBusy(true)
    const { error } = await supabase.rpc('finish_rack', { p_rack_id: rack.id, p_winner_id: winnerId, p_player_number: playerNumber })
    if (error) toast.error(error.message)
    setBusy(false)
  }

  if (!rack) {
    return (
      <div className="mt-6 border border-white/10 p-4 rounded-xl text-center bg-[#0A0A0A]">
        <p className="text-[#A3A3A3] mb-4 text-sm">No active rack.</p>
        <Button onClick={() => void startRack()} disabled={busy}>Start New Rack</Button>
      </div>
    )
  }

  const potted = rack.events.map(e => e.ball)
  const allBalls = Array.from({ length: 15 }, (_, i) => i + 1)
  const remaining = allBalls.filter(b => !potted.includes(b))

  return (
    <div className="mt-6 border border-[#1E8F63]/30 p-4 rounded-xl bg-[#0A0A0A]">
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-[#F5F5F5] font-bold">Ball Tracking</h4>
        <Button variant="outline" size="sm" className="h-7 px-2" onClick={() => void undoLast()} disabled={busy || rack.events.length === 0}>
          <RotateCcw size={14} className="mr-1" /> Undo Pot
        </Button>
      </div>
      
      <div className="mb-4">
        <p className="text-xs text-[#A3A3A3] mb-2 uppercase tracking-widest">Tap to Pot (Player 1: {p1Name})</p>
        <div className="flex flex-wrap gap-2">
          {remaining.map(b => (
            <button key={b} disabled={busy} onClick={() => void potBall(b, player1Id)} style={{ backgroundColor: getBallColor(b) }}
              className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white shadow-sm border border-white/20 hover:scale-110 transition-transform">
              {b}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <p className="text-xs text-[#A3A3A3] mb-2 uppercase tracking-widest">Tap to Pot (Player 2: {p2Name})</p>
        <div className="flex flex-wrap gap-2">
          {remaining.map(b => (
            <button key={b} disabled={busy} onClick={() => void potBall(b, player2Id)} style={{ backgroundColor: getBallColor(b) }}
              className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white shadow-sm border border-white/20 hover:scale-110 transition-transform">
              {b}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 border-t border-white/10 pt-4">
        <Button onClick={() => void finishRack(player1Id, 1)} disabled={busy}>P1 Won Rack</Button>
        <Button onClick={() => void finishRack(player2Id, 2)} disabled={busy}>P2 Won Rack</Button>
      </div>
    </div>
  )
}
