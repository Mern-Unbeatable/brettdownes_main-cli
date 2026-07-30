import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { partnerSourcing } from '../data/site'
import { useBannerEntrance } from '../hooks/useBannerEntrance'

export default function PartnerSourcing({ className = '' }) {
  const ref = useBannerEntrance()

  return (
    <section
      ref={ref}
      className={`relative overflow-hidden rounded-3xl bg-navy px-6 py-10 md:px-12 md:py-12 ${className}`}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 left-1/2 h-56 w-[120%] -translate-x-1/2 bg-[radial-gradient(ellipse_at_center,rgba(0,245,212,0.22),transparent_70%)]"
      />
      <div
        data-banner-accent
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 w-1.5 origin-top bg-cyan"
      />

      <div className="relative mx-auto max-w-3xl text-center">
        <p
          data-banner-item
          className="text-[11px] font-bold tracking-[0.28em] text-cyan uppercase"
        >
          Custom sourcing
        </p>
        <h2
          data-banner-item
          className="mt-3 font-display text-2xl font-bold tracking-tight text-white md:text-3xl"
        >
          {partnerSourcing.title}
        </h2>
        <p
          data-banner-item
          className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-white/65 md:text-[15px]"
        >
          {partnerSourcing.text}
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            data-banner-cta
            to="/contact"
            className="group inline-flex items-center gap-2 rounded-xl bg-cyan px-6 py-3.5 text-sm font-semibold text-navy transition hover:brightness-110"
          >
            Contact us
            <ArrowRight
              className="h-4 w-4 transition group-hover:translate-x-0.5"
              strokeWidth={2.25}
            />
          </Link>
        </div>
      </div>
    </section>
  )
}
