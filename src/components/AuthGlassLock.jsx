import { Link } from 'react-router-dom'
import { Lock } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

/**
 * Glass overlay for guest-locked catalogue sections on open pages.
 * Login → shop gate (verify). Sign up → shop gate in register mode.
 */
export default function AuthGlassLock({
  title = 'Member access required',
  text = 'Sign in or create an account to browse research catalogue pricing and order.',
}) {
  const { ready, isAuthenticated } = useAuth()

  if (!ready || isAuthenticated) return null

  return (
    <div
      className="absolute inset-0 z-20 flex items-center justify-center rounded-2xl px-4"
      role="dialog"
      aria-label={title}
    >
      <div
        aria-hidden
        className="absolute inset-0 rounded-2xl bg-white/45 backdrop-blur-[10px]"
      />
      <div className="relative w-full max-w-sm rounded-2xl border border-white/50 bg-white/55 p-6 text-center shadow-[0_18px_50px_rgba(17,24,39,0.12)] backdrop-blur-xl sm:p-7">
        <span className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-ink text-cyan">
          <Lock className="h-5 w-5" strokeWidth={2} />
        </span>
        <h3 className="font-display text-lg font-bold tracking-tight text-ink">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted">{text}</p>
        <div className="mt-5 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
          <Link
            to="/shop"
            className="inline-flex flex-1 items-center justify-center rounded-xl bg-cyan px-5 py-3 text-sm font-semibold text-ink transition hover:bg-cyan-dim sm:flex-none sm:min-w-[7.5rem]"
          >
            Login
          </Link>
          <Link
            to="/shop?auth=register"
            className="inline-flex flex-1 items-center justify-center rounded-xl border border-ink/15 bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-ink/90 sm:flex-none sm:min-w-[7.5rem]"
          >
            Sign up
          </Link>
        </div>
      </div>
    </div>
  )
}
