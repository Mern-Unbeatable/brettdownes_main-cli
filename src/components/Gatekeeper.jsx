import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import gsap from 'gsap'
import { Eye, EyeOff, Lock, ShieldCheck, Sparkles } from 'lucide-react'
import VaccineIllustration from './VaccineIllustration'
import { lockBodyScroll, unlockBodyScroll } from '../hooks/lockBodyScroll'

const STORAGE_KEY = 'peptideops_gate_ok'

export function isGatePassed() {
  try {
    return sessionStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

function markGatePassed() {
  try {
    sessionStorage.setItem(STORAGE_KEY, '1')
  } catch {
    /* ignore */
  }
}

const notices = [
  {
    title: 'Required Protocol Step',
    text: 'Registration is mandatory for FDA compliance and verified lab access.',
  },
  {
    title: 'Same-Day Approvals',
    text: 'Verification is free and typically cleared within one business day.',
  },
  {
    title: 'No-Spam Guarantee',
    text: 'Your credentials stay encrypted and are never sold or shared.',
  },
]

export default function Gatekeeper({ onPass }) {
  const rootRef = useRef(null)
  const stageRef = useRef(null)
  const artRef = useRef(null)
  const formRef = useRef(null)
  const badgeRef = useRef(null)
  const seamRef = useRef(null)
  const animating = useRef(false)
  const modeRef = useRef('verify')

  const [mode, setMode] = useState('verify')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [company, setCompany] = useState('')
  const [framework, setFramework] = useState('')
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [busy, setBusy] = useState(false)

  modeRef.current = mode

  useEffect(() => {
    lockBodyScroll()
    return () => unlockBodyScroll()
  }, [])

  useLayoutEffect(() => {
    const root = rootRef.current
    if (!root) return undefined
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined

    const ctx = gsap.context(() => {
      gsap.fromTo(
        root.querySelectorAll('[data-gate-enter]'),
        { opacity: 0, y: 18 },
        { opacity: 1, y: 0, duration: 0.7, stagger: 0.06, ease: 'power3.out', delay: 0.08 },
      )
      gsap.fromTo(
        badgeRef.current,
        { scale: 0.65, opacity: 0, xPercent: -50, yPercent: -50, x: 0, y: 0 },
        {
          scale: 1,
          opacity: 1,
          xPercent: -50,
          yPercent: -50,
          x: 0,
          y: 0,
          duration: 0.8,
          ease: 'back.out(1.5)',
          delay: 0.2,
        },
      )
    }, root)

    return () => ctx.revert()
  }, [])

  const layoutFor = (nextMode) => {
    const stage = stageRef.current
    if (!stage) return { artLeft: 0, formLeft: 50, seam: 50 }
    // Verify: art 42% left | form 58% right — Register: form 58% left | art 42% right
    if (nextMode === 'verify') {
      return { artLeft: 0, formLeft: 42, artW: 42, formW: 58, seam: 42 }
    }
    return { artLeft: 58, formLeft: 0, artW: 42, formW: 58, seam: 58 }
  }

  const radius = '48px'

  const applyLayout = (nextMode, animate, { onMid, onDone } = {}) => {
    const art = artRef.current
    const form = formRef.current
    const badge = badgeRef.current
    const seam = seamRef.current
    if (!art || !form || !badge || !seam) return

    const L = layoutFor(nextMode)
    const content = form.querySelector('[data-gate-content]')
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (!animate || reduce) {
      gsap.set(art, { left: `${L.artLeft}%`, width: `${L.artW}%` })
      gsap.set(form, {
        left: `${L.formLeft}%`,
        width: `${L.formW}%`,
        borderRadius: radius,
      })
      gsap.set(seam, { left: `${L.seam}%` })
      gsap.set(badge, {
        left: `${L.seam}%`,
        top: '50%',
        xPercent: -50,
        yPercent: -50,
        x: 0,
        y: nextMode === 'register' ? -100 : 0,
        scale: 1,
        rotationY: 0,
      })
      if (content) gsap.set(content, { autoAlpha: 1, y: 0, clearProps: 'transform' })
      onMid?.()
      onDone?.()
      return
    }

    animating.current = true
    const toRegister = nextMode === 'register'
    const tl = gsap.timeline({
      defaults: { ease: 'power3.inOut' },
      onComplete: () => {
        animating.current = false
        onDone?.()
      },
    })

    // Hide current form content first, then slide panels, then reveal new content
    if (content) {
      tl.to(
        content,
        {
          autoAlpha: 0,
          y: toRegister ? -20 : 20,
          duration: 0.22,
          ease: 'power2.in',
        },
        0,
      )
    }

    tl.to(art, { left: `${L.artLeft}%`, width: `${L.artW}%`, duration: 0.7 }, 0.12)
      .to(
        form,
        {
          left: `${L.formLeft}%`,
          width: `${L.formW}%`,
          borderRadius: radius,
          duration: 0.7,
        },
        0.12,
      )
      .to(seam, { left: `${L.seam}%`, duration: 0.7 }, 0.12)
      .to(
        badge,
        {
          left: `${L.seam}%`,
          top: '50%',
          xPercent: -50,
          yPercent: -50,
          x: 0,
          y: toRegister ? -100 : 0,
          scale: 1.06,
          duration: 0.7,
          ease: 'power3.inOut',
        },
        0.12,
      )
      .to(badge, { scale: 1, duration: 0.3, ease: 'back.out(1.5)' }, 0.55)
      .add(() => {
        onMid?.()
      })
      .add(() => {
        const nextContent = form.querySelector('[data-gate-content]')
        if (nextContent) {
          // Registration enters with a 50px slide-up
          const fromY = toRegister ? 50 : -30
          gsap.fromTo(
            nextContent,
            { autoAlpha: 0, y: fromY },
            {
              autoAlpha: 1,
              y: 0,
              duration: 0.45,
              ease: 'power2.out',
              clearProps: 'transform',
            },
          )
        }
      })
  }

  useLayoutEffect(() => {
    applyLayout('verify', false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const swapTo = (next) => {
    if (next === modeRef.current || animating.current) return
    setError('')
    setSubmitted(false)
    setShowPassword(false)

    applyLayout(next, true, {
      onMid: () => {
        modeRef.current = next
        setMode(next)
      },
    })
  }

  const handleVerify = (e) => {
    e.preventDefault()
    setError('')
    const value = email.trim()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setError('Enter a valid approved email address.')
      return
    }
    if (!password.trim()) {
      setError('Enter your password to continue.')
      return
    }
    setBusy(true)
    window.setTimeout(() => {
      markGatePassed()
      setBusy(false)
      onPass?.()
    }, 480)
  }

  const handleRegister = (e) => {
    e.preventDefault()
    setError('')
    if (!company.trim() || !email.trim() || !password.trim() || !framework.trim()) {
      setError('Complete all registration fields to continue.')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Enter a valid institutional email address.')
      return
    }
    if (password.trim().length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    setBusy(true)
    window.setTimeout(() => {
      setBusy(false)
      setSubmitted(true)
    }, 560)
  }

  const formInner = (
    <div
      data-gate-content
      className="mx-auto flex min-h-full w-full max-w-xl flex-col justify-center px-6 py-8 text-left sm:px-10 lg:px-12"
    >
      {mode === 'verify' ? (
        <>
          <div
            data-gate-enter
            className="mb-5 w-full rounded-2xl border border-white/20 bg-white/5 p-3.5 text-left sm:p-4"
          >
            <p className="font-display text-[11px] font-bold tracking-[0.22em] text-white uppercase">
              Registration Notice
            </p>
            <ul className="mt-2.5 space-y-2">
              {notices.map((item) => (
                <li key={item.title} className="text-[13px] leading-relaxed text-white">
                  <span className="font-semibold">{item.title}:</span> {item.text}
                </li>
              ))}
            </ul>
          </div>

          <h1
            data-gate-enter
            className="font-display text-[26px] font-bold tracking-tight text-white uppercase sm:text-[32px] lg:text-[36px]"
          >
            Portal Verification
          </h1>
          <p data-gate-enter className="mt-1.5 max-w-md text-sm text-white">
            Enter your approved research email to unlock the Peptide Ops catalog.
          </p>

          <form data-gate-enter onSubmit={handleVerify} className="mt-5 w-full space-y-3">
            <label className="block">
              <span className="mb-1.5 block text-[10px] font-bold tracking-[0.2em] text-white uppercase">
                Approved Email Address
              </span>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@lab-institution.com"
                className="w-full rounded-xl border border-white/20 bg-white/[0.06] px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-white/40 focus:border-white/50 focus:bg-white/[0.08]"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[10px] font-bold tracking-[0.2em] text-white uppercase">
                Password
              </span>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full rounded-xl border border-white/20 bg-white/[0.06] px-4 py-3.5 pr-12 text-sm text-white outline-none transition placeholder:text-white/40 focus:border-white/50 focus:bg-white/[0.08]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-white/55 transition hover:text-white"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" strokeWidth={2} />
                  ) : (
                    <Eye className="h-4 w-4" strokeWidth={2} />
                  )}
                </button>
              </div>
            </label>
            {error ? <p className="text-sm text-white">{error}</p> : null}
            <button
              type="submit"
              disabled={busy}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan px-4 py-3.5 text-sm font-bold tracking-[0.08em] text-navy uppercase transition hover:brightness-110 disabled:opacity-60"
            >
              <Lock className="h-4 w-4" strokeWidth={2.2} />
              {busy ? 'Verifying…' : 'Verify & Enter'}
            </button>
            <button
              type="button"
              onClick={() => swapTo('register')}
              className="w-full rounded-xl border border-white/35 bg-transparent px-4 py-3.5 text-sm font-semibold tracking-[0.06em] text-white uppercase transition hover:border-white hover:bg-white/10"
            >
              Register New Account
            </button>
          </form>
        </>
      ) : (
        <>
          <p
            data-gate-enter
            className="font-display text-[11px] font-bold tracking-[0.22em] text-white uppercase"
          >
            Secure Onboarding
          </p>
          <h1
            data-gate-enter
            className="mt-2 font-display text-[28px] font-bold tracking-tight text-white uppercase sm:text-[34px] lg:text-[38px]"
          >
            Account Registration
          </h1>
          <p data-gate-enter className="mt-2 max-w-md text-sm text-white">
            Submit your lab credentials for same-day verification review.
          </p>

          {submitted ? (
            <div
              data-gate-enter
              className="mt-8 w-full rounded-2xl border border-white/25 bg-white/5 p-5 text-left"
            >
              <ShieldCheck className="h-8 w-8 text-white" />
              <p className="mt-3 font-display text-lg font-bold text-white uppercase">
                Registration received
              </p>
              <p className="mt-2 text-sm text-white">
                We will confirm your access shortly. You can return to verification once approved.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSubmitted(false)
                  swapTo('verify')
                }}
                className="mt-5 text-sm font-semibold text-white underline underline-offset-2"
              >
                Return to login
              </button>
            </div>
          ) : (
            <form data-gate-enter onSubmit={handleRegister} className="mt-6 w-full space-y-3">
              <label className="block">
                <span className="mb-1.5 block text-[10px] font-bold tracking-[0.2em] text-white uppercase">
                  01 — Company / Institution Name
                </span>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Laboratory, LLC, or Individual Research Identity"
                  className="w-full rounded-xl border border-white/20 bg-white/[0.06] px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-white/40 focus:border-white/50"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[10px] font-bold tracking-[0.2em] text-white uppercase">
                  02 — Institutional Email
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@lab-institution.com"
                  className="w-full rounded-xl border border-white/20 bg-white/[0.06] px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-white/40 focus:border-white/50"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[10px] font-bold tracking-[0.2em] text-white uppercase">
                  03 — Password
                </span>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a secure password"
                    className="w-full rounded-xl border border-white/20 bg-white/[0.06] px-4 py-3.5 pr-12 text-sm text-white outline-none transition placeholder:text-white/40 focus:border-white/50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute top-1/2 right-3 -translate-y-1/2 text-white/55 transition hover:text-white"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" strokeWidth={2} />
                    ) : (
                      <Eye className="h-4 w-4" strokeWidth={2} />
                    )}
                  </button>
                </div>
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[10px] font-bold tracking-[0.2em] text-white uppercase">
                  04 — Intended Evaluation Framework
                </span>
                <textarea
                  rows={3}
                  value={framework}
                  onChange={(e) => setFramework(e.target.value)}
                  placeholder="Briefly describe your research protocol or intended use."
                  className="w-full resize-none rounded-xl border border-white/20 bg-white/[0.06] px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-white/40 focus:border-white/50"
                />
              </label>
              {error ? <p className="text-sm text-white">{error}</p> : null}
              <button
                type="submit"
                disabled={busy}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan px-4 py-3.5 text-sm font-bold tracking-[0.08em] text-navy uppercase transition hover:brightness-110 disabled:opacity-60"
              >
                <Sparkles className="h-4 w-4" strokeWidth={2.2} />
                {busy ? 'Submitting…' : 'Submit Registration'}
              </button>
              <button
                type="button"
                onClick={() => swapTo('verify')}
                className="w-full rounded-xl border border-white/35 bg-transparent px-4 py-3.5 text-sm font-semibold tracking-[0.06em] text-white uppercase transition hover:border-white hover:bg-white/10"
              >
                Return to Login
              </button>
            </form>
          )}
        </>
      )}
    </div>
  )

  return createPortal(
    <div
      ref={rootRef}
      className="fixed inset-0 z-[12000] overflow-hidden bg-white px-3 pt-3 pb-3 sm:px-4 sm:pt-4 sm:pb-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="gatekeeper-title"
    >
      <div className="relative isolate mx-auto flex h-full w-full max-w-12xl overflow-hidden rounded-[28px] bg-white sm:rounded-[36px] md:rounded-[44px]">
        {/* Desktop split stage */}
        <div ref={stageRef} className="relative hidden h-full w-full bg-white [perspective:1200px] lg:block">
          <div
            ref={artRef}
            className="absolute top-0 bottom-0 z-0 overflow-hidden bg-white"
            style={{ left: '0%', width: '42%' }}
          >
            <div className="relative flex h-full flex-col justify-between overflow-hidden px-8 py-12 xl:px-12">
              <div data-gate-enter className="relative z-[1]">
                <p className="font-display text-[11px] font-bold tracking-[0.28em] text-cyan-dim uppercase">
                  Peptide Ops
                </p>
                <h2 className="mt-3 max-w-sm font-display text-[36px] leading-[1.05] font-bold tracking-tight text-ink xl:text-[42px]">
                  {mode === 'verify' ? 'Welcome.' : 'Join the network.'}
                </h2>
                <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted">
                  {mode === 'verify'
                    ? 'Research-grade peptides with verified purity, batch documentation, and secure portal access.'
                    : 'Create a verified research account to request compounds and track approvals.'}
                </p>
              </div>

              <div data-gate-enter className="relative z-[1] mx-auto my-4 w-full max-w-[440px] flex-1">
                <VaccineIllustration className="h-full w-full max-h-[min(54vh,480px)] float-soft" />
              </div>

              <div data-gate-enter className="relative z-[1] flex items-center gap-3 text-muted">
                <span className="h-px flex-1 bg-black/10" />
                <span className="text-[10px] font-bold tracking-[0.24em] uppercase">Secure Portal</span>
                <span className="h-px flex-1 bg-black/10" />
              </div>
            </div>
          </div>

          <div
            ref={formRef}
            className="absolute top-0 bottom-0 z-[1] overflow-hidden bg-[#141a22] shadow-[-12px_0_40px_rgba(0,0,0,0.12)]"
            style={{ left: '42%', width: '58%', borderRadius: '48px' }}
          >
            <h2 id="gatekeeper-title" className="sr-only">
              Secure Portal Access
            </h2>
            <div className="gate-scroll h-full overflow-y-auto overscroll-contain">
              {formInner}
            </div>
          </div>

          {/* Seam + logo cube */}
          <div
            ref={seamRef}
            className="pointer-events-none absolute top-0 bottom-0 z-10 w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-cyan/60 to-transparent"
            style={{ left: '42%' }}
          />
          <div
            ref={badgeRef}
            className="pointer-events-none absolute top-1/2 z-20"
            style={{ left: '42%' }}
          >
            <div className="flex h-[120px] w-[120px] items-center justify-center rounded-[30px] border border-white/15 bg-[#141A22] shadow-[0_0_0_8px_#fff,0_16px_48px_rgba(0,0,0,0.28)] rotate-45">
              <div className="-rotate-45 overflow-hidden rounded-2xl">
                <img
                  src="/images/logo.png"
                  alt="Peptide Ops"
                  className="h-[72px] w-[72px] object-cover object-[50%_28%]"
                  draggable={false}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Mobile */}
        <div className="relative flex h-full w-full flex-col overflow-y-auto bg-white lg:hidden">
          <div className="relative shrink-0 bg-white px-5 pt-8 pb-4">
            <div className="mb-4 flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-white/15 bg-[#141A22] shadow-[0_0_24px_rgba(0,0,0,0.2)]">
                <img
                  src="/images/logo.png"
                  alt="Peptide Ops"
                  className="h-14 w-14 object-cover object-[50%_28%]"
                  draggable={false}
                />
              </div>
            </div>
            <div className="mx-auto max-w-[260px]">
              <VaccineIllustration className="w-full" />
            </div>
            <p className="mt-3 text-center font-display text-[11px] font-bold tracking-[0.28em] text-cyan-dim uppercase">
              Peptide Ops
            </p>
          </div>
          <div className="flex-1 rounded-t-[28px] bg-[#141a22] shadow-[0_-8px_30px_rgba(0,0,0,0.1)]">
            {formInner}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
