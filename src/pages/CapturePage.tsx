import { useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
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
    <main className="grid min-h-screen place-items-center bg-chalk px-6 text-center text-ink">
      <section className="w-full max-w-md px-6">
        <p className="text-sm uppercase tracking-[0.28em] text-felt">GBC Solo</p>
        <h1 className="mt-4 font-display text-5xl">Remote photo capture</h1>
        <p className="mt-4 text-ink/65">Player {playerId ?? 'unknown'}</p>
        {preview && <img className="mx-auto mt-6 aspect-square w-full max-w-sm rounded-xl object-cover" src={preview} alt="Photo preview" />}
        <label className="mt-6 block cursor-pointer rounded-lg bg-felt px-4 py-3 font-semibold text-chalk">Take or choose photo<input className="sr-only" type="file" accept="image/*" capture="user" onChange={(event) => void choosePhoto(event.target.files?.[0])} /></label>
        <p className="mt-4 text-sm text-ink/65">{status}</p>
        {!token && <p className="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-800">This page needs a valid QR link.</p>}
        <button className="mt-5 rounded-lg bg-copper px-5 py-3 font-semibold text-ink disabled:opacity-50" disabled={!photo || !token || busy} onClick={() => void uploadPhoto()}>{busy ? 'Uploading...' : 'Upload photo'}</button>
      </section>
    </main>
  )
}
