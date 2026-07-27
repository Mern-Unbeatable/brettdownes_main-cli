import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { lockBodyScroll, unlockBodyScroll } from '../hooks/lockBodyScroll'

function syncDrawerToViewport(el) {
  if (!el) return
  const vv = window.visualViewport
  const height = Math.round(vv?.height ?? window.innerHeight)
  const top = Math.round(vv?.offsetTop ?? 0)
  el.style.top = `${top}px`
  el.style.height = `${height}px`
  el.style.bottom = 'auto'
}

export default function SideDrawer({ open, onClose, title, children }) {
  const asideRef = useRef(null)

  useEffect(() => {
    if (!open) return

    lockBodyScroll()

    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)

    return () => {
      unlockBodyScroll()
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  useEffect(() => {
    if (!open) return undefined

    const el = asideRef.current
    const update = () => syncDrawerToViewport(el)

    update()
    const vv = window.visualViewport
    vv?.addEventListener('resize', update)
    vv?.addEventListener('scroll', update)
    window.addEventListener('resize', update)

    return () => {
      vv?.removeEventListener('resize', update)
      vv?.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [open])

  return createPortal(
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            aria-label="Close panel"
            className="fixed inset-0 z-[10050] bg-black/50 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: 'tween', duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            onClick={onClose}
          />
          <motion.aside
            ref={asideRef}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className="fixed top-0 right-0 z-[10060] flex w-[min(100%,40vw)] min-w-[min(100%,300px)] max-w-[520px] flex-col overflow-hidden bg-white shadow-2xl"
            style={{ height: '100dvh' }}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            onAnimationComplete={() => syncDrawerToViewport(asideRef.current)}
          >
            <div className="flex shrink-0 items-center justify-between border-b border-black/8 px-5 py-4 md:px-6">
              <h2 className="font-display text-lg font-semibold tracking-tight text-ink">{title}</h2>
              <button
                type="button"
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-fog text-ink transition hover:bg-fog-deep"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 md:px-6">
              {children}
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>,
    document.body,
  )
}
