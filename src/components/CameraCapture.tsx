import { useEffect, useRef, useState } from 'react'
import { resizeImage } from '../lib/image'
import { Button } from './ui/Button'
import { Card } from './ui/Card'

type CameraCaptureProps = {
  onConfirm: (photo: Blob) => void
  onCancel?: () => void
}

export function CameraCapture({ onConfirm, onCancel }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
  const [deviceId, setDeviceId] = useState('')
  const [preview, setPreview] = useState<string | null>(null)
  const [photo, setPhoto] = useState<Blob | null>(null)
  const [message, setMessage] = useState('Choose a camera to begin.')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let active = true

    async function loadDevices() {
      try {
        const permissions = await navigator.mediaDevices.getUserMedia({ video: true })
        permissions.getTracks().forEach((track) => track.stop())
        const allDevices = await navigator.mediaDevices.enumerateDevices()
        const cameras = allDevices.filter((device) => device.kind === 'videoinput')
        if (active) {
          setDevices(cameras)
          setDeviceId(cameras[0]?.deviceId ?? '')
          setMessage(cameras.length ? 'Camera ready.' : 'No camera was found.')
        }
      } catch {
        if (active) setMessage('Camera permission was denied. Allow camera access and try again.')
      }
    }

    void loadDevices()
    return () => {
      active = false
      streamRef.current?.getTracks().forEach((track) => track.stop())
    }
  }, [])

  useEffect(() => {
    if (!deviceId || photo) return
    let active = true

    async function startCamera() {
      streamRef.current?.getTracks().forEach((track) => track.stop())
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { deviceId: { exact: deviceId } } })
        streamRef.current = stream
        if (active && videoRef.current) videoRef.current.srcObject = stream
      } catch {
        setMessage('This camera could not be opened. Try another device.')
      }
    }

    void startCamera()
    return () => {
      active = false
      streamRef.current?.getTracks().forEach((track) => track.stop())
    }
  }, [deviceId, photo])

  async function capture() {
    const video = videoRef.current
    if (!video || video.videoWidth === 0) {
      setMessage('Wait for the camera preview, then capture again.')
      return
    }

    setBusy(true)
    try {
      const canvas = document.createElement('canvas')
      const size = Math.min(video.videoWidth, video.videoHeight)
      canvas.width = size
      canvas.height = size
      const context = canvas.getContext('2d')
      if (!context) throw new Error('Canvas is not supported in this browser.')
      context.drawImage(video, (video.videoWidth - size) / 2, (video.videoHeight - size) / 2, size, size, 0, 0, size, size)
      const captured = await resizeImage(await new Promise<Blob>((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Capture failed.')), 'image/jpeg', 0.8)))
      setPhoto(captured)
      setPreview(URL.createObjectURL(captured))
      streamRef.current?.getTracks().forEach((track) => track.stop())
      setMessage('Photo captured. Confirm it or retake it.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Photo capture failed.')
    } finally {
      setBusy(false)
    }
  }

  function retake() {
    if (preview) URL.revokeObjectURL(preview)
    setPreview(null)
    setPhoto(null)
    setMessage('Camera ready.')
  }

  function confirm() {
    if (photo) onConfirm(photo)
  }

  return (
    <Card className="space-y-4 border-white/10 bg-[#121212] p-4 text-[#F5F5F5]">
      <div className="flex flex-wrap items-center gap-3">
        <label className="text-sm font-semibold text-[#A3A3A3]" htmlFor="camera-device">Camera</label>
        <select id="camera-device" className="min-w-0 flex-1 rounded-lg border border-white/10 bg-[#0A0A0A] px-3 py-2 text-sm text-[#F5F5F5] focus:outline-none focus:ring-1 focus:ring-white/40" value={deviceId} onChange={(event) => setDeviceId(event.target.value)} disabled={Boolean(photo)}>
          {devices.length === 0 && <option value="">No cameras found</option>}
          {devices.map((device, index) => <option key={device.deviceId} value={device.deviceId}>{device.label || `Camera ${index + 1}`}</option>)}
        </select>
      </div>
      <div className="overflow-hidden rounded-xl border border-white/10 bg-[#0A0A0A]">
        {preview ? <img className="mx-auto aspect-square w-full max-w-sm object-cover" src={preview} alt="Captured player preview" /> : <video ref={videoRef} className="mx-auto aspect-square w-full max-w-sm object-cover" autoPlay muted playsInline />}
      </div>
      <p className="text-sm text-[#A3A3A3]">{message}</p>
      <div className="flex flex-wrap gap-2">
        {!photo && <Button type="button" variant="secondary" onClick={() => void capture()} disabled={busy || !deviceId}>{busy ? 'Preparing...' : 'Capture'}</Button>}
        {photo && <Button type="button" variant="outline" onClick={retake}>Retake</Button>}
        {photo && <Button type="button" onClick={confirm}>Confirm photo</Button>}
        {onCancel && <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>}
      </div>
    </Card>
  )
}
