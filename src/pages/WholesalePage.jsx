import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  AlertCircle,
  CheckCircle2,
  CreditCard,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  LogOut,
  Minus,
  Plus,
  Search,
  Send,
  ShieldCheck,
  ShoppingCart,
  Trash2,
  X,
} from 'lucide-react'
import { api, ApiError, formatPrice } from '../lib/api'
import { siteContact } from '../data/site'
import { lockBodyScroll, unlockBodyScroll } from '../hooks/lockBodyScroll'
import Seo from '../components/Seo'

const STORAGE_KEY = 'wholesale_access_pw'
const CHECKOUT_KEY = 'wholesale_checkout'

const money = (cents) => formatPrice((Number(cents) || 0) / 100)

function readStoredPassword() {
  try {
    return sessionStorage.getItem(STORAGE_KEY) || ''
  } catch {
    return ''
  }
}

function storePassword(value) {
  try {
    if (value) sessionStorage.setItem(STORAGE_KEY, value)
    else sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    /* storage unavailable */
  }
}

/* ------------------------------------------------------------------ */
/* Shared bits                                                         */
/* ------------------------------------------------------------------ */

function WhatsAppGlyph({ className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="currentColor" aria-hidden>
      <path d="M19.11 17.53c-.28-.14-1.64-.81-1.9-.9-.25-.1-.44-.14-.62.14-.19.28-.72.9-.88 1.08-.16.19-.33.21-.6.07-.28-.14-1.17-.43-2.23-1.37-.82-.73-1.38-1.64-1.54-1.91-.16-.28-.02-.43.12-.57.13-.13.28-.33.42-.5.14-.16.19-.28.28-.47.1-.19.05-.35-.02-.5-.07-.14-.62-1.49-.85-2.04-.22-.53-.45-.46-.62-.47h-.53c-.19 0-.5.07-.76.35-.26.28-1 1-1 2.43s1.02 2.82 1.17 3.01c.14.19 2 3.05 4.84 4.28.68.29 1.21.47 1.62.6.68.22 1.3.19 1.79.11.55-.08 1.64-.67 1.87-1.32.23-.65.23-1.2.16-1.32-.07-.11-.25-.18-.53-.32z" />
      <path d="M16.02 3C8.84 3 3 8.83 3 16c0 2.29.61 4.45 1.68 6.32L3 29l6.85-1.8A12.93 12.93 0 0 0 16.02 29C23.2 29 29 23.17 29 16S23.2 3 16.02 3zm0 23.67c-2.1 0-4.05-.56-5.74-1.54l-.41-.24-4.06 1.07 1.08-3.96-.27-.41A10.6 10.6 0 0 1 5.35 16c0-5.88 4.79-10.67 10.67-10.67S26.69 10.12 26.69 16s-4.79 10.67-10.67 10.67z" />
    </svg>
  )
}

function availableStock(product) {
  if (product == null) return 0
  if (Number.isFinite(Number(product.stock))) return Math.max(0, Math.trunc(Number(product.stock)))
  return product.inStock ? 9999 : 0
}

function NoHomeBrewBadge({ className = 'h-20 w-20' }) {
  return (
    <img
      src="/images/no-home-brew.jpeg"
      alt="Not home brew, pharmacy manufactured"
      className={`shrink-0 rounded-full object-cover ring-2 ring-white/15 ${className}`}
      draggable={false}
    />
  )
}

function restockWhatsAppHref(product) {
  const ref = product?.catNo ? `[${product.catNo}] ` : ''
  const name = product?.name || product?.catNo || 'an item'
  const text = `Hi Peptide Ops — I'd like to order ${ref}${name}${
    product?.strength ? ` (${product.strength})` : ''
  }, but it's showing out of stock. Can you add it to your next order?`
  return `https://wa.me/${siteContact.whatsapp}?text=${encodeURIComponent(text)}`
}

/** Floating two-tone capsules drifting behind the lock screen. */
const CAPSULES = [
  { top: '12%', left: '8%', size: 46, rot: -25, dur: 9, delay: 0 },
  { top: '24%', left: '82%', size: 64, rot: 35, dur: 11, delay: 1.2 },
  { top: '68%', left: '14%', size: 54, rot: 15, dur: 10, delay: 0.6 },
  { top: '78%', left: '74%', size: 40, rot: -40, dur: 8, delay: 1.8 },
  { top: '46%', left: '90%', size: 34, rot: 10, dur: 12, delay: 0.3 },
  { top: '52%', left: '4%', size: 30, rot: -10, dur: 10, delay: 2.1 },
]

