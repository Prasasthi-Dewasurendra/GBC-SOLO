import type { ButtonHTMLAttributes } from 'react'

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
}

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-felt text-warm hover:bg-live',
  secondary: 'border border-live/40 bg-live/10 text-warm hover:bg-live/20',
  outline: 'border border-border bg-transparent text-muted hover:border-muted hover:text-warm',
  ghost: 'bg-transparent text-muted hover:bg-warm/5 hover:text-warm',
}

export function Button({ className = '', variant = 'primary', ...props }: ButtonProps) {
  return <button className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`} {...props} />
}
