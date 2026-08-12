import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
  useNavigationType,
} from 'react-router-dom'
import { lazy, Suspense, useEffect, useLayoutEffect, useState } from 'react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import gsap from 'gsap'
import HomePage from './pages/HomePage'
import ShopPage from './pages/ShopPage'
import ContactPage from './pages/ContactPage'
import FaqPage from './pages/FaqPage'
import CoaPage from './pages/CoaPage'
import TermsOfServicePage from './pages/TermsOfServicePage'
import PrivacyPolicyPage from './pages/PrivacyPolicyPage'
import ProductDetailPage from './pages/ProductDetailPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import WhatsAppFloat from './components/WhatsAppFloat'
import CartDrawer from './components/CartDrawer'
import PromoModal from './components/PromoModal'
import Gatekeeper from './components/Gatekeeper'
import { ToastProvider } from './components/Toaster'
import { CartProvider } from './context/CartContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import { SettingsProvider } from './context/SettingsContext'
import { CatalogProvider } from './context/CatalogContext'
import { RequireAdmin, RequireAuth } from './components/RouteGuards'

// Checkout pulls in Stripe.js and the dashboards are only for signed-in staff and
// researchers, so neither belongs in the storefront's first-load bundle.
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'))
const CheckoutSuccessPage = lazy(() => import('./pages/CheckoutSuccessPage'))
const CheckoutCancelPage = lazy(() => import('./pages/CheckoutCancelPage'))
const DashboardLayout = lazy(() => import('./pages/dashboard/DashboardLayout'))
const UserOverview = lazy(() => import('./pages/dashboard/user/UserOverview'))
const UserOrders = lazy(() => import('./pages/dashboard/user/UserOrders'))
const UserOrderDetail = lazy(() => import('./pages/dashboard/user/UserOrderDetail'))
const UserProfile = lazy(() => import('./pages/dashboard/user/UserProfile'))
const AdminProfile = lazy(() => import('./pages/dashboard/admin/AdminProfile'))
const UserSettings = lazy(() => import('./pages/dashboard/user/UserSettings'))
const AdminOverview = lazy(() => import('./pages/dashboard/admin/AdminOverview'))
const AdminProducts = lazy(() => import('./pages/dashboard/admin/AdminProducts'))
const AdminProductEditor = lazy(() => import('./pages/dashboard/admin/AdminProductEditor'))
const AdminOrders = lazy(() => import('./pages/dashboard/admin/AdminOrders'))
const AdminOrderDetail = lazy(() => import('./pages/dashboard/admin/AdminOrderDetail'))
const AdminCustomers = lazy(() => import('./pages/dashboard/admin/AdminCustomers'))
const AdminSettings = lazy(() => import('./pages/dashboard/admin/AdminSettings'))

gsap.registerPlugin(ScrollTrigger)

/** Routes that must stay reachable without a portal session. */
const PUBLIC_PATHS = ['/reset-password']

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

function RouteFallback() {
  return (
    <div className="grid min-h-screen place-items-center bg-navy">
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-cyan" />
    </div>
  )
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

function AppShell() {
  const { ready, isAuthenticated } = useAuth()
  const { pathname } = useLocation()
  const [gateMountKey, setGateMountKey] = useState(0)

  const isPublicRoute = PUBLIC_PATHS.some((path) => pathname.startsWith(path))
  const isPortalRoute = pathname.startsWith('/dashboard') || pathname.startsWith('/admin')
  // Hold the gate closed until the session check finishes so it never flashes
  // for an already-signed-in researcher.
  const gateOpen = ready && !isAuthenticated && !isPublicRoute

  // If someone removes/hides the gate via DevTools, remount it until verified
  useEffect(() => {
    if (!gateOpen) return undefined

    const tick = () => {
      if (!document.getElementById('gatekeeper-root')) {
        setGateMountKey((k) => k + 1)
      }
    }

    const id = window.setInterval(tick, 400)
    return () => window.clearInterval(id)
  }, [gateOpen])

  return (
    <>
      <RouteEffects />
      <div
        id="app-shell"
        {...(gateOpen ? { inert: true } : {})}
        aria-hidden={gateOpen || undefined}
        className={gateOpen ? 'pointer-events-none select-none' : undefined}
      >
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/shop" element={<ShopPage />} />
            <Route path="/shop/:slug" element={<ProductDetailPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/checkout/success" element={<CheckoutSuccessPage />} />
            <Route path="/checkout/cancel" element={<CheckoutCancelPage />} />
            <Route path="/faq" element={<FaqPage />} />
            <Route path="/coa" element={<CoaPage />} />
            <Route path="/terms" element={<TermsOfServicePage />} />
            <Route path="/privacy" element={<PrivacyPolicyPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />

            <Route element={<RequireAuth />}>
              <Route path="/dashboard" element={<DashboardLayout scope="user" />}>
                <Route index element={<UserOverview />} />
                <Route path="orders" element={<UserOrders />} />
                <Route path="orders/:id" element={<UserOrderDetail />} />
                <Route path="profile" element={<UserProfile />} />
                <Route path="settings" element={<UserSettings />} />
              </Route>
            </Route>

            <Route element={<RequireAdmin />}>
              <Route path="/admin" element={<DashboardLayout scope="admin" />}>
                <Route index element={<AdminOverview />} />
                <Route path="products" element={<AdminProducts />} />
                <Route path="products/new" element={<AdminProductEditor />} />
                <Route path="products/:id" element={<AdminProductEditor />} />
                <Route path="orders" element={<AdminOrders />} />
                <Route path="orders/:id" element={<AdminOrderDetail />} />
                <Route path="customers" element={<AdminCustomers />} />
                <Route path="settings" element={<AdminSettings />} />
                <Route path="profile" element={<AdminProfile />} />
              </Route>
            </Route>
          </Routes>
        </Suspense>
      </div>

      {!gateOpen && !isPortalRoute ? (
        <>
          <CartDrawer />
          <PromoModal />
          <WhatsAppFloat />
        </>
      ) : null}

      {gateOpen ? <Gatekeeper key={gateMountKey} /> : null}
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <SettingsProvider>
            <CatalogProvider>
              <CartProvider>
                <AppShell />
              </CartProvider>
            </CatalogProvider>
          </SettingsProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  )
}
