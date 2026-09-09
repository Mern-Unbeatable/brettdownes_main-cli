import { Link } from 'react-router-dom'

/**
 * Crawlable brand + internal-link block for homepage SEO / AI search.
 * Keeps one job: explain who we are and point to public info pages.
 */
export default function HomeBrandSeo() {
  return (
    <section className="border-t border-fog-deep bg-fog/40 py-16 md:py-20" aria-labelledby="brand-seo-heading">
      <div className="mx-auto max-w-3xl px-5 text-center md:px-8">
        <h2
          id="brand-seo-heading"
          className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl"
        >
          Peptide Ops Logistics
        </h2>
        <p className="mt-4 text-sm leading-relaxed text-muted sm:text-[15px]">
          Peptide Ops Logistics (peptideopslogistics.com) provides research-grade lyophilized
          peptides with verified purity documentation for qualified laboratories and institutional
          partners. Catalogue access is reserved for approved researchers. Products are labeled
          for research use only and are not intended for human consumption.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-muted sm:text-[15px]">
          Learn about shipping and quality standards, review certificates of analysis, or reach
          our team for institutional orders and compound sourcing requests.
        </p>
        <nav
          aria-label="Peptide Ops Logistics resources"
          className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm font-semibold text-ink"
        >
          <Link to="/faq" className="underline-offset-4 transition hover:text-cyan-dim hover:underline">
            FAQ
          </Link>
          <Link to="/coa" className="underline-offset-4 transition hover:text-cyan-dim hover:underline">
            Certificates of Analysis
          </Link>
          <Link
            to="/contact"
            className="underline-offset-4 transition hover:text-cyan-dim hover:underline"
          >
            Contact
          </Link>
          <Link
            to="/terms"
            className="underline-offset-4 transition hover:text-cyan-dim hover:underline"
          >
            Terms
          </Link>
          <Link
            to="/privacy"
            className="underline-offset-4 transition hover:text-cyan-dim hover:underline"
          >
            Privacy
          </Link>
        </nav>
      </div>
    </section>
  )
}
