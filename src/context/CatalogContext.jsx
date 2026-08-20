import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api } from '../lib/api'
import { useAuth } from './AuthContext'

const CatalogContext = createContext(null)

export function CatalogProvider({ children }) {
  const { isAuthenticated, ready: authReady } = useAuth()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await api.get('/api/products')
      const next = [...(data.products || [])].sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
      )
      setProducts(next)
    } catch (err) {
      setError(err.message)
      setProducts([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!authReady) return
    // The catalogue lives behind the portal gate, so wait for a session.
    if (!isAuthenticated) {
      setProducts([])
      setLoading(false)
      return
    }
    load()
  }, [authReady, isAuthenticated, load])

  const value = useMemo(() => {
    const categories = [...new Set(products.map((product) => product.category))].filter(Boolean)
    return {
      products,
      categories,
      loading,
      error,
      reload: load,
      getBySlug: (slug) => products.find((product) => product.slug === slug),
    }
  }, [products, loading, error, load])

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>
}

export function useCatalog() {
  const ctx = useContext(CatalogContext)
  if (!ctx) throw new Error('useCatalog must be used within CatalogProvider')
  return ctx
}

export function lowestPrice(product) {
  if (!product?.variants?.length) return 0
  return Math.min(...product.variants.map((variant) => variant.price))
}
