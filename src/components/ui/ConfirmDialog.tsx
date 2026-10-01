import { Button } from './Button'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from './Dialog'
import type { ReactNode } from 'react'

type ConfirmDialogProps = { trigger: ReactNode; title: string; description: string; confirmLabel?: string; onConfirm: () => void }

export function ConfirmDialog({ trigger, title, description, confirmLabel = 'Confirm', onConfirm }: ConfirmDialogProps) {
  return <Dialog><DialogTrigger asChild>{trigger}</DialogTrigger><DialogContent><DialogTitle className="font-display text-2xl">{title}</DialogTitle><DialogDescription className="mt-2 text-sm text-muted">{description}</DialogDescription><div className="mt-6 flex justify-end gap-2"><DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose><DialogClose asChild><Button onClick={onConfirm}>{confirmLabel}</Button></DialogClose></div></DialogContent></Dialog>
}
