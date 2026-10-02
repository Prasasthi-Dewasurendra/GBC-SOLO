import type { ButtonHTMLAttributes } from 'react'

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
}

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-[#C9A24B] text-[#0A0A0A] font-semibold hover:bg-[#b8913d]',
  secondary: 'border border-white/20 bg-transparent text-[#F5F5F5] hover:bg-white/10 hover:border-white/40',
  outline: 'border border-white/10 bg-transparent text-[#F5F5F5] hover:border-white/30 hover:bg-white/5',
  ghost: 'bg-transparent text-[#A3A3A3] hover:bg-white/5 hover:text-[#F5F5F5]',
}

export function Button({ className = '', variant = 'primary', ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition duration-150 disabled:cursor-not-allowed disabled:opacity-40 ${variants[variant]} ${className}`}
      {...props}
    />
  )
}
