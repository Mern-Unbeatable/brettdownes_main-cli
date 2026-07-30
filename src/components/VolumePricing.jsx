import { Link } from 'react-router-dom'
import { ArrowRight, Network, Warehouse } from 'lucide-react'
import { volumePricing } from '../data/site'
import { useBannerEntrance } from '../hooks/useBannerEntrance'

const channelIcons = {
  Wholesale: Warehouse,
  Distributors: Network,
}

export default function VolumePricing({ className = '' }) {
  const ref = useBannerEntrance()

  return (
    <section
      ref={ref}
      className={`relative overflow-hidden rounded-3xl bg-gradient-to-br from-navy via-navy-soft to-[#062a28] px-6 py-10 md:px-12 md:py-14 ${className}`}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-20 top-0 h-72 w-72 rounded-full bg-cyan/15 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-cyan-dim/10 blur-3xl"
      />

      <div className="relative mx-auto max-w-3xl">
        <p
          data-banner-item
          className="text-[11px] font-bold tracking-[0.28em] text-cyan uppercase"
        >
          {volumePricing.eyebrow}
        </p>
        <h2
          data-banner-item
          className="mt-3 font-display text-2xl font-bold tracking-tight text-white md:text-4xl md:leading-[1.15]"
        >
          {volumePricing.titleLine1}
          <br />
          {volumePricing.titleLine2}
        </h2>
        <p
          data-banner-item
          className="mt-5 max-w-2xl text-sm leading-relaxed text-white/70 md:text-[15px]"
        >
          {volumePricing.text}
        </p>

        <div data-banner-item className="mt-8 h-px w-full bg-white/15" />

        <div
          data-banner-item
          className="mt-8 flex flex-col items-center gap-5 sm:flex-row sm:justify-center sm:gap-14"
        >
          {volumePricing.channels.map((label) => {
            const Icon = channelIcons[label]
            return (
              <div key={label} className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan/15 text-cyan">
                  {Icon ? <Icon className="h-5 w-5" strokeWidth={2} /> : null}
                </span>
                <span className="font-display text-lg font-bold tracking-tight text-white md:text-xl">
                  {label}
                </span>
              </div>
            )
          })}
        </div>

        <div className="mt-9 flex justify-center">
          <Link
            data-banner-cta
            to="/contact"
            className="group inline-flex items-center gap-2 rounded-xl bg-cyan px-6 py-3.5 text-sm font-semibold text-navy transition hover:brightness-110"
          >
            Inquire about volume pricing
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
