import type { ButtonHTMLAttributes } from 'react'

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
}

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-gold-metal text-ink shadow-gold hover:brightness-110',
  secondary: 'bg-felt text-warm shadow-live hover:bg-live',
  outline: 'border border-gold/30 bg-transparent text-goldLight hover:bg-gold/10',
  ghost: 'bg-transparent text-muted hover:bg-warm/5 hover:text-warm',
}

export function Button({ className = '', variant = 'primary', ...props }: ButtonProps) {
  return <button className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`} {...props} />
}
