import { Check, FileWarning, Scale, ShieldCheck, X } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import PageTransition from '../components/PageTransition'
import Footer from '../components/Footer'
import { RUO_CAUTION } from '../data/site'

const matrix = [
  {
    feature: 'Product descriptions & nomenclature',
    compliant:
      'Limited to exact chemical names, CAS numbers, sequence strings, molecular weight, and technical specs.',
    nonCompliant:
      'Uses wellness terms like “fat burner,” “healing peptide,” “anti-aging,” “muscle builder,” or recovery claims.',
  },
  {
    feature: 'Dosing & administration guidelines',
    compliant:
      'Provides zero human dosage information. Only includes assay concentrations or lab protocols.',
    nonCompliant:
      'Publishes human dosage charts, injection instructions (Sub-Q/IM), or reconstitution calculators for human use.',
  },
  {
    feature: 'Customer support & interactions',
    compliant:
      'Restricted to institutional account inquiry and order fulfillment. Strict refusal of human use questions.',
    nonCompliant:
      'Live chat or support advising customers on taking, mixing, or injecting research chemicals.',
  },
  {
    feature: 'Reviews & user feedback',
    compliant:
      'Reviews disabled or strictly moderated to cover analytical purity (HPLC/MS) and order handling only.',
    nonCompliant:
      'User reviews detailing personal physical results (e.g., “lost 15 lbs,” “healed my tendon”).',
  },
  {
    feature: 'Product packaging & format',
    compliant:
      'Standard laboratory vials labeled strictly per 21 CFR § 312.160 warning requirements.',
    nonCompliant:
      'Human-centric forms (pre-filled nasal sprays, troches, oral liquids) or supplement-style branding.',
  },
]

const requirements = [
  {
    icon: Scale,
    title: 'Pre-approval promotion prohibition',
    cite: '21 CFR § 312.7',
    text: 'Vendors cannot represent or advertise unapproved research substances as safe or effective for any human therapeutic purpose. Linking product pages to human clinical trials can be cited by FDA as evidence of human intended use.',
  },
  {
    icon: ShieldCheck,
    title: 'Buyer due diligence & verification',
    cite: 'Best practice',
    text: 'To maintain RUO status, distributors should verify that purchasers are qualified research entities, universities, corporate labs, or verified researchers. Detailed sales records must be maintained for a minimum of 2 years.',
  },
]

