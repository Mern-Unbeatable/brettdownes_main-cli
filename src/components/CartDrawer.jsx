import { Link } from 'react-router-dom'
import { Minus, Plus, Trash2 } from 'lucide-react'
import SideDrawer from './SideDrawer'
import { useCart } from '../context/CartContext'
import { assetUrl, formatPrice } from '../lib/api'

export default function CartDrawer() {
  const { items, subtotal, cartOpen, closeCart, updateQty, removeItem } = useCart()

  return (
    <SideDrawer open={cartOpen} onClose={closeCart} title="Your Cart">
      <div className="flex h-full flex-col">
        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center py-10 text-center">
            <p className="text-sm text-muted">Your cart is empty.</p>
            <Link
              to="/shop"
              onClick={closeCart}
              className="mt-4 rounded-full bg-cyan px-5 py-2.5 text-sm font-semibold text-ink transition hover:bg-cyan-dim"
            >
              Browse shop
            </Link>
          </div>
        ) : (
          <>
            <ul className="flex-1 space-y-4">
              {items.map((item) => (
                <li
                  key={`${item.productId}-${item.variantId}`}
                  className="flex items-start gap-3 rounded-2xl border border-black/6 bg-fog/70 p-3"
                >
                  <img
                    src={assetUrl(item.image)}
                    alt={item.name}
                    className="h-16 w-16 shrink-0 rounded-xl object-cover bg-white"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-sm font-semibold text-ink">{item.name}</p>
                    <p className="mt-0.5 text-xs text-muted">{item.dose}</p>
                    <p className="mt-1 text-sm font-medium text-ink">{formatPrice(item.price)}</p>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 rounded-full bg-white px-1.5 py-1 ring-1 ring-black/8">
                        <button
                          type="button"
                          aria-label="Decrease"
                          onClick={() => updateQty(item.productId, item.variantId, -1)}
                          className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-fog"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="min-w-5 text-center text-sm font-semibold">{item.qty}</span>
                        <button
                          type="button"
                          aria-label="Increase"
                          onClick={() => updateQty(item.productId, item.variantId, 1)}
                          className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-fog"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <button
                        type="button"
                        aria-label="Remove"
                        onClick={() => removeItem(item.productId, item.variantId)}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-fog text-ink transition hover:bg-fog-deep"
                      >
                        <Trash2 className="h-4 w-4" strokeWidth={1.8} />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-6 border-t border-black/8 pt-5">
              <div className="mb-4 flex items-center justify-between text-sm">
                <span className="text-muted">Subtotal</span>
                <span className="font-display text-base font-semibold text-ink">
                  {formatPrice(subtotal)}
                </span>
              </div>
              <Link
                to="/checkout"
                onClick={closeCart}
                className="flex w-full items-center justify-center rounded-full bg-cyan py-3.5 text-sm font-semibold text-navy transition hover:brightness-110"
              >
                Checkout
              </Link>
            </div>
          </>
        )}
      </div>
    </SideDrawer>
  )
}
