import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { api } from '../lib/api'
import { useAuth } from './AuthContext'

const CartContext = createContext(null)
// Bumped to v2 when variant ids moved from static strings to database uuids;
// carts saved under the old key would no longer resolve at checkout.
const STORAGE_KEY = 'peptide-ops-cart-v2'

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
  const { user, ready: authReady } = useAuth()
  const [items, setItems] = useState(() => loadCart())
  const [cartOpen, setCartOpen] = useState(false)
  const [cartReady, setCartReady] = useState(false)
  const hydratedUserId = useRef(null)
  const skipNextSave = useRef(false)
  const saveTimer = useRef(null)

  // Load the signed-in user's persisted cart. A pre-login local cart is
  // migrated once when the account has no server cart yet.
  useEffect(() => {
    if (!authReady) return undefined

    window.clearTimeout(saveTimer.current)
    let active = true

    if (!user) {
      hydratedUserId.current = null
      setItems(loadCart())
      setCartReady(true)
      return undefined
    }

    setCartReady(false)
    hydratedUserId.current = null

    async function hydrate() {
      try {
        let data = await api.get('/api/cart')
        const localItems = loadCart()

        if (!data.items?.length && localItems.length) {
          data = await api.put('/api/cart', {
            items: localItems.map(({ variantId, qty }) => ({ variantId, qty })),
          })
        }

        if (!active) return
        skipNextSave.current = true
        setItems(data.items || [])
        localStorage.removeItem(STORAGE_KEY)
        hydratedUserId.current = user.id
      } catch (error) {
        if (!active) return
        // Keep the local cart usable during a temporary API outage.
        console.error('Could not load saved cart:', error)
        hydratedUserId.current = user.id
      } finally {
        if (active) setCartReady(true)
      }
    }

    hydrate()
    return () => {
      active = false
      window.clearTimeout(saveTimer.current)
    }
  }, [authReady, user])

  // Persist every cart change. Signed-in carts live in Postgres; localStorage
  // remains only as a fallback for a cart created before authentication.
  useEffect(() => {
    if (!authReady || !cartReady) return undefined

    if (!user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
      return undefined
    }

    if (hydratedUserId.current !== user.id) return undefined
    if (skipNextSave.current) {
      skipNextSave.current = false
      return undefined
    }

    window.clearTimeout(saveTimer.current)
    saveTimer.current = window.setTimeout(() => {
      api
        .put('/api/cart', {
          items: items.map(({ variantId, qty }) => ({ variantId, qty })),
        })
        .catch((error) => console.error('Could not save cart:', error))
    }, 250)

    return () => window.clearTimeout(saveTimer.current)
  }, [items, user, authReady, cartReady])

  const addItem = useCallback((item) => {
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
  }, [])

  const updateQty = useCallback((productId, variantId, delta) => {
    setItems((prev) =>
      prev
        .map((item) =>
          item.productId === productId && item.variantId === variantId
            ? { ...item, qty: Math.max(0, item.qty + delta) }
            : item,
        )
        .filter((item) => item.qty > 0),
    )
  }, [])

  const removeItem = useCallback((productId, variantId) => {
    setItems((prev) =>
      prev.filter((item) => !(item.productId === productId && item.variantId === variantId)),
    )
  }, [])

  const clearCart = useCallback(() => setItems([]), [])

  const count = useMemo(() => items.reduce((sum, item) => sum + item.qty, 0), [items])
  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.qty, 0),
    [items],
  )

  const value = {
    items,
    cartReady,
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
