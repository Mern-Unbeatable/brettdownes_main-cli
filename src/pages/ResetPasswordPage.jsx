import { useLayoutEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import gsap from 'gsap'
import { Eye, EyeOff, KeyRound, ShieldCheck } from 'lucide-react'
import { api } from '../lib/api'
import { useToast } from '../components/Toaster'

export default function ResetPasswordPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const toast = useToast()
  const cardRef = useRef(null)

  const token = params.get('token') || ''
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)

  useLayoutEffect(() => {
    const card = cardRef.current
    if (!card) return undefined
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined

    const ctx = gsap.context(() => {
      gsap.fromTo(
        card,
        { autoAlpha: 0, y: 28, scale: 0.96 },
        { autoAlpha: 1, y: 0, scale: 1, duration: 0.6, ease: 'power3.out' },
      )
      gsap.fromTo(
        card.querySelectorAll('[data-reset-enter]'),
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.5, stagger: 0.06, ease: 'power3.out', delay: 0.15 },
      )
    }, card)

    return () => ctx.revert()
  }, [])

  const onSubmit = async (e) => {
    e.preventDefault()
    if (busy) return

    if (password.length < 8) {
      toast.error('Password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      toast.error('Both passwords must match.')
      return
    }

    setBusy(true)
    try {
      await api.post('/api/auth/reset-password', { token, password })
      setDone(true)
      toast.success('Password updated. You can sign in now.', { title: 'All set' })
      window.setTimeout(() => navigate('/', { replace: true }), 2200)
    } catch (error) {
      toast.error(error.message || 'This reset link is invalid or has expired.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#141A22] px-4 py-10">
      <div
        ref={cardRef}
        className="w-full max-w-md rounded-[28px] border border-white/15 bg-white/[0.06] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-2xl sm:p-8"
      >
        <div data-reset-enter className="flex flex-col items-center text-center">
          <img
            src="/images/logo.png"
            alt="Peptide Ops"
            className="h-20 w-20 object-contain"
            draggable={false}
          />
          <h1 className="mt-3 font-display text-xl font-bold tracking-tight text-white uppercase">
            Reset password
          </h1>
          <p className="mt-1.5 text-[12px] leading-relaxed text-white/70">
            Choose a new password for your research portal account.
          </p>
        </div>

        {!token ? (
          <div data-reset-enter className="mt-6 rounded-2xl border border-white/20 bg-white/5 p-5 text-center">
            <p className="text-sm text-white/85">
              This link is missing its reset token. Request a new one from the portal login screen.
            </p>
            <Link
              to="/"
              className="mt-4 inline-block w-full rounded-xl border border-white/35 px-4 py-2.5 text-[12px] font-semibold tracking-[0.06em] text-white uppercase transition hover:border-white hover:bg-white/10"
            >
              Return to login
            </Link>
          </div>
        ) : done ? (
          <div data-reset-enter className="mt-6 rounded-2xl border border-white/20 bg-white/5 p-5 text-center">
            <ShieldCheck className="mx-auto h-8 w-8 text-cyan" />
            <p className="mt-3 font-display text-base font-bold text-white uppercase">
              Password updated
            </p>
            <p className="mt-1.5 text-[12px] text-white/80">
              Taking you back to the portal so you can sign in.
            </p>
          </div>
        ) : (
          <form onSubmit={onSubmit} data-reset-enter className="mt-6 space-y-3">
            <label className="block">
              <span className="mb-1 block text-[10px] font-bold tracking-[0.18em] text-white uppercase">
                New password
              </span>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="gate-input w-full rounded-lg border border-white/20 bg-white/[0.06] px-3.5 py-2.5 pr-11 text-[13px] outline-none transition placeholder:text-white/40 focus:border-white/50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-white/55 transition hover:text-white"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </label>

            <label className="block">
              <span className="mb-1 block text-[10px] font-bold tracking-[0.18em] text-white uppercase">
                Confirm password
              </span>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Repeat your new password"
                  className="gate-input w-full rounded-lg border border-white/20 bg-white/[0.06] px-3.5 py-2.5 pr-11 text-[13px] outline-none transition placeholder:text-white/40 focus:border-white/50"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-white/55 transition hover:text-white"
                  aria-label={showConfirm ? 'Hide password' : 'Show password'}
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </label>

            <button
              type="submit"
              disabled={busy}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan px-4 py-2.5 text-[12px] font-bold tracking-[0.08em] text-navy uppercase transition hover:brightness-110 disabled:opacity-60"
            >
              <KeyRound className="h-4 w-4" strokeWidth={2.2} />
              {busy ? 'Saving…' : 'Update password'}
            </button>

            <Link
              to="/"
              className="block w-full rounded-xl border border-white/35 px-4 py-2.5 text-center text-[12px] font-semibold tracking-[0.06em] text-white uppercase transition hover:border-white hover:bg-white/10"
            >
              Return to login
            </Link>
          </form>
        )}
      </div>
    </main>
  )
}
