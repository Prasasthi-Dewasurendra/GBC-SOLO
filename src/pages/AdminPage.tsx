import { ChangeEvent, FormEvent, useEffect, useState } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import { CameraCapture } from '../components/CameraCapture'
import { resizeImage } from '../lib/image'
import { supabase } from '../lib/supabase'

type Player = {
  id: string
  name: string
  photo_url: string | null
  seed: number | null
  created_at: string
}

export function AdminPage() {
  const [players, setPlayers] = useState<Player[]>([])
  const [name, setName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [photo, setPhoto] = useState<Blob | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [cameraOpen, setCameraOpen] = useState(false)
  const [remoteLink, setRemoteLink] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    async function loadPlayers() {
      const { data, error } = await supabase.from('players').select('*').order('created_at')
      if (error) setMessage(error.message)
      else setPlayers((data ?? []) as Player[])
    }

    void loadPlayers()
    const channel = supabase.channel('admin-players').on('postgres_changes', { event: '*', schema: 'public', table: 'players' }, () => { void loadPlayers() }).subscribe()
    return () => { void supabase.removeChannel(channel) }
  }, [])

  async function signOut() {
    await supabase.auth.signOut()
  }

  function clearPhoto() {
    if (photoPreview) URL.revokeObjectURL(photoPreview)
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
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not prepare that image.')
    }
  }

  function editPlayer(player: Player) {
    setEditingId(player.id)
    setName(player.name)
    clearPhoto()
    setPhotoPreview(player.photo_url)
    setMessage(null)
  }

  function resetForm() {
    setEditingId(null)
    setName('')
    clearPhoto()
    setMessage(null)
  }

  async function uploadPhoto(playerId: string, image: Blob) {
    const path = `${playerId}/${crypto.randomUUID()}.jpg`
    const { error: uploadError } = await supabase.storage.from('player-photos').upload(path, image, { contentType: 'image/jpeg', upsert: false })
    if (uploadError) throw uploadError
    return supabase.storage.from('player-photos').getPublicUrl(path).data.publicUrl
  }

  async function savePlayer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const cleanName = name.trim()
    if (!cleanName || (!editingId && players.length >= 32)) return
    setBusy(true)
    setMessage(null)

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
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Player could not be saved.')
    } finally {
      setBusy(false)
    }
  }

  async function deletePlayer(player: Player) {
    if (!window.confirm(`Delete ${player.name}?`)) return
    const { error } = await supabase.from('players').delete().eq('id', player.id)
    if (error) setMessage(error.message)
  }

  async function createRemoteLink(playerId: string) {
    setMessage(null)
    const { data, error } = await supabase.functions.invoke('capture-photo', { body: { action: 'create', playerId } })
    if (error || !data?.token) {
      setMessage(error?.message ?? 'Remote capture is not available yet.')
      return
    }
    setRemoteLink(`${window.location.origin}/capture/${playerId}?token=${encodeURIComponent(data.token)}`)
  }

  return (
    <main className="min-h-screen bg-chalk text-ink">
      <header className="flex items-center justify-between border-b border-ink/10 px-6 py-5 md:px-10">
        <div><p className="text-xs uppercase tracking-[0.28em] text-felt">GBC Solo</p><h1 className="font-display text-3xl">Tournament control</h1></div>
        <button className="rounded-lg border border-ink/20 px-4 py-2 text-sm font-semibold transition hover:bg-ink hover:text-chalk" onClick={signOut}>Sign out</button>
      </header>
      <section className="mx-auto grid max-w-6xl gap-8 px-6 py-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] md:px-10">
        <div>
          <div className="mb-6 flex items-end justify-between"><div><p className="text-sm uppercase tracking-[0.24em] text-felt">Registration</p><h2 className="font-display text-4xl">Add players</h2></div><strong className="text-2xl text-copper">{players.length} / 32</strong></div>
          <form className="space-y-4 rounded-2xl bg-white/70 p-6 shadow-sm" onSubmit={savePlayer}>
            <label className="block text-sm font-semibold">Player name<input className="mt-2 w-full rounded-lg border border-ink/15 bg-chalk px-3 py-2.5 font-normal outline-none focus:ring-2 focus:ring-copper" value={name} onChange={(event) => setName(event.target.value)} required maxLength={80} /></label>
            {photoPreview && <img className="aspect-square w-40 rounded-lg object-cover" src={photoPreview} alt="Player preview" />}
            <div className="flex flex-wrap gap-2">
              <label className="cursor-pointer rounded-lg border border-ink/20 px-3 py-2 text-sm font-semibold">Choose photo<input className="sr-only" type="file" accept="image/*" capture="user" onChange={(event) => void chooseFile(event)} /></label>
              <button type="button" className="rounded-lg border border-ink/20 px-3 py-2 text-sm font-semibold" onClick={() => setCameraOpen(true)}>Use camera</button>
              {photoPreview && <button type="button" className="rounded-lg border border-ink/20 px-3 py-2 text-sm" onClick={clearPhoto}>Remove photo</button>}
            </div>
            {cameraOpen && <CameraCapture onConfirm={(captured) => { clearPhoto(); setPhoto(captured); setPhotoPreview(URL.createObjectURL(captured)); setCameraOpen(false) }} onCancel={() => setCameraOpen(false)} />}
            {message && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-800">{message}</p>}
            <div className="flex gap-2"><button className="rounded-lg bg-felt px-4 py-2.5 font-semibold text-chalk disabled:opacity-50" disabled={busy || (!editingId && players.length >= 32)}>{busy ? 'Saving...' : editingId ? 'Save changes' : 'Register player'}</button>{editingId && <button type="button" className="rounded-lg border border-ink/20 px-4 py-2.5" onClick={resetForm}>Cancel</button>}</div>
          </form>
          <p className="mt-4 text-sm text-ink/60">A phone used as a webcam, including DroidCam or Camo, appears in the camera dropdown. For a separate phone, use the QR option beside a player.</p>
        </div>
        <div><h2 className="mb-4 font-display text-3xl">Registered players</h2><div className="grid gap-3 sm:grid-cols-2">{players.map((player, index) => <article className="flex gap-3 rounded-xl border border-ink/10 bg-white/70 p-3" key={player.id}>{player.photo_url ? <img className="h-20 w-20 rounded-lg object-cover" src={player.photo_url} alt="" /> : <div className="grid h-20 w-20 place-items-center rounded-lg bg-felt text-2xl text-chalk">{player.name.charAt(0).toUpperCase()}</div>}<div className="min-w-0 flex-1"><p className="text-xs text-ink/50">Player {index + 1}</p><h3 className="truncate font-semibold">{player.name}</h3><div className="mt-2 flex flex-wrap gap-2"><button className="text-xs font-semibold text-felt underline" onClick={() => editPlayer(player)}>Edit</button><button className="text-xs font-semibold text-red-700 underline" onClick={() => void deletePlayer(player)}>Delete</button><button className="text-xs font-semibold text-felt underline" onClick={() => void createRemoteLink(player.id)}>Phone QR</button></div></div></article>)}</div></div>
      </section>
      {remoteLink && <div className="fixed inset-0 z-10 grid place-items-center bg-ink/70 p-6" role="dialog" aria-modal="true"><div className="w-full max-w-sm rounded-2xl bg-chalk p-6 text-center"><h2 className="font-display text-3xl">Scan with phone</h2><p className="mt-2 text-sm text-ink/60">This link expires after 10 minutes and works once.</p><div className="my-5 flex justify-center bg-white p-4"><QRCodeCanvas value={remoteLink} size={240} /></div><button className="rounded-lg border border-ink/20 px-4 py-2 font-semibold" onClick={() => setRemoteLink(null)}>Close</button></div></div>}
    </main>
  )
}
