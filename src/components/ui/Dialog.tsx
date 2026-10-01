import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'

export const Dialog = DialogPrimitive.Root
export const DialogTrigger = DialogPrimitive.Trigger
export const DialogClose = DialogPrimitive.Close
export const DialogContent = ({ className = '', children, ...props }: DialogPrimitive.DialogContentProps) => <DialogPrimitive.Portal><DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-ink/80 backdrop-blur-sm" /><DialogPrimitive.Content className={`fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-auto rounded-2xl border border-gold/30 bg-card p-6 text-warm shadow-2xl ${className}`} {...props}>{children}<DialogPrimitive.Close className="absolute right-4 top-4 rounded-lg p-1 text-muted hover:bg-warm/10 hover:text-warm"><X size={18} /></DialogPrimitive.Close></DialogPrimitive.Content></DialogPrimitive.Portal>
export const DialogTitle = DialogPrimitive.Title
export const DialogDescription = DialogPrimitive.Description
