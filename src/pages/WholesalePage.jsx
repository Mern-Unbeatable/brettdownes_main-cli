import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  LogOut,
  Minus,
  Plus,
  Search,
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

function directWhatsAppHref() {
  const text = 'Hi Peptide Ops — I have a wholesale pricing inquiry.'
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

/* ------------------------------------------------------------------ */
/* Lock screen                                                         */
/* ------------------------------------------------------------------ */

function LockScreen({ onUnlock }) {
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

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
    <div className="relative min-h-screen overflow-hidden bg-navy text-white">
      {/* ambient glows */}
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-cyan/15 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-52 right-0 h-[460px] w-[460px] rounded-full bg-cyan/10 blur-[120px]" />
      <FloatingCapsules />

      <div className="relative grid min-h-screen place-items-center px-5 py-16">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-md"
        >
          <div className="flex flex-col items-center text-center">
            <img
              src="/images/logo.png"
              alt="Peptide Ops Logistics"
              className="h-20 w-auto object-contain"
              draggable={false}
            />
            <div className="relative mt-7 flex h-20 w-20 items-center justify-center">
              <span className="absolute inset-0 rounded-full border border-cyan/30" />
              <motion.span
                className="absolute inset-[-10px] rounded-full border border-dashed border-cyan/25"
                animate={{ rotate: 360 }}
                transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
              />
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-cyan/15 text-cyan ring-1 ring-cyan/40">
                <Lock className="h-6 w-6" strokeWidth={2} />
              </span>
            </div>
            <h1 className="mt-6 font-display text-[30px] font-bold tracking-tight">
              Wholesale Access
            </h1>
            <p className="mt-2 max-w-xs text-[13px] leading-relaxed text-white/55">
              Enter your access password to view live, trade-only wholesale pricing.
            </p>
          </div>

          <form
            onSubmit={submit}
            className="mt-8 rounded-2xl border border-white/10 bg-white/[0.05] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.45)] backdrop-blur-xl"
          >
            <label className="block">
              <span className="mb-1.5 block text-[11px] font-bold tracking-[0.16em] text-white/70 uppercase">
                Access Password
              </span>
              <div className="relative">
                <input
                  ref={inputRef}
                  type={show ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value)
                    if (error) setError('')
                  }}
                  placeholder="Enter password"
                  autoComplete="current-password"
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
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-cyan px-4 py-3 text-[13px] font-bold tracking-[0.08em] text-navy uppercase transition hover:brightness-110 disabled:opacity-60"
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.2} />
              ) : (
                <Lock className="h-4 w-4" strokeWidth={2.4} />
              )}
              {busy ? 'Unlocking…' : 'Unlock Access'}
            </button>
          </form>

          <p className="mt-5 flex items-center justify-center gap-2 text-[11px] font-medium tracking-[0.04em] text-white/40">
            <ShieldCheck className="h-4 w-4 text-cyan/70" />
            Encrypted wholesale portal · authorised partners only
          </p>
        </motion.div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Order modal                                                         */
/* ------------------------------------------------------------------ */

function orderLineLabel(product) {
  const bits = [product.name || product.catNo].filter(Boolean)
  const detail = [product.strength, product.vialSize].filter(Boolean).join(', ')
  return detail ? `${bits.join(' ')} — ${detail}` : bits.join(' ')
}

function buildWhatsAppMessage(form, items) {
  const lines = []
  lines.push("Hello Peptide Ops Logistics, I'd like to place a wholesale order.")
  lines.push('')
  lines.push(`Name: ${form.name}`)
  lines.push(`Email: ${form.email}`)
  if (form.phone) lines.push(`Contact: ${form.phone}`)
  lines.push(`Location: ${form.location}`)
  lines.push('')
  lines.push('Items:')
  let total = 0
  items.forEach((item, index) => {
    const lineTotal = (item.product.price || 0) * item.qty
    total += lineTotal
    const ref = item.product.catNo ? `[${item.product.catNo}] ` : ''
    lines.push(
      `${index + 1}. ${ref}${orderLineLabel(item.product)} × ${item.qty} = ${formatPrice(lineTotal)}`,
    )
  })
  lines.push('')
  lines.push(`Estimated total: ${formatPrice(total)}`)
  if (form.message) {
    lines.push('')
    lines.push(`Notes: ${form.message}`)
  }
  return lines.join('\n')
}

