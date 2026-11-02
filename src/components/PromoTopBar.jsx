import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Sparkles, Tag, Truck } from 'lucide-react'
import { api } from '../lib/api'
import { useSettings, useSettingsReady } from '../context/SettingsContext'
import { useShellUi } from '../context/ShellUiContext'
import { buildPromoTickerMessages } from '../utils/promoTicker'

const BAR_HEIGHT_PX = 40
const PX_PER_SECOND = 56
const MOTION = { duration: 0.32, ease: [0.22, 1, 0.36, 1] }
/** Laptop/desktop: static ticker unless there are more than this many promo lines. */
const MARQUEE_MIN_MESSAGES_DESKTOP = 6
const DESKTOP_MEDIA = '(min-width: 1024px)'

function Separator() {
  return <span className="h-1 w-1 shrink-0 rounded-full bg-cyan/50" aria-hidden />
}

/** Free delivery gets its own glowing pill so it stands apart from the discount lines. */
function ShippingItem({ message, showSeparator }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-4 px-3 sm:gap-5 sm:px-4">
      <span className="promo-shipping-pill relative inline-flex items-center gap-2 overflow-hidden rounded-full border border-cyan/50 bg-gradient-to-r from-cyan/25 via-cyan/10 to-cyan/25 py-[3px] pr-3.5 pl-[3px] shadow-[0_0_14px_rgba(0,245,212,0.28)]">
        <span className="flex h-[22px] w-[22px] items-center justify-center rounded-full bg-cyan shadow-[0_0_8px_rgba(0,245,212,0.6)]">
          <Truck className="promo-shipping-truck h-3 w-3 text-navy" strokeWidth={2.6} aria-hidden />
        </span>
        <span className="whitespace-nowrap text-[11px] tracking-[0.06em] uppercase sm:text-[12px]">
          <span className="font-extrabold text-cyan">{message.highlight}</span>{' '}
          <span className="font-semibold text-white">{message.text}</span>
        </span>
      </span>
      {showSeparator ? <Separator /> : null}
    </span>
  )
}

function DiscountItem({ message, showSeparator }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-2.5 px-4 sm:px-5">
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan/15 ring-1 ring-cyan/30">
        <Tag className="h-3.5 w-3.5 text-cyan" strokeWidth={2.2} aria-hidden />
      </span>
      <span className="whitespace-nowrap text-[11px] font-semibold tracking-[0.06em] text-white/95 uppercase sm:text-[12px]">
        {message.text}
      </span>
      {showSeparator ? <Separator /> : null}
    </span>
  )
}

function MessageStrip({ messages }) {
  return (
    <span className="inline-flex shrink-0 items-center whitespace-nowrap">
      {messages.map((message, index) => {
        const Item = message.kind === 'shipping' ? ShippingItem : DiscountItem
        return (
          <Item
            key={`${message.kind}-${message.text}-${index}`}
            message={message}
            showSeparator={index < messages.length - 1}
          />
        )
      })}
    </span>
  )
}

