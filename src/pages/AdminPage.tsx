import { ChangeEvent, FormEvent, useEffect, useState } from 'react'
import { Camera, Download, RotateCcw, UserPlus, QrCode } from 'lucide-react'
import { QRCodeCanvas } from 'qrcode.react'
import { CameraCapture } from '../components/CameraCapture'
import { ConnectionBanner } from '../components/ConnectionBanner'
import { AdminSidebar } from '../components/AdminSidebar'
import { PlayerAvatar } from '../components/brand/PlayerAvatar'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '../components/ui/Dialog'
import { Input } from '../components/ui/Input'
import { Badge } from '../components/ui/Badge'
import { useConnectionStatus } from '../hooks/useConnectionStatus'
import { downloadCsv } from '../lib/csv'
import { resizeImage } from '../lib/image'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'

type Player = { id: string; name: string; photo_url: string | null; seed: number | null; created_at: string }

export function AdminPage() {
  const [players, setPlayers] = useState<Player[]>([])
  const [name, setName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [photo, setPhoto] = useState<Blob | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [cameraOpen, setCameraOpen] = useState(false)
  const [remoteLink, setRemoteLink] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [tournamentState, setTournamentState] = useState('registration')
  const online = useConnectionStatus()
  const rosterLocked = tournamentState !== 'registration'

  useEffect(() => {
    async function loadData() {
      const [{ data: playerData, error: playerError }, { data: tournamentData, error: tournamentError }] = await Promise.all([
        supabase.from('players').select('*').order('created_at'),
        supabase.from('tournament').select('state').eq('id', 1).single(),
      ])
      if (playerError || tournamentError) toast.error(playerError?.message ?? tournamentError?.message ?? 'Could not load tournament data.')
      else { setPlayers((playerData ?? []) as Player[]); setTournamentState(tournamentData.state) }
    }
    void loadData()
    const channel = supabase.channel('admin-players')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'players' }, () => { void loadData() })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tournament' }, () => { void loadData() })
      .subscribe()
    return () => { void supabase.removeChannel(channel) }
  }, [])

  function clearPhoto() {
    if (photoPreview?.startsWith('blob:')) URL.revokeObjectURL(photoPreview)
    setPhoto(null)
    setPhotoPreview(null)
  }

  async function chooseFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      const prepared = await resizeImage(file)
      clearPhoto()
      setPhoto(prepared)
      setPhotoPreview(URL.createObjectURL(prepared))
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Could not prepare that image.') }
  }

  function editPlayer(player: Player) {
    setEditingId(player.id)
    setName(player.name)
    clearPhoto()
    setPhotoPreview(player.photo_url)
  }

  function resetForm() { setEditingId(null); setName(''); clearPhoto() }

  async function uploadPhoto(playerId: string, image: Blob) {
    const path = `${playerId}/${crypto.randomUUID()}.jpg`
    const { error } = await supabase.storage.from('player-photos').upload(path, image, { contentType: 'image/jpeg', upsert: false })
    if (error) throw error
    return supabase.storage.from('player-photos').getPublicUrl(path).data.publicUrl
  }

  async function savePlayer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const cleanName = name.trim()
    if (!cleanName || (!editingId && (players.length >= 32 || rosterLocked))) {
      if (rosterLocked && !editingId) toast.error('The draw is locked. Reset the tournament before changing roster membership.')
      return
    }
    setBusy(true)
    try {
      let playerId = editingId
      if (editingId) {
        const { error } = await supabase.from('players').update({ name: cleanName }).eq('id', editingId)
        if (error) throw error
      } else {
        const { data, error } = await supabase.from('players').insert({ name: cleanName }).select().single()
        if (error) throw error
        playerId = data.id
      }
      if (playerId && photo) {
        const photoUrl = await uploadPhoto(playerId, photo)
        const { error } = await supabase.from('players').update({ photo_url: photoUrl }).eq('id', playerId)
        if (error) throw error
      }
      resetForm()
      toast.success(editingId ? 'Player updated.' : 'Player registered.')
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Player could not be saved.') }
    finally { setBusy(false) }
  }

  async function deletePlayer(player: Player) {
    if (rosterLocked) { toast.error('The draw is locked. Reset the tournament before deleting a player.'); return }
    if (!window.confirm(`Delete ${player.name}?`)) return
    const { error } = await supabase.from('players').delete().eq('id', player.id)
    if (error) toast.error(error.message)
    else toast.success('Player deleted.')
  }

  async function createRemoteLink(playerId: string) {
    const { data, error } = await supabase.functions.invoke('capture-photo', { body: { action: 'create', playerId } })
    if (error || !data?.token) { toast.error(error?.message ?? 'Remote capture is not available yet.'); return }
    setRemoteLink(`${window.location.origin}/capture/${playerId}?token=${encodeURIComponent(data.token)}`)
  }

  function exportPlayers() { downloadCsv('gbc-solo-players.csv', ['Name', 'Seed', 'Photo URL', 'Registered At'], players.map((player) => [player.name, player.seed, player.photo_url, player.created_at])) }

  async function resetTournament() {
    if (!window.confirm('Reset the tournament bracket and all match scores? Players will be kept.')) return
    if (window.prompt('Type RESET to confirm.') !== 'RESET') return
    setBusy(true)
    const { error: matchError } = await supabase.from('matches').delete().gte('round', 1)
    if (matchError) toast.error(matchError.message)
    else {
      const { error } = await supabase.from('tournament').update({ state: 'registration', live_match_id: null }).eq('id', 1)
      if (error) toast.error(error.message)
      else toast.success('Tournament reset. Player roster kept.')
    }
    setBusy(false)
  }

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-[#F5F5F5]">
      <ConnectionBanner online={online} />
      <div className="flex min-h-screen">
        <AdminSidebar current="registration" />

        <div className="min-w-0 flex-1 flex flex-col">
          <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 bg-[#0A0A0A] px-6 py-5 md:px-10">
            <div>
              <p className="text-xs uppercase tracking-widest text-[#A3A3A3]">Operator desk</p>
              <h1 className="text-2xl font-bold text-[#F5F5F5]">Player Registration</h1>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={exportPlayers}>
                <Download size={15} /> Export
              </Button>
              <Button variant="outline" onClick={() => void resetTournament()} disabled={busy}>
                <RotateCcw size={15} /> Reset
              </Button>
            </div>
          </header>

          <section className="mx-auto max-w-7xl w-full space-y-8 px-6 py-8 md:px-10 flex-1">
            <Card className="border-white/10 bg-[#121212] p-6 md:p-8">
              <div className="flex flex-wrap items-end justify-between gap-5">
                <div>
                  <p className="text-xs uppercase tracking-wider text-[#A3A3A3]">Tournament state · {tournamentState}</p>
                  <h2 className="mt-2 text-3xl font-bold text-[#F5F5F5]">Build the field</h2>
                  <p className="mt-2 max-w-xl text-sm text-[#A3A3A3]">Register 32 players before the draw locks the tournament roster.</p>
                </div>
                <div className="text-right">
                  <strong className="text-4xl font-bold text-[#F5F5F5]">
                    {players.length}
                    <span className="text-xl text-[#A3A3A3]"> / 32</span>
                  </strong>
                  <div className="mt-3 h-2 w-48 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full bg-[#1E8F63] transition-all"
                      style={{ width: `${Math.min((players.length / 32) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </Card>

            <div className="grid gap-8 xl:grid-cols-[22rem_minmax(0,1fr)]">
              <Card className="h-fit border-white/10 bg-[#121212] p-6">
                <div className="flex items-center gap-3">
                  <UserPlus className="text-[#F5F5F5]" />
                  <div>
                    <h2 className="text-xl font-bold text-[#F5F5F5]">{editingId ? 'Edit player' : 'New player'}</h2>
                    <p className="text-xs text-[#A3A3A3]">Name and photo</p>
                  </div>
                </div>

                <form className="mt-6 space-y-5" onSubmit={savePlayer}>
                  <label className="block text-sm font-medium text-[#A3A3A3]">
                    Player name
                    <Input
                      className="mt-2"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      required
                      maxLength={80}
                      placeholder="Enter full name"
                    />
                  </label>

                  {photoPreview && (
                    <div className="flex justify-center py-2">
                      <PlayerAvatar photoUrl={photoPreview} name={name || 'Preview'} size="xl" ring="none" />
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-xs font-semibold text-[#F5F5F5] transition hover:bg-white/10">
                      <Download size={14} /> Choose
                      <input className="sr-only" type="file" accept="image/*" capture="user" onChange={(event) => void chooseFile(event)} />
                    </label>
                    <Button type="button" variant="secondary" onClick={() => setCameraOpen(true)}>
                      <Camera size={14} /> Camera
                    </Button>
                  </div>

                  {rosterLocked && (
                    <p className="rounded-lg border border-white/10 bg-white/5 p-3 text-xs text-[#A3A3A3]">
                      Roster locked after draw. You can still edit photos and names.
                    </p>
                  )}

                  <div className="flex gap-2">
                    <Button className="flex-1" disabled={busy || (!editingId && (players.length >= 32 || rosterLocked))}>
                      {busy ? 'Saving...' : editingId ? 'Save changes' : 'Register player'}
                    </Button>
                    {editingId && (
                      <Button type="button" variant="ghost" onClick={resetForm}>
                        Cancel
                      </Button>
                    )}
                  </div>
                </form>
              </Card>

              <div>
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-[#A3A3A3]">Field list</p>
                    <h2 className="text-2xl font-bold text-[#F5F5F5]">Registered players</h2>
                  </div>
                  {rosterLocked ? <Badge tone="done">Locked</Badge> : <Badge tone="pending">Open</Badge>}
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {players.map((player, index) => (
                    <Card className="flex items-center gap-3 border-white/10 bg-[#121212] p-3" key={player.id}>
                      <PlayerAvatar photoUrl={player.photo_url} name={player.name} size="md" ring="none" />
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] uppercase tracking-wider text-[#A3A3A3]">Player {String(index + 1).padStart(2, '0')}</p>
                        <h3 className="truncate font-semibold text-[#F5F5F5]" title={player.name}>
                          {player.name}
                        </h3>
                        <div className="mt-2 flex gap-3 text-[11px]">
                          <button className="text-[#F5F5F5] hover:underline" onClick={() => editPlayer(player)}>
                            Edit
                          </button>
                          <button
                            className="text-[#A3A3A3] hover:text-[#F5F5F5] disabled:cursor-not-allowed disabled:opacity-40"
                            disabled={rosterLocked}
                            onClick={() => void deletePlayer(player)}
                          >
                            Delete
                          </button>
                          <button
                            className="inline-flex items-center gap-1 text-[#A3A3A3] hover:text-[#F5F5F5]"
                            onClick={() => void createRemoteLink(player.id)}
                          >
                            <QrCode size={12} /> QR
                          </button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      <Dialog open={cameraOpen} onOpenChange={setCameraOpen}>
        <DialogContent className="border border-white/10 bg-[#121212] p-6 text-[#F5F5F5]">
          <DialogTitle className="text-xl font-bold">Capture player photo</DialogTitle>
          <DialogDescription className="mt-1 text-sm text-[#A3A3A3]">
            Choose a camera, frame a centered square, then confirm.
          </DialogDescription>
          <div className="mt-4">
            <CameraCapture
              onConfirm={(captured) => {
                clearPhoto()
                setPhoto(captured)
                setPhotoPreview(URL.createObjectURL(captured))
                setCameraOpen(false)
              }}
              onCancel={() => setCameraOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(remoteLink)} onOpenChange={(open) => !open && setRemoteLink(null)}>
        <DialogContent className="border border-white/10 bg-[#121212] p-6 text-center text-[#F5F5F5]">
          <DialogTitle className="text-xl font-bold">Scan with phone</DialogTitle>
          <DialogDescription className="mt-1 text-sm text-[#A3A3A3]">
            This secure link expires after 10 minutes and works once.
          </DialogDescription>
          {remoteLink && (
            <div className="mx-auto my-6 w-fit rounded-xl bg-white p-4">
              <QRCodeCanvas value={remoteLink} size={220} />
            </div>
          )}
          <Button variant="outline" onClick={() => setRemoteLink(null)}>
            Close
          </Button>
        </DialogContent>
      </Dialog>
    </main>
  )
}
