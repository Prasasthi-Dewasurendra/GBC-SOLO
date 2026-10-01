import * as SelectPrimitive from '@radix-ui/react-select'
import { Check, ChevronDown } from 'lucide-react'

export const Select = SelectPrimitive.Root
export const SelectTrigger = ({ className = '', ...props }: SelectPrimitive.SelectTriggerProps) => <SelectPrimitive.Trigger className={`inline-flex min-h-11 items-center justify-between gap-3 rounded-xl border border-gold/20 bg-ink/70 px-3 text-sm text-warm ${className}`} {...props}><span className="flex-1 text-left"><SelectPrimitive.Value /></span><ChevronDown size={16} /></SelectPrimitive.Trigger>
export const SelectValue = SelectPrimitive.Value
export const SelectContent = ({ className = '', ...props }: SelectPrimitive.SelectContentProps) => <SelectPrimitive.Portal><SelectPrimitive.Content className={`z-50 overflow-hidden rounded-xl border border-gold/30 bg-card p-1 text-warm shadow-2xl ${className}`} position="popper" {...props} /></SelectPrimitive.Portal>
export const SelectItem = ({ className = '', children, ...props }: SelectPrimitive.SelectItemProps) => <SelectPrimitive.Item className={`relative flex cursor-pointer items-center rounded-lg px-3 py-2 text-sm outline-none data-[highlighted]:bg-gold/15 ${className}`} {...props}><SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText><SelectPrimitive.ItemIndicator className="absolute right-2"><Check size={14} className="text-gold" /></SelectPrimitive.ItemIndicator></SelectPrimitive.Item>