function FloatingCapsules() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {CAPSULES.map((c, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{ top: c.top, left: c.left }}
          initial={{ y: 0, rotate: c.rot, opacity: 0 }}
          animate={{ y: [0, -22, 0], rotate: [c.rot, c.rot + 8, c.rot], opacity: 0.5 }}
          transition={{
            y: { duration: c.dur, repeat: Infinity, ease: 'easeInOut', delay: c.delay },
            rotate: { duration: c.dur, repeat: Infinity, ease: 'easeInOut', delay: c.delay },
            opacity: { duration: 1.2, delay: c.delay * 0.4 },
          }}
        >
          <span
            className="block overflow-hidden rounded-full blur-[1px]"
            style={{ width: c.size, height: c.size / 2.4 }}
          >
            <span className="flex h-full w-full">
              <span className="h-full w-1/2 bg-cyan/50" />
              <span className="h-full w-1/2 bg-white/25" />
            </span>
          </span>
        </motion.div>
      ))}
    </div>
  )
}

function TelegramButton({ url, className = '' }) {
  if (!url) return null
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-2 rounded-xl border border-[#2AABEE]/40 bg-[#2AABEE]/10 px-3.5 py-2 text-[12px] font-semibold text-[#2AABEE] transition hover:bg-[#2AABEE]/20 ${className}`}
    >
      <Send className="h-4 w-4" />
      Telegram
    </a>
  )
}

/* ------------------------------------------------------------------ */
/* Lock screen                                                         */
/* ------------------------------------------------------------------ */

function LockScreen({ onUnlock }) {
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [keyboardOpen, setKeyboardOpen] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    if (busy) return
    const value = password.trim()
    if (!value) {
      setError('Enter the access password.')
      return
    }
    setBusy(true)
    setError('')
    try {
      await onUnlock(value)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not verify. Try again.')
      setBusy(false)
    }
  }

  return (
    <div
      className={`relative bg-navy text-white ${
        keyboardOpen ? 'min-h-dvh overflow-y-auto' : 'h-dvh overflow-hidden'
      }`}
    >
      {/* Decorative layer is fixed so it never adds page scroll or covers inputs on mobile. */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-cyan/15 blur-[120px]" />
        <div className="absolute -bottom-52 right-0 h-[460px] w-[460px] rounded-full bg-cyan/10 blur-[120px]" />
        <FloatingCapsules />
      </div>

      <div
        className={`relative flex justify-center px-5 ${
          keyboardOpen
            ? 'min-h-dvh items-start py-6 pb-[42vh] sm:items-center sm:py-10 sm:pb-10'
            : 'h-dvh items-center py-4 sm:py-8'
        }`}
      >
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          onFocus={() => setKeyboardOpen(true)}
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) setKeyboardOpen(false)
          }}
          className="w-full max-w-md"
        >
          <div className="flex flex-col items-center text-center">
            <img
              src="/images/logo.png"
              alt="Peptide Ops Logistics"
              className="h-10 w-auto object-contain sm:h-16"
              draggable={false}
            />
            <NoHomeBrewBadge className="mt-2.5 h-[4.5rem] w-[4.5rem] sm:mt-4 sm:h-24 sm:w-24" />
            <h1 className="mt-3 font-display text-[22px] font-bold tracking-tight sm:mt-5 sm:text-[30px]">
              Private Access
            </h1>
            <p className="mt-1 max-w-xs text-[11px] leading-snug text-white/55 sm:mt-1.5 sm:text-[13px] sm:leading-relaxed">
              Enter your access password to view the private price list.
            </p>
          </div>

          <form
            onSubmit={submit}
            className="mt-3.5 rounded-2xl border border-white/10 bg-white/[0.05] p-4 shadow-[0_24px_70px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:mt-6 sm:p-6"
          >
            <label className="block">
              <span className="mb-1.5 block text-[11px] font-bold tracking-[0.16em] text-white/70 uppercase">
                Access Password
              </span>
              <div className="relative">
                <input
                  type={show ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value)
                    if (error) setError('')
                  }}
                  onFocus={(event) => {
                    const el = event.currentTarget
                    window.setTimeout(() => {
                      el.scrollIntoView({ block: 'center', behavior: 'smooth' })
                    }, 300)
                  }}
                  placeholder="Enter password"
                  autoComplete="current-password"
                  name="private-access"
                  id="private-access"
                  className="w-full rounded-xl border border-white/15 bg-white/[0.06] px-4 py-3 pr-12 text-[14px] text-white outline-none transition placeholder:text-white/35 focus:border-cyan focus:bg-white/[0.08]"
                />
                <button
                  type="button"
                  onClick={() => setShow((value) => !value)}
                  aria-label={show ? 'Hide password' : 'Show password'}
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-white/55 transition hover:text-white"
                >
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </label>

            <AnimatePresence>
              {error ? (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3 text-[12px] font-medium text-rose-400"
                >
                  {error}
                </motion.p>
              ) : null}
            </AnimatePresence>

            <button
              type="submit"
              disabled={busy}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-cyan px-4 py-2.5 text-[13px] font-bold tracking-[0.08em] text-navy uppercase transition hover:brightness-110 disabled:opacity-60 sm:mt-5 sm:py-3"
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.2} />
              ) : (
                <Lock className="h-4 w-4" strokeWidth={2.4} />
              )}
              {busy ? 'Unlocking…' : 'Unlock Access'}
            </button>
          </form>

          <p className="mt-3 flex items-center justify-center gap-2 text-[10px] font-medium tracking-[0.04em] text-white/40 sm:mt-5 sm:text-[11px]">
            <ShieldCheck className="h-4 w-4 text-cyan/70" />
            Encrypted private portal · authorised partners only
          </p>
        </motion.div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Catalog                                                             */
