import { Link } from 'react-router-dom'
import SideDrawer from './SideDrawer'
import { navLinks } from '../data/site'

export default function MenuDrawer({ open, onClose, active, onSelect }) {
  return (
    <SideDrawer open={open} onClose={onClose} title="Menu">
      <nav className="flex flex-1 flex-col gap-1">
        {navLinks.map((link) => {
          const isActive = active === link.label
          return (
            <Link
              key={link.label}
              to={link.to}
              onClick={() => {
                onSelect?.(link.label)
                onClose()
              }}
              className={`rounded-2xl px-4 py-3.5 text-[15px] font-medium transition ${
                isActive
                  ? 'bg-ink text-white'
                  : 'text-ink hover:bg-fog'
              }`}
            >
              {link.label}
            </Link>
          )
        })}
      </nav>
    </SideDrawer>
  )
}
