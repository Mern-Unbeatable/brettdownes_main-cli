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

  const isNarrow = () => window.matchMedia('(max-width: 1023px)').matches

  const layoutFor = (nextMode) => {
    const narrow = isNarrow()
    if (narrow) {
      // Mobile / tablet: logo on login only (hidden on register)
      const sideBadge =
        nextMode === 'verify'
          ? { badgeLeft: '0%', badgeXPercent: 0, badgeX: 40, badgeVisible: true }
          : { badgeLeft: '50%', badgeXPercent: -50, badgeX: 0, badgeVisible: false }

      // Vertical swap — form height matches content; art gets the rest
      if (nextMode === 'verify') {
        return {
          axis: 'y',
          artTop: 0,
          artH: 40,
          formTop: 40,
          formH: 60,
          seam: 40,
          badgeY: -20,
          radius: '24px 24px 0 0',
          ...sideBadge,
        }
      }
      return {
        axis: 'y',
        artTop: 60,
        artH: 40,
        formTop: 0,
        formH: 60,
        seam: 60,
        badgeY: 0,
        radius: '0 0 24px 24px',
        ...sideBadge,
      }
    }

    // Desktop: horizontal split
    if (nextMode === 'verify') {
      return {
        axis: 'x',
        artLeft: 0,
        formLeft: 42,
        artW: 42,
        formW: 58,
        seam: 42,
        badgeY: 0,
        radius: '48px',
      }
    }
    return {
      axis: 'x',
      artLeft: 58,
      formLeft: 0,
      artW: 42,
      formW: 58,
      seam: 58,
      badgeY: -100,
      radius: '48px',
    }
  }

  const panelProps = (L) => {
    if (L.axis === 'y') {
      return {
        art: { top: `${L.artTop}%`, height: `${L.artH}%`, left: '0%', width: '100%' },
        form: {
          top: `${L.formTop}%`,
          height: `${L.formH}%`,
          left: '0%',
          width: '100%',
          borderRadius: L.radius,
        },
        seam: { top: `${L.seam}%`, left: '0%', width: '100%', height: '1px' },
        badge: {
          left: L.badgeLeft ?? '50%',
          top: `${L.seam}%`,
          xPercent: L.badgeXPercent ?? -50,
          yPercent: -50,
          x: L.badgeX ?? 0,
          y: L.badgeY,
          autoAlpha: L.badgeVisible === false ? 0 : 1,
        },
      }
    }
    return {
      art: { left: `${L.artLeft}%`, width: `${L.artW}%`, top: '0%', height: '100%' },
      form: {
        left: `${L.formLeft}%`,
        width: `${L.formW}%`,
        top: '0%',
        height: '100%',
        borderRadius: L.radius,
      },
      seam: { left: `${L.seam}%`, top: '0%', width: '1px', height: '100%' },
      badge: {
        left: `${L.seam}%`,
        top: '50%',
        xPercent: -50,
        yPercent: -50,
        x: 0,
        y: L.badgeY,
        autoAlpha: 1,
      },
    }
  }

  const applyLayout = (nextMode, animate, { onMid, onDone } = {}) => {
    const art = artRef.current
    const form = formRef.current
    const badge = badgeRef.current
    const seam = seamRef.current
    if (!art || !form || !badge || !seam) return

    const L = layoutFor(nextMode)
    const P = panelProps(L)
    const content = form.querySelector('[data-gate-content]')
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (!animate || reduce) {
      gsap.set(art, P.art)
      gsap.set(form, P.form)
      gsap.set(seam, P.seam)
      gsap.set(badge, { ...P.badge, scale: 1, rotationY: 0 })
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

    const narrow = isNarrow()
    const badgeTween = narrow
      ? { ...P.badge, scale: toRegister ? 0.85 : 1.06, duration: 0.5, ease: 'power2.inOut' }
      : { ...P.badge, scale: 1.06, duration: 0.7, ease: 'power3.inOut' }

    tl.to(art, { ...P.art, duration: 0.7 }, 0.12)
      .to(form, { ...P.form, duration: 0.7 }, 0.12)
      .to(seam, { ...P.seam, duration: 0.7 }, 0.12)
      .to(badge, badgeTween, 0.12)

    if (!narrow || !toRegister) {
      tl.to(badge, { scale: 1, duration: 0.3, ease: 'back.out(1.5)' }, 0.55)
    }

    tl.add(() => {
      onMid?.()
    }).add(() => {
      const nextContent = form.querySelector('[data-gate-content]')
      if (nextContent) {
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
    applyLayout(modeRef.current, false)

    const root = rootRef.current
    if (!root) return undefined

    const onResize = () => {
      if (animating.current) return
      applyLayout(modeRef.current, false)
    }
    window.addEventListener('resize', onResize)

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return () => window.removeEventListener('resize', onResize)
    }

    const badgePos = panelProps(layoutFor(modeRef.current)).badge
    const ctx = gsap.context(() => {
      gsap.fromTo(
        root.querySelectorAll('[data-gate-enter]'),
        { opacity: 0, y: 18 },
        { opacity: 1, y: 0, duration: 0.7, stagger: 0.06, ease: 'power3.out', delay: 0.08 },
      )
      gsap.fromTo(
        badgeRef.current,
        { scale: 0.65, opacity: 0, ...badgePos },
        {
          scale: 1,
          opacity: 1,
          ...badgePos,
          duration: 0.8,
          ease: 'back.out(1.5)',
          delay: 0.2,
        },
      )
    }, root)

    return () => {
      window.removeEventListener('resize', onResize)
      ctx.revert()
    }
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
      className={`mx-auto flex h-full w-full min-w-0 max-w-xl flex-col justify-start px-3 text-left sm:px-6 lg:justify-center lg:px-12 lg:py-8 ${
        mode === 'register' ? 'pt-3 pb-4 sm:pt-4 sm:pb-5' : 'pt-4 pb-4 sm:pt-5 sm:pb-5'
      }`}
    >
      {mode === 'verify' ? (
        <>
          <div
            data-gate-enter
            className="mb-2 w-full rounded-xl border border-white/20 bg-white/5 p-2.5 text-left sm:mb-4 sm:rounded-2xl sm:p-4"
          >
            <p className="font-display text-[8px] font-bold tracking-[0.18em] text-white uppercase sm:text-[11px]">
              Registration Notice
            </p>
            <ul className="mt-1.5 space-y-1 sm:mt-2.5 sm:space-y-2">
              {notices.map((item) => (
                <li key={item.title} className="text-[10px] leading-snug text-white sm:text-[13px] sm:leading-relaxed">
                  <span className="font-semibold">{item.title}:</span> {item.text}
                </li>
              ))}
            </ul>
          </div>

          <h1
            data-gate-enter
            className="font-display text-[16px] font-bold tracking-tight text-white uppercase sm:text-[24px] lg:text-[36px]"
          >
            Portal Verification
          </h1>
          <p data-gate-enter className="mt-0.5 max-w-md text-[10px] leading-snug text-white sm:mt-1.5 sm:text-[13px] lg:text-sm">
            Enter your approved research email to unlock the Peptide Ops catalog.
          </p>

          <form data-gate-enter onSubmit={handleVerify} className="mt-2 w-full space-y-2 sm:mt-5 sm:space-y-3">
            <label className="block">
              <span className="mb-0.5 block text-[8px] font-bold tracking-[0.18em] text-white uppercase sm:mb-1.5 sm:text-[10px]">
                Approved Email Address
              </span>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@lab-institution.com"
                className="gate-input w-full rounded-xl border border-white/20 bg-white/[0.06] px-3 py-2 text-[13px] outline-none transition placeholder:text-white/40 focus:border-white/50 focus:bg-white/[0.08] sm:px-4 sm:py-3.5 sm:text-sm"
              />
            </label>
            <label className="block">
              <span className="mb-0.5 block text-[8px] font-bold tracking-[0.18em] text-white uppercase sm:mb-1.5 sm:text-[10px]">
                Password
              </span>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="gate-input w-full rounded-xl border border-white/20 bg-white/[0.06] px-3 py-2 pr-11 text-[13px] outline-none transition placeholder:text-white/40 focus:border-white/50 focus:bg-white/[0.08] sm:px-4 sm:py-3.5 sm:pr-12 sm:text-sm"
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
            {error ? <p className="text-[12px] text-white sm:text-sm">{error}</p> : null}
            <button
              type="submit"
              disabled={busy}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan px-4 py-2 text-[11px] font-bold tracking-[0.08em] text-navy uppercase transition hover:brightness-110 disabled:opacity-60 sm:py-3.5 sm:text-sm"
            >
              <Lock className="h-4 w-4" strokeWidth={2.2} />
              {busy ? 'Verifying…' : 'Verify & Enter'}
            </button>
            <button
              type="button"
              onClick={() => swapTo('register')}
              className="w-full rounded-xl border border-white/35 bg-transparent px-4 py-2 text-[11px] font-semibold tracking-[0.06em] text-white uppercase transition hover:border-white hover:bg-white/10 sm:py-3.5 sm:text-sm"
            >
              Register New Account
            </button>
          </form>
        </>
      ) : (
        <>
          <p
            data-gate-enter
            className="font-display text-[8px] font-bold tracking-[0.18em] text-white uppercase sm:text-[11px]"
          >
            Secure Onboarding
          </p>
          <h1
            data-gate-enter
            className="mt-0.5 font-display text-[16px] font-bold tracking-tight text-white uppercase sm:mt-2 sm:text-[24px] lg:text-[38px]"
          >
            Account Registration
          </h1>
          <p data-gate-enter className="mt-0.5 max-w-md text-[10px] leading-snug text-white sm:mt-2 sm:text-[13px] lg:text-sm">
            Submit your credentials for same-day verification review.
          </p>

          {submitted ? (
            <div
              data-gate-enter
              className="mt-4 w-full rounded-2xl border border-white/25 bg-white/5 p-3 text-left sm:mt-8 sm:p-5"
            >
              <ShieldCheck className="h-6 w-6 text-white sm:h-8 sm:w-8" />
              <p className="mt-2 font-display text-sm font-bold text-white uppercase sm:mt-3 sm:text-lg">
                Registration received
              </p>
              <p className="mt-1.5 text-[11px] text-white sm:text-sm">
                We will confirm your access shortly. You can return to verification once approved.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSubmitted(false)
                  swapTo('verify')
                }}
                className="mt-3 text-[11px] font-semibold text-white underline underline-offset-2 sm:mt-5 sm:text-sm"
              >
                Return to login
              </button>
            </div>
          ) : (
            <form data-gate-enter onSubmit={handleRegister} className="mt-1.5 w-full space-y-1.5 sm:mt-6 sm:space-y-3">
              <label className="block">
                <span className="mb-0.5 block text-[8px] font-bold tracking-[0.18em] text-white uppercase sm:mb-1.5 sm:text-[10px]">
                  01 — Company / Institution Name
                </span>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Laboratory, LLC, or Individual Research Identity"
                  className="gate-input w-full rounded-xl border border-white/20 bg-white/[0.06] px-3 py-2 text-[13px] outline-none transition placeholder:text-white/40 focus:border-white/50 sm:px-4 sm:py-3.5 sm:text-sm"
                />
              </label>
              <label className="block">
                <span className="mb-0.5 block text-[8px] font-bold tracking-[0.18em] text-white uppercase sm:mb-1.5 sm:text-[10px]">
                  02 — Institutional Email
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@lab-institution.com"
                  className="gate-input w-full rounded-xl border border-white/20 bg-white/[0.06] px-3 py-2 text-[13px] outline-none transition placeholder:text-white/40 focus:border-white/50 sm:px-4 sm:py-3.5 sm:text-sm"
                />
              </label>
              <label className="block">
                <span className="mb-0.5 block text-[8px] font-bold tracking-[0.18em] text-white uppercase sm:mb-1.5 sm:text-[10px]">
                  03 — Password
                </span>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a secure password"
                    className="gate-input w-full rounded-xl border border-white/20 bg-white/[0.06] px-3 py-2 pr-11 text-[13px] outline-none transition placeholder:text-white/40 focus:border-white/50 sm:px-4 sm:py-3.5 sm:pr-12 sm:text-sm"
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
                <span className="mb-0.5 block text-[8px] font-bold tracking-[0.18em] text-white uppercase sm:mb-1.5 sm:text-[10px]">
                  04 — Intended Evaluation Framework
                </span>
                <textarea
                  rows={2}
                  value={framework}
                  onChange={(e) => setFramework(e.target.value)}
                  placeholder="Briefly describe your research protocol or intended use."
                  className="gate-input max-h-[52px] w-full resize-none rounded-xl border border-white/20 bg-white/[0.06] px-3 py-2 text-[13px] outline-none transition placeholder:text-white/40 focus:border-white/50 sm:max-h-none sm:px-4 sm:py-3.5 sm:text-sm"
                />
              </label>
              {error ? <p className="text-[12px] text-white sm:text-sm">{error}</p> : null}
              <button
                type="submit"
                disabled={busy}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan px-4 py-2 text-[11px] font-bold tracking-[0.08em] text-navy uppercase transition hover:brightness-110 disabled:opacity-60 sm:py-3.5 sm:text-sm"
              >
                <Sparkles className="h-4 w-4" strokeWidth={2.2} />
                {busy ? 'Submitting…' : 'Submit Registration'}
              </button>
              <button
                type="button"
                onClick={() => swapTo('verify')}
                className="w-full rounded-xl border border-white/35 bg-transparent px-4 py-2 text-[11px] font-semibold tracking-[0.06em] text-white uppercase transition hover:border-white hover:bg-white/10 sm:py-3.5 sm:text-sm"
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
      className="fixed inset-0 z-[12000] overflow-hidden overscroll-none bg-white px-2 pt-2 pb-2 sm:px-3 sm:pt-3 sm:pb-3 md:px-4 md:pt-4 md:pb-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="gatekeeper-title"
    >
      <div className="relative isolate mx-auto flex h-full w-full max-w-12xl overflow-hidden rounded-[22px] bg-white sm:rounded-[28px] md:rounded-[36px] lg:rounded-[44px]">
        <div ref={stageRef} className="relative h-full w-full overflow-hidden bg-white [perspective:1200px]">
          <div
            ref={artRef}
            className="absolute z-0 overflow-hidden bg-white"
            style={{ left: '0%', width: '42%', top: '0%', height: '100%' }}
          >
            <div
              className={`relative flex h-full flex-col overflow-hidden px-4 py-3 sm:px-6 sm:py-5 lg:px-8 lg:py-12 xl:px-12 ${
                mode === 'register' ? 'justify-start gap-2 lg:justify-between' : 'justify-between'
              }`}
            >
              <div
                data-gate-enter
                className={`relative z-[1] shrink-0 ${mode === 'register' ? 'pt-1' : ''}`}
              >
                <p className="font-display text-[9px] font-bold tracking-[0.22em] text-cyan-dim uppercase sm:text-[10px] lg:text-[11px]">
                  Peptide Ops
                </p>
                <h2
                  className={`mt-1 max-w-sm font-display leading-[1.05] font-bold tracking-tight text-ink sm:mt-2 lg:text-[36px] xl:text-[42px] ${
                    mode === 'verify'
                      ? 'text-[28px] sm:text-[34px]'
                      : 'text-[18px] sm:text-[26px] lg:text-[36px]'
                  }`}
                >
                  {mode === 'verify' ? 'Welcome.' : 'Join the network.'}
                </h2>
                <p
                  className={`mt-1 max-w-sm leading-snug text-muted sm:mt-2 lg:mt-3 lg:text-sm ${
                    mode === 'verify' ? 'text-[10px] sm:text-[12px]' : 'text-[10px] sm:text-[12px]'
                  }`}
                >
                  {mode === 'verify'
                    ? 'Research-grade peptides with verified purity, batch documentation, and secure portal access.'
                    : 'Create a verified research account to request compounds and track approvals.'}
                </p>
              </div>

              <div
                data-gate-enter
                className={`relative z-[1] mx-auto flex min-h-0 w-full flex-1 items-center justify-center lg:my-4 ${
                  mode === 'register' ? 'max-w-[150px] sm:max-w-[240px] lg:max-w-[440px]' : 'max-w-[180px] sm:max-w-[280px] lg:max-w-[440px]'
                }`}
              >
                <VaccineIllustration className="h-auto max-h-full w-full object-contain float-soft" />
              </div>

              <div data-gate-enter className="relative z-[1] hidden items-center gap-3 text-muted lg:flex">
                <span className="h-px flex-1 bg-black/10" />
                <span className="text-[10px] font-bold tracking-[0.24em] uppercase">Secure Portal</span>
                <span className="h-px flex-1 bg-black/10" />
              </div>
            </div>
          </div>

          <div
            ref={formRef}
            className="absolute z-[1] overflow-hidden bg-[#141a22] shadow-[0_-8px_30px_rgba(0,0,0,0.1)] lg:shadow-[-12px_0_40px_rgba(0,0,0,0.12)]"
            style={{ left: '42%', width: '58%', top: '0%', height: '100%', borderRadius: '48px' }}
          >
            <h2 id="gatekeeper-title" className="sr-only">
              Secure Portal Access
            </h2>
            <div className="gate-scroll h-full overflow-x-hidden overflow-y-auto overscroll-contain">
              {formInner}
            </div>
          </div>

          <div
            ref={seamRef}
            className="pointer-events-none absolute z-10 bg-gradient-to-r from-transparent via-cyan/50 to-transparent lg:bg-gradient-to-b lg:via-cyan/60"
            style={{ left: '42%', top: '0%', width: '1px', height: '100%' }}
          />
          <div
            ref={badgeRef}
            className="pointer-events-none absolute z-20"
            style={{ left: '42%', top: '50%' }}
          >
            <div className="flex h-[52px] w-[52px] items-center justify-center rounded-[12px] border border-white/15 bg-[#141A22] shadow-[0_0_0_3px_#fff,0_6px_16px_rgba(0,0,0,0.25)] rotate-45 sm:h-[72px] sm:w-[72px] sm:rounded-[18px] sm:shadow-[0_0_0_4px_#fff,0_10px_24px_rgba(0,0,0,0.28)] lg:h-[120px] lg:w-[120px] lg:rounded-[30px] lg:shadow-[0_0_0_8px_#fff,0_16px_48px_rgba(0,0,0,0.28)]">
              <div className="-rotate-45 overflow-hidden rounded-md sm:rounded-lg lg:rounded-2xl">
                <img
                  src="/images/logo.png"
                  alt="Peptide Ops"
                  className="h-9 w-9 object-cover object-[50%_28%] sm:h-12 sm:w-12 lg:h-[72px] lg:w-[72px]"
                  draggable={false}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
