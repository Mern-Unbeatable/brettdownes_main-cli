import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { LayoutDashboard, LogOut, Package, Settings, ShieldCheck, User } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from './Toaster'

/**
 * Account chip shown next to the cart button. Always rendered so the header
 * never jumps; the menu portals to body so header overflow cannot clip it.
 */
export default function AccountMenu({ onBeforeNavigate, align = 'right', tone = 'light' }) {
  const { user, ready, isAdmin, logout } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 })
  const wrapRef = useRef(null)
  const menuRef = useRef(null)

  const updatePosition = () => {
    const trigger = wrapRef.current
    if (!trigger) return
    const rect = trigger.getBoundingClientRect()
    const width = 240
    const gap = 10
    const left =
      align === 'right'
        ? Math.min(rect.right - width, window.innerWidth - width - 8)
        : Math.max(8, rect.left)
    setMenuPos({
      top: rect.bottom + gap,
      left: Math.max(8, left),
    })
  }

  useLayoutEffect(() => {
    if (!open) return undefined
    updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [open, align])

  useEffect(() => {
    if (!open) return undefined

    const onPointerDown = (event) => {
      const inTrigger = wrapRef.current?.contains(event.target)
      const inMenu = menuRef.current?.contains(event.target)
      if (!inTrigger && !inMenu) setOpen(false)
    }
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const go = (path) => {
    setOpen(false)
    onBeforeNavigate?.()
    navigate(path)
  }

  const handleLogout = async () => {
    setOpen(false)
    onBeforeNavigate?.()
    await logout()
    toast.success('Signed out of the research portal.', { title: 'Goodbye' })
    navigate('/', { replace: true })
  }

  const onTrigger = () => {
    if (!ready || !user) return
    setOpen((value) => !value)
  }

  const links = user
    ? [
        isAdmin
          ? { label: 'Admin dashboard', icon: ShieldCheck, path: '/admin' }
          : { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
        ...(isAdmin
          ? []
          : [
              {
                label: 'My orders',
                icon: Package,
                path: '/dashboard/orders',
              },
            ]),
        {
          label: 'Profile',
          icon: User,
          path: isAdmin ? '/admin/profile' : '/dashboard/profile',
        },
        {
          label: 'Settings',
          icon: Settings,
          path: isAdmin ? '/admin/settings' : '/dashboard/settings',
        },
      ]
    : []

  const displayName =
    user?.name && user.name.trim().toLowerCase() !== user.email?.toLowerCase()
      ? user.name
      : user?.company || user?.email || 'Account'

  const chipClass =
    tone === 'dark'
      ? 'bg-ink text-white hover:bg-ink/90'
      : 'bg-white text-[#111] hover:bg-white/90'

  return (
    <div ref={wrapRef} className="relative shrink-0">
      <button
        type="button"
        onClick={onTrigger}
        disabled={!ready || !user}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        className={`relative inline-flex h-11 w-11 items-center justify-center rounded-[12px] shadow-sm transition disabled:cursor-default ${chipClass}`}
      >
        <User className="h-[18px] w-[18px]" strokeWidth={1.7} />
        {user && isAdmin ? (
          <span
            aria-hidden
            className="absolute -top-1 -right-1 flex h-[18px] items-center justify-center rounded-full bg-cyan px-1 text-[8px] font-bold tracking-[0.06em] text-navy uppercase"
          >
            Adm
          </span>
        ) : null}
      </button>

      {createPortal(
        <AnimatePresence>
          {open && user ? (
            <motion.div
              ref={menuRef}
              role="menu"
              initial={{ opacity: 0, y: -8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.97 }}
              transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
              style={{ top: menuPos.top, left: menuPos.left }}
              className="fixed z-[10080] w-60 overflow-hidden rounded-2xl border border-white/12 bg-[#0a121c]/95 shadow-[0_18px_50px_rgba(5,11,20,0.45)] backdrop-blur-xl"
            >
              <div className="border-b border-white/8 px-4 py-3">
                <p className="truncate text-[13px] font-semibold text-white">{displayName}</p>
                {displayName !== user.email ? (
                  <p className="truncate text-[11px] text-white/55">{user.email}</p>
                ) : null}
              </div>

              <div className="p-1.5">
                {links.map((link) => (
                  <button
                    key={link.path}
                    type="button"
                    role="menuitem"
                    onClick={() => go(link.path)}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[13px] font-medium text-white/85 transition hover:bg-white/10 hover:text-white"
                  >
                    <link.icon className="h-4 w-4 text-cyan" strokeWidth={1.8} />
                    {link.label}
                  </button>
                ))}
              </div>

              <div className="border-t border-white/8 p-1.5">
                <button
                  type="button"
                  role="menuitem"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[13px] font-medium text-white/85 transition hover:bg-white/10 hover:text-white"
                >
                  <LogOut className="h-4 w-4 text-cyan" strokeWidth={1.8} />
                  Log out
                </button>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>,
        document.body,
      )}
    </div>
  )
}
