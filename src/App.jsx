import { BrowserRouter, Routes, Route, useLocation, useNavigationType } from 'react-router-dom'
import { useEffect, useLayoutEffect, useState } from 'react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import gsap from 'gsap'
import HomePage from './pages/HomePage'
import ShopPage from './pages/ShopPage'
import ContactPage from './pages/ContactPage'
import FaqPage from './pages/FaqPage'
import ProductDetailPage from './pages/ProductDetailPage'
import CheckoutPage from './pages/CheckoutPage'
import WhatsAppFloat from './components/WhatsAppFloat'
import CartDrawer from './components/CartDrawer'
import PromoModal from './components/PromoModal'
import Gatekeeper, { isGatePassed } from './components/Gatekeeper'
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
    // Keep gate scroll-lock intact while portal verification is required
    if (document.documentElement.dataset.gateLocked === '1') {
      if (hash) return
      scrollToTopInstant()
      return
    }

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
  const [gateOpen, setGateOpen] = useState(() => !isGatePassed())
  const [gateMountKey, setGateMountKey] = useState(0)

  // If someone removes/hides the gate via DevTools, remount it until verified
  useEffect(() => {
    if (!gateOpen) return undefined

    const tick = () => {
      if (isGatePassed()) {
        setGateOpen(false)
        return
      }
      setGateOpen(true)
      if (!document.getElementById('gatekeeper-root')) {
        setGateMountKey((k) => k + 1)
      }
    }

    const id = window.setInterval(tick, 400)
    return () => window.clearInterval(id)
  }, [gateOpen])

  const handleGatePass = () => {
    if (!isGatePassed()) return
    setGateOpen(false)
  }

  return (
    <BrowserRouter>
      <CartProvider>
        <RouteEffects />
        <div
          id="app-shell"
          {...(gateOpen ? { inert: true } : {})}
          aria-hidden={gateOpen || undefined}
          className={gateOpen ? 'pointer-events-none select-none' : undefined}
        >
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/shop" element={<ShopPage />} />
            <Route path="/shop/:slug" element={<ProductDetailPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/faq" element={<FaqPage />} />
            <Route path="/contact" element={<ContactPage />} />
          </Routes>
        </div>
        {!gateOpen ? (
          <>
            <CartDrawer />
            <PromoModal />
            <WhatsAppFloat />
          </>
        ) : null}
        {gateOpen ? <Gatekeeper key={gateMountKey} onPass={handleGatePass} /> : null}
      </CartProvider>
    </BrowserRouter>
  )
}
