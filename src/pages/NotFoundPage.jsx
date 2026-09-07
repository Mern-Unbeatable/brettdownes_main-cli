import { Link } from 'react-router-dom'
import { ArrowLeft, Home } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import PageTransition from '../components/PageTransition'
import Footer from '../components/Footer'
import Seo from '../components/Seo'
import { pageSeo } from '../data/seo'

export default function NotFoundPage() {
  return (
    <PageTransition>
      <Seo {...pageSeo.notFound} />
      <PageHeader />
      <main className="bg-white py-16 md:py-24">
        <div className="mx-auto max-w-xl px-5 text-center md:px-8">
          <p className="font-display text-[11px] font-bold tracking-[0.28em] text-cyan uppercase">
            Error 404
          </p>
          <h1 className="mt-4 font-display text-4xl font-extrabold tracking-tight text-ink md:text-5xl">
            Page not found
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-muted md:text-base">
            The page you are looking for does not exist or may have been moved. Head back to the
            storefront or browse the research catalogue.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-xl bg-cyan px-6 py-3 text-sm font-semibold text-navy transition hover:brightness-110"
            >
              <Home className="h-4 w-4" strokeWidth={2} />
              Back to home
            </Link>
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 rounded-xl bg-fog px-6 py-3 text-sm font-semibold text-ink transition hover:bg-fog-deep"
            >
              <ArrowLeft className="h-4 w-4" strokeWidth={2} />
              Browse shop
            </Link>
          </div>
          <p className="mt-8 text-[11px] text-muted">
            For Research Use Only; Not for Human Consumption.
          </p>
        </div>
      </main>
      <Footer />
    </PageTransition>
  )
}
