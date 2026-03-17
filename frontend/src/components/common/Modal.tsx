import React, { useEffect, useRef } from 'react'
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  width?: string
}

export default function Modal({ isOpen, onClose, children, width = 'max-w-md' }: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null)

  useBodyScrollLock(isOpen)

  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    if (!isOpen) {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onCloseRef.current()
      }
    }

    const previousActive = document.activeElement as HTMLElement | null
    requestAnimationFrame(() => dialogRef.current?.focus())
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      previousActive?.focus?.()
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center p-4 sm:p-6">
      <button
        type="button"
        aria-label="ปิดหน้าต่าง"
        className="ui-overlay absolute inset-0"
        onClick={onClose}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        className={`ui-surface-strong ui-pop relative z-10 max-h-[min(88vh,52rem)] sm:max-h-[min(92vh,52rem)] w-full overflow-y-auto overscroll-contain p-4 sm:p-6 md:p-8 ${width}`}
      >
        {children}
      </div>
    </div>
  )
}

