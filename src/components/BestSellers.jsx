import { Link } from 'react-router-dom'
import { Component, ShoppingCart } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { formatPrice, lowestPrice, products } from '../data/site'

export default function BestSellers() {
  const { addItem } = useCart()
  const featured = products.slice(0, 4)

  return (
    <section id="shop" className="bg-white py-16 md:py-24">
      <div className="mx-auto max-w-10xl px-5 md:px-8">
        <div data-reveal="up" className="mb-12 flex flex-col items-center gap-3 text-center">
          <div className="flex items-center gap-2">
            <Component className="h-4 w-4 text-cyan" strokeWidth={2.25} />
            <span className="text-[11px] font-bold tracking-[0.28em] text-ink uppercase">
              Best Sellers
            </span>
          </div>
          <h2 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl md:text-[2rem]">
            Precision formulas for research
          </h2>
        </div>

        <div data-reveal-stagger data-stagger="0.12" className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {featured.map((product) => (
            <article key={product.id} className="group text-center">
              <div className="relative overflow-hidden rounded-2xl bg-[#f2f2f2]">
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
                    src={product.image}
                    alt={product.name}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                  />
                </Link>
              </div>

              <div className="mt-4">
                <Link to={`/shop/${product.slug}`}>
                  <h3 className="font-display text-base font-bold tracking-tight text-ink transition hover:text-cyan-dim">
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

        <div data-reveal="up" className="mt-12 flex items-center justify-between gap-6">
          <div className="progress-track-dark hidden w-44 sm:block" aria-hidden />
          <Link
            to="/shop"
            className="ml-auto inline-flex items-center gap-2.5 rounded-xl bg-cyan px-6 py-3.5 text-sm font-semibold text-ink transition hover:bg-cyan-dim"
          >
            Shop Now
            <ShoppingCart className="h-4 w-4" strokeWidth={2.2} />
          </Link>
        </div>
      </div>
    </section>
  )
}
