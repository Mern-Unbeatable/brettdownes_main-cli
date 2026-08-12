import { Link } from 'react-router-dom'
import { Beaker, FileCheck2, FlaskConical, RefreshCw } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import PageTransition from '../components/PageTransition'
import Footer from '../components/Footer'
import { siteContact } from '../data/site'

const pillars = [
  {
    icon: FileCheck2,
    title: 'Manufacturer Verified',
    text: 'Prior to issuing purchase orders, we review and verify private HPLC/MS analytical certificates directly from our certified manufacturing partners.',
  },
  {
    icon: FlaskConical,
    title: 'Expanding Independent Testing',
    text: 'We are progressively submitting batches to independent third-party laboratories (such as Janoshik and ILS) to generate custom, lot-matched COAs featuring our brand name.',
  },
  {
    icon: RefreshCw,
    title: 'Live Updates',
    text: 'Certificates are uploaded to this portal as batch results are finalized.',
  },
]

export default function CoaPage() {
  return (
    <PageTransition>
      <PageHeader />

      <main className="bg-white py-14 md:py-20">
        <div className="mx-auto max-w-3xl px-5 md:px-8">
          <div data-reveal="up" className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan/30 bg-cyan/5 px-3.5 py-1.5">
              <Beaker className="h-3.5 w-3.5 text-cyan-dim" strokeWidth={2} />
              <span className="text-[11px] font-bold tracking-[0.22em] text-ink uppercase">
                Quality & transparency
              </span>
            </div>
            <h1 className="mt-5 font-display text-2xl font-bold tracking-tight text-ink md:text-3xl">
              Our Commitment to Quality &amp; Transparency
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-muted md:text-base">
              As a growing company, we are actively expanding our independent third-party
              certification library.
            </p>
          </div>

          <div
            data-reveal="up"
            data-reveal-delay="0.08"
            className="mt-10 rounded-3xl border border-cyan/25 bg-gradient-to-br from-cyan/10 via-fog to-white p-6 md:p-8"
          >
            <p className="font-display text-base font-bold text-ink md:text-lg">
              Every product we source undergoes strict batch verification:
            </p>
            <ul className="mt-6 space-y-5">
              {pillars.map((item) => {
                const Icon = item.icon
                return (
                  <li key={item.title} className="flex gap-4">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-cyan shadow-sm ring-1 ring-cyan/20">
                      <Icon className="h-5 w-5" strokeWidth={1.8} />
                    </span>
                    <div>
                      <p className="font-display text-sm font-semibold text-ink">{item.title}</p>
                      <p className="mt-1 text-sm leading-relaxed text-muted">{item.text}</p>
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>

          <p
            data-reveal="up"
            data-reveal-delay="0.12"
            className="mt-8 text-center text-sm leading-relaxed text-muted"
          >
            Thank you for your trust and support as we build our inventory and expand our public
            testing archive.
          </p>

          <div
            data-reveal="up"
            data-reveal-delay="0.16"
            className="mt-10 flex flex-wrap items-center justify-center gap-3"
          >
            <Link
              to="/shop"
              className="rounded-xl bg-cyan px-5 py-3 text-sm font-semibold text-navy transition hover:brightness-110"
            >
              Browse products
            </Link>
            <a
              href={`mailto:${siteContact.email}?subject=${encodeURIComponent('COA / certificate request')}`}
              className="rounded-xl bg-fog px-5 py-3 text-sm font-semibold text-ink transition hover:bg-fog-deep"
            >
              Request a certificate
            </a>
          </div>
        </div>
      </main>

      <Footer />
    </PageTransition>
  )
}
