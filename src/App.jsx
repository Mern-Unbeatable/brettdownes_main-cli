import { BrowserRouter, Routes, Route, useLocation, useNavigationType } from 'react-router-dom'
import { useEffect, useLayoutEffect } from 'react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import gsap from 'gsap'
import HomePage from './pages/HomePage'
import ShopPage from './pages/ShopPage'
import ContactPage from './pages/ContactPage'
import ProductDetailPage from './pages/ProductDetailPage'
import CheckoutPage from './pages/CheckoutPage'
import CompliancePage from './pages/CompliancePage'
import WhatsAppFloat from './components/WhatsAppFloat'
import CartDrawer from './components/CartDrawer'
import PromoModal from './components/PromoModal'
import { CartProvider } from './context/CartContext'

gsap.registerPlugin(ScrollTrigger)

function scrollToTopInstant() {
  const html = document.documentElement
  const body = document.body
  const prevHtml = html.style.scrollBehavior
  const prevBody = body.style.scrollBehavior

  html.style.scrollBehavior = 'auto'
  body.style.scrollBehavior = 'auto'

  window.scrollTo(0, 0)
  html.scrollTop = 0
  body.scrollTop = 0
  if (document.scrollingElement) document.scrollingElement.scrollTop = 0

  html.style.scrollBehavior = prevHtml
  body.style.scrollBehavior = prevBody
}

function RouteEffects() {
  const { pathname, hash } = useLocation()
  const navType = useNavigationType()

  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual'
    }
  }, [])

  // Run before paint so the new page never shows mid-scroll
  useLayoutEffect(() => {
    document.body.classList.remove('drawer-open')
    document.body.style.paddingRight = ''
    document.body.style.overflow = ''
    document.body.style.pointerEvents = ''

    if (hash) return
    scrollToTopInstant()
  }, [pathname, hash, navType])

  useEffect(() => {
    if (hash) {
      const id = hash.replace('#', '')
      const t = window.setTimeout(() => {
        const el = document.getElementById(id)
        if (el) el.scrollIntoView({ behavior: 'smooth' })
        ScrollTrigger.refresh()
      }, 50)
      return () => window.clearTimeout(t)
    }

    scrollToTopInstant()

    const t1 = window.setTimeout(() => {
      scrollToTopInstant()
      ScrollTrigger.refresh()
      scrollToTopInstant()
    }, 50)

    const t2 = window.setTimeout(scrollToTopInstant, 200)

    return () => {
      window.clearTimeout(t1)
      window.clearTimeout(t2)
    }
  }, [pathname, hash, navType])

  return null
}

export default function App() {
  return (
    <BrowserRouter>
      <CartProvider>
        <RouteEffects />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/shop/:slug" element={<ProductDetailPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/compliance" element={<CompliancePage />} />
          <Route path="/contact" element={<ContactPage />} />
        </Routes>
        <CartDrawer />
        <PromoModal />
        <WhatsAppFloat />
      </CartProvider>
    </BrowserRouter>
  )
}
