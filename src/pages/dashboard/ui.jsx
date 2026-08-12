import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import gsap from 'gsap'
import { Inbox, Eye, EyeOff, X } from 'lucide-react'
import { lockBodyScroll, unlockBodyScroll } from '../../hooks/lockBodyScroll'

/** Light entrance for dashboard sections — skips on reduced-motion. */
export function Reveal({ children, className = '', stagger = 0.04, y = 8 }) {
  const ref = useRef(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return undefined
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined

    const kids = Array.from(el.children)
    if (!kids.length) return undefined

    const ctx = gsap.context(() => {
      gsap.fromTo(
        kids,
        { opacity: 0.92, y },
        {
          opacity: 1,
          y: 0,
          duration: 0.28,
          stagger,
          ease: 'power2.out',
          clearProps: 'transform,opacity',
        },
      )
    }, el)

    return () => ctx.revert()
  }, [stagger, y])

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  )
}

export function PageHeading({ title, subtitle, actions }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h1 className="font-display text-xl font-bold tracking-tight text-ink md:text-2xl">
          {title}
        </h1>
        {subtitle ? <p className="mt-1 text-[13px] text-muted">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  )
}

export function Card({ children, className = '', padded = true }) {
  return (
    <section
      className={`rounded-2xl border border-black/6 bg-white shadow-sm ${padded ? 'p-5 md:p-6' : ''} ${className}`}
    >
      {children}
    </section>
  )
}

