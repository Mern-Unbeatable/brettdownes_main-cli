import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { ArrowLeft, Check, Minus, Plus, ShoppingCart } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import PageTransition from '../components/PageTransition'
import Footer from '../components/Footer'
import RuoNotice from '../components/RuoNotice'
import { useCart } from '../context/CartContext'
import { formatPrice, getProductBySlug, products } from '../data/site'

export default function ProductDetailPage() {
  const { slug } = useParams()
  const product = getProductBySlug(slug)
  const { addItem } = useCart()

  const [variantId, setVariantId] = useState(() => product?.variants[0]?.id)
  const [qty, setQty] = useState(1)
  const [activeImage, setActiveImage] = useState(
    () => product?.variants[0]?.image || product?.image,
  )

  useEffect(() => {
    if (!product) return
    setVariantId(product.variants[0].id)
    setQty(1)
    setActiveImage(product.variants[0].image || product.image)
  }, [slug, product])

  const variant = useMemo(
    () => product?.variants.find((v) => v.id === variantId) || product?.variants[0],
    [product, variantId],
  )

  const gallery = useMemo(() => {
    if (!product) return []
    const seen = new Set()
    const list = []
    for (const v of product.variants) {
      const src = v.image || product.image
      if (!seen.has(src)) {
        seen.add(src)
        list.push({ src, variantId: v.id, dose: v.dose })
      }
    }
    if (!seen.has(product.image)) {
      list.unshift({ src: product.image, variantId: product.variants[0].id, dose: 'Main' })
    }
    return list
  }, [product])

  const selectVariant = (id) => {
    setVariantId(id)
    const next = product.variants.find((v) => v.id === id)
    if (next?.image) setActiveImage(next.image)
  }

  const selectImage = (item) => {
    setActiveImage(item.src)
    if (item.variantId) setVariantId(item.variantId)
  }

  if (!product) {
    return <Navigate to="/shop" replace />
  }

  const related = products.filter((p) => p.id !== product.id && p.category === product.category).slice(0, 4)

  return (
    <PageTransition>
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
                        src={item.src}
                        alt={`${product.name} ${item.dose}`}
                        className="aspect-square w-full object-cover"
                      />
                    </button>
                  )
                })}
              </div>

              <div className="min-w-0 flex-1 overflow-hidden rounded-[24px] bg-[#f2f2f2]">
                <img
                  key={activeImage}
                  src={activeImage}
                  alt={product.name}
                  className="aspect-[3/4] w-full object-cover"
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
              <p className="mt-3 text-sm leading-relaxed text-muted md:text-base">
                {product.description}
              </p>

              <div className="mt-6 flex flex-wrap gap-3 text-sm">
                <span className="rounded-full bg-fog px-3 py-1.5 font-medium text-ink">
                  Purity {product.purity}
                </span>
                <span className="rounded-full bg-fog px-3 py-1.5 font-medium text-ink">
                  {product.form}
                </span>
                <span className="rounded-full bg-fog px-3 py-1.5 font-medium text-ink">
                  SKU {variant.sku}
                </span>
              </div>

              <div className="mt-8">
                <p className="mb-3 text-sm font-semibold text-ink">Select version</p>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((v) => {
                    const active = v.id === variant.id
                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => selectVariant(v.id)}
                        className={`rounded-full px-4 py-2.5 text-sm font-medium transition ${
                          active
                            ? 'bg-ink text-white'
                            : 'bg-fog text-muted hover:bg-fog-deep hover:text-ink'
                        }`}
                      >
                        {v.dose}
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
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-ink transition hover:bg-fog-deep"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="min-w-8 text-center text-sm font-semibold text-ink">{qty}</span>
                  <button
                    type="button"
                    aria-label="Increase quantity"
                    onClick={() => setQty((q) => q + 1)}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-ink transition hover:bg-fog-deep"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                <p className="font-display text-2xl font-bold text-ink">
                  {formatPrice(variant.price * qty)}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  addItem({
                    productId: product.id,
                    variantId: variant.id,
                    name: product.name,
                    dose: variant.dose,
                    price: variant.price,
                    image: variant.image || product.image,
                    slug: product.slug,
                    qty,
                  })
                }
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-cyan px-6 py-4 text-sm font-semibold text-ink transition hover:bg-cyan-dim sm:w-auto"
              >
                <ShoppingCart className="h-4 w-4" strokeWidth={2.2} />
                Add {variant.dose} to cart
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
                {related.map((item) => (
                  <Link key={item.id} to={`/shop/${item.slug}`} className="group text-center">
                    <div className="overflow-hidden rounded-2xl bg-[#f2f2f2]">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="aspect-[3/4] w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                      />
                    </div>
                    <h4 className="mt-4 font-display text-base font-bold text-ink">{item.name}</h4>
                    <p className="mt-0.5 text-sm text-muted">
                      From {formatPrice(Math.min(...item.variants.map((v) => v.price)))}
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </main>

      <Footer />
    </PageTransition>
  )
}
