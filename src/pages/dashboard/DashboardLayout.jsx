import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ChevronLeft,
  BadgePercent,
  Beaker,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Settings,
  ShoppingBag,
  User,
  Users,
  X,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../components/Toaster'
import { lockBodyScroll, unlockBodyScroll } from '../../hooks/lockBodyScroll'

const NAV = {
  user: [
    { to: '/dashboard', end: true, label: 'Overview', icon: LayoutDashboard },
    { to: '/dashboard/orders', label: 'My orders', icon: Package },
    { to: '/dashboard/profile', label: 'Profile', icon: User },
    { to: '/dashboard/settings', label: 'Settings', icon: Settings },
  ],
  admin: [
    { to: '/admin', end: true, label: 'Overview', icon: LayoutDashboard },
    { to: '/admin/products', label: 'Products', icon: ShoppingBag },
    { to: '/admin/coa', label: 'COA library', icon: Beaker },
    { to: '/admin/orders', label: 'Orders', icon: Package },
    { to: '/admin/customers', label: 'Customers', icon: Users },
    { to: '/admin/discounts', label: 'Discounts & coupons', icon: BadgePercent },
    { to: '/admin/settings', label: 'Settings', icon: Settings },
    { to: '/admin/profile', label: 'Profile', icon: User },
  ],
}

const SIDEBAR_KEY = 'peptide-ops-sidebar-collapsed'

function SidebarContent({ scope, collapsed, onNavigate, user, isAdmin, onLogout }) {
  const items = NAV[scope] || NAV.user
  const portalLabel = isAdmin && scope === 'admin' ? 'Admin portal' : 'Research portal'

  return (
    <div className="flex h-full flex-col">
      <div
        className={`flex shrink-0 flex-col items-center border-b border-white/8 px-3 pt-4 pb-3 ${
          collapsed ? 'lg:px-1.5 lg:pt-3 lg:pb-2.5' : ''
        }`}
      >
        <Link
          to="/"
          onClick={onNavigate}
          className="flex w-full flex-col items-center gap-1.5 text-center"
        >
          <img
            src="/images/logo.png"
            alt="Peptide Ops"
            className={`object-contain object-center ${
              collapsed ? 'h-11 w-11' : 'h-16 w-auto max-w-[9rem]'
            }`}
            draggable={false}
          />
          {!collapsed ? (
            <span className="text-[9px] font-bold tracking-[0.2em] text-cyan uppercase">
              {portalLabel}
            </span>
          ) : null}
        </Link>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            title={collapsed ? item.label : undefined}
            className={({ isActive }) =>
              `group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition ${
                collapsed ? 'lg:justify-center lg:px-2' : ''
              } ${
                isActive
                  ? 'bg-cyan text-navy'
                  : 'text-white/70 hover:bg-white/8 hover:text-white'
              }`
            }
          >
            <item.icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.8} />
            {!collapsed ? <span className="truncate">{item.label}</span> : null}
          </NavLink>
        ))}
      </nav>

      <div className="shrink-0 space-y-1 border-t border-white/8 p-3">
        <Link
          to="/shop"
          onClick={onNavigate}
          title={collapsed ? 'Back to shop' : undefined}
          className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium text-white/70 transition hover:bg-white/8 hover:text-white ${
            collapsed ? 'lg:justify-center lg:px-2' : ''
          }`}
        >
          <Home className="h-[18px] w-[18px] shrink-0" strokeWidth={1.8} />
          {!collapsed ? 'Back to shop' : null}
        </Link>
        <button
          type="button"
          onClick={onLogout}
          title={collapsed ? 'Log out' : undefined}
          className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] font-medium text-white/70 transition hover:bg-white/8 hover:text-white ${
            collapsed ? 'lg:justify-center lg:px-2' : ''
          }`}
        >
          <LogOut className="h-[18px] w-[18px] shrink-0" strokeWidth={1.8} />
          {!collapsed ? 'Log out' : null}
        </button>

        {!collapsed ? (
          <div className="mt-2 flex items-center gap-2.5 rounded-xl bg-white/5 px-3 py-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan text-navy">
              <User className="h-4 w-4" strokeWidth={1.8} />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[12px] font-semibold text-white">
                {user?.name || user?.company}
              </span>
              <span className="block truncate text-[10px] text-white/50">{user?.email}</span>
            </span>
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default function DashboardLayout({ scope = 'user' }) {
  const { user, isAdmin, logout } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const location = useLocation()

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(SIDEBAR_KEY) === '1'
    } catch {
      return false
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_KEY, collapsed ? '1' : '0')
    } catch {
      /* storage unavailable, collapse state stays session-only */
    }
  }, [collapsed])

  useEffect(() => {
    if (!drawerOpen) return undefined
    lockBodyScroll()
    return () => unlockBodyScroll()
  }, [drawerOpen])

  useEffect(() => {
    setDrawerOpen(false)
    // Instant jump — avoid smooth-scroll + fade flash when opening an order
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [location.pathname])

  const handleLogout = async () => {
    await logout()
    toast.success('Signed out of the research portal.', { title: 'Goodbye' })
    navigate('/', { replace: true })
  }

  const sidebarProps = {
    scope,
    user,
    isAdmin,
    onLogout: handleLogout,
  }

  return (
    <div className="min-h-screen bg-fog">
      <aside
        className={`fixed inset-y-0 left-0 z-40 hidden shrink-0 border-r border-white/8 bg-navy transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] lg:block ${
          collapsed ? 'w-[76px]' : 'w-[248px]'
        }`}
      >
        <SidebarContent {...sidebarProps} collapsed={collapsed} onNavigate={undefined} />
        <button
          type="button"
          onClick={() => setCollapsed((value) => !value)}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="absolute top-1/2 -right-3 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-navy text-white/70 shadow-lg transition hover:text-cyan"
        >
          <ChevronLeft
            className={`h-3.5 w-3.5 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`}
            strokeWidth={2.4}
          />
        </button>
      </aside>

      <AnimatePresence>
        {drawerOpen ? (
          <>
            <motion.button
              type="button"
              aria-label="Close navigation"
              onClick={() => setDrawerOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="fixed inset-0 z-[10050] bg-black/55 backdrop-blur-[2px] lg:hidden"
            />
            <motion.aside
              role="dialog"
              aria-modal="true"
              aria-label="Dashboard navigation"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              className="fixed inset-y-0 left-0 z-[10060] w-[min(84vw,290px)] bg-navy shadow-2xl lg:hidden"
            >
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Close navigation"
                className="absolute top-4 right-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
              >
                <X className="h-4 w-4" />
              </button>
              <SidebarContent
                {...sidebarProps}
                collapsed={false}
                onNavigate={() => setDrawerOpen(false)}
              />
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>

      <div
        className={`flex min-h-screen flex-col transition-[padding] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          collapsed ? 'lg:pl-[76px]' : 'lg:pl-[248px]'
        }`}
      >
        {/* Mobile-only menu trigger — the desktop top bar is intentionally gone */}
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          aria-label="Open navigation"
          className="fixed top-4 left-4 z-30 flex h-11 w-11 items-center justify-center rounded-[12px] bg-navy text-white shadow-lg transition hover:bg-navy-soft lg:hidden"
        >
          <Menu className="h-[18px] w-[18px]" strokeWidth={1.8} />
        </button>

        <main className="flex-1 px-4 py-6 pt-16 md:px-6 md:py-8 lg:pt-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
