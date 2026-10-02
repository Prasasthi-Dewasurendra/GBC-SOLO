import type { InputHTMLAttributes } from 'react'

export function Input({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`min-h-10 w-full rounded-lg border border-white/10 bg-[#121212] px-3 text-[#F5F5F5] placeholder:text-[#A3A3A3]/60 focus:border-white/30 focus:ring-1 focus:ring-white/40 focus:outline-none ${className}`}
      {...props}
    />
  )
}
