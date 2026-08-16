import { Link, useNavigate } from 'react-router-dom'
import { LayoutDashboard, LogOut, Package, Settings, ShieldCheck, User } from 'lucide-react'
import SideDrawer from './SideDrawer'
import { navLinks } from '../data/site'
import { useAuth } from '../context/AuthContext'
import { useToast } from './Toaster'

export default function MenuDrawer({ open, onClose, active }) {
  const { user, isAdmin, logout } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()

  const accountLinks = user
    ? [
        isAdmin
          ? { label: 'Admin dashboard', icon: ShieldCheck, to: '/admin' }
          : { label: 'Dashboard', icon: LayoutDashboard, to: '/dashboard' },
        ...(isAdmin
          ? []
          : [{ label: 'My orders', icon: Package, to: '/dashboard/orders' }]),
        {
          label: 'Settings',
          icon: Settings,
          to: isAdmin ? '/admin/settings' : '/dashboard/settings',
        },
      ]
    : []

  const handleLogout = async () => {
    onClose()
    await logout()
    toast.success('Signed out of the research portal.', { title: 'Goodbye' })
    navigate('/', { replace: true })
  }

  return (
    <SideDrawer open={open} onClose={onClose} title="Menu">
      <nav className="flex flex-col gap-1">
        {navLinks.map((link) => {
          const isActive = active === link.label
          return (
            <Link
              key={link.label}
              to={link.to}
              onClick={onClose}
              className={`rounded-2xl px-4 py-3.5 text-[15px] font-medium transition ${
                isActive ? 'bg-ink text-white' : 'text-ink hover:bg-fog'
              }`}
            >
              {link.label}
            </Link>
          )
        })}
      </nav>

      {user ? (
        <div className="mt-6 border-t border-black/8 pt-5">
          <div className="mb-3 flex items-center gap-3 px-1">
            <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-navy text-cyan">
              <User className="h-[18px] w-[18px]" strokeWidth={1.7} />
              {isAdmin ? (
                <span
                  aria-hidden
                  className="absolute -top-1 -right-1 flex h-[16px] items-center justify-center rounded-full bg-cyan px-1 text-[7px] font-bold tracking-[0.06em] text-navy uppercase"
                >
                  Adm
                </span>
              ) : null}
            </span>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-semibold text-ink">
                {user.name || user.company}
              </p>
              <p className="truncate text-[11px] text-muted">{user.email}</p>
            </div>
          </div>

          <nav className="flex flex-col gap-1">
            {accountLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={onClose}
                className="flex items-center gap-2.5 rounded-2xl px-4 py-3 text-[14px] font-medium text-ink transition hover:bg-fog"
              >
                <link.icon className="h-4 w-4 text-cyan-dim" strokeWidth={1.8} />
                {link.label}
              </Link>
            ))}
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-2.5 rounded-2xl px-4 py-3 text-left text-[14px] font-medium text-ink transition hover:bg-fog"
            >
              <LogOut className="h-4 w-4 text-cyan-dim" strokeWidth={1.8} />
              Log out
            </button>
          </nav>
        </div>
      ) : null}
    </SideDrawer>
  )
}
