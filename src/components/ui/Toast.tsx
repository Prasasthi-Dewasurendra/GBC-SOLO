import { Toaster } from 'sonner'

export function Toast() {
  return (
    <Toaster
      position="top-right"
      richColors={false}
      toastOptions={{
        className: 'border border-white/10 bg-[#121212] text-[#F5F5F5]',
        style: {
          color: '#F5F5F5',
          background: '#121212',
          borderColor: 'rgba(255, 255, 255, 0.10)',
        },
      }}
    />
  )
}
