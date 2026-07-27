import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Link, useLocation } from 'react-router-dom'
import { X } from 'lucide-react'
import { bulkRewards, siteContact } from '../data/site'
import { lockBodyScroll, unlockBodyScroll } from '../hooks/lockBodyScroll'

function whatsappHref() {
  return `https://wa.me/${siteContact.whatsapp}?text=${encodeURIComponent(siteContact.whatsappMessage)}`
}

export default function PromoModal() {
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)
  const isHome = pathname === '/'

  useEffect(() => {
    if (!isHome) {
      setOpen(false)
      return undefined
    }

    const t = window.setTimeout(() => setOpen(true), 3000)
    return () => window.clearTimeout(t)
  }, [isHome, pathname])

  const dismiss = () => setOpen(false)

  useEffect(() => {
    if (!open) return undefined

    lockBodyScroll()
    const onKey = (e) => {
      if (e.key === 'Escape') dismiss()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      unlockBodyScroll()
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  if (!isHome) return null

  return createPortal(
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            aria-label="Close promotions"
            className="fixed inset-0 z-[10070] bg-navy/45 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            onClick={dismiss}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="promo-modal-title"
            className="fixed inset-0 z-[10080] flex items-center justify-center p-4 sm:p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              className="relative w-full max-w-[560px] overflow-hidden rounded-[24px] border border-black/6 bg-white shadow-[0_24px_80px_rgba(5,11,20,0.22)] sm:max-w-[640px] md:max-w-[720px]"
              initial={{ opacity: 0, y: 28, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              transition={{ type: 'tween', duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(0,245,212,0.1),_transparent_55%)]" />

              <button
                type="button"
                onClick={dismiss}
                className="absolute top-3.5 right-3.5 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-fog text-ink transition hover:bg-fog-deep"
                aria-label="Close"
              >
                <X className="h-4 w-4" strokeWidth={2} />
              </button>

              <div className="relative px-5 pt-8 pb-6 sm:px-8 sm:pt-10 sm:pb-8 md:px-10">
                <p className="text-center text-[11px] font-bold tracking-[0.28em] text-cyan-dim uppercase">
                  Current promotions
                </p>
                <h2
                  id="promo-modal-title"
                  className="mt-2 text-center font-display text-[24px] font-bold tracking-tight text-ink uppercase sm:text-[28px] md:text-[32px]"
                >
                  Bulk Tier Rewards
                </h2>

                <ul className="mt-6 grid gap-2.5 sm:mt-7 sm:grid-cols-3 sm:gap-3">
                  {bulkRewards.map((tier) => (
                    <li
                      key={tier.save}
                      className="rounded-2xl border border-black/8 bg-fog px-4 py-4 text-center sm:py-5"
                    >
                      <p className="font-display text-xl font-bold tracking-wide text-cyan-dim uppercase sm:text-[22px]">
                        Save {tier.save}
                      </p>
                      <p className="mt-1 text-[11px] font-semibold tracking-[0.12em] text-muted uppercase sm:text-[10px] md:text-[11px]">
                        {tier.detail}
                      </p>
                    </li>
                  ))}
                </ul>

                <p className="mx-auto mt-5 max-w-lg text-center text-sm leading-relaxed text-muted sm:mt-6">
                  Unlock scale discounts automatically across your entire order. Mix &amp; match —
                  no coupon codes required.
                </p>

                <div className="mt-6 grid grid-cols-2 gap-2.5 sm:mx-auto sm:mt-7 sm:max-w-md sm:gap-3">
                  <Link
                    to="/shop"
                    onClick={dismiss}
                    className="inline-flex items-center justify-center rounded-xl bg-cyan px-4 py-3.5 text-sm font-semibold text-navy transition hover:brightness-110"
                  >
                    Order now
                  </Link>
                  <a
                    href={whatsappHref()}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={dismiss}
                    className="inline-flex items-center justify-center rounded-xl border border-black/10 bg-white px-4 py-3.5 text-sm font-semibold text-ink transition hover:border-cyan/50 hover:bg-fog"
                  >
                    WhatsApp
                  </a>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>,
    document.body,
  )
}
