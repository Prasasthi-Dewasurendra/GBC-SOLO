import { useState } from 'react'
import { Bell, Check, Download, Play, RotateCcw } from 'lucide-react'
import { MatchCard, type MatchCardData } from '../components/MatchCard'
import { GoldDivider } from '../components/brand/GoldDivider'
import { LiveBadge } from '../components/brand/LiveBadge'
import { LogoTitle } from '../components/brand/LogoTitle'
import { PlayerAvatar } from '../components/brand/PlayerAvatar'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '../components/ui/Dialog'
import { Input } from '../components/ui/Input'
import { Select, SelectContent, SelectItem, SelectTrigger } from '../components/ui/Select'
import { Skeleton } from '../components/ui/Skeleton'
import { Table } from '../components/ui/Table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/Tabs'
import { toast } from 'sonner'

const mockMatch: MatchCardData = {
  id: 'preview',
  round: 1,
  slot: 0,
  match_number: 1,
  player1_id: 'p1',
  player2_id: 'p2',
  player1: { name: 'Maya Chen' },
  player2: { name: 'Oliver Grant' },
  p1_racks: 1,
  p2_racks: 0,
  best_of: 3,
  status: 'live',
  table_number: 1,
  winner_id: null,
}

export function DesignPreviewPage() {
  const [tab, setTab] = useState('components')
  return (
    <main className="min-h-screen bg-[#0A0A0A] px-6 py-10 text-[#F5F5F5] md:px-12">
      <div className="mx-auto max-w-7xl">
        <LogoTitle />
        <GoldDivider />
        <header className="py-10">
          <p className="text-xs uppercase tracking-widest text-[#A3A3A3]">Design system preview</p>
          <h1 className="mt-2 text-4xl font-bold text-[#F5F5F5]">Black, White, Green & Gold</h1>
          <p className="mt-2 max-w-2xl text-sm text-[#A3A3A3]">
            High-contrast tournament layout. Gold restricted to primary buttons, active items, winner scores, and the Final card border.
          </p>
        </header>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="border border-white/10 bg-[#121212]">
            <TabsTrigger value="components">Components</TabsTrigger>
            <TabsTrigger value="matches">Match cards</TabsTrigger>
            <TabsTrigger value="states">States</TabsTrigger>
          </TabsList>

          <TabsContent value="components" className="mt-6">
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              <Card className="border-white/10 bg-[#121212] p-5">
                <h2 className="text-lg font-bold">Actions</h2>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button onClick={() => toast.success('Action saved')}>
                    Primary <Check size={16} />
                  </Button>
                  <Button variant="secondary">
                    <Play size={16} /> Outline
                  </Button>
                  <Button variant="outline">
                    <Download size={16} /> Export
                  </Button>
                  <Button variant="ghost">
                    <RotateCcw size={16} /> Undo
                  </Button>
                </div>
              </Card>

              <Card className="border-white/10 bg-[#121212] p-5">
                <h2 className="text-lg font-bold">Fields</h2>
                <div className="mt-4 space-y-3">
                  <Input placeholder="Player name" />
                  <Select defaultValue="r32">
                    <SelectTrigger>
                      <span className="flex-1 text-[#A3A3A3]">Round</span>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="r32">R32</SelectItem>
                      <SelectItem value="final">Final</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </Card>

              <Card className="border-white/10 bg-[#121212] p-5">
                <h2 className="text-lg font-bold">Feedback</h2>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge tone="live">Live</Badge>
                  <Badge tone="done">Done</Badge>
                  <Badge tone="pending">Pending</Badge>
                </div>
                <div className="mt-4 flex items-center gap-3 text-[#A3A3A3]">
                  <Bell size={16} />
                  <Skeleton className="h-3 w-28 bg-white/10" />
                </div>
              </Card>

              <Card className="border-white/10 bg-[#121212] p-5">
                <h2 className="text-lg font-bold">Dialogs</h2>
                <div className="mt-4 flex gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline">Open dialog</Button>
                    </DialogTrigger>
                    <DialogContent className="border border-white/10 bg-[#121212] p-6 text-[#F5F5F5]">
                      <DialogTitle className="text-xl font-bold">A focused decision</DialogTitle>
                      <DialogDescription className="mt-2 text-sm text-[#A3A3A3]">
                        Overlays use clean card surfaces with white 10% borders.
                      </DialogDescription>
                    </DialogContent>
                  </Dialog>
                  <ConfirmDialog
                    trigger={<Button variant="secondary">Confirm action</Button>}
                    title="Confirm action"
                    description="This is a reusable confirmation dialog."
                    onConfirm={() => toast.success('Confirmed')}
                  />
                </div>
              </Card>

              <Card className="border-white/10 bg-[#121212] p-5 md:col-span-2">
                <h2 className="text-lg font-bold">Table</h2>
                <Table className="mt-4">
                  <thead className="border-b border-white/10 text-xs text-[#A3A3A3]">
                    <tr>
                      <th className="p-3 text-left">Match</th>
                      <th className="p-3 text-left">Status</th>
                      <th className="p-3 text-left">Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-white/5">
                      <td className="p-3 text-sm">M1 · Round 1</td>
                      <td className="p-3">
                        <LiveBadge />
                      </td>
                      <td className="p-3 font-serif text-lg font-bold text-[#F5F5F5]">1 — 0</td>
                    </tr>
                  </tbody>
                </Table>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="matches" className="mt-6 grid gap-5 md:grid-cols-3">
            <MatchCard match={mockMatch} variant="compact" />
            <MatchCard
              match={{ ...mockMatch, status: 'done', winner_id: 'p1', p1_racks: 2 }}
              variant="standard"
            />
            <MatchCard
              match={{
                ...mockMatch,
                round: 5,
                best_of: 5,
                status: 'pending',
                player1: { name: 'TBD' },
                player2: { name: 'TBD' },
                player1_id: null,
                player2_id: null,
              }}
              variant="display"
            />
          </TabsContent>

          <TabsContent value="states" className="mt-6">
            <Card className="border-white/10 bg-[#121212] p-8">
              <div className="flex flex-wrap items-center gap-6">
                <PlayerAvatar name="Maya Chen" size="sm" ring="gold" state="winner" />
                <PlayerAvatar name="Oliver Grant" size="md" ring="green" state="normal" />
                <PlayerAvatar name="Practice Player" size="lg" state="eliminated" />
                <PlayerAvatar name="TBD" size="xl" state="tbd" />
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}
