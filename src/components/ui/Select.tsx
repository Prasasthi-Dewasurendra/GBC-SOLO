import * as SelectPrimitive from '@radix-ui/react-select'
import { Check, ChevronDown } from 'lucide-react'

export const Select = SelectPrimitive.Root
export const SelectTrigger = ({ className = '', ...props }: SelectPrimitive.SelectTriggerProps) => (
  <SelectPrimitive.Trigger
    className={`inline-flex min-h-10 items-center justify-between gap-3 rounded-lg border border-white/10 bg-[#121212] px-3 text-sm text-[#F5F5F5] focus:outline-none focus:ring-1 focus:ring-white/40 ${className}`}
    {...props}
  >
    <span className="flex-1 text-left">
      <SelectPrimitive.Value />
    </span>
    <ChevronDown size={16} className="text-[#A3A3A3]" />
  </SelectPrimitive.Trigger>
)
export const SelectValue = SelectPrimitive.Value
export const SelectContent = ({ className = '', ...props }: SelectPrimitive.SelectContentProps) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      className={`z-50 overflow-hidden rounded-lg border border-white/10 bg-[#121212] p-1 text-[#F5F5F5] shadow-xl ${className}`}
      position="popper"
      {...props}
    />
  </SelectPrimitive.Portal>
)
export const SelectItem = ({ className = '', children, ...props }: SelectPrimitive.SelectItemProps) => (
  <SelectPrimitive.Item
    className={`relative flex cursor-pointer items-center rounded-md px-3 py-2 text-sm outline-none data-[highlighted]:bg-white/10 ${className}`}
    {...props}
  >
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    <SelectPrimitive.ItemIndicator className="absolute right-2">
      <Check size={14} className="text-[#F5F5F5]" />
    </SelectPrimitive.ItemIndicator>
  </SelectPrimitive.Item>
)
