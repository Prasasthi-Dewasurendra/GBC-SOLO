import type { TableHTMLAttributes } from 'react'

export function Table({ className = '', ...props }: TableHTMLAttributes<HTMLTableElement>) {
  return <table className={`w-full border-collapse text-left text-sm ${className}`} {...props} />
}
