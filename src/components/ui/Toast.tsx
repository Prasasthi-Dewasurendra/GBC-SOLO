import { Toaster } from 'sonner'

export function Toast() {
  return <Toaster position="top-right" richColors={false} toastOptions={{ className: 'border-gold/30 bg-card text-warm', style: { color: '#F5F1E6', background: '#111612', borderColor: 'rgba(212,175,55,0.3)' } }} />
}