export default function CompliancePage() {
  return (
    <PageTransition>
      <PageHeader
        title="FDA Compliance"
        subtitle="Research Use Only (RUO) peptide websites & legal framework overview."
        image="https://images.unsplash.com/photo-1582719471384-894fbb16e074?auto=format&fit=crop&w=2400&q=80"
      />

      <main className="bg-white py-14 md:py-20">
        <div className="mx-auto max-w-10xl px-5 md:px-8">
          <div data-reveal="scale" className="mb-12 overflow-hidden rounded-[28px]">
            <img
              src="/images/lab-line.png"
              alt="Research laboratory operations"
              className="h-[220px] w-full object-cover object-center sm:h-[280px] md:h-[340px]"
            />
          </div>

          {/* Intro — Contact-page layout */}
          <div className="grid gap-10 md:grid-cols-2 md:gap-14">
            <div data-reveal="left">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan" />
                <span className="text-[11px] font-bold tracking-[0.28em] text-ink uppercase">
                  Regulatory scope
                </span>
              </div>
              <h2 className="mt-4 font-display text-2xl font-bold tracking-tight text-ink md:text-3xl">
                Executive summary & legal framework
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                FD&amp;C Act · 21 CFR § 312.160 &amp; § 201.128
              </p>
              <div className="mt-5 space-y-4 text-sm leading-relaxed text-muted">
                <p>
                  The U.S. Food and Drug Administration (FDA) does not recognize a blanket legal
                  exemption for online vendors selling active pharmaceutical ingredients under a
                  simple “Research Use Only” disclaimer. The RUO exemption under 21 CFR § 312.160 is
                  a strictly construed legal pathway intended solely for genuine laboratory research,
                  in vitro testing, or non-clinical animal studies.
                </p>
                <p>
                  Under 21 CFR § 201.128 (“Objective Intended Use”), the FDA evaluates the totality
                  of a website’s operations—including claims, customer interactions, product
                  presentation, and marketing—to determine actual intent. If objective evidence
                  suggests products are intended for human consumption, the RUO defense collapses.
                </p>
              </div>
            </div>

            <div
              data-reveal="right"
              data-reveal-delay="0.1"
              className="relative overflow-hidden rounded-3xl bg-navy p-6 text-white md:p-8"
            >
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(0,245,212,0.14),_transparent_55%)]" />
              <div className="relative">
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan" />
                  <p className="text-[11px] font-bold tracking-[0.28em] text-cyan uppercase">
                    Mandatory labeling
                  </p>
                </div>
                <p className="mt-3 text-[11px] font-medium tracking-wide text-white/45 uppercase">
                  21 CFR § 312.160(a)(3)
                </p>
                <p className="mt-4 text-sm leading-relaxed text-white/70">
                  All physical product containers, primary packaging, and online product listings
                  must prominently carry the exact statutory statement:
                </p>
                <p className="mt-5 rounded-2xl border border-white/12 bg-white/[0.06] px-4 py-4 text-sm font-medium leading-relaxed text-cyan">
                  “{RUO_CAUTION}”
                </p>
              </div>
            </div>
          </div>

          {/* Matrix */}
          <section className="mt-16 md:mt-20">
            <div data-reveal="up" className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan" />
              <span className="text-[11px] font-bold tracking-[0.28em] text-ink uppercase">
                Comparison matrix
              </span>
            </div>
            <h2
              data-reveal="up"
              className="mt-4 font-display text-2xl font-bold tracking-tight text-ink md:text-3xl"
            >
              Compliant vs. non-compliant RUO sites
            </h2>
            <p data-reveal="up" className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
              Summary standards for Research Use Only operations under FDA intended-use doctrine.
            </p>

            <div data-reveal-stagger data-stagger="0.08" className="mt-10 space-y-8">
              {matrix.map((row) => (
                <article key={row.feature}>
                  <h3 className="font-display text-base font-bold tracking-tight text-ink">
                    {row.feature}
                  </h3>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <div className="rounded-2xl border border-black/6 bg-white px-4 py-4">
                      <p className="mb-2 inline-flex items-center gap-2 text-[11px] font-bold tracking-[0.16em] text-cyan-dim uppercase">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-cyan/15 text-cyan">
                          <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                        </span>
                        Compliant
                      </p>
                      <p className="text-sm leading-relaxed text-muted">{row.compliant}</p>
                    </div>
                    <div className="rounded-2xl border border-black/6 bg-white px-4 py-4">
                      <p className="mb-2 inline-flex items-center gap-2 text-[11px] font-bold tracking-[0.16em] text-red-600 uppercase">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-red-50 text-red-600">
                          <X className="h-3.5 w-3.5" strokeWidth={2.5} />
                        </span>
                        Non-compliant
                      </p>
                      <p className="text-sm leading-relaxed text-muted">{row.nonCompliant}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          {/* Requirements */}
          <section className="mt-16 md:mt-20">
            <div data-reveal="up" className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan" />
              <span className="text-[11px] font-bold tracking-[0.28em] text-ink uppercase">
                Core requirements
              </span>
            </div>
            <h2
              data-reveal="up"
              className="mt-4 font-display text-2xl font-bold tracking-tight text-ink md:text-3xl"
            >
              Operating standards we follow
            </h2>
            <p data-reveal="up" className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
              How Peptide Ops Logistics maintains Research Use Only status across listings and
              fulfillment.
            </p>

            <div
              data-reveal-stagger
              data-stagger="0.12"
              className="mt-10 grid gap-5 md:grid-cols-2"
            >
              {requirements.map(({ icon: Icon, title, cite, text }) => (
                <article key={title} className="rounded-3xl bg-fog p-6 md:p-8">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full border border-cyan/40 bg-white text-cyan">
                    <Icon className="h-5 w-5" strokeWidth={1.8} />
                  </span>
                  <h3 className="mt-5 font-display text-lg font-bold text-ink">{title}</h3>
                  <p className="mt-1 text-[11px] font-bold tracking-[0.16em] text-cyan-dim uppercase">
                    {cite}
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-muted">{text}</p>
                </article>
              ))}
            </div>

            <div
              data-reveal="up"
              className="relative mt-5 overflow-hidden rounded-3xl bg-navy p-6 text-white md:p-8"
            >
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(0,245,212,0.12),_transparent_55%)]" />
              <div className="relative flex flex-col gap-4 sm:flex-row sm:gap-5">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-cyan/35 bg-white/5 text-cyan">
                  <FileWarning className="h-5 w-5" strokeWidth={1.8} />
                </span>
                <div>
                  <h3 className="font-display text-lg font-bold text-white">
                    Special statutory warning: Human Growth Hormone (HGH)
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/65">
                    Under 21 U.S.C. § 333(e), distributing HGH, Somatropin, or direct HGH
                    secretagogues outside authorized medical treatment constitutes a federal felony.
                    The “Research Use Only” exemption does{' '}
                    <span className="font-semibold text-cyan">not</span> protect vendors against
                    illegal HGH distribution charges.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </PageTransition>
  )
}