/* ------------------------------------------------------------------ */

function Catalog({ categories, config, onLogout }) {
  const navigate = useNavigate()
  const [activeId, setActiveId] = useState(categories[0]?.id || '')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState({}) // id -> { product, qty }
  const [cartOpen, setCartOpen] = useState(false)

  const telegramUrl = config?.telegramUrl || ''

  const active = useMemo(
    () => categories.find((category) => category.id === activeId) || categories[0],
    [categories, activeId],
  )

  const filtered = useMemo(() => {
    const products = active?.products || []
    const term = search.trim().toLowerCase()
    if (!term) return products
    return products.filter((product) =>
      [product.catNo, product.name, product.strength, product.vialSize]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(term)),
    )
  }, [active, search])

  const selectedItems = useMemo(() => Object.values(selected), [selected])
  const selectedCount = selectedItems.reduce((sum, item) => sum + item.qty, 0)
  const orderSubtotal = selectedItems.reduce(
    (sum, item) => sum + (item.product.price || 0) * item.qty,
    0,
  )

  const addToOrder = (product) => {
    const max = availableStock(product)
    if (max < 1) return
    setSelected((prev) => {
      const current = prev[product.id]
      const nextQty = Math.min(current ? current.qty + 1 : 1, max)
      return { ...prev, [product.id]: { product, qty: nextQty } }
    })
  }

  const changeQty = (id, qty) => {
    setSelected((prev) => {
      if (qty <= 0) {
        const next = { ...prev }
        delete next[id]
        return next
      }
      const max = availableStock(prev[id]?.product)
      return { ...prev, [id]: { ...prev[id], qty: Math.min(qty, max) } }
    })
  }

  const removeFromOrder = (id) => {
    setSelected((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
  }

  const goToCheckout = () => {
    if (selectedItems.length === 0) return
    try {
      sessionStorage.setItem(
        CHECKOUT_KEY,
        JSON.stringify({
          items: selectedItems.map((item) => ({ product: item.product, qty: item.qty })),
        }),
      )
    } catch {
      /* storage unavailable */
    }
    navigate('/checkout?from=other')
  }

  const categoryTagline = categories.map((category) => category.name).join(' · ')

  return (
    <div className="min-h-screen bg-navy pb-28 text-white">
      <aside
        aria-label="Not home brew"
        className="pointer-events-none fixed top-[5.75rem] bottom-8 left-2 z-20 hidden w-[5.25rem] flex-col items-center xl:flex xl:left-4 xl:w-24"
      >
        <div className="sticky top-[5.75rem]">
          <NoHomeBrewBadge className="h-[4.75rem] w-[4.75rem] xl:h-[5.5rem] xl:w-[5.5rem]" />
        </div>
      </aside>

      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-white/8 bg-navy/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-4">
          <div className="flex items-center gap-3">
            <img
              src="/images/logo.png"
              alt="Peptide Ops"
              className="h-9 w-auto object-contain sm:h-10"
              draggable={false}
            />
            <div className="hidden sm:block">
              <h1 className="font-display text-[17px] font-bold leading-tight tracking-tight">
                Peptide Ops Logistics
              </h1>
              <p className="text-[11px] text-white/45">{categoryTagline || 'Price list'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <TelegramButton url={telegramUrl} className="hidden sm:inline-flex" />
            <button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-3.5 py-2 text-[12px] font-semibold text-white/80 transition hover:border-white/30 hover:text-white"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-6">
        <div className="mb-5 xl:hidden">
          <NoHomeBrewBadge className="h-16 w-16 sm:h-[4.5rem] sm:w-[4.5rem]" />
        </div>

        {/* Note banner */}
        {config?.note ? (
          <div className="mb-5 flex gap-3 rounded-2xl border border-cyan/25 bg-cyan/[0.06] px-4 py-3.5">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-cyan" />
            <div className="min-w-0">
              <p className="text-[13px] leading-relaxed text-white/80">{config.note}</p>
              {telegramUrl ? (
                <a
                  href={telegramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#2AABEE] transition hover:brightness-110"
                >
                  <Send className="h-3.5 w-3.5" />
                  Join our Telegram for updates
                </a>
              ) : null}
            </div>
          </div>
        ) : null}

        {/* Category tabs */}
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => {
                setActiveId(category.id)
                setSearch('')
              }}
              className={`rounded-full px-4 py-2 text-[13px] font-semibold transition ${
                active?.id === category.id
                  ? 'bg-cyan text-navy shadow-[0_6px_20px_rgba(0,245,212,0.25)]'
                  : 'border border-white/12 bg-white/[0.03] text-white/70 hover:border-white/25 hover:text-white'
              }`}
            >
              {category.name}
              <span
                className={`ml-1.5 ${active?.id === category.id ? 'text-navy/60' : 'text-white/35'}`}
              >
                {(category.products || []).length}
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative mt-5">
          <Search className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-white/40" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name, cat. no or strength…"
            className="w-full rounded-xl border border-white/12 bg-white/[0.04] py-3 pr-4 pl-11 text-[13px] text-white outline-none transition placeholder:text-white/35 focus:border-cyan focus:bg-white/[0.06]"
          />
        </div>

        <p className="mt-4 mb-3 text-[12px] font-medium text-white/45">
          Showing <span className="text-white/80">{filtered.length}</span> of{' '}
          {(active?.products || []).length} products
        </p>

        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/12 bg-white/[0.02] px-6 py-20 text-center">
            <Search className="mx-auto h-6 w-6 text-white/25" />
            <p className="mt-3 font-display text-[15px] font-bold text-white">No products found</p>
            <p className="mt-1.5 text-[13px] text-white/50">Try a different search term.</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-hidden rounded-2xl border border-white/10 md:block">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-white/[0.04] text-[11px] font-bold tracking-[0.12em] text-white/45 uppercase">
                    <th className="px-4 py-3">Cat. No</th>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Strength</th>
                    <th className="px-4 py-3">Vial Size</th>
                    <th className="px-4 py-3 text-right">Price</th>
                    <th className="px-4 py-3 text-right">Cart</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/8 text-[13px]">
                  {filtered.map((product, index) => {
                    const chosen = selected[product.id]
                    return (
                      <tr
                        key={product.id}
                        className={`transition hover:bg-white/[0.04] ${
                          index % 2 ? 'bg-white/[0.012]' : ''
                        } ${availableStock(product) > 0 ? '' : 'opacity-60'}`}
                      >
                        <td className="px-4 py-3 font-mono text-[12px] font-semibold text-cyan">
                          {product.catNo || '—'}
                        </td>
                        <td className="px-4 py-3 font-medium text-white/90">
                          {product.name || '—'}
                        </td>
                        <td className="px-4 py-3 text-white/60">{product.strength || '—'}</td>
                        <td className="px-4 py-3 text-white/60">{product.vialSize || '—'}</td>
                        <td className="px-4 py-3 text-right font-semibold text-white">
                          {formatPrice(product.price)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end">
                            {availableStock(product) > 0 ? (
                              <button
                                type="button"
                                onClick={() => addToOrder(product)}
                                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-bold transition ${
                                  chosen
                                    ? 'bg-cyan/15 text-cyan ring-1 ring-cyan/40'
                                    : 'bg-cyan text-navy hover:brightness-110'
                                }`}
                              >
                                <ShoppingCart className="h-3.5 w-3.5" />
                                {chosen ? `Added (${chosen.qty})` : 'Add to cart'}
                              </button>
                            ) : (
                              <a
                                href={restockWhatsAppHref(product)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/[0.04] px-3 py-1.5 text-[12px] font-semibold text-white/60 transition hover:text-white"
                              >
                                <WhatsAppGlyph className="h-3.5 w-3.5" />
                                Out of stock
                              </a>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="space-y-3 md:hidden">
              {filtered.map((product) => {
                const chosen = selected[product.id]
                return (
                  <div
                    key={product.id}
                    className={`rounded-2xl border border-white/10 bg-white/[0.03] p-4 ${
                      availableStock(product) > 0 ? '' : 'opacity-70'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        {product.catNo ? (
                          <span className="font-mono text-[11px] font-semibold text-cyan">
                            {product.catNo}
                          </span>
                        ) : null}
                        <p className="font-semibold text-white">{product.name || '—'}</p>
                        <p className="mt-0.5 text-[12px] text-white/50">
                          {[product.strength, product.vialSize].filter(Boolean).join(' · ') ||
                            'No specs'}
                        </p>
                      </div>
                      <span className="shrink-0 font-display text-base font-bold text-white">
                        {formatPrice(product.price)}
                      </span>
                    </div>
                    {availableStock(product) > 0 ? (
                      <button
                        type="button"
                        onClick={() => addToOrder(product)}
                        className={`mt-3 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-[13px] font-bold transition ${
                          chosen
                            ? 'bg-cyan/15 text-cyan ring-1 ring-cyan/40'
                            : 'bg-cyan text-navy hover:brightness-110'
                        }`}
                      >
                        <ShoppingCart className="h-4 w-4" />
                        {chosen ? `Added — ${chosen.qty} in cart` : 'Add to cart'}
                      </button>
                    ) : (
                      <a
                        href={restockWhatsAppHref(product)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] py-2.5 text-[13px] font-semibold text-white/70 transition hover:text-white"
                      >
                        <WhatsAppGlyph className="h-4 w-4" />
                        Out of stock — request via WhatsApp
                      </a>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        )}
      </main>

      {/* Floating cart button */}
      <AnimatePresence>
        {selectedItems.length > 0 && !cartOpen ? (
          <motion.button
            type="button"
            onClick={() => setCartOpen(true)}
            aria-label={`Open order — ${selectedCount} item${selectedCount === 1 ? '' : 's'}`}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
            className="fixed right-5 bottom-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-cyan text-navy shadow-[0_12px_34px_rgba(0,245,212,0.4)] transition hover:brightness-110 sm:right-7 sm:bottom-7 sm:h-16 sm:w-16"
          >
            <ShoppingCart className="h-6 w-6" strokeWidth={2} />
            <span className="absolute -top-1 -right-1 flex h-6 min-w-6 items-center justify-center rounded-full bg-navy px-1.5 text-[11px] font-bold text-cyan ring-2 ring-cyan">
              {selectedCount}
            </span>
          </motion.button>
        ) : null}
      </AnimatePresence>

      <OrderDrawer
        open={cartOpen}
        items={selectedItems}
        subtotal={orderSubtotal}
        onClose={() => setCartOpen(false)}
        onChangeQty={changeQty}
        onRemove={removeFromOrder}
        onClear={() => {
          setSelected({})
          setCartOpen(false)
        }}
        onCheckout={goToCheckout}
      />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Order drawer (slides in from the right, like the main store cart)   */
/* ------------------------------------------------------------------ */

function OrderDrawer({ open, items, subtotal, onClose, onChangeQty, onRemove, onClear, onCheckout }) {
  useEffect(() => {
    if (!open) return undefined
    lockBodyScroll()
    const onKey = (event) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      unlockBodyScroll()
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  return createPortal(
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            aria-label="Close order"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-[10050] min-h-[100dvh] bg-black/60 backdrop-blur-[2px]"
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label="Your order"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-y-0 right-0 z-[10060] flex w-[min(100%,42vw)] min-w-[320px] max-w-[460px] flex-col overflow-hidden border-l border-white/10 bg-navy-soft text-white shadow-2xl"
          >
            <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-5 py-4">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan/15 text-cyan">
                  <ShoppingCart className="h-4 w-4" />
                </span>
                <div className="leading-tight">
                  <h2 className="font-display text-[15px] font-bold">Your order</h2>
                  <p className="text-[11px] text-white/45">
                    {items.length} product{items.length === 1 ? '' : 's'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-white/70 transition hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5">
              {items.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center py-10 text-center">
                  <ShoppingCart className="h-8 w-8 text-white/25" />
                  <p className="mt-3 text-[13px] text-white/50">Your order is empty.</p>
                </div>
              ) : (
                <ul className="space-y-3">
                  {items.map((item) => (
                    <li
                      key={item.product.id}
                      className="rounded-2xl border border-white/8 bg-white/[0.03] p-3.5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          {item.product.catNo ? (
                            <span className="font-mono text-[11px] font-semibold text-cyan">
                              {item.product.catNo}
                            </span>
                          ) : null}
                          <p className="truncate text-[13px] font-semibold text-white">
                            {item.product.name || '—'}
                          </p>
                          <p className="mt-0.5 truncate text-[11px] text-white/45">
                            {[item.product.strength, item.product.vialSize]
                              .filter(Boolean)
                              .join(' · ') || 'No specs'}
                          </p>
                        </div>
                        <span className="shrink-0 font-display text-sm font-bold text-white">
                          {formatPrice((item.product.price || 0) * item.qty)}
                        </span>
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1 rounded-lg bg-white/5 p-1">
                          <button
                            type="button"
                            aria-label="Decrease"
                            onClick={() => onChangeQty(item.product.id, item.qty - 1)}
                            className="flex h-7 w-7 items-center justify-center rounded-md text-white/70 transition hover:bg-white/10"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="w-7 text-center text-[13px] font-bold">{item.qty}</span>
                          <button
                            type="button"
                            aria-label="Increase"
                            disabled={item.qty >= availableStock(item.product)}
                            onClick={() => onChangeQty(item.product.id, item.qty + 1)}
                            className="flex h-7 w-7 items-center justify-center rounded-md text-white/70 transition hover:bg-white/10 disabled:opacity-30"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <button
                          type="button"
                          aria-label="Remove"
                          onClick={() => onRemove(item.product.id)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-white/40 transition hover:bg-rose-500/15 hover:text-rose-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {items.length > 0 ? (
              <div className="shrink-0 border-t border-white/10 px-5 py-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-[13px] text-white/55">Subtotal</span>
                  <span className="font-display text-lg font-bold text-cyan">
                    {formatPrice(subtotal)}
                  </span>
                </div>
                <p className="mb-3 text-[11px] text-white/40">
                  Shipping is calculated at checkout from live carrier rates.
                </p>
                <button
                  type="button"
                  onClick={onCheckout}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan px-4 py-3 text-[13px] font-bold tracking-[0.06em] text-navy uppercase transition hover:brightness-110"
                >
                  <CreditCard className="h-5 w-5" />
                  Checkout
                </button>
                <button
                  type="button"
                  onClick={onClear}
                  className="mt-2 w-full rounded-xl border border-white/10 py-2.5 text-[12px] font-semibold text-white/55 transition hover:border-white/25 hover:text-white/80"
                >
                  Clear order
                </button>
              </div>
            ) : null}
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>,
    document.body,
  )
}

/* ------------------------------------------------------------------ */
/* Order result (after Stripe redirect)                                */
/* ------------------------------------------------------------------ */

function ResultScreen({ status, order, onContinue }) {
  const paid = status === 'success'
  return (
    <div className="grid min-h-dvh place-items-center bg-navy px-5 text-white">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-center shadow-2xl"
      >
        <span
          className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${
            paid ? 'bg-cyan/15 text-cyan' : 'bg-rose-500/15 text-rose-400'
          }`}
        >
          {paid ? <CheckCircle2 className="h-8 w-8" /> : <AlertCircle className="h-8 w-8" />}
        </span>
        <h1 className="mt-5 font-display text-2xl font-bold">
          {paid ? 'Payment received' : 'Checkout cancelled'}
        </h1>
        <p className="mt-2 text-[13px] text-white/60">
          {paid
            ? `Thanks for your order${order?.orderNumber ? ` — ${order.orderNumber}` : ''}. We've emailed your receipt${
                order?.contactEmail ? ` to ${order.contactEmail}` : ''
              } and you'll get a tracking link once it ships.`
            : 'Your payment was not completed and you have not been charged. You can review your order and try again.'}
        </p>
        {paid && order ? (
          <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-left text-[13px]">
            <div className="flex items-center justify-between py-1 text-white/60">
              <span>Total paid</span>
              <span className="font-display text-base font-bold text-cyan">
                {money(order.totalCents)}
              </span>
            </div>
          </div>
        ) : null}
        <button
          type="button"
          onClick={onContinue}
          className="mt-6 w-full rounded-xl bg-cyan px-6 py-3 text-[13px] font-bold tracking-[0.06em] text-navy uppercase transition hover:brightness-110"
        >
          {paid ? 'Back to price list' : 'Return to price list'}
        </button>
      </motion.div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function WholesalePage() {
  const [data, setData] = useState(null) // { categories, config }
  const [checking, setChecking] = useState(true)
  const [result, setResult] = useState(null) // { status, order }

  const unlock = async (password) => {
    const res = await api.post('/api/wholesale/unlock', { password })
    storePassword(password)
    setData({ categories: res.categories || [], config: res.config || {} })
    return res
  }

  // Handle return from Stripe Checkout (?checkout=success|cancel).
  // Ref guard: React Strict Mode remounts effects in dev and would confirm twice.
  const confirmStarted = useRef(false)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const checkout = params.get('checkout')
    if (!checkout) return
    const orderId = params.get('orderId')
    const sessionId = params.get('session_id')
    const clean = () => window.history.replaceState({}, '', window.location.pathname)

    if (checkout === 'success' && orderId && sessionId) {
      if (confirmStarted.current) return
      confirmStarted.current = true
      api
        .post('/api/wholesale/checkout/confirm', { orderId, sessionId })
        .then((res) => setResult({ status: 'success', order: res.order }))
        .catch(() => setResult({ status: 'success', order: null }))
        .finally(clean)
    } else {
      setResult({ status: 'cancel', order: null })
      clean()
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    const stored = readStoredPassword()
    if (!stored) {
      setChecking(false)
      return () => {
        cancelled = true
      }
    }
    api
      .post('/api/wholesale/unlock', { password: stored })
      .then((res) => {
        if (!cancelled) setData({ categories: res.categories || [], config: res.config || {} })
      })
      .catch(() => {
        if (!cancelled) storePassword('')
      })
      .finally(() => {
        if (!cancelled) setChecking(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const logout = () => {
    storePassword('')
    setData(null)
  }

  const seo = <Seo title="Private Store" path="/other" noIndex />

  if (result) {
    return (
      <>
        {seo}
        <ResultScreen
          status={result.status}
          order={result.order}
          onContinue={() => setResult(null)}
        />
      </>
    )
  }

  if (checking) {
    return (
      <>
        {seo}
        <div className="grid min-h-screen place-items-center bg-navy">
          <Loader2 className="h-8 w-8 animate-spin text-cyan" />
        </div>
      </>
    )
  }

  if (!data) {
    return (
      <>
        {seo}
        <LockScreen onUnlock={unlock} />
      </>
    )
  }

  return (
    <>
      {seo}
      <Catalog categories={data.categories} config={data.config} onLogout={logout} />
    </>
  )
}
