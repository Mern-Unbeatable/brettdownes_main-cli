import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import gsap from 'gsap'
import { Eye, EyeOff, KeyRound, Lock, ShieldCheck, Sparkles } from 'lucide-react'

const STORAGE_KEY = 'peptideops_gate_ok'
const GATE_EMAIL = 'admin@peptideops.com'
const GATE_PASSWORD = 'PeptideOps1'
const APPEAR_DELAY_MS = 1000

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
    text: 'Registration is mandatory for FDA compliance and verified account access.',
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
  const modalRef = useRef(null)
  const artRef = useRef(null)
  const formRef = useRef(null)
  const seamRef = useRef(null)
  const animating = useRef(false)
  const modeRef = useRef('verify')
  const frameHRef = useRef(0)
  const frameWRef = useRef(0)
  const panelPxRef = useRef(null)
  const topPadLockedRef = useRef(false)

  const [visible, setVisible] = useState(false)
  const [mode, setMode] = useState('verify')
  const [email, setEmail] = useState(GATE_EMAIL)
  const [password, setPassword] = useState(GATE_PASSWORD)
  const [showPassword, setShowPassword] = useState(false)
  const [company, setCompany] = useState('')
  const [framework, setFramework] = useState('')
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [busy, setBusy] = useState(false)

  modeRef.current = mode

  const pagePadY = () => {
    const w = window.innerWidth
    if (w >= 768) return 64
    if (w >= 640) return 40
    return 24
  }

  /**
   * Lock modal pixel height once (and on real width/rotate only).
   * Never resize for keyboard open/close — that causes the shake.
   */
  const applyFrameSize = ({ force = false } = {}) => {
    const modal = modalRef.current
    if (!modal) return

    const w = window.innerWidth
    const narrow = w <= 1023
    const avail = Math.min(920, Math.max(420, window.innerHeight - pagePadY()))
    const widthChanged = Math.abs(w - frameWRef.current) > 50

    // Keep the locked size stable through keypad / focus / layout thrash
    if (!force && frameHRef.current && !widthChanged) {
      const h = frameHRef.current
      modal.style.setProperty('height', `${h}px`, 'important')
      modal.style.setProperty('min-height', `${h}px`, 'important')
      modal.style.setProperty('max-height', `${h}px`, 'important')
      document.documentElement.style.setProperty('--gate-frame-h', `${h}px`)
      return
    }

    if (narrow) {
      const h = avail
      // Phone: more welcome room. Tablet: a bit more art so Welcome isn't flush on the form.
      const artRatio = w < 640 ? 0.34 : 0.30
      const artH = Math.round(h * artRatio)
      frameHRef.current = h
      frameWRef.current = w
      panelPxRef.current = { artH, formH: h - artH, total: h }
    } else {
      frameHRef.current = avail
      frameWRef.current = w
      panelPxRef.current = null
    }

    const h = frameHRef.current
    modal.style.setProperty('height', `${h}px`, 'important')
    modal.style.setProperty('min-height', `${h}px`, 'important')
    modal.style.setProperty('max-height', `${h}px`, 'important')
    document.documentElement.style.setProperty('--gate-frame-h', `${h}px`)

    if (force || widthChanged || !topPadLockedRef.current) {
      const topPad = Math.max(pagePadY() / 2, Math.round((window.innerHeight - h) / 2))
      document.documentElement.style.setProperty('--gate-top-pad', `${Math.max(8, topPad)}px`)
      topPadLockedRef.current = true
    }
  }

  useEffect(() => {
    const t = window.setTimeout(() => setVisible(true), APPEAR_DELAY_MS)
    return () => window.clearTimeout(t)
  }, [])

  // Freeze the site behind; allow document scroll so the full modal moves (no inner scroll)
  useEffect(() => {
    document.documentElement.dataset.gateLocked = '1'
    window.scrollTo(0, 0)

    const STYLE_ID = 'peptideops-gate-lock-css'
    const ensureLockCss = () => {
      let style = document.getElementById(STYLE_ID)
      if (!style) {
        style = document.createElement('style')
        style.id = STYLE_ID
        document.head.appendChild(style)
      }
      style.textContent = `
html[data-gate-locked="1"] {
  overflow-x: hidden !important;
  overflow-y: hidden !important;
  height: auto !important;
  -webkit-overflow-scrolling: touch;
}
html[data-gate-locked="1"][data-gate-kb="1"] {
  overflow-y: auto !important;
  overscroll-behavior-y: contain;
}
html[data-gate-locked="1"][data-gate-kb="1"] #gatekeeper-root {
  /* Page (external) scroll moves the whole modal — no inner form scrollbar */
  touch-action: pan-y;
}
html[data-gate-locked="1"] body {
  overflow: visible !important;
  height: auto !important;
  min-height: 100% !important;
  padding-right: 0 !important;
  background: #141A22 !important;
}
html[data-gate-locked="1"] #app-shell {
  position: fixed !important;
  inset: 0 !important;
  width: 100% !important;
  height: 100% !important;
  overflow: hidden !important;
  pointer-events: none !important;
  user-select: none !important;
}
html[data-gate-locked="1"] .side-action-dock,
html[data-gate-locked="1"] .faq-category-dock,
html[data-gate-locked="1"] .whatsapp-float,
html[data-gate-locked="1"] .sticky-nav-pill {
  opacity: 0 !important;
  pointer-events: none !important;
  visibility: hidden !important;
}
html[data-gate-locked="1"] #gatekeeper-root {
  display: block !important;
  visibility: visible !important;
  opacity: 1 !important;
  pointer-events: auto !important;
  z-index: 2147483647 !important;
  position: relative !important;
  inset: auto !important;
  top: 0 !important;
  left: 0 !important;
  width: 100% !important;
  height: auto !important;
  min-height: max(100svh, calc(var(--gate-frame-h, 100svh) + var(--gate-kb-pad, 0px))) !important;
  max-width: none !important;
  max-height: none !important;
  overflow: visible !important;
  transform: none !important;
  clip: auto !important;
  clip-path: none !important;
}
`
    }

    const enforceShell = () => {
      const shell = document.getElementById('app-shell')
      if (!shell) return
      shell.setAttribute('inert', '')
      shell.setAttribute('aria-hidden', 'true')
      shell.style.setProperty('position', 'fixed', 'important')
      shell.style.setProperty('inset', '0', 'important')
      shell.style.setProperty('width', '100%', 'important')
      shell.style.setProperty('height', '100%', 'important')
      shell.style.setProperty('overflow', 'hidden', 'important')
      shell.style.setProperty('pointer-events', 'none', 'important')
      shell.style.setProperty('user-select', 'none', 'important')
    }

    const enforceRoot = () => {
      const root = rootRef.current
      if (!root) return
      root.style.setProperty('display', 'block', 'important')
      root.style.setProperty('visibility', 'visible', 'important')
      root.style.setProperty('opacity', '1', 'important')
      root.style.setProperty('pointer-events', 'auto', 'important')
      root.style.setProperty('z-index', '2147483647', 'important')
      root.style.setProperty('position', 'relative', 'important')
      root.style.setProperty('inset', 'auto', 'important')
      root.style.setProperty('top', '0', 'important')
      root.style.setProperty('left', '0', 'important')
      root.style.setProperty('width', '100%', 'important')
      root.style.setProperty('height', 'auto', 'important')
      root.style.setProperty(
        'min-height',
        `max(100svh, calc(var(--gate-frame-h, 100svh) + var(--gate-kb-pad, 0px)))`,
        'important',
      )
      root.style.setProperty('overflow', 'visible', 'important')
      root.style.removeProperty('transform')
      root.style.removeProperty('clip')
      root.style.removeProperty('clip-path')
      root.style.removeProperty('max-height')
    }

    const enforce = () => {
      document.documentElement.dataset.gateLocked = '1'
      // Body must stay scrollable — never apply drawer-open lock here
      document.body.classList.remove('drawer-open')
      document.body.style.paddingRight = ''
      ensureLockCss()
      enforceShell()
      enforceRoot()
    }

    const blockOutside = (e) => {
      const root = rootRef.current
      const target = e.target
      if (root && target instanceof Node && root.contains(target)) return
      e.preventDefault()
      e.stopPropagation()
      e.stopImmediatePropagation()
      enforce()
    }

    const blockKeys = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
      }
    }

    const blockNav = (e) => {
      e.preventDefault()
    }

    // Keypad only toggles page scroll room — never resize/remeasure the modal (prevents shake)
    const setKeyboardPad = (on) => {
      if (!on) {
        delete document.documentElement.dataset.gateKb
        document.documentElement.style.setProperty('--gate-kb-pad', '0px')
        return
      }
      document.documentElement.dataset.gateKb = '1'
      // Enough room to scroll the full modal above the keypad
      document.documentElement.style.setProperty('--gate-kb-pad', '40vh')
    }
    const onFocusIn = (e) => {
      const t = e.target
      if (!(t instanceof HTMLElement)) return
      if (!t.matches('input, textarea, select')) return
      if (!rootRef.current?.contains(t)) return
      if (window.matchMedia('(max-width: 1023px)').matches) setKeyboardPad(true)
    }
    const onFocusOut = () => {
      // Mobile often blurs with null relatedTarget while the keypad opens — wait, then re-check
      window.setTimeout(() => {
        const active = document.activeElement
        if (
          active instanceof HTMLElement &&
          rootRef.current?.contains(active) &&
          active.matches('input, textarea, select')
        ) {
          return
        }
        setKeyboardPad(false)
      }, 80)
    }

    applyFrameSize({ force: true })
    ensureLockCss()
    enforce()
    setKeyboardPad(false)

    const interval = window.setInterval(enforce, 250)

    const events = ['click', 'mousedown', 'mouseup', 'pointerdown', 'pointerup', 'touchstart', 'touchend', 'submit', 'auxclick', 'contextmenu']
    events.forEach((type) => document.addEventListener(type, blockOutside, true))
    window.addEventListener('popstate', blockNav)
    window.addEventListener('keydown', blockKeys, true)
    document.addEventListener('focusin', onFocusIn, true)
    document.addEventListener('focusout', onFocusOut, true)

    return () => {
      delete document.documentElement.dataset.gateLocked
      delete document.documentElement.dataset.gateKb
      document.documentElement.style.removeProperty('--gate-kb-pad')
      document.documentElement.style.removeProperty('--gate-frame-h')
      document.documentElement.style.removeProperty('--gate-top-pad')
      window.clearInterval(interval)
      events.forEach((type) => document.removeEventListener(type, blockOutside, true))
      window.removeEventListener('popstate', blockNav)
      window.removeEventListener('keydown', blockKeys, true)
      document.removeEventListener('focusin', onFocusIn, true)
      document.removeEventListener('focusout', onFocusOut, true)
      document.getElementById(STYLE_ID)?.remove()

      const shell = document.getElementById('app-shell')
      if (shell) {
        shell.removeAttribute('inert')
        shell.removeAttribute('aria-hidden')
        shell.style.removeProperty('position')
        shell.style.removeProperty('inset')
        shell.style.removeProperty('width')
        shell.style.removeProperty('height')
        shell.style.removeProperty('overflow')
        shell.style.removeProperty('pointer-events')
        shell.style.removeProperty('user-select')
      }
    }
  }, [])

  // Keep focus trapped inside the gate overlay
  useEffect(() => {
    if (!visible) return undefined

    const root = rootRef.current
    if (!root) return undefined

    const focusables = () =>
      root.querySelectorAll(
        'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )

    const firstInput = root.querySelector('input, button, textarea')
    // Avoid auto-opening the mobile keyboard (causes extra page scroll)
    if (
      firstInput instanceof HTMLElement &&
      window.matchMedia('(min-width: 1024px)').matches
    ) {
      firstInput.focus({ preventScroll: true })
    }

    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        return
      }
      if (e.key !== 'Tab') return

      const nodes = [...focusables()]
      if (!nodes.length) {
        e.preventDefault()
        return
      }
      const first = nodes[0]
      const last = nodes[nodes.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    root.addEventListener('keydown', onKeyDown)
    return () => root.removeEventListener('keydown', onKeyDown)
  }, [visible])

  const isNarrow = () => window.matchMedia('(max-width: 1023px)').matches

  const layoutFor = (nextMode) => {
    const narrow = isNarrow()
    const px = narrow ? panelPxRef.current : null
    // Reset keeps the login panel layout; only register flips panels
    const loginSide = nextMode !== 'register'

    if (narrow && px) {
      if (loginSide) {
        return {
          axis: 'y',
          unit: 'px',
          artTop: 0,
          artH: px.artH,
          formTop: px.artH,
          formH: px.formH,
          seam: px.artH,
          radius: '24px 24px 0 0',
        }
      }
      return {
        axis: 'y',
        unit: 'px',
        artTop: px.formH,
        artH: px.artH,
        formTop: 0,
        formH: px.formH,
        seam: px.formH,
        radius: '0 0 24px 24px',
      }
    }

    if (narrow) {
      const phone = window.innerWidth < 640
      const artH = phone ? 34 : 30
      const formH = 100 - artH
      if (loginSide) {
        return {
          axis: 'y',
          artTop: 0,
          artH,
          formTop: artH,
          formH,
          seam: artH,
          radius: '24px 24px 0 0',
        }
      }
      return {
        axis: 'y',
        artTop: formH,
        artH,
        formTop: 0,
        formH,
        seam: formH,
        radius: '0 0 24px 24px',
      }
    }

    if (loginSide) {
      return {
        axis: 'x',
        artLeft: 0,
        formLeft: 40,
        artW: 40,
        formW: 60,
        seam: 40,
        radius: '0 28px 28px 0',
      }
    }
    return {
      axis: 'x',
      artLeft: 60,
      formLeft: 0,
      artW: 40,
      formW: 60,
      seam: 60,
      radius: '28px 0 0 28px',
    }
  }

  const panelProps = (L) => {
    if (L.axis === 'y') {
      const u = L.unit === 'px' ? 'px' : '%'
      return {
        art: { top: `${L.artTop}${u}`, height: `${L.artH}${u}`, left: '0%', width: '100%' },
        form: {
          top: `${L.formTop}${u}`,
          height: `${L.formH}${u}`,
          left: '0%',
          width: '100%',
          borderRadius: L.radius,
        },
        seam: { top: `${L.seam}${u}`, left: '0%', width: '100%', height: '1px' },
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
    }
  }

  const applyLayout = (nextMode, animate, { onMid, onDone } = {}) => {
    const art = artRef.current
    const form = formRef.current
    const seam = seamRef.current
    if (!art || !form || !seam) return

    const L = layoutFor(nextMode)
    const P = panelProps(L)
    const content = form.querySelector('[data-gate-content]')
    const welcome = art.querySelector('[data-gate-welcome]')
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (!animate || reduce) {
      gsap.set(art, P.art)
      gsap.set(form, P.form)
      gsap.set(seam, P.seam)
      if (content) gsap.set(content, { autoAlpha: 1, y: 0, clearProps: 'transform' })
      if (welcome) gsap.set(welcome, { autoAlpha: 1, y: 0, clearProps: 'transform' })
      onMid?.()
      onDone?.()
      return
    }

    animating.current = true
    const toRegister = nextMode === 'register'
    const fromRegister = modeRef.current === 'register'
    const panelsMove = fromRegister !== toRegister
    const toReset = nextMode === 'reset'
    const fromReset = modeRef.current === 'reset'
    const tl = gsap.timeline({
      defaults: { ease: 'power3.inOut' },
      onComplete: () => {
        animating.current = false
        onDone?.()
      },
    })

    // Fade out current form + welcome (verify ↔ reset keeps panels still but still animates)
    if (content) {
      tl.to(
        content,
        {
          autoAlpha: 0,
          y: toRegister ? -20 : toReset || fromReset ? 16 : 20,
          duration: 0.28,
          ease: 'power2.in',
        },
        0,
      )
    }
    if (welcome) {
      tl.to(
        welcome,
        {
          autoAlpha: 0,
          y: toRegister ? -12 : 12,
          duration: 0.28,
          ease: 'power2.in',
        },
        0,
      )
    }

    if (panelsMove) {
      tl.to(art, { ...P.art, duration: 0.7 }, 0.12)
        .to(form, { ...P.form, duration: 0.7 }, 0.12)
        .to(seam, { ...P.seam, duration: 0.7 }, 0.12)
    }

    tl.add(() => {
      onMid?.()
    }, panelsMove ? undefined : 0.3).add(() => {
      const nextContent = form.querySelector('[data-gate-content]')
      const nextWelcome = art.querySelector('[data-gate-welcome]')
      const fromY = toRegister ? 40 : toReset ? 28 : fromReset ? -24 : -30

      if (nextContent) {
        gsap.fromTo(
          nextContent,
          { autoAlpha: 0, y: fromY },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.5,
            ease: 'power2.out',
            clearProps: 'transform',
          },
        )
      }
      if (nextWelcome) {
        gsap.fromTo(
          nextWelcome,
          { autoAlpha: 0, y: toRegister ? 20 : -16 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.5,
            ease: 'power2.out',
            clearProps: 'transform',
          },
        )
      }
    })
  }

  useLayoutEffect(() => {
    if (!visible) return undefined

    applyFrameSize({ force: true })
    applyLayout(modeRef.current, false)

    const root = rootRef.current
    const modal = modalRef.current
    if (!root || !modal) return undefined

    const onResize = () => {
      if (animating.current) return
      // Ignore keypad-driven height changes — only real width / rotate
      const w = window.innerWidth
      if (Math.abs(w - frameWRef.current) < 50) return
      applyFrameSize({ force: true })
      applyLayout(modeRef.current, false)
    }
    window.addEventListener('resize', onResize)

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const ctx = gsap.context(() => {
      if (reduce) {
        gsap.set(modal, { autoAlpha: 1, scale: 1, y: 0 })
        return
      }

      gsap.fromTo(
        modal,
        { autoAlpha: 0, scale: 0.94, y: 28 },
        { autoAlpha: 1, scale: 1, y: 0, duration: 0.55, ease: 'power3.out' },
      )
      gsap.fromTo(
        root.querySelectorAll('[data-gate-enter]'),
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.55, stagger: 0.05, ease: 'power3.out', delay: 0.15 },
      )
    }, root)

    return () => {
      window.removeEventListener('resize', onResize)
      ctx.revert()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible])

  const swapTo = (next) => {
    if (next === modeRef.current || animating.current) return
    setError('')
    setSubmitted(false)
    setShowPassword(false)

    // Keep locked frame height — only slide panels (no remeasure / no shake)
    applyLayout(next, true, {
      onMid: () => {
        modeRef.current = next
        if (formRef.current) formRef.current.scrollTop = 0
        if (next === 'register' || next === 'reset') {
          setPassword('')
          if (next === 'register') setEmail('')
        } else {
          setEmail(GATE_EMAIL)
          setPassword(GATE_PASSWORD)
        }
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
    if (
      value.toLowerCase() !== GATE_EMAIL.toLowerCase() ||
      password !== GATE_PASSWORD
    ) {
      setError('Invalid email or password.')
      return
    }
    setBusy(true)
    window.setTimeout(() => {
      markGatePassed()
      setBusy(false)
      onPass?.()
    }, 480)
  }

  const handleReset = (e) => {
    e.preventDefault()
    setError('')
    const value = email.trim()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setError('Enter the approved email linked to your account.')
      return
    }
    setBusy(true)
    window.setTimeout(() => {
      setBusy(false)
      setSubmitted(true)
    }, 560)
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

  const welcomeCopy =
    mode === 'register'
      ? {
          title: 'Join the network',
          text: 'Create a verified research account to request compounds and track approvals.',
        }
      : mode === 'reset'
        ? {
            title: 'Reset access',
            text: 'We will email a secure reset link to your approved research address.',
          }
        : {
            title: 'Welcome',
            text: 'Research-grade peptides with verified purity, select-batch quality testing, and secure portal access.',
          }

  const welcomeInner = (
    <div
      data-gate-welcome
      className="flex h-full flex-col items-center justify-end px-5 pt-1 pb-4 text-center sm:justify-center sm:px-8 sm:pt-3 sm:pb-5 lg:px-10 lg:py-12"
    >
      <div data-gate-enter className="flex flex-col items-center">
        <img
          src="/images/logo.png"
          alt="Peptide Ops"
          className="h-28 w-28 object-contain sm:h-40 sm:w-40 lg:h-56 lg:w-56"
          draggable={false}
        />
        <h2
          id="gatekeeper-title"
          className="mt-1 max-w-xs font-display text-[22px] leading-[1.05] font-bold tracking-tight text-white sm:mt-2 sm:text-[34px] lg:text-[42px]"
        >
          {welcomeCopy.title}
        </h2>
        <p className="mt-1 mb-0.5 max-w-[16rem] text-[11px] leading-snug text-white/65 sm:mt-2 sm:mb-0 sm:max-w-xs sm:text-[13px] sm:leading-relaxed lg:mt-3 lg:text-sm">
          {welcomeCopy.text}
        </p>
      </div>
      <div data-gate-enter className="mt-8 hidden w-full items-center gap-3 text-white/40 lg:flex">
        <span className="h-px flex-1 bg-white/15" />
        <span className="text-[10px] font-bold tracking-[0.24em] uppercase">Secure Portal</span>
        <span className="h-px flex-1 bg-white/15" />
      </div>
    </div>
  )

  const formInner = (
    <div
      data-gate-content
      className="mx-auto box-border flex h-full w-full min-w-0 max-w-xl flex-col justify-center px-4 pt-5 pb-4 text-left sm:px-6 sm:pt-6 sm:pb-5 lg:px-10 lg:py-8"
    >
      {mode === 'verify' ? (
        <>
          <div
            data-gate-enter
            className="mb-1.5 w-full rounded-xl border border-white/15 bg-white/10 p-2 text-left backdrop-blur-sm sm:mb-4 sm:rounded-2xl sm:p-4"
          >
            <p className="font-display text-[8px] font-bold tracking-[0.18em] text-white uppercase sm:text-[11px]">
              Registration Notice
            </p>
            <ul className="mt-1 space-y-0.5 sm:mt-2.5 sm:space-y-2">
              {notices.map((item) => (
                <li key={item.title} className="text-[10px] leading-snug text-white sm:text-[13px] sm:leading-relaxed">
                  <span className="font-semibold">{item.title}:</span> {item.text}
                </li>
              ))}
            </ul>
          </div>

          <h1
            data-gate-enter
            className="font-display text-[15px] font-bold tracking-tight text-white uppercase sm:text-[24px] lg:text-[32px]"
          >
            Portal Verification
          </h1>
          <p data-gate-enter className="mt-0.5 max-w-md text-[10px] leading-snug text-white/80 sm:mt-1.5 sm:text-[13px] lg:text-sm">
            Enter your approved research email to unlock the Peptide Ops catalog.
          </p>

          <form data-gate-enter onSubmit={handleVerify} className="mt-1.5 w-full space-y-1.5 sm:mt-5 sm:space-y-3">
            <label className="block">
              <span className="mb-0.5 block text-[8px] font-bold tracking-[0.18em] text-white uppercase sm:mb-1.5 sm:text-[10px]">
                Approved Email Address
              </span>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@institution.com"
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
              onClick={() => swapTo('reset')}
              className="w-full rounded-xl border border-white/35 bg-transparent px-4 py-2 text-[11px] font-semibold tracking-[0.06em] text-white uppercase transition hover:border-white hover:bg-white/10 sm:py-3.5 sm:text-sm"
            >
              Forgot Password?
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
      ) : mode === 'reset' ? (
        <>
          <div
            data-gate-enter
            className="mb-1.5 w-full rounded-xl border border-white/15 bg-white/10 p-2 text-left backdrop-blur-sm sm:mb-4 sm:rounded-2xl sm:p-4"
          >
            <p className="font-display text-[8px] font-bold tracking-[0.18em] text-white uppercase sm:text-[11px]">
              Password Recovery
            </p>
            <p className="mt-1 text-[10px] leading-snug text-white sm:mt-2 sm:text-[13px] sm:leading-relaxed">
              Enter your approved research email. If an account exists, a secure reset link will be sent within a few
              minutes.
            </p>
          </div>

          <h1
            data-gate-enter
            className="font-display text-[15px] font-bold tracking-tight text-white uppercase sm:text-[24px] lg:text-[32px]"
          >
            Reset Password
          </h1>
          <p data-gate-enter className="mt-0.5 max-w-md text-[10px] leading-snug text-white/80 sm:mt-1.5 sm:text-[13px] lg:text-sm">
            Restore portal access without leaving the verification flow.
          </p>

          {submitted ? (
            <div
              data-gate-enter
              className="mt-4 w-full rounded-2xl border border-white/25 bg-white/5 p-3 text-left sm:mt-8 sm:p-5"
            >
              <ShieldCheck className="h-6 w-6 text-cyan sm:h-8 sm:w-8" />
              <p className="mt-2 font-display text-sm font-bold text-white uppercase sm:mt-3 sm:text-lg">
                Reset link sent
              </p>
              <p className="mt-1.5 text-[11px] text-white/85 sm:text-sm">
                Check <span className="font-semibold text-white">{email.trim() || 'your inbox'}</span> for a secure
                password reset link. It expires in 30 minutes.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSubmitted(false)
                  swapTo('verify')
                }}
                className="mt-3 w-full rounded-xl border border-white/35 bg-transparent px-4 py-2 text-[11px] font-semibold tracking-[0.06em] text-white uppercase transition hover:border-white hover:bg-white/10 sm:mt-5 sm:py-3.5 sm:text-sm"
              >
                Return to Login
              </button>
            </div>
          ) : (
            <form data-gate-enter onSubmit={handleReset} className="mt-1.5 w-full space-y-1.5 sm:mt-5 sm:space-y-3">
              <label className="block">
                <span className="mb-0.5 block text-[8px] font-bold tracking-[0.18em] text-white uppercase sm:mb-1.5 sm:text-[10px]">
                  Approved Email Address
                </span>
                <input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@institution.com"
                  className="gate-input w-full rounded-xl border border-white/20 bg-white/[0.06] px-3 py-2 text-[13px] outline-none transition placeholder:text-white/40 focus:border-white/50 focus:bg-white/[0.08] sm:px-4 sm:py-3.5 sm:text-sm"
                />
              </label>
              {error ? <p className="text-[12px] text-white sm:text-sm">{error}</p> : null}
              <button
                type="submit"
                disabled={busy}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan px-4 py-2 text-[11px] font-bold tracking-[0.08em] text-navy uppercase transition hover:brightness-110 disabled:opacity-60 sm:py-3.5 sm:text-sm"
              >
                <KeyRound className="h-4 w-4" strokeWidth={2.2} />
                {busy ? 'Sending…' : 'Send Reset Link'}
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
            className="mt-0.5 font-display text-[16px] font-bold tracking-tight text-white uppercase whitespace-nowrap sm:mt-2 sm:text-[22px] lg:text-[28px]"
          >
            Account Registration
          </h1>
          <p data-gate-enter className="mt-0.5 max-w-md text-[10px] leading-snug text-white/80 sm:mt-2 sm:text-[13px] lg:text-sm">
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
                  Company / Institution Name
                </span>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Company, LLC, or Individual Research Identity"
                  className="gate-input w-full rounded-xl border border-white/20 bg-white/[0.06] px-3 py-1.5 text-[13px] outline-none transition placeholder:text-white/40 focus:border-white/50 sm:px-4 sm:py-3.5 sm:text-sm"
                />
              </label>
              <label className="block">
                <span className="mb-0.5 block text-[8px] font-bold tracking-[0.18em] text-white uppercase sm:mb-1.5 sm:text-[10px]">
                  Institutional Email
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@institution.com"
                  className="gate-input w-full rounded-xl border border-white/20 bg-white/[0.06] px-3 py-1.5 text-[13px] outline-none transition placeholder:text-white/40 focus:border-white/50 sm:px-4 sm:py-3.5 sm:text-sm"
                />
              </label>
              <label className="block">
                <span className="mb-0.5 block text-[8px] font-bold tracking-[0.18em] text-white uppercase sm:mb-1.5 sm:text-[10px]">
                  Password
                </span>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a secure password"
                    className="gate-input w-full rounded-xl border border-white/20 bg-white/[0.06] px-3 py-1.5 pr-11 text-[13px] outline-none transition placeholder:text-white/40 focus:border-white/50 sm:px-4 sm:py-3.5 sm:pr-12 sm:text-sm"
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
                  Intended Evaluation Framework
                </span>
                <textarea
                  rows={2}
                  value={framework}
                  onChange={(e) => setFramework(e.target.value)}
                  placeholder="Briefly describe your research protocol or intended use."
                  className="gate-input max-h-[48px] w-full resize-none rounded-xl border border-white/20 bg-white/[0.06] px-3 py-1.5 text-[13px] outline-none transition placeholder:text-white/40 focus:border-white/50 sm:max-h-none sm:px-4 sm:py-3.5 sm:text-sm"
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
      id="gatekeeper-root"
      ref={rootRef}
      className={`relative z-[12000] w-full min-h-[max(100svh,calc(var(--gate-frame-h,100svh)+var(--gate-kb-pad,0px)))] ${
        visible
          ? 'bg-[#141A22]/55 backdrop-blur-md'
          : 'bg-[#141A22]/35 backdrop-blur-[2px]'
      }`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="gatekeeper-title"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) e.preventDefault()
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="gate-page box-border flex w-full justify-center px-3 sm:px-5 md:px-8">
        <div
          ref={modalRef}
          className={`relative isolate flex w-full max-w-5xl shrink-0 overflow-hidden rounded-[22px] border border-white/20 bg-white/10 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-2xl sm:rounded-[28px] lg:rounded-[32px] ${
            visible ? '' : 'pointer-events-none opacity-0'
          }`}
          style={{ height: 'var(--gate-frame-h, min(920px, calc(100svh - 1.5rem)))' }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="relative h-full w-full overflow-hidden">
            <div
              ref={artRef}
              className="absolute z-0 overflow-hidden bg-white/[0.04]"
              style={{ left: '0%', width: '40%', top: '0%', height: '100%' }}
            >
              {welcomeInner}
            </div>

            <div
              ref={formRef}
              className="absolute z-[1] overflow-hidden border-white/10 bg-[#141A22]/70 backdrop-blur-xl"
              style={{ left: '40%', width: '60%', top: '0%', height: '100%', borderRadius: '0 28px 28px 0' }}
            >
              {formInner}
            </div>

            <div
              ref={seamRef}
              className="pointer-events-none absolute z-10 bg-gradient-to-r from-transparent via-cyan/35 to-transparent lg:bg-gradient-to-b lg:via-cyan/45"
              style={{ left: '40%', top: '0%', width: '1px', height: '100%' }}
            />
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
