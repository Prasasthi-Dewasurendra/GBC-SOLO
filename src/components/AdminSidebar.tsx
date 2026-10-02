import { useState } from 'react'
import {
  Users,
  LayoutGrid,
  Radio,
  Monitor,
  Settings,
  Download,
  RotateCcw,
  LogOut,
  X,
} from 'lucide-react'
import { LogoTitle } from './brand/LogoTitle'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from './ui/Dialog'
import { Button } from './ui/Button'
import { downloadCsv } from '../lib/csv'

type AdminSidebarProps = {
  current: 'registration' | 'draw' | 'scoring' | 'settings'
}

export function AdminSidebar({ current }: AdminSidebarProps) {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  async function signOut() {
    await supabase.auth.signOut()
  }

  async function handleExportAll() {
    try {
      const [{ data: players }, { data: matches }] = await Promise.all([
        supabase.from('players').select('*').order('created_at'),
        supabase.from('matches').select('*').order('round').order('slot'),
      ])

      if (players) {
        downloadCsv(
          'gbc-players.csv',
          ['Name', 'Seed', 'Photo URL', 'Registered At'],
          players.map((p) => [p.name, p.seed, p.photo_url, p.created_at])
        )
      }

      if (matches) {
        downloadCsv(
          'gbc-matches.csv',
          ['Match #', 'Round', 'Slot', 'P1 ID', 'P2 ID', 'P1 Score', 'P2 Score', 'Table', 'Status', 'Winner ID'],
          matches.map((m) => [
            m.match_number,
            m.round,
            m.slot,
            m.player1_id,
            m.player2_id,
            m.p1_racks,
            m.p2_racks,
            m.table_number,
            m.status,
            m.winner_id,
          ])
        )
      }
      toast.success('Exports downloaded.')
    } catch {
      toast.error('Failed to export data.')
    }
  }

  async function resetTournament() {
    if (!window.confirm('Reset tournament bracket and all match scores? Player roster will remain.')) return
    if (window.prompt('Type RESET to confirm.') !== 'RESET') return

    setBusy(true)
    const { error: matchError } = await supabase.from('matches').delete().gte('round', 1)
    if (matchError) {
      toast.error(matchError.message)
    } else {
      const { error } = await supabase.from('tournament').update({ state: 'registration', live_match_id: null }).eq('id', 1)
      if (error) toast.error(error.message)
      else toast.success('Tournament reset successfully. Registration is now open.')
    }
    setBusy(false)
    setSettingsOpen(false)
  }

  return (
    <>
      <aside className="hidden w-64 shrink-0 flex-col justify-between border-r border-white/10 bg-[#0A0A0A] p-6 lg:flex">
        <div>
          <LogoTitle />
          <nav className="mt-10 space-y-1.5">
            <a
              href="/admin"
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                current === 'registration'
                  ? 'border-l-2 border-[#C9A24B] bg-white/5 text-[#C9A24B]'
                  : 'text-[#A3A3A3] hover:bg-white/5 hover:text-[#F5F5F5]'
              }`}
            >
              <Users size={18} />
              Player Registration
            </a>

            <a
              href="/admin/draw"
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                current === 'draw'
                  ? 'border-l-2 border-[#C9A24B] bg-white/5 text-[#C9A24B]'
                  : 'text-[#A3A3A3] hover:bg-white/5 hover:text-[#F5F5F5]'
              }`}
            >
              <LayoutGrid size={18} />
              Draw
            </a>

            <a
              href="/admin/scoring"
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                current === 'scoring'
                  ? 'border-l-2 border-[#C9A24B] bg-white/5 text-[#C9A24B]'
                  : 'text-[#A3A3A3] hover:bg-white/5 hover:text-[#F5F5F5]'
              }`}
            >
              <Radio size={18} />
              Scoring
            </a>

            <a
              href="/display"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[#A3A3A3] transition hover:bg-white/5 hover:text-[#F5F5F5]"
            >
              <Monitor size={18} />
              Display (links)
            </a>

            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition ${
                current === 'settings'
                  ? 'border-l-2 border-[#C9A24B] bg-white/5 text-[#C9A24B]'
                  : 'text-[#A3A3A3] hover:bg-white/5 hover:text-[#F5F5F5]'
              }`}
            >
              <Settings size={18} />
              Settings / Export
            </button>
          </nav>
        </div>

        <div className="border-t border-white/10 pt-4">
          <button
            type="button"
            onClick={signOut}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-[#A3A3A3] transition hover:bg-white/5 hover:text-[#F5F5F5]"
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </aside>

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="border border-white/10 bg-[#121212] p-6 text-[#F5F5F5]">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <DialogTitle className="text-xl font-bold">Settings & Data Export</DialogTitle>
            <button
              onClick={() => setSettingsOpen(false)}
              className="text-[#A3A3A3] hover:text-[#F5F5F5]"
            >
              <X size={18} />
            </button>
          </div>
          <DialogDescription className="mt-2 text-sm text-[#A3A3A3]">
            Export tournament statistics or reset bracket data for a new tournament.
          </DialogDescription>

          <div className="mt-6 space-y-4">
            <div className="rounded-lg border border-white/10 bg-[#0A0A0A] p-4">
              <h4 className="text-sm font-semibold text-[#F5F5F5]">Data Export</h4>
              <p className="mt-1 text-xs text-[#A3A3A3]">
                Download CSV spreadsheets for players and matches.
              </p>
              <Button
                variant="secondary"
                className="mt-3 w-full"
                onClick={() => void handleExportAll()}
              >
                <Download size={16} /> Download CSV Files
              </Button>
            </div>

            <div className="rounded-lg border border-white/10 bg-[#0A0A0A] p-4">
              <h4 className="text-sm font-semibold text-[#F5F5F5]">Reset Tournament</h4>
              <p className="mt-1 text-xs text-[#A3A3A3]">
                Clears all match scores, tables, and bracket progress. Registered players are preserved.
              </p>
              <Button
                variant="outline"
                className="mt-3 w-full border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50"
                onClick={() => void resetTournament()}
                disabled={busy}
              >
                <RotateCcw size={16} /> Reset Tournament
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