function OrderModal({ items, onClose, onChangeQty, onRemove, onSent }) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    message: '',
  })
  const [sent, setSent] = useState(false)
  const [touched, setTouched] = useState(false)

  useEffect(() => {
    lockBodyScroll()
    return () => unlockBodyScroll()
  }, [])

  const total = useMemo(
    () => items.reduce((sum, item) => sum + (item.product.price || 0) * item.qty, 0),
    [items],
  )

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())
  const valid = form.name.trim() && emailValid && form.location.trim() && items.length > 0

  const send = () => {
    setTouched(true)
    if (!valid) return
    const message = buildWhatsAppMessage(
      {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        location: form.location.trim(),
        message: form.message.trim(),
      },
      items,
    )
    const href = `https://wa.me/${siteContact.whatsapp}?text=${encodeURIComponent(message)}`
    window.open(href, '_blank', 'noopener,noreferrer')
    setSent(true)
  }

  const field =
    'w-full rounded-xl border border-white/12 bg-white/[0.05] px-3.5 py-2.5 text-[13px] text-white outline-none transition placeholder:text-white/35 focus:border-cyan'
  const labelCls = 'mb-1 block text-[11px] font-bold tracking-[0.12em] text-white/60 uppercase'

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-5">
      <motion.button
        type="button"
        aria-label="Close"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
        className="relative flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl border border-white/10 bg-navy-soft text-white shadow-2xl sm:rounded-3xl"
      >
        {sent ? (
          <div className="flex flex-col items-center px-6 py-12 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#25D366]/15 text-[#25D366]">
              <CheckCircle2 className="h-8 w-8" />
            </span>
            <h2 className="mt-5 font-display text-xl font-bold">Order sent!</h2>
            <p className="mt-2 max-w-xs text-[13px] text-white/60">
              WhatsApp is opening with your order details pre-filled. Just hit send there to reach
              our team.
            </p>
            <button
              type="button"
              onClick={onSent}
              className="mt-6 rounded-xl bg-cyan px-6 py-2.5 text-[13px] font-bold tracking-[0.06em] text-navy uppercase transition hover:brightness-110"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-5 py-4">
              <div>
                <h2 className="font-display text-[16px] font-bold">Review &amp; send order</h2>
                <p className="text-[12px] text-white/50">We&apos;ll continue on WhatsApp.</p>
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

            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5">
              {/* Items */}
              <div className="space-y-2">
                <p className="text-[11px] font-bold tracking-[0.14em] text-white/50 uppercase">
                  Products ({items.length})
                </p>
                {items.map((item) => (
                  <div
                    key={item.product.id}
                    className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2.5"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold text-white">
                        {item.product.catNo ? (
                          <span className="mr-1.5 font-mono text-[11px] text-cyan">
                            {item.product.catNo}
                          </span>
                        ) : null}
                        {item.product.name || '—'}
                      </p>
                      <p className="truncate text-[11px] text-white/45">
                        {[item.product.strength, item.product.vialSize].filter(Boolean).join(' · ') ||
                          'No specs'}
                        {' · '}
                        {formatPrice(item.product.price)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 rounded-lg bg-white/5 p-1">
                      <button
                        type="button"
                        aria-label="Decrease"
                        onClick={() => onChangeQty(item.product.id, item.qty - 1)}
                        className="flex h-7 w-7 items-center justify-center rounded-md text-white/70 transition hover:bg-white/10"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-6 text-center text-[13px] font-bold">{item.qty}</span>
                      <button
                        type="button"
                        aria-label="Increase"
                        onClick={() => onChangeQty(item.product.id, item.qty + 1)}
                        className="flex h-7 w-7 items-center justify-center rounded-md text-white/70 transition hover:bg-white/10"
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
                ))}
                <div className="flex items-center justify-between px-1 pt-1 text-[13px]">
                  <span className="text-white/55">Estimated total</span>
                  <span className="font-display text-lg font-bold text-cyan">
                    {formatPrice(total)}
                  </span>
                </div>
              </div>

              {/* Details */}
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block sm:col-span-2">
                  <span className={labelCls}>Full name *</span>
                  <input
                    className={field}
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="Your name"
                  />
                  {touched && !form.name.trim() ? (
                    <span className="mt-1 block text-[11px] text-rose-400">
                      Please enter your name.
                    </span>
                  ) : null}
                </label>
                <label className="block">
                  <span className={labelCls}>Email *</span>
                  <input
                    className={field}
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    placeholder="you@email.com"
                  />
                  {touched && !emailValid ? (
                    <span className="mt-1 block text-[11px] text-rose-400">
                      Enter a valid email.
                    </span>
                  ) : null}
                </label>
                <label className="block">
                  <span className={labelCls}>Contact number</span>
                  <input
                    className={field}
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    placeholder="Optional"
                  />
                </label>
                <label className="block sm:col-span-2">
                  <span className={labelCls}>Location *</span>
                  <input
                    className={field}
                    value={form.location}
                    onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                    placeholder="City / country"
                  />
                  {touched && !form.location.trim() ? (
                    <span className="mt-1 block text-[11px] text-rose-400">
                      Please enter your location.
                    </span>
                  ) : null}
                </label>
                <label className="block sm:col-span-2">
                  <span className={labelCls}>Inquiry / message</span>
                  <textarea
                    rows={3}
                    className={`${field} resize-none`}
                    value={form.message}
                    onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                    placeholder="Anything else we should know? (optional)"
                  />
                </label>
              </div>
            </div>

            <div className="shrink-0 border-t border-white/10 px-5 py-4">
              <button
                type="button"
                onClick={send}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-3 text-[13px] font-bold tracking-[0.06em] text-white uppercase transition hover:bg-[#20bd5a] disabled:opacity-60"
              >
                <WhatsAppGlyph className="h-5 w-5" />
                Send order via WhatsApp
              </button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Catalog                                                             */
/* ------------------------------------------------------------------ */

function Catalog({ categories, onLogout }) {
  const [activeId, setActiveId] = useState(categories[0]?.id || '')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState({}) // id -> { product, qty }
  const [orderOpen, setOrderOpen] = useState(false)

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

  const addToOrder = (product) => {
    setSelected((prev) => {
      const current = prev[product.id]
      return { ...prev, [product.id]: { product, qty: current ? current.qty + 1 : 1 } }
    })
  }

  const changeQty = (id, qty) => {
    setSelected((prev) => {
      if (qty <= 0) {
        const next = { ...prev }
        delete next[id]
        return next
      }
      return { ...prev, [id]: { ...prev[id], qty } }
    })
  }

  const removeFromOrder = (id) => {
    setSelected((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
  }

  return (
    <div className="min-h-screen bg-navy pb-28 text-white">
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
                Wholesale Prices
              </h1>
              <p className="text-[11px] text-white/45">Live trade pricing</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={directWhatsAppHref()}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden items-center gap-2 rounded-xl border border-[#25D366]/40 bg-[#25D366]/10 px-3.5 py-2 text-[12px] font-semibold text-[#25D366] transition hover:bg-[#25D366]/20 sm:inline-flex"
            >
              <WhatsAppGlyph className="h-4 w-4" />
              Chat
            </a>
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
                    <th className="px-4 py-3 text-right">Order</th>
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
                        }`}
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
                              {chosen ? `Added (${chosen.qty})` : 'Order'}
                            </button>
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
                    className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
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
                      {chosen ? `Added — ${chosen.qty} in order` : 'Add to order'}
                    </button>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </main>

      {/* Sticky order bar */}
      <AnimatePresence>
        {selectedItems.length > 0 ? (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-navy-soft/95 backdrop-blur-xl"
          >
            <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3.5">
              <div className="flex items-center gap-3">
                <span className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-cyan/15 text-cyan">
                  <ShoppingCart className="h-5 w-5" />
                  <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-cyan px-1 text-[10px] font-bold text-navy">
                    {selectedCount}
                  </span>
                </span>
                <div className="leading-tight">
                  <p className="text-[13px] font-semibold text-white">
                    {selectedItems.length} product{selectedItems.length > 1 ? 's' : ''} selected
                  </p>
                  <button
                    type="button"
                    onClick={() => setSelected({})}
                    className="text-[11px] text-white/45 underline-offset-2 transition hover:text-white/70 hover:underline"
                  >
                    Clear selection
                  </button>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOrderOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-[#25D366] px-5 py-2.5 text-[13px] font-bold tracking-[0.04em] text-white uppercase transition hover:bg-[#20bd5a]"
              >
                <WhatsAppGlyph className="h-5 w-5" />
                <span className="hidden sm:inline">Review &amp; send order</span>
                <span className="sm:hidden">Send order</span>
              </button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {orderOpen ? (
          <OrderModal
            items={selectedItems}
            onClose={() => setOrderOpen(false)}
            onChangeQty={changeQty}
            onRemove={removeFromOrder}
            onSent={() => {
              setOrderOpen(false)
              setSelected({})
            }}
          />
        ) : null}
      </AnimatePresence>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function WholesalePage() {
  const [categories, setCategories] = useState(null)
  const [checking, setChecking] = useState(true)

  const unlock = async (password) => {
    const result = await api.post('/api/wholesale/unlock', { password })
    storePassword(password)
    setCategories(result.categories || [])
    return result
  }

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
      .then((result) => {
        if (!cancelled) setCategories(result.categories || [])
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
    setCategories(null)
  }

  const seo = <Seo title="Wholesale Prices" path="/other" noIndex />

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

  if (!categories) {
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
      <Catalog categories={categories} onLogout={logout} />
    </>
  )
}
