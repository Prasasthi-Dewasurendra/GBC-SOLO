type ConnectionBannerProps = {
  online: boolean
  message?: string
}

export function ConnectionBanner({ online, message = 'Connection lost. Changes may not be saved.' }: ConnectionBannerProps) {
  if (online) return null
  return <div className="fixed left-0 right-0 top-0 z-40 bg-goldDark px-4 py-2 text-center text-sm font-semibold text-warm">{message}</div>
}
