import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const CartContext = createContext(null)
const STORAGE_KEY = 'peptide-ops-cart'

function loadCart() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => loadCart())
  const [cartOpen, setCartOpen] = useState(false)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items])

  const addItem = (item) => {
    setItems((prev) => {
      const key = `${item.productId}-${item.variantId}`
      const existing = prev.find((p) => `${p.productId}-${p.variantId}` === key)
      if (existing) {
        return prev.map((p) =>
          `${p.productId}-${p.variantId}` === key
            ? { ...p, qty: p.qty + (item.qty || 1) }
            : p,
        )
      }
      return [...prev, { ...item, qty: item.qty || 1 }]
    })
    setCartOpen(true)
  }

  const updateQty = (productId, variantId, delta) => {
    setItems((prev) =>
      prev
        .map((item) =>
          item.productId === productId && item.variantId === variantId
            ? { ...item, qty: Math.max(0, item.qty + delta) }
            : item,
        )
        .filter((item) => item.qty > 0),
    )
  }

  const removeItem = (productId, variantId) => {
    setItems((prev) =>
      prev.filter((item) => !(item.productId === productId && item.variantId === variantId)),
    )
  }

  const clearCart = () => setItems([])

  const count = useMemo(() => items.reduce((sum, item) => sum + item.qty, 0), [items])
  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.qty, 0),
    [items],
  )

  const value = {
    items,
    count,
    subtotal,
    cartOpen,
    setCartOpen,
    openCart: () => setCartOpen(true),
    closeCart: () => setCartOpen(false),
    addItem,
    updateQty,
    removeItem,
    clearCart,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
