import { Link } from 'react-router-dom'
import { partnerSourcing, siteContact } from '../data/site'

export default function PartnerSourcing({ className = '' }) {
  return (
    <section
      data-reveal="up"
      className={`rounded-3xl border border-black/6 bg-fog px-6 py-8 md:px-10 md:py-10 ${className}`}
    >
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-[11px] font-bold tracking-[0.28em] text-cyan-dim uppercase">
          Custom sourcing
        </p>
        <h2 className="mt-2 font-display text-xl font-bold tracking-tight text-ink md:text-2xl">
          {partnerSourcing.title}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted md:text-[15px]">
          {partnerSourcing.text}
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/contact"
            className="inline-flex rounded-xl bg-cyan px-5 py-3 text-sm font-semibold text-navy transition hover:brightness-110"
          >
            Contact us
          </Link>
          <a
            href={`mailto:${siteContact.email}`}
            className="inline-flex rounded-xl border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:border-cyan/40 hover:bg-white"
          >
            Email support
          </a>
        </div>
      </div>
    </section>
  )
}
