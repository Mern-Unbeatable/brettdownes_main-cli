import { Link } from 'react-router-dom'
import { RUO_CAUTION } from '../data/site'

/** Shared navy RUO banner — same look as footer */
export default function RuoNotice({
  compact = false,
  showLink = false,
  className = '',
}) {
  return (
    <aside
      className={`relative overflow-hidden rounded-3xl border border-white/10 bg-navy px-5 py-5 sm:px-6 sm:py-6 ${className}`}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(0,245,212,0.14),_transparent_55%)]" />
      <div className="relative">
        <p className="text-[11px] font-bold tracking-[0.28em] text-cyan uppercase">
          Research Use Only
        </p>
        {!compact ? (
          <p className="mt-1 text-[11px] font-medium tracking-wide text-white/45 uppercase">
            21 CFR § 312.160(a)(3)
          </p>
        ) : null}
        <p
          className={`mt-3 rounded-2xl border border-white/12 bg-white/[0.06] px-4 py-3.5 leading-relaxed text-cyan ${
            compact ? 'text-[11px] sm:text-xs' : 'text-xs sm:text-[13px]'
          }`}
        >
          {RUO_CAUTION}
        </p>
        {showLink ? (
          <Link
            to="/compliance"
            className="mt-3 inline-flex text-xs font-semibold text-white/70 underline-offset-2 transition hover:text-cyan hover:underline"
          >
            View full FDA compliance summary
          </Link>
        ) : null}
      </div>
    </aside>
  )
}
