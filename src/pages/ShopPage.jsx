import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Component, Search, ShoppingCart, X } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import PageTransition from '../components/PageTransition'
import Footer from '../components/Footer'
import PartnerSourcing from '../components/PartnerSourcing'
import VolumePricing from '../components/VolumePricing'
import { useCart } from '../context/CartContext'
import { useGsapReveal } from '../hooks/useGsapReveal'
import { lowestPrice, useCatalog } from '../context/CatalogContext'
import { assetUrl, formatPrice } from '../lib/api'
import ProductBadge from '../components/ProductBadge'
import { PRODUCT_CATEGORIES, normalizeCategory } from '../data/categories'

const filters = ['All', ...PRODUCT_CATEGORIES]

export default function ShopPage() {
  const { addItem } = useCart()
  const { products, loading, error, reload } = useCatalog()
  const [filter, setFilter] = useState('All')
  const [query, setQuery] = useState('')
  const gridRef = useRef(null)

  const list = useMemo(() => {
    const q = query.trim().toLowerCase()
    return products
      .filter((p) => {
        const matchFilter = filter === 'All' || normalizeCategory(p.category) === filter
        const matchQuery =
          !q ||
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.variants.some((v) => v.dose.toLowerCase().includes(q))
        return matchFilter && matchQuery
      })
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }))
  }, [products, filter, query])

  useGsapReveal(gridRef, [list])

  return (
    <PageTransition>
      <PageHeader
        title="Shop"
        subtitle="Research-grade lyophilized peptides with verified purity and certificates of analysis."
        image="/images/shop-hero-peptides.webp"
      />

      <main className="bg-white py-14 md:py-20">
        <div className="mx-auto max-w-10xl px-5 md:px-8">
          <div data-reveal="up" className="mb-12">
            <p className="mb-6 flex items-center justify-center gap-2.5 text-center text-sm text-ink sm:text-[15px]">
              <span
                className="inline-flex h-[18px] w-[26px] shrink-0 overflow-hidden rounded-[2px] shadow-[0_0_0_1px_rgba(0,0,0,0.08)]"
                aria-hidden
              >
                <svg viewBox="0 0 26 18" className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
                  <rect width="26" height="18" fill="#B22234" />
                  <path
                    d="M0 2h26M0 5h26M0 8h26M0 11h26M0 14h26"
                    stroke="#fff"
                    strokeWidth="1.4"
                  />
                  <rect width="11" height="9.5" fill="#3C3B6E" />
                </svg>
              </span>
              <span>All in-stock items ship within 24–48 hours.</span>
            </p>

            <label htmlFor="peptide-search" className="sr-only">
              Search peptides
            </label>
            <div className="relative mx-auto max-w-3xl">
              <div className="flex items-center gap-3 rounded-2xl border border-black/8 bg-fog px-4 py-3.5 shadow-sm transition focus-within:border-cyan focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgba(0,245,212,0.18)] md:px-5 md:py-4">
                <Search className="h-5 w-5 shrink-0 text-muted" strokeWidth={2} />
                <input
                  id="peptide-search"
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search peptides by name, dose, or category…"
                  className="w-full bg-transparent text-[15px] text-ink outline-none placeholder:text-muted/80"
                  autoComplete="off"
                />
                {query ? (
                  <button
                    type="button"
                    aria-label="Clear search"
                    onClick={() => setQuery('')}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-muted transition hover:text-ink"
                  >
                    <X className="h-4 w-4" />
                  </button>
                ) : (
                  <span className="hidden shrink-0 rounded-full bg-white px-3 py-1 text-[11px] font-semibold tracking-wide text-muted uppercase sm:inline">
                    Peptides
                  </span>
                )}
              </div>
            </div>
          </div>

          <div
            data-reveal="up"
            data-reveal-delay="0.08"
            className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between"
          >
            <div className="flex items-center gap-2">
              <Component className="h-4 w-4 text-cyan" strokeWidth={2.25} />
              <span className="text-[11px] font-bold tracking-[0.28em] text-ink uppercase">
                Catalog
              </span>
              <span className="ml-2 text-xs text-muted">
                {list.length} result{list.length === 1 ? '' : 's'}
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {filters.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setFilter(item)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    filter === item
                      ? 'bg-ink text-white'
                      : 'bg-fog text-muted hover:bg-fog-deep hover:text-ink'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="animate-pulse">
                  <div className="aspect-[3/4] w-full rounded-2xl bg-fog" />
                  <div className="mx-auto mt-4 h-3 w-2/3 rounded bg-fog" />
                  <div className="mx-auto mt-2 h-3 w-1/3 rounded bg-fog" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="rounded-3xl bg-fog px-6 py-16 text-center">
              <p className="font-display text-lg font-semibold text-ink">
                Could not load the catalog
              </p>
              <p className="mt-2 text-sm text-muted">{error}</p>
              <button
                type="button"
                onClick={reload}
                className="mt-5 inline-flex rounded-xl bg-cyan px-5 py-3 text-sm font-semibold text-ink transition hover:bg-cyan-dim"
              >
                Try again
              </button>
            </div>
          ) : list.length === 0 ? (
            <div data-reveal="scale" className="rounded-3xl bg-fog px-6 py-16 text-center">
              <p className="font-display text-lg font-semibold text-ink">No peptides found</p>
              <p className="mt-2 text-sm text-muted">
                Try another name or clear your search to browse the full catalog.
              </p>
              <button
                type="button"
                onClick={() => {
                  setQuery('')
                  setFilter('All')
                }}
                className="mt-5 inline-flex rounded-xl bg-cyan px-5 py-3 text-sm font-semibold text-ink transition hover:bg-cyan-dim"
              >
                Clear search
              </button>
            </div>
          ) : (
            <div
              ref={gridRef}
              data-reveal-managed
              data-reveal-stagger
              data-stagger="0.08"
              className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4"
            >
              {list.map((product) => (
                <article key={product.id} className="group text-center">
                  <div className="relative overflow-hidden rounded-2xl bg-[#f2f2f2]">
                    <ProductBadge label={product.badge} />
                    <div className="absolute top-3.5 right-3.5 z-10 flex -translate-y-1 flex-col gap-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                      <button
                        type="button"
                        aria-label={`Add ${product.name} to cart`}
                        onClick={() => {
                          const v = product.variants[0]
                          addItem({
                            productId: product.id,
                            variantId: v.id,
                            name: product.name,
                            dose: v.dose,
                            price: v.price,
                            image: v.image || product.image,
                            slug: product.slug,
                            qty: 1,
                          })
                        }}
                        className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-ink text-white shadow-md transition hover:scale-105 hover:bg-cyan hover:text-ink"
                      >
                        <ShoppingCart className="h-4 w-4" strokeWidth={2.2} />
                      </button>
                    </div>

                    <Link to={`/shop/${product.slug}`} className="block aspect-[3/4] w-full">
                      <img
                        src={assetUrl(product.image)}
                        alt={product.name}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                      />
                    </Link>
                  </div>

                  <div className="mt-4">
                    <p className="text-[11px] font-medium tracking-[0.18em] text-muted uppercase">
                      {product.variants.length} versions
                    </p>
                    <Link to={`/shop/${product.slug}`}>
                      <h3 className="mt-1 font-display text-base font-bold tracking-tight text-ink transition hover:text-cyan-dim">
                        {product.name}
                      </h3>
                    </Link>
                    <p className="mt-0.5 text-sm text-muted">
                      From {formatPrice(lowestPrice(product))}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          )}

          <div className="mt-14 flex flex-col gap-6 md:mt-16 md:gap-8">
            <VolumePricing />
            <PartnerSourcing />
          </div>
        </div>
      </main>

      <Footer />
    </PageTransition>
  )
}