export function StatCard({ label, value, hint, icon: Icon, tone = 'default' }) {
  const tones = {
    default: 'bg-fog text-ink',
    cyan: 'bg-cyan/15 text-cyan-dim',
    navy: 'bg-navy text-cyan',
    warn: 'bg-amber-100 text-amber-700',
  }

  return (
    <div className="rounded-2xl border border-black/6 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-bold tracking-[0.16em] text-muted uppercase">{label}</p>
        {Icon ? (
          <span
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${tones[tone] || tones.default}`}
          >
            <Icon className="h-4 w-4" strokeWidth={1.9} />
          </span>
        ) : null}
      </div>
      <p className="mt-3 font-display text-2xl font-bold tracking-tight text-ink">{value}</p>
      {hint ? <p className="mt-1 text-[12px] text-muted">{hint}</p> : null}
    </div>
  )
}

const BADGE_TONES = {
  PENDING: 'bg-amber-100 text-amber-700',
  PROCESSING: 'bg-sky-100 text-sky-700',
  SHIPPED: 'bg-cyan/20 text-cyan-dim',
  DELIVERED: 'bg-emerald-100 text-emerald-700',
  CANCELLED: 'bg-rose-100 text-rose-700',
  REFUNDED: 'bg-slate-200 text-slate-700',
  UNPAID: 'bg-amber-100 text-amber-700',
  PAID: 'bg-emerald-100 text-emerald-700',
  ACTIVE: 'bg-emerald-100 text-emerald-700',
  BLOCKED: 'bg-rose-100 text-rose-700',
  ADMIN: 'bg-navy text-cyan',
  USER: 'bg-fog text-muted',
  DELIVERY: 'bg-sky-100 text-sky-700',
  PICKUP: 'bg-violet-100 text-violet-700',
  STRIPE: 'bg-indigo-100 text-indigo-700',
}

export function Badge({ children, tone }) {
  const key = tone || String(children || '').toUpperCase()
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold tracking-[0.1em] uppercase ${
        BADGE_TONES[key] || 'bg-fog text-muted'
      }`}
    >
      {children}
    </span>
  )
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  as: Component = 'button',
  ...props
}) {
  const variants = {
    primary: 'bg-cyan text-navy hover:brightness-105',
    dark: 'bg-ink text-white hover:bg-navy',
    ghost: 'bg-fog text-ink hover:bg-fog-deep',
    outline: 'border border-black/12 bg-white text-ink hover:border-black/25',
    danger: 'bg-rose-600 text-white hover:bg-rose-700',
  }
  const sizes = {
    sm: 'px-3 py-2 text-[12px]',
    md: 'px-4 py-2.5 text-[13px]',
  }

  return (
    <Component
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
        variants[variant]
      } ${sizes[size]} ${className}`}
      {...(Component === 'button' && !props.type ? { type: 'button' } : {})}
      {...props}
    >
      {children}
    </Component>
  )
}

export function Field({ label, hint, error, children, className = '' }) {
  return (
    <label className={`block ${className}`}>
      {label ? (
        <span className="mb-1.5 block text-[12px] font-semibold text-ink">{label}</span>
      ) : null}
      {children}
      {hint && !error ? <span className="mt-1 block text-[11px] text-muted">{hint}</span> : null}
      {error ? <span className="mt-1 block text-[11px] text-rose-600">{error}</span> : null}
    </label>
  )
}

const inputClass =
  'w-full rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-[13px] text-ink outline-none transition placeholder:text-muted/60 focus:border-cyan disabled:bg-fog disabled:text-muted'

export function Input({ className = '', ...props }) {
  return <input className={`${inputClass} ${className}`} {...props} />
}

/** Password input with an eye toggle built in. */
export function PasswordInput({ className = '', ...props }) {
  const [show, setShow] = useState(false)

  return (
    <div className="relative">
      <input
        {...props}
        type={show ? 'text' : 'password'}
        className={`${inputClass} pr-11 ${className}`}
      />
      <button
        type="button"
        onClick={() => setShow((value) => !value)}
        aria-label={show ? 'Hide password' : 'Show password'}
        className="absolute top-1/2 right-3 -translate-y-1/2 text-muted transition hover:text-ink"
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  )
}

export function Textarea({ className = '', rows = 4, ...props }) {
  return <textarea rows={rows} className={`${inputClass} resize-y ${className}`} {...props} />
}

export function Select({ className = '', children, ...props }) {
  return (
    <select className={`${inputClass} ${className}`} {...props}>
      {children}
    </select>
  )
}

export function Toggle({ checked, onChange, label, description, disabled }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-black/6 bg-fog px-4 py-3.5">
      <div className="min-w-0">
        <p className="text-[13px] font-semibold text-ink">{label}</p>
        {description ? <p className="mt-0.5 text-[12px] text-muted">{description}</p> : null}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition disabled:opacity-50 ${
          checked ? 'bg-cyan' : 'bg-black/15'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  )
}

export function EmptyState({ title, message, action, icon: Icon = Inbox }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-black/12 bg-white px-6 py-14 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-fog text-muted">
        <Icon className="h-5 w-5" strokeWidth={1.7} />
      </span>
      <p className="mt-4 font-display text-[15px] font-bold text-ink">{title}</p>
      {message ? <p className="mt-1.5 max-w-sm text-[13px] text-muted">{message}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  )
}

export function Spinner({ className = 'h-5 w-5' }) {
  return (
    <span
      className={`inline-block animate-spin rounded-full border-2 border-black/10 border-t-cyan ${className}`}
      role="status"
      aria-label="Loading"
    />
  )
}

export function LoadingBlock({ label = 'Loading' }) {
  return (
    <div className="flex min-h-[220px] flex-col items-center justify-center gap-3 py-16">
      <Spinner className="h-7 w-7" />
      <p className="text-[11px] font-bold tracking-[0.18em] text-muted uppercase">{label}</p>
    </div>
  )
}

export function ErrorBlock({ message, onRetry }) {
  return (
    <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-6 text-center">
      <p className="text-[13px] font-semibold text-rose-700">{message}</p>
      {onRetry ? (
        <Button variant="outline" size="sm" className="mt-4" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  )
}

export function Modal({ open, onClose, title, children, footer, actions, size = 'md' }) {
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

  const widths = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-3xl' }
  const footerContent = footer || actions

  return createPortal(
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[10070] flex items-end justify-center p-0 sm:items-center sm:p-5">
          <motion.button
            type="button"
            aria-label="Close dialog"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className={`relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl ${widths[size]}`}
          >
            <div className="flex shrink-0 items-center justify-between border-b border-black/8 px-5 py-4">
              <h2 className="font-display text-[15px] font-bold text-ink">{title}</h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-fog text-ink transition hover:bg-fog-deep"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">{children}</div>
            {footerContent ? (
              <div className="flex shrink-0 flex-wrap justify-end gap-2 border-t border-black/8 px-5 py-4">
                {footerContent}
              </div>
            ) : null}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body,
  )
}

export function formatDate(value, withTime = false) {
  if (!value) return '-'
  const date = new Date(value)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    ...(withTime ? { hour: 'numeric', minute: '2-digit' } : {}),
  })
}
