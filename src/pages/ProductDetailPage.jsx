import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { ArrowLeft, Check, Minus, Plus, ShoppingCart } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import PageTransition from '../components/PageTransition'
import Footer from '../components/Footer'
import RuoNotice from '../components/RuoNotice'
import ProductBadge, {
  firstInStockVariant,
  isProductOutOfStock,
  isVariantOutOfStock,
} from '../components/ProductBadge'
import { useCart } from '../context/CartContext'
import { lowestPrice, useCatalog } from '../context/CatalogContext'
import { assetUrl, formatPrice } from '../lib/api'
import { normalizeCategory } from '../data/categories'
import Seo from '../components/Seo'
import { absoluteUrl, productSeo } from '../data/seo'

export default function ProductDetailPage() {
  const { slug } = useParams()
  const { products, loading, getBySlug } = useCatalog()
  const product = getBySlug(slug)
  const { addItem } = useCart()

  const [variantId, setVariantId] = useState(() => product?.variants[0]?.id)
  const [qty, setQty] = useState(1)
  const [activeImage, setActiveImage] = useState(
    () => product?.variants[0]?.image || product?.image,
  )

  useEffect(() => {
    if (!product?.variants?.length) return
    const preferred = firstInStockVariant(product) || product.variants[0]
    setVariantId(preferred.id)
    setQty(1)
    // Detail view uses variant images only; main product image is for listings.
    setActiveImage(preferred.image || product.image)
  }, [slug, product])

  const variant = useMemo(
    () => product?.variants.find((v) => v.id === variantId) || product?.variants[0],
    [product, variantId],
  )

  const gallery = useMemo(() => {
    if (!product) return []
    const seen = new Set()
    const list = []

    // Product detail gallery = variant images only.
    // Main product.image is for shop/home cards — do not add it here, or the
    // same photo (often under a different /uploads/ path) shows as a 2nd thumb.
    for (const v of product.variants) {
      const src = v.image
      if (!src || seen.has(src)) continue
      seen.add(src)
      list.push({ src, variantId: v.id, dose: v.dose })
    }

    // Fallback when no variant has its own image.
    if (list.length === 0 && product.image) {
      list.push({
        src: product.image,
        variantId: product.variants[0]?.id ?? null,
        dose: product.variants[0]?.dose || 'Main',
      })
    }

    return list
  }, [product])

  const selectVariant = (id) => {
    setVariantId(id)
    setQty(1)
    const next = product.variants.find((v) => v.id === id)
    if (next?.image) setActiveImage(next.image)
  }

  const selectImage = (item) => {
    setActiveImage(item.src)
    if (item.variantId) setVariantId(item.variantId)
  }

  // The catalogue loads asynchronously, so only redirect once it has settled.
  if (loading && !product) {
    return (
      <PageTransition>
        <div className="flex min-h-[60vh] items-center justify-center bg-white">
          <span className="h-10 w-10 animate-spin rounded-full border-2 border-black/10 border-t-cyan" />
        </div>
      </PageTransition>
    )
  }

  if (!product || !variant) {
    return <Navigate to="/shop" replace />
  }

  const related = products
    .filter((p) => p.id !== product.id && normalizeCategory(p.category) === normalizeCategory(product.category))
    .slice(0, 4)

  const productOutOfStock = isProductOutOfStock(product)
  const variantOutOfStock = isVariantOutOfStock(variant)
  const stockLeft = Math.max(0, Number(variant.stock ?? variant.quantity ?? 0))
  const maxQty = Math.max(1, stockLeft)
  const seo = productSeo(product)
  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: seo.description,
    image: absoluteUrl(seo.image),
    sku: variant.barcode || variant.id,
    brand: { '@type': 'Brand', name: 'Peptide Ops' },
    category: product.category || 'Research peptides',
    offers: {
      '@type': 'Offer',
      priceCurrency: 'USD',
      price: Number(variant.price ?? 0).toFixed(2),
      availability: productOutOfStock
        ? 'https://schema.org/OutOfStock'
        : 'https://schema.org/InStock',
      url: absoluteUrl(seo.path),
    },
  }

  return (
    <PageTransition>
      <Seo {...seo} jsonLd={productJsonLd} />
      <PageHeader
        title={product.name}
        subtitle={product.summary}
        image="/images/lab-line.png"
      />

      <main className="bg-white py-12 md:py-16">
        <div className="mx-auto max-w-10xl px-5 md:px-8">
          <Link
            data-reveal="fade"
            to="/shop"
            className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-muted transition hover:text-ink"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to shop
          </Link>

          <div className="mx-auto grid max-w-5xl items-start gap-10 lg:grid-cols-2 lg:gap-12">
            <div
              data-reveal="left"
              className="mx-auto flex w-full max-w-[480px] gap-3 lg:mx-0"
            >
              {gallery.length > 1 ? (
                <div className="flex w-[72px] shrink-0 flex-col gap-2.5 sm:w-[84px]">
                  {gallery.map((item) => {
                    const active = item.src === activeImage
                    return (
                      <button
                        key={`${item.variantId}-${item.src}`}
                        type="button"
                        onClick={() => selectImage(item)}
                        className={`overflow-hidden rounded-xl bg-[#f2f2f2] transition ${
                          active
                            ? 'ring-2 ring-cyan ring-offset-2'
                            : 'opacity-80 hover:opacity-100'
                        }`}
                        aria-label={`Show ${item.dose} image`}
                      >
                        <img
                          src={assetUrl(item.src)}
                          alt={`${product.name} ${item.dose}`}
                          className="aspect-square w-full object-cover"
                        />
                      </button>
                    )
                  })}
                </div>
              ) : null}

              <div className="relative min-w-0 flex-1 overflow-hidden rounded-[24px] bg-[#f2f2f2]">
                <ProductBadge label={product.badge} outOfStock={productOutOfStock || variantOutOfStock} />
                <img
                  key={activeImage}
                  src={assetUrl(activeImage)}
                  alt={product.name}
                  className={`aspect-[3/4] w-full object-cover ${
                    productOutOfStock || variantOutOfStock ? 'opacity-70' : ''
                  }`}
                />
              </div>
            </div>

            <div data-reveal="right" data-reveal-delay="0.1" className="mx-auto w-full max-w-xl lg:mx-0">
              <p className="text-[11px] font-bold tracking-[0.28em] text-cyan uppercase">
                {product.category}
              </p>
              <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-ink md:text-4xl">
                {product.name}
              </h2>
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-muted md:text-base">
                {product.description}
              </p>

              <div className="mt-6 flex flex-wrap gap-3 text-sm">
                <span className="rounded-full bg-fog px-3 py-1.5 font-medium text-ink">
                  Purity {product.purity}
                </span>
                <span className="rounded-full bg-fog px-3 py-1.5 font-medium text-ink">
                  {product.form}
                </span>
              </div>

              <div className="mt-8">
                <p className="mb-3 text-sm font-semibold text-ink">Select version</p>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((v) => {
                    const active = v.id === variant.id
                    const soldOut = isVariantOutOfStock(v)
                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => selectVariant(v.id)}
                        className={`rounded-full px-4 py-2.5 text-sm font-medium transition ${
                          active
                            ? 'bg-ink text-white'
                            : 'bg-fog text-muted hover:bg-fog-deep hover:text-ink'
                        } ${soldOut ? 'opacity-55' : ''}`}
                      >
                        {v.dose}
                        {soldOut ? ' · Out of stock' : ''}
                      </button>
                    )
                  })}
                </div>
                <p className="mt-2 text-xs text-muted">
                  Same peptide compound — choose the dose / pack that fits your protocol.
                </p>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2 rounded-full bg-fog px-2 py-1.5">
                  <button
                    type="button"
                    aria-label="Decrease quantity"
                    disabled={variantOutOfStock}
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-ink transition hover:bg-fog-deep disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="min-w-8 text-center text-sm font-semibold text-ink">{qty}</span>
                  <button
                    type="button"
                    aria-label="Increase quantity"
                    disabled={variantOutOfStock || qty >= maxQty}
                    onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-ink transition hover:bg-fog-deep disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                <p className="font-display text-2xl font-bold text-ink">
                  {formatPrice(variant.price * qty)}
                </p>
              </div>

              {variantOutOfStock ? (
                <p className="mt-4 text-sm font-medium text-rose-600">
                  This version is out of stock and cannot be ordered.
                </p>
              ) : stockLeft <= 5 ? (
                <p className="mt-4 text-sm text-muted">Only {stockLeft} left in stock.</p>
              ) : null}

              <button
                type="button"
                disabled={variantOutOfStock}
                onClick={() => {
                  if (variantOutOfStock) return
                  addItem({
                    productId: product.id,
                    variantId: variant.id,
                    name: product.name,
                    dose: variant.dose,
                    barcode: variant.barcode,
                    price: variant.price,
                    image: variant.image || product.image,
                    slug: product.slug,
                    qty: Math.min(qty, maxQty),
                  })
                }}
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-cyan px-6 py-4 text-sm font-semibold text-ink transition hover:bg-cyan-dim disabled:cursor-not-allowed disabled:bg-fog disabled:text-muted sm:w-auto"
              >
                <ShoppingCart className="h-4 w-4" strokeWidth={2.2} />
                {variantOutOfStock ? 'Out of stock' : `Add ${variant.dose} to cart`}
              </button>

              <ul className="mt-8 space-y-2.5">
                {product.highlights.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-muted">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cyan/15 text-cyan">
                      <Check className="h-3 w-3" strokeWidth={3} />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>

              <div className="mt-8">
                <RuoNotice />
              </div>
            </div>
          </div>

          {related.length > 0 ? (
            <section className="mt-20">
              <h3
                data-reveal="up"
                className="font-display text-xl font-bold tracking-tight text-ink md:text-2xl"
              >
                Related in {product.category}
              </h3>
              <div
                data-reveal-stagger
                data-stagger="0.1"
                className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
              >
                {related.map((item) => {
                  const relatedOut = isProductOutOfStock(item)
                  return (
                    <Link key={item.id} to={`/shop/${item.slug}`} className="group text-center">
                      <div className="relative overflow-hidden rounded-2xl bg-[#f2f2f2]">
                        <ProductBadge label={item.badge} outOfStock={relatedOut} />
                        <img
                          src={assetUrl(item.image)}
                          alt={item.name}
                          className={`aspect-[3/4] w-full object-cover transition duration-500 group-hover:scale-[1.03] ${
                            relatedOut ? 'opacity-70' : ''
                          }`}
                        />
                      </div>
                      <h4 className="mt-4 font-display text-base font-bold text-ink">{item.name}</h4>
                      <p className="mt-0.5 text-sm text-muted">
                        {relatedOut ? 'Out of stock' : `From ${formatPrice(lowestPrice(item))}`}
                      </p>
                    </Link>
                  )
                })}
              </div>
            </section>
          ) : null}
        </div>
      </main>

      <Footer />
    </PageTransition>
  )
}