export default function PromoTopBar() {
  const { pathname } = useLocation()
  const settings = useSettings()
  /** null = still fetching; avoids flashing fallback copy before live tiers load */
  const [tiers, setTiers] = useState(null)
  const viewportRef = useRef(null)
  const measureRef = useRef(null)
  const [mode, setMode] = useState('static')
  const [durationSec, setDurationSec] = useState(32)
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(DESKTOP_MEDIA).matches : true,
  )

  const shellUi = useShellUi()
  const overlayOpen = shellUi?.overlayOpen ?? false
  const onStorefront = pathname !== '/'
  const settingsReady = useSettingsReady()
  // Wait for live tiers + settings so the fallback free-delivery copy never flashes
  const tiersReady = tiers !== null && settingsReady
  const barVisible = onStorefront && !overlayOpen && tiersReady

  useEffect(() => {
    api
      .get('/api/discounts/public')
      .then((data) => setTiers(data.tiers || []))
      .catch(() => setTiers([]))
  }, [])

  useEffect(() => {
    const mq = window.matchMedia(DESKTOP_MEDIA)
    const sync = () => setIsDesktop(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  const messages = useMemo(
    () => buildPromoTickerMessages(tiers ?? [], settings.freeShippingThresholdCents),
    [tiers, settings.freeShippingThresholdCents],
  )

  useLayoutEffect(() => {
    if (!onStorefront) return undefined

    const update = () => {
      const probe = measureRef.current
      const viewport = viewportRef.current
      if (!probe || !viewport) return

      const viewportW = viewport.clientWidth
      if (viewportW < 48) return

      const stripW = probe.offsetWidth
      if (stripW <= 0) return

      const overflow = stripW > viewportW + 2
      const scroll = isDesktop
        ? messages.length >= MARQUEE_MIN_MESSAGES_DESKTOP
        : overflow

      setMode(scroll ? 'marquee' : 'static')
      if (scroll) setDurationSec(Math.max(16, stripW / PX_PER_SECOND))
    }

    update()
    const id = window.requestAnimationFrame(update)
    window.addEventListener('resize', update)
    return () => {
      window.cancelAnimationFrame(id)
      window.removeEventListener('resize', update)
    }
  }, [messages, onStorefront, barVisible, isDesktop])

  useEffect(() => {
    const shell = document.getElementById('app-shell')
    const height = barVisible ? BAR_HEIGHT_PX : 0

    document.documentElement.style.setProperty('--site-promo-bar', `${height}px`)

    if (shell) {
      shell.style.transition = 'padding-top 0.32s cubic-bezier(0.22, 1, 0.36, 1)'
      shell.style.paddingTop = barVisible ? `${BAR_HEIGHT_PX}px` : '0px'
    }

    return () => {
      if (!onStorefront) {
        document.documentElement.style.setProperty('--site-promo-bar', '0px')
        if (shell) {
          shell.style.paddingTop = ''
          shell.style.transition = ''
        }
      }
    }
  }, [barVisible, onStorefront])

  if (!onStorefront || typeof document === 'undefined') return null

  return createPortal(
    <>
      <div
        ref={measureRef}
        className="pointer-events-none fixed top-0 -left-[9999px] opacity-0"
        aria-hidden
      >
        <MessageStrip messages={messages} />
      </div>

      <AnimatePresence initial={false}>
        {barVisible ? (
          <motion.div
            key="promo-top-bar"
            className="promo-top-bar fixed inset-x-0 top-0 z-[10040] overflow-hidden border-b border-cyan/30 shadow-[0_4px_24px_rgba(0,245,212,0.1)]"
            style={{ height: BAR_HEIGHT_PX }}
            role="region"
            aria-label="Store promotions"
            initial={{ opacity: 0, y: -BAR_HEIGHT_PX }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -BAR_HEIGHT_PX }}
            transition={MOTION}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-navy via-[#0a1628] to-navy" aria-hidden />
            <div className="promo-top-bar-shimmer absolute inset-0 opacity-35" aria-hidden />
            <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-cyan/60 to-transparent" />

            <div className="relative flex h-full items-stretch">
              <div className="hidden shrink-0 items-center gap-1.5 border-r border-white/10 bg-navy/80 px-3 sm:flex">
                <Sparkles className="h-3.5 w-3.5 text-cyan" strokeWidth={2.5} aria-hidden />
                <span className="text-[9px] font-bold tracking-[0.18em] text-cyan uppercase">
                  Offers
                </span>
              </div>

              <div ref={viewportRef} className="relative min-w-0 flex-1 overflow-hidden">
                {mode === 'marquee' ? (
                  <>
                    <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-[#0a1628] to-transparent sm:w-12" />
                    <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-[#0a1628] to-transparent sm:w-12" />
                    <div className="flex h-full items-center">
                      <div
                        className="promo-marquee-track promo-marquee-track--live flex w-max items-center"
                        style={{ '--promo-marquee-duration': `${durationSec}s` }}
                      >
                        <MessageStrip messages={messages} />
                        <span aria-hidden="true">
                          <MessageStrip messages={messages} />
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex h-full items-center justify-center px-2 sm:px-3">
                    <MessageStrip messages={messages} />
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>,
    document.body,
  )
}
