import type { ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'

export function Modal({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{ background: 'rgba(8,5,18,0.75)', backdropFilter: 'blur(4px)' }}
          onClick={onClose}
        >
          <motion.div
            className="card-raised w-full max-w-md p-5"
            initial={{ scale: 0.92, y: 14, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 8, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={title}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-base font-bold" style={{ color: 'var(--gold)' }}>
                {title}
              </h3>
              <button className="btn-ghost btn px-2 py-1" onClick={onClose} aria-label="Fechar">
                ✕
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function SectionTitle({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="font-display text-lg font-bold tracking-wide" style={{ color: 'var(--ink)' }}>
        {children}
      </h2>
      {right}
    </div>
  )
}

export function EmptyState({ icon, text, hint }: { icon: string; text: string; hint: string }) {
  return (
    <div className="card flex flex-col items-center gap-2 px-6 py-10 text-center">
      <div className="text-3xl" aria-hidden>
        {icon}
      </div>
      <p className="font-semibold" style={{ color: 'var(--ink-2)' }}>
        {text}
      </p>
      <p className="text-sm" style={{ color: 'var(--ink-3)' }}>
        {hint}
      </p>
    </div>
  )
}
