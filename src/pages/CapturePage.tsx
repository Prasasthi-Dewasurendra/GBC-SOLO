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
      const { error } = await supabase.functions.invoke('capture-photo', {
        body: { action: 'upload', playerId, token, image },
      })
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
    <main className="grid min-h-screen place-items-center bg-[#0A0A0A] px-6 py-10 text-center text-[#F5F5F5]">
      <section className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <LogoTitle />
        </div>
        <Card className="border-white/10 bg-[#121212] p-6">
          <p className="text-xs uppercase tracking-widest text-[#A3A3A3]">Secure remote capture</p>
          <h1 className="mt-2 text-2xl font-bold text-[#F5F5F5]">Player photo</h1>
          <p className="mt-1 text-xs text-[#A3A3A3]">Player ID: {playerId ?? 'unknown'}</p>

          {preview && (
            <img
              className="mx-auto mt-6 aspect-square w-full max-w-sm rounded-xl border border-white/10 object-cover"
              src={preview}
              alt="Photo preview"
            />
          )}

          <label className="mt-6 flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-sm font-semibold text-[#F5F5F5] transition hover:bg-white/15">
            <Camera size={18} /> Take or choose photo
            <input
              className="sr-only"
              type="file"
              accept="image/*"
              capture="user"
              onChange={(event) => void choosePhoto(event.target.files?.[0])}
            />
          </label>

          <p className="mt-4 text-xs text-[#A3A3A3]">{status}</p>

          {!token && (
            <p className="mt-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-[#A3A3A3]">
              This page requires a valid QR link.
            </p>
          )}

          <Button
            className="mt-5 w-full h-11"
            disabled={!photo || !token || busy}
            onClick={() => void uploadPhoto()}
          >
            {busy ? 'Uploading...' : 'Upload photo'}
          </Button>
        </Card>
      </section>
    </main>
  )
}
