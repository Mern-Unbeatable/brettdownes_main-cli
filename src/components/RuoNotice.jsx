import { RUO_CAUTION } from '../data/site'

/** Product-page RUO disclaimer only */
export default function RuoNotice({ className = '' }) {
  return (
    <aside
      className={`relative overflow-hidden rounded-3xl border border-white/10 bg-navy px-5 py-5 sm:px-6 sm:py-6 ${className}`}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(0,245,212,0.14),_transparent_55%)]" />
      <div className="relative">
        <p className="text-[11px] font-bold tracking-[0.28em] text-cyan uppercase">
          Research disclaimer
        </p>
        <p className="mt-3 rounded-2xl border border-white/12 bg-white/[0.06] px-4 py-3.5 text-sm font-medium leading-relaxed text-cyan">
          {RUO_CAUTION}
        </p>
      </div>
    </aside>
  )
}
