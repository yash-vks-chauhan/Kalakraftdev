'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ConfirmDialogProps {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  isProcessing?: boolean
  processingLabel?: string
  /**
   * Visual tone of the confirm button.
   * Defaults to "destructive" so existing delete confirmations stay red.
   */
  variant?: 'default' | 'destructive'
  /**
   * Optional icon shown in the dialog header.
   */
  icon?: React.ReactNode
  onConfirm: () => void
  onClose: () => void
}

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isProcessing = false,
  processingLabel,
  variant = 'destructive',
  icon,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!open || typeof document === 'undefined') return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isProcessing) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, isProcessing, onClose])

  if (!mounted || !open || typeof document === 'undefined') {
    return null
  }

  const confirmText = isProcessing ? processingLabel ?? confirmLabel : confirmLabel

  return createPortal(
    <div
      /*
       * pointer-events-auto because this can be raised as a Radix dialog
       * (the mobile account sheet) is closing, and Radix leaves
       * `pointer-events: none` on <body> for a frame or two afterwards —
       * which this portal would otherwise inherit and become unclickable.
       */
      // `animate-in fade-in` was tailwindcss-animate, which this project does
      // not have installed — the dialog was appearing with no motion at all.
      className="pointer-events-auto fixed inset-0 z-[10000] flex animate-fade-in items-center justify-center bg-foreground/45 px-4 backdrop-blur-[2px]"
      onClick={isProcessing ? undefined : onClose}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-description"
        className={cn(
          'w-full max-w-md rounded-lg border bg-background p-6 shadow-2xl',
          'animate-pop-in',
        )}
        onClick={(event) => event.stopPropagation()}
      >
        {icon && (
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-muted text-foreground">
            {icon}
          </div>
        )}
        <h2
          id="confirm-dialog-title"
          className="text-base font-semibold tracking-tight text-foreground sm:text-lg"
        >
          {title}
        </h2>
        <p
          id="confirm-dialog-description"
          className="mt-2 text-sm leading-6 text-muted-foreground"
        >
          {description}
        </p>

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isProcessing}
            className="w-full sm:w-auto"
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={variant === 'destructive' ? 'destructive' : 'default'}
            size="sm"
            onClick={onConfirm}
            disabled={isProcessing}
            className="w-full gap-1.5 sm:w-auto"
          >
            {isProcessing && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {confirmText}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  )
}
