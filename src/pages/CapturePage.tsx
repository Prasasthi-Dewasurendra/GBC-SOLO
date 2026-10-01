import { useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { Camera } from 'lucide-react'
import { LogoTitle } from '../components/brand/LogoTitle'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { resizeImage } from '../lib/image'
import { supabase } from '../lib/supabase'

export function CapturePage() {
  const { playerId } = useParams<{ playerId: string }>()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const [preview, setPreview] = useState<string | null>(null)
  const [photo, setPhoto] = useState<Blob | null>(null)
  const [status, setStatus] = useState('Take a square player photo in good light.')
  const [busy, setBusy] = useState(false)

  async function choosePhoto(file: File | undefined) {
    if (!file) return
    try {
      const prepared = await resizeImage(file)
      if (preview) URL.revokeObjectURL(preview)
      setPhoto(prepared)
      setPreview(URL.createObjectURL(prepared))
      setStatus('Photo ready. Submit it when you are happy with the framing.')
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'The photo could not be prepared.')
    }
  }

  async function uploadPhoto() {
    if (!photo || !token || !playerId) return
    setBusy(true)
    setStatus('Uploading photo...')
    try {
      const image = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(String(reader.result))
        reader.onerror = () => reject(new Error('The photo could not be read.'))
        reader.readAsDataURL(photo)
      })
      const { error } = await supabase.functions.invoke('capture-photo', { body: { action: 'upload', playerId, token, image } })
      if (error) throw error
      setStatus('Photo uploaded. You can close this page.')
      setPhoto(null)
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Upload failed. The link may have expired.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-felt-gradient px-6 py-10 text-center text-warm">
      <section className="w-full max-w-md"><div className="mb-8 flex justify-center"><LogoTitle /></div><Card className="p-6"><p className="text-xs uppercase tracking-[0.3em] text-gold">Secure remote capture</p><h1 className="mt-3 font-display text-4xl">Player photo</h1><p className="mt-3 text-muted">Player {playerId ?? 'unknown'}</p>
        {preview && <img className="mx-auto mt-6 aspect-square w-full max-w-sm rounded-2xl border border-gold/30 object-cover" src={preview} alt="Photo preview" />}
        <label className="mt-6 flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-gold-metal px-4 py-3 font-semibold text-ink transition hover:brightness-110"><Camera size={18} /> Take or choose photo<input className="sr-only" type="file" accept="image/*" capture="user" onChange={(event) => void choosePhoto(event.target.files?.[0])} /></label>
        <p className="mt-4 text-sm text-muted">{status}</p>
        {!token && <p className="mt-3 rounded-xl border border-goldDark/50 bg-goldDark/15 px-3 py-2 text-sm text-goldLight">This page needs a valid QR link.</p>}
        <Button className="mt-5 w-full" disabled={!photo || !token || busy} onClick={() => void uploadPhoto()}>{busy ? 'Uploading...' : 'Upload photo'}</Button>
      </Card></section>
    </main>
  )
}
