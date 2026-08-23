import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal, flushSync } from 'react-dom'
import gsap from 'gsap'
import { Eye, EyeOff, KeyRound, Lock, ShieldCheck, Sparkles } from 'lucide-react'
import { useToast } from './Toaster'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'

const APPEAR_DELAY_MS = 1000

const notices = [
  {
    title: 'Required Protocol',
    text: 'Registration required for FDA-compliant access.',
  },
  {
    title: 'Same-Day Approvals',
    text: 'Free verification, usually within one business day.',
  },
  {
    title: 'No-Spam Guarantee',
    text: 'Encrypted credentials — never sold or shared.',
  },
]

export default function Gatekeeper({ onPass }) {
  const rootRef = useRef(null)
  const modalRef = useRef(null)
  const artRef = useRef(null)
  const formRef = useRef(null)
  const seamRef = useRef(null)
  const animating = useRef(false)
  const layoutTlRef = useRef(null)
  const animGenRef = useRef(0)
  const modeRef = useRef('verify')
  const frameHRef = useRef(0)
  const frameWRef = useRef(0)
  const panelPxRef = useRef(null)
  const topPadLockedRef = useRef(false)
  const toast = useToast()
  const { login, registerStart, registerVerify, registerResend } = useAuth()

  const [visible, setVisible] = useState(false)
  const [mode, setMode] = useState('verify')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [company, setCompany] = useState('')
  const [framework, setFramework] = useState('')
  const [otp, setOtp] = useState('')
  const [otpCooldown, setOtpCooldown] = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const [busy, setBusy] = useState(false)

  modeRef.current = mode

  useEffect(() => {
    if (otpCooldown <= 0) return undefined
    const timer = window.setTimeout(() => setOtpCooldown((n) => n - 1), 1000)
    return () => window.clearTimeout(timer)
  }, [otpCooldown])

  const pagePadY = () => {
    const w = window.innerWidth
    if (w >= 1024) return 96
    if (w >= 768) return 64
    if (w >= 640) return 48
    return 32
  }

  /** Phone-only stacked layout. 640px+ uses laptop side-by-side. */
  const isNarrow = () => window.matchMedia('(max-width: 639px)').matches


  /**
   * Lock modal pixel height once (and on real width/rotate only).
   * Never resize for keyboard open/close — that causes the shake.
   * Short viewports: shrink art share + allow page scroll so form fields aren't clipped.
   */
  const applyFrameSize = ({ force = false } = {}) => {
    const modal = modalRef.current
    if (!modal) return

    const w = window.innerWidth
    const vh = window.innerHeight
    const narrow = w <= 639
    const pad = pagePadY()
    // Prefer fitting the viewport; drop the old 360px floor that forced overflow on short screens
    const avail = Math.min(640, Math.max(280, vh - pad))
    const widthChanged = Math.abs(w - frameWRef.current) > 50

    // Keep the locked size stable through keypad / focus / layout thrash
    if (!force && frameHRef.current && !widthChanged) {
      const h = frameHRef.current
      modal.style.setProperty('height', `${h}px`, 'important')
      modal.style.setProperty('min-height', `${h}px`, 'important')
      modal.style.setProperty('max-height', `${h}px`, 'important')
      document.documentElement.style.setProperty('--gate-frame-h', `${h}px`)
      syncPageScrollRoom(h)
      return
    }

    if (narrow) {
      // Use more of the viewport on short screens so both panels fit
      const heightCap = vh < 700 ? 0.94 : 0.78
      const h = Math.min(avail, Math.round(vh * heightCap))
      const phone = w < 640
      // Tablet short height still needs a readable welcome strip (not a stamp)
      let artRatio = phone ? 0.4 : 0.3
      if (vh < 720) artRatio = phone ? 0.28 : 0.26
      if (vh < 580) artRatio = phone ? 0.2 : 0.22
      // Enforce a usable welcome height on tablet so logo/text aren't crushed
      const minArt = phone ? 96 : Math.min(168, Math.round(h * 0.32))
      const artH = Math.max(minArt, Math.round(h * artRatio))
      const formH = Math.max(220, h - artH)
      const total = artH + formH
      frameHRef.current = total
      frameWRef.current = w
      panelPxRef.current = { artH, formH, total }
    } else {
      // Tablet + laptop: side-by-side card with breathing room
      const heightCap = vh < 700 ? 0.88 : 0.7
      frameHRef.current = Math.min(avail, Math.round(vh * heightCap))
      frameWRef.current = w
      panelPxRef.current = null
    }

    const h = frameHRef.current
    modal.style.setProperty('height', `${h}px`, 'important')
    modal.style.setProperty('min-height', `${h}px`, 'important')
    modal.style.setProperty('max-height', `${h}px`, 'important')
    document.documentElement.style.setProperty('--gate-frame-h', `${h}px`)
    syncPageScrollRoom(h)

    if (force || widthChanged || !topPadLockedRef.current) {
      const centered = Math.max(8, Math.round((vh - h) / 2))
      // Mobile/short: small top pad so the card can scroll. Laptop+: always vertically center.
      const topPad = narrow
        ? vh < 700
          ? Math.max(8, Math.min(pad / 2, 16))
          : centered
        : centered
      document.documentElement.style.setProperty('--gate-top-pad', `${topPad}px`)
      topPadLockedRef.current = true
    }
  }

  /** Enable document scroll when the locked card cannot fit the viewport. */
  const syncPageScrollRoom = (frameH) => {
    const needsScroll = frameH + pagePadY() + 24 > window.innerHeight
    if (needsScroll) {
      document.documentElement.dataset.gateOverflow = '1'
    } else if (!document.documentElement.dataset.gateKb) {
      delete document.documentElement.dataset.gateOverflow
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
/* Short viewport or keyboard: page scroll moves the whole modal */
html[data-gate-locked="1"][data-gate-kb="1"],
html[data-gate-locked="1"][data-gate-overflow="1"] {
  overflow-y: auto !important;
  overscroll-behavior-y: contain;
}
html[data-gate-locked="1"][data-gate-kb="1"] #gatekeeper-root,
html[data-gate-locked="1"][data-gate-overflow="1"] #gatekeeper-root {
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
html[data-gate-locked="1"] .sticky-nav-pill {
  opacity: 0 !important;
  pointer-events: none !important;
  visibility: hidden !important;
}
/* Toasts must sit above the gate (same stacking context as body portal). */
html[data-gate-locked="1"] [data-peptide-toaster] {
  display: flex !important;
  visibility: visible !important;
  opacity: 1 !important;
  pointer-events: none !important;
  z-index: 2147483647 !important;
  position: fixed !important;
}
html[data-gate-locked="1"] #gatekeeper-root {
  display: block !important;
  visibility: visible !important;
  opacity: 1 !important;
  pointer-events: auto !important;
  z-index: 2147483646 !important;
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
      root.style.setProperty('z-index', '2147483646', 'important')
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
      // Skip style thrash during panel swaps — it freezes GSAP on tablet
      if (animating.current) return
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
      // Allow toast dismiss / hover while gate is locked
      if (target instanceof Element && target.closest('[data-peptide-toaster]')) return
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
      if (window.matchMedia('(max-width: 639px)').matches) setKeyboardPad(true)
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
      delete document.documentElement.dataset.gateOverflow
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
      window.matchMedia('(min-width: 640px)').matches
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

  const layoutFor = (nextMode) => {
    const narrow = isNarrow()
    const px = narrow ? panelPxRef.current : null
    // Reset keeps the login panel layout; register + OTP share the flipped layout
    const loginSide = nextMode !== 'register' && nextMode !== 'otp'

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
      const artH = phone ? 40 : 28
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

    layoutTlRef.current?.kill()
    layoutTlRef.current = null
    gsap.killTweensOf([art, form, seam, content, welcome].filter(Boolean))

    if (!animate || reduce) {
      gsap.set(art, P.art)
      gsap.set(form, P.form)
      gsap.set(seam, P.seam)
      if (content) gsap.set(content, { autoAlpha: 1, y: 0, clearProps: 'transform' })
      if (welcome) gsap.set(welcome, { autoAlpha: 1, y: 0, clearProps: 'transform' })
      animating.current = false
      onMid?.()
      onDone?.()
      return
    }

    animating.current = true
    const gen = ++animGenRef.current
    const toRegister = nextMode === 'register' || nextMode === 'otp'
    const fromRegister = modeRef.current === 'register' || modeRef.current === 'otp'
    const panelsMove = fromRegister !== toRegister
    const toReset = nextMode === 'reset'
    const fromReset = modeRef.current === 'reset'

    const finish = () => {
      if (animGenRef.current !== gen) return
      animating.current = false
      layoutTlRef.current = null
      onDone?.()
    }

    // Safety: never leave the gate locked if a tween is interrupted on tablet
    const safety = window.setTimeout(() => {
      if (animGenRef.current === gen && animating.current) finish()
    }, 1800)

    const tl = gsap.timeline({
      defaults: { ease: 'power3.inOut' },
      onInterrupt: () => {
        window.clearTimeout(safety)
      },
    })
    layoutTlRef.current = tl

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
      if (animGenRef.current !== gen) return

      // Commit mode swap before fade-in so tablet doesn't animate a stale / half-updated tree
      flushSync(() => {
        onMid?.()
      })

      const nextContent = form.querySelector('[data-gate-content]')
      const nextWelcome = art.querySelector('[data-gate-welcome]')
      const fromY = toRegister ? 40 : toReset ? 28 : fromReset ? -24 : -30

      let pending = 0
      const doneOne = () => {
        if (animGenRef.current !== gen) return
        pending -= 1
        if (pending <= 0) {
          window.clearTimeout(safety)
          finish()
        }
      }

      if (nextContent) {
        pending += 1
        gsap.fromTo(
          nextContent,
          { autoAlpha: 0, y: fromY },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.5,
            ease: 'power2.out',
            clearProps: 'transform',
            overwrite: 'auto',
            onComplete: doneOne,
          },
        )
      }
      if (nextWelcome) {
        pending += 1
        gsap.fromTo(
          nextWelcome,
          { autoAlpha: 0, y: toRegister ? 20 : -16 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.5,
            ease: 'power2.out',
            clearProps: 'transform',
            overwrite: 'auto',
            onComplete: doneOne,
          },
        )
      }
      if (pending === 0) {
        window.clearTimeout(safety)
        finish()
      }
    }, panelsMove ? undefined : 0.3)
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
    setSubmitted(false)
    setShowPassword(false)
    setOtp('')

    // Keep locked frame height — only slide panels (no remeasure / no shake)
    applyLayout(next, true, {
      onMid: () => {
        const prev = modeRef.current
        modeRef.current = next
        if (formRef.current) formRef.current.scrollTop = 0
        if (next === 'register') {
          // Keep fields when returning from OTP to edit details.
          if (prev !== 'otp') {
            setPassword('')
            setEmail('')
          }
        } else if (next === 'reset') {
          setPassword('')
        } else if (next !== 'otp') {
          setPassword('')
        }
        setMode(next)
      },
    })
  }

  const handleVerify = async (e) => {
    e.preventDefault()
    if (busy) return

    const value = email.trim()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      toast.error('Enter a valid approved email address.')
      return
    }
    if (!password.trim()) {
      toast.error('Enter your password to continue.')
      return
    }

    setBusy(true)
    try {
      await login(value, password)
      toast.success('Access verified. Entering portal…', { title: 'Verified' })
      onPass?.()
    } catch (error) {
      toast.error(error.message || 'Invalid email or password.')
    } finally {
      setBusy(false)
    }
  }

  const handleReset = async (e) => {
    e.preventDefault()
    if (busy) return

    const value = email.trim()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      toast.error('Enter the approved email linked to your account.')
      return
    }

    setBusy(true)
    try {
      await api.post('/api/auth/forgot-password', { email: value })
      setSubmitted(true)
      toast.success('If an account exists, a reset link is on the way.', {
        title: 'Reset link sent',
      })
    } catch (error) {
      toast.error(error.message || 'Could not send the reset link. Try again shortly.')
    } finally {
      setBusy(false)
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    if (busy) return

    if (!company.trim() || !email.trim() || !password.trim() || !framework.trim()) {
      toast.error('Complete all registration fields to continue.')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      toast.error('Enter a valid institutional email address.')
      return
    }
    if (password.trim().length < 8) {
      toast.error('Password must be at least 8 characters.')
      return
    }

    setBusy(true)
    try {
      await registerStart({
        company: company.trim(),
        email: email.trim().toLowerCase(),
        password,
        researchFramework: framework.trim(),
      })
      setOtp('')
      setOtpCooldown(60)
      toast.success('Enter the 6-digit code we emailed you.', { title: 'Verify email' })
      swapTo('otp')
    } catch (error) {
      toast.error(error.message || 'Registration failed. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  const handleOtpVerify = async (e) => {
    e.preventDefault()
    if (busy) return

    const code = otp.trim()
    if (!/^\d{6}$/.test(code)) {
      toast.error('Enter the 6-digit code from your email.')
      return
    }

    setBusy(true)
    try {
      const result = await registerVerify({
        email: email.trim().toLowerCase(),
        otp: code,
      })

      if (result.autoApproved) {
        toast.success('Account approved. Entering portal…', { title: 'Welcome' })
        onPass?.()
        return
      }

      setSubmitted(true)
      toast.success('Email verified. We will confirm your access shortly.', {
        title: 'Submitted',
      })
    } catch (error) {
      toast.error(error.message || 'Verification failed. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  const handleOtpResend = async () => {
    if (busy || otpCooldown > 0) return
    setBusy(true)
    try {
      await registerResend(email.trim().toLowerCase())
      setOtpCooldown(60)
      toast.success('A new code is on its way.', { title: 'Code sent' })
    } catch (error) {
      toast.error(error.message || 'Could not resend the code.')
    } finally {
      setBusy(false)
    }
  }

  const welcomeCopy =
    mode === 'register' || mode === 'otp'
      ? {
          title: mode === 'otp' ? 'Verify email' : 'Join the network',
          text:
            mode === 'otp'
              ? 'Enter the one-time code we sent to confirm your address.'
              : 'Create a verified research account to request compounds.',
        }
      : mode === 'reset'
        ? {
            title: 'Reset access',
            text: 'We email a secure reset link to your approved address.',
          }
        : {
            title: 'Welcome',
            text: 'Research-grade peptides with verified purity and secure portal access.',
          }

  const welcomeInner = (
    <div
      data-gate-welcome
      className="flex h-full flex-col items-center justify-center px-4 py-2 text-center sm:px-6 sm:py-6 md:px-10 md:py-8 xl:px-12"
    >
      <div data-gate-enter className="flex flex-col items-center">
        <img
          src="/images/logo.png"
          alt="Peptide Ops"
          className="h-24 w-24 object-contain sm:h-32 sm:w-32 md:h-36 md:w-36 xl:h-44 xl:w-44"
          draggable={false}
        />
        <h2
          id="gatekeeper-title"
          className="mt-1.5 max-w-xs font-display text-[20px] leading-[1.05] font-bold tracking-tight text-white sm:mt-2.5 sm:text-[26px] md:mt-3 md:text-[28px] xl:text-[36px]"
        >
          {welcomeCopy.title}
        </h2>
        <p className="mt-1.5 max-w-[16rem] text-[11px] leading-snug text-white/65 sm:mt-2 sm:max-w-[15rem] sm:text-[12px] sm:leading-relaxed md:max-w-xs md:text-[13px] xl:text-[14px]">
          {welcomeCopy.text}
        </p>
      </div>
      <div data-gate-enter className="mt-4 hidden w-full items-center gap-3 text-white/40 sm:flex md:mt-5">
        <span className="h-px flex-1 bg-white/15" />
        <span className="text-[10px] font-bold tracking-[0.24em] uppercase">Secure Portal</span>
        <span className="h-px flex-1 bg-white/15" />
      </div>
    </div>
  )

  const formInner = (
    <div
      data-gate-content
      className={`mx-auto box-border flex h-full w-full min-w-0 max-w-xl flex-col justify-center overflow-hidden px-4 text-left sm:max-w-none sm:px-6 md:px-8 xl:px-10 ${
        mode === 'register' || mode === 'otp'
          ? 'pt-2.5 pb-2.5 sm:py-4 md:py-5'
          : 'pt-2 pb-2 sm:py-4 md:py-5'
      }`}
    >
      {mode === 'verify' ? (
        <>
          <div
            data-gate-enter
            className="mb-1 w-full rounded-xl border border-white/15 bg-white/10 p-1.5 text-left backdrop-blur-sm sm:mb-2.5 sm:rounded-2xl sm:p-2.5 md:mb-3 md:p-3"
          >
            <p className="font-display text-[8px] font-bold tracking-[0.18em] text-white uppercase sm:text-[10px]">
              Registration Notice
            </p>
            <ul className="mt-0.5 space-y-0.5 sm:mt-1.5 sm:space-y-1">
              {notices.map((item) => (
                <li key={item.title} className="text-[9px] leading-snug text-white sm:text-[11px] sm:leading-snug md:text-[12px]">
                  <span className="font-semibold">{item.title}:</span> {item.text}
                </li>
              ))}
            </ul>
          </div>

          <h1
            data-gate-enter
            className="font-display text-[14px] font-bold tracking-tight text-white uppercase sm:text-[18px] md:text-[20px] xl:text-[22px]"
          >
            Portal Verification
          </h1>
          <p data-gate-enter className="mt-0.5 max-w-md text-[9px] leading-snug text-white/80 sm:mt-1 sm:text-[11px] md:text-[12px]">
            Enter your approved research email to unlock the catalog.
          </p>

          <form data-gate-enter onSubmit={handleVerify} className="mt-1 w-full space-y-1 sm:mt-2 sm:space-y-2 md:mt-2.5">
            <label className="block">
              <span className="mb-0.5 block text-[8px] font-bold tracking-[0.18em] text-white uppercase sm:mb-1 sm:text-[10px]">
                Approved Email Address
              </span>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@institution.com"
                className="gate-input w-full rounded-lg border border-white/20 bg-white/[0.06] px-3 py-1.5 text-[12px] outline-none transition placeholder:text-white/40 focus:border-white/50 focus:bg-white/[0.08] sm:px-3.5 sm:py-2 sm:text-[13px]"
              />
            </label>
            <label className="mb-3 block sm:mb-3.5 md:mb-4">
              <span className="mb-0.5 block text-[8px] font-bold tracking-[0.18em] text-white uppercase sm:mb-1 sm:text-[10px]">
                Password
              </span>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="gate-input w-full rounded-lg border border-white/20 bg-white/[0.06] px-3 py-1.5 pr-11 text-[12px] outline-none transition placeholder:text-white/40 focus:border-white/50 focus:bg-white/[0.08] sm:px-3.5 sm:py-2 sm:pr-11 sm:text-[13px]"
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
              <button
                type="button"
                onClick={() => swapTo('reset')}
                className="mt-2 w-full py-0.5 text-center text-[11px] font-semibold tracking-[0.04em] text-white/75 underline underline-offset-2 transition hover:text-white sm:mt-2.5 sm:text-[13px]"
              >
                Forgot Password?
              </button>
            </label>
            <button
              type="submit"
              disabled={busy}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan px-4 py-1.5 text-[11px] font-bold tracking-[0.08em] text-navy uppercase transition hover:brightness-110 disabled:opacity-60 sm:py-2 sm:text-[13px]"
            >
              <Lock className="h-4 w-4" strokeWidth={2.2} />
              {busy ? 'Verifying…' : 'Verify & Enter'}
            </button>
            <button
              type="button"
              onClick={() => swapTo('register')}
              className="mt-3 w-full rounded-xl border border-white/35 bg-transparent px-4 py-1.5 text-[11px] font-semibold tracking-[0.06em] text-white uppercase transition hover:border-white hover:bg-white/10 sm:mt-4 sm:py-2 sm:text-[13px]"
            >
              Register New Account
            </button>
          </form>
        </>
      ) : mode === 'reset' ? (
        <>
          <div
            data-gate-enter
            className="mb-1.5 w-full rounded-xl border border-white/15 bg-white/10 p-2 text-left backdrop-blur-sm md:mb-4 md:rounded-2xl md:p-4"
          >
            <p className="font-display text-[8px] font-bold tracking-[0.18em] text-white uppercase md:text-[11px]">
              Password Recovery
            </p>
            <p className="mt-1 text-[10px] leading-snug text-white md:mt-2 md:text-[13px] md:leading-relaxed">
              Enter your approved research email. If an account exists, a secure reset link will be sent within a few
              minutes.
            </p>
          </div>

          <h1
            data-gate-enter
            className="font-display text-[15px] font-bold tracking-tight text-white uppercase md:text-[22px] xl:text-[24px]"
          >
            Reset Password
          </h1>
          <p data-gate-enter className="mt-0.5 max-w-md text-[10px] leading-snug text-white/80 md:mt-1 md:text-[12px]">
            Restore portal access without leaving the verification flow.
          </p>

          {submitted ? (
            <div
              data-gate-enter
              className="mt-4 w-full rounded-2xl border border-white/25 bg-white/5 p-3 text-left md:mt-8 md:p-5"
            >
              <ShieldCheck className="h-6 w-6 text-cyan md:h-8 md:w-8" />
              <p className="mt-2 font-display text-sm font-bold text-white uppercase md:mt-3 md:text-lg">
                Reset link sent
              </p>
              <p className="mt-1.5 text-[11px] text-white/85 md:text-sm">
                Check <span className="font-semibold text-white">{email.trim() || 'your inbox'}</span> for a secure
                password reset link. It expires in 30 minutes.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSubmitted(false)
                  swapTo('verify')
                }}
                className="mt-3 w-full rounded-xl border border-white/35 bg-transparent px-4 py-2 text-[11px] font-semibold tracking-[0.06em] text-white uppercase transition hover:border-white hover:bg-white/10 md:mt-5 md:py-3 md:text-sm"
              >
                Return to Login
              </button>
            </div>
          ) : (
            <form data-gate-enter onSubmit={handleReset} className="mt-1.5 w-full space-y-1.5 md:mt-3 md:space-y-2">
              <label className="block">
                <span className="mb-0.5 block text-[8px] font-bold tracking-[0.18em] text-white uppercase md:mb-1 md:text-[10px]">
                  Approved Email Address
                </span>
                <input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@institution.com"
                  className="gate-input w-full rounded-lg border border-white/20 bg-white/[0.06] px-3 py-2 text-[13px] outline-none transition placeholder:text-white/40 focus:border-white/50 focus:bg-white/[0.08] md:px-3.5 md:py-2 md:text-[13px]"
                />
              </label>
              <button
                type="submit"
                disabled={busy}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan px-4 py-2 text-[11px] font-bold tracking-[0.08em] text-navy uppercase transition hover:brightness-110 disabled:opacity-60 md:py-2 md:text-[13px]"
              >
                <KeyRound className="h-4 w-4" strokeWidth={2.2} />
                {busy ? 'Sending…' : 'Send Reset Link'}
              </button>
              <button
                type="button"
                onClick={() => swapTo('verify')}
                className="w-full rounded-xl border border-white/35 bg-transparent px-4 py-2 text-[11px] font-semibold tracking-[0.06em] text-white uppercase transition hover:border-white hover:bg-white/10 md:py-2 md:text-[13px]"
              >
                Return to Login
              </button>
            </form>
          )}
        </>
      ) : mode === 'otp' ? (
        <>
          <p
            data-gate-enter
            className="font-display text-[7px] font-bold tracking-[0.16em] text-white uppercase sm:text-[8px] md:text-[11px]"
          >
            Email Verification
          </p>
          <h1
            data-gate-enter
            className="mt-0.5 font-display text-[13px] font-bold tracking-tight text-white uppercase whitespace-nowrap sm:text-[15px] md:mt-1.5 md:text-[20px] xl:text-[22px]"
          >
            Enter OTP Code
          </h1>
          <p data-gate-enter className="mt-0.5 max-w-md text-[9px] leading-snug text-white/80 sm:text-[10px] md:mt-1 md:text-[12px]">
            We sent a 6-digit code to{' '}
            <span className="font-semibold text-white">{email.trim() || 'your inbox'}</span>.
          </p>

          {submitted ? (
            <div
              data-gate-enter
              className="mt-3 w-full rounded-2xl border border-white/25 bg-white/5 p-3 text-left md:mt-8 md:p-5"
            >
              <ShieldCheck className="h-5 w-5 text-white sm:h-6 sm:w-6 md:h-8 md:w-8" />
              <p className="mt-2 font-display text-xs font-bold text-white uppercase sm:text-sm md:mt-3 md:text-lg">
                Registration received
              </p>
              <p className="mt-1.5 text-[10px] text-white sm:text-[11px] md:text-sm">
                Your email is verified. We will confirm portal access shortly.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSubmitted(false)
                  swapTo('verify')
                }}
                className="mt-3 w-full rounded-xl border border-white/35 bg-transparent px-4 py-1.5 text-[10px] font-semibold tracking-[0.06em] text-white uppercase transition hover:border-white hover:bg-white/10 sm:py-2 sm:text-[11px] md:mt-5 md:py-3 md:text-sm"
              >
                Return to Login
              </button>
            </div>
          ) : (
            <form data-gate-enter onSubmit={handleOtpVerify} className="mt-1.5 w-full space-y-1.5 md:mt-3 md:space-y-2">
              <label className="block">
                <span className="mb-0.5 block text-[7px] font-bold tracking-[0.16em] text-white uppercase sm:text-[8px] md:mb-1 md:text-[10px]">
                  Verification Code
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="6-digit code"
                  className="gate-input w-full rounded-lg border border-white/20 bg-white/[0.06] px-2.5 py-1.5 text-center text-[16px] tracking-[0.35em] outline-none transition placeholder:tracking-normal placeholder:text-white/40 focus:border-white/50 sm:px-3 sm:py-2 md:px-3.5 md:text-[18px]"
                />
              </label>
              <button
                type="submit"
                disabled={busy}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-cyan px-4 py-2 text-[11px] font-bold tracking-[0.08em] text-navy uppercase transition hover:brightness-110 disabled:opacity-60 sm:gap-2 sm:text-[12px] md:text-[13px]"
              >
                <ShieldCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={2.2} />
                {busy ? 'Verifying…' : 'Verify & Continue'}
              </button>
              <button
                type="button"
                disabled={busy || otpCooldown > 0}
                onClick={handleOtpResend}
                className="w-full rounded-xl border border-white/35 bg-transparent px-4 py-2 text-[11px] font-semibold tracking-[0.06em] text-white uppercase transition hover:border-white hover:bg-white/10 disabled:opacity-50 sm:text-[12px] md:text-[13px]"
              >
                {otpCooldown > 0 ? `Resend in ${otpCooldown}s` : 'Resend Code'}
              </button>
              <button
                type="button"
                onClick={() => swapTo('register')}
                className="mt-1 w-full text-center text-[11px] font-semibold tracking-[0.04em] text-white/75 underline underline-offset-2 transition hover:text-white sm:text-[12px]"
              >
                Edit registration details
              </button>
            </form>
          )}
        </>
      ) : (
        <>
          <p
            data-gate-enter
            className="font-display text-[7px] font-bold tracking-[0.16em] text-white uppercase sm:text-[8px] md:text-[11px]"
          >
            Secure Onboarding
          </p>
          <h1
            data-gate-enter
            className="mt-0.5 font-display text-[13px] font-bold tracking-tight text-white uppercase whitespace-nowrap sm:text-[15px] md:mt-1.5 md:text-[20px] xl:text-[22px]"
          >
            Account Registration
          </h1>
          <p data-gate-enter className="mt-0.5 max-w-md text-[9px] leading-snug text-white/80 sm:text-[10px] md:mt-1 md:text-[12px]">
            We email a one-time code to verify your address, then apply access settings.
          </p>

          {submitted ? (
            <div
              data-gate-enter
              className="mt-3 w-full rounded-2xl border border-white/25 bg-white/5 p-3 text-left md:mt-8 md:p-5"
            >
              <ShieldCheck className="h-5 w-5 text-white sm:h-6 sm:w-6 md:h-8 md:w-8" />
              <p className="mt-2 font-display text-xs font-bold text-white uppercase sm:text-sm md:mt-3 md:text-lg">
                Registration received
              </p>
              <p className="mt-1.5 text-[10px] text-white sm:text-[11px] md:text-sm">
                We will confirm your access shortly. You can return to verification once approved.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSubmitted(false)
                  swapTo('verify')
                }}
                className="mt-3 w-full rounded-xl border border-white/35 bg-transparent px-4 py-1.5 text-[10px] font-semibold tracking-[0.06em] text-white uppercase transition hover:border-white hover:bg-white/10 sm:py-2 sm:text-[11px] md:mt-5 md:py-3 md:text-sm"
              >
                Return to Login
              </button>
            </div>
          ) : (
            <form data-gate-enter onSubmit={handleRegister} className="mt-1.5 w-full space-y-1 sm:space-y-1.5 md:mt-3 md:space-y-2">
              <label className="block">
                <span className="mb-0.5 block text-[7px] font-bold tracking-[0.16em] text-white uppercase sm:text-[8px] md:mb-1 md:text-[10px]">
                  Company / Institution Name
                </span>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Company, LLC, or Individual Research Identity"
                  className="gate-input w-full rounded-lg border border-white/20 bg-white/[0.06] px-2.5 py-1 text-[11px] outline-none transition placeholder:text-white/40 focus:border-white/50 sm:px-3 sm:py-1.5 sm:text-[12px] md:px-3.5 md:py-2 md:text-[13px]"
                />
              </label>
              <label className="block">
                <span className="mb-0.5 block text-[7px] font-bold tracking-[0.16em] text-white uppercase sm:text-[8px] md:mb-1 md:text-[10px]">
                  Institutional Email
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@institution.com"
                  className="gate-input w-full rounded-lg border border-white/20 bg-white/[0.06] px-2.5 py-1 text-[11px] outline-none transition placeholder:text-white/40 focus:border-white/50 sm:px-3 sm:py-1.5 sm:text-[12px] md:px-3.5 md:py-2 md:text-[13px]"
                />
              </label>
              <label className="block">
                <span className="mb-0.5 block text-[7px] font-bold tracking-[0.16em] text-white uppercase sm:text-[8px] md:mb-1 md:text-[10px]">
                  Password
                </span>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a secure password"
                    className="gate-input w-full rounded-lg border border-white/20 bg-white/[0.06] px-2.5 py-1 pr-10 text-[11px] outline-none transition placeholder:text-white/40 focus:border-white/50 sm:px-3 sm:py-1.5 sm:pr-11 sm:text-[12px] md:px-3.5 md:py-2 md:pr-11 md:text-[13px]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute top-1/2 right-2.5 -translate-y-1/2 text-white/55 transition hover:text-white sm:right-3"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff className="h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={2} />
                    ) : (
                      <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={2} />
                    )}
                  </button>
                </div>
              </label>
              <label className="block">
                <span className="mb-0.5 block text-[7px] font-bold tracking-[0.16em] text-white uppercase sm:text-[8px] md:mb-1 md:text-[10px]">
                  Intended Evaluation Framework
                </span>
                <textarea
                  rows={2}
                  value={framework}
                  onChange={(e) => setFramework(e.target.value)}
                  placeholder="Briefly describe your research protocol or intended use."
                  className="gate-input min-h-[56px] max-h-[72px] w-full resize-none rounded-lg border border-white/20 bg-white/[0.06] px-2.5 py-1.5 text-[11px] outline-none transition placeholder:text-white/40 focus:border-white/50 sm:min-h-[56px] sm:max-h-[64px] sm:px-3 sm:py-1.5 sm:text-[12px] md:min-h-[52px] md:max-h-[56px] md:px-3.5 md:py-2 md:text-[13px]"
                />
              </label>
              <button
                type="submit"
                disabled={busy}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-cyan px-4 py-2 text-[11px] font-bold tracking-[0.08em] text-navy uppercase transition hover:brightness-110 disabled:opacity-60 sm:gap-2 sm:text-[12px] md:text-[13px]"
              >
                <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={2.2} />
                {busy ? 'Submitting…' : 'Submit Registration'}
              </button>
              <button
                type="button"
                onClick={() => swapTo('verify')}
                className="mt-3 flex w-full items-center justify-center rounded-xl border border-white/35 bg-transparent px-4 py-2 text-[11px] font-bold tracking-[0.08em] text-white uppercase transition hover:border-white hover:bg-white/10 sm:mt-4 sm:text-[12px] md:mt-4 md:text-[13px]"
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
      <div className="gate-page box-border flex w-full justify-center px-3 sm:px-5 md:px-8 md:px-10 xl:px-14">
        <div
          ref={modalRef}
          className={`relative isolate flex w-full max-w-3xl shrink-0 overflow-hidden rounded-[20px] border border-white/20 bg-white/10 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-2xl sm:max-w-4xl sm:rounded-[28px] ${
            visible ? '' : 'pointer-events-none opacity-0'
          }`}
          style={{ height: 'var(--gate-frame-h, min(640px, calc(100svh - 2rem)))' }}
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
              className="pointer-events-none absolute z-10 bg-gradient-to-r from-transparent via-cyan/35 to-transparent sm:bg-gradient-to-b sm:via-cyan/45"
              style={{ left: '40%', top: '0%', width: '1px', height: '100%' }}
            />
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
