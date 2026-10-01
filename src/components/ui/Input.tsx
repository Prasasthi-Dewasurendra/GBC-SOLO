import type { InputHTMLAttributes } from 'react'

export function Input({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`min-h-11 w-full border border-gold/20 bg-ink/70 px-3 text-warm placeholder:text-muted/60 focus:border-gold focus:outline-none ${className}`} {...props} />
}
