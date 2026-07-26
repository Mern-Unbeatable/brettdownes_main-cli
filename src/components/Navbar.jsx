import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Menu, ShoppingBag } from 'lucide-react'
import Logo from './Logo'
import MenuDrawer from './MenuDrawer'
import SideActionDock from './SideActionDock'
import { useCart } from '../context/CartContext'
import { navLinks } from '../data/site'

gsap.registerPlugin(ScrollTrigger)

function NavPill({ navRef, active, onSelect, className, showPill = true }) {
  const itemRefs = useRef({})
  const [pill, setPill] = useState({ left: 0, width: 0, ready: false })

  const measurePill = () => {
    const nav = navRef.current
    const el = itemRefs.current[active]
    if (!nav || !el) return
    const navRect = nav.getBoundingClientRect()
    const elRect = el.getBoundingClientRect()
    setPill({
      left: elRect.left - navRect.left,
      width: elRect.width,
      ready: true,
    })
  }

  useLayoutEffect(() => {
    measurePill()
  }, [active])

  useEffect(() => {
    window.addEventListener('resize', measurePill)
    return () => window.removeEventListener('resize', measurePill)
  }, [active])

  return (
    <nav ref={navRef} className={className}>
      {showPill && pill.ready ? (
        <motion.span
          aria-hidden
          className="absolute top-1.5 bottom-1.5 rounded-full bg-white shadow-sm"
          initial={false}
          animate={{ left: pill.left, width: pill.width }}
          transition={{
            type: 'tween',
            duration: 0.45,
            ease: [0.22, 1, 0.36, 1],
          }}
        />
      ) : null}

      {navLinks.map((link) => {
        const isActive = active === link.label
        return (
          <Link
            key={link.label}
            to={link.to}
            ref={(node) => {
              itemRefs.current[link.label] = node
            }}
            onClick={() => onSelect(link.label)}
            className={`relative z-10 inline-flex items-center rounded-full px-5 py-2 text-[14px] font-medium transition-colors duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              isActive ? 'text-[#1a1a1a]' : 'text-white/90 hover:text-white'
            }`}
          >
            {link.label}
          </Link>
        )
      })}
    </nav>
  )
}

export default function Navbar() {
  const location = useLocation()
  const { count, openCart, cartOpen } = useCart()
  const [active, setActive] = useState('Home')
  const [menuOpen, setMenuOpen] = useState(false)
  const [isSticky, setIsSticky] = useState(false)
  const heroNavRef = useRef(null)
  const stickyNavRef = useRef(null)

  useEffect(() => {
    if (location.pathname.startsWith('/shop')) setActive('Shop')
    else if (location.pathname.startsWith('/contact')) setActive('Contact')
    else setActive('Home')
  }, [location.pathname])

  useEffect(() => {
    const hero = document.getElementById('home')
    if (!hero) return

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: hero,
        start: 'bottom top',
        onEnter: () => setIsSticky(true),
        onLeaveBack: () => setIsSticky(false),
      })
    })

    return () => ctx.revert()
  }, [])

  return (
    <>
      <header className="pointer-events-none absolute inset-x-0 top-0 z-50">
        <div className="pointer-events-auto mx-auto flex min-h-[80px] w-full items-center justify-between px-6 py-2 md:px-10 lg:px-12">
          <Link
            to="/"
            className="flex shrink-0 items-center"
            onClick={() => setActive('Home')}
          >
            <Logo className="h-[80px] w-auto" />
          </Link>

          <NavPill
            navRef={heroNavRef}
            active={active}
            onSelect={setActive}
            showPill={!isSticky}
            className={`pointer-events-auto relative hidden items-center rounded-full border border-white/10 bg-black/35 px-1.5 py-1.5 backdrop-blur-xl transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] lg:flex ${
              isSticky ? 'pointer-events-none -translate-y-2 opacity-0' : 'opacity-100'
            }`}
          />

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              aria-label="Cart"
              onClick={() => {
                setMenuOpen(false)
                openCart()
              }}
              className="relative inline-flex h-11 w-11 items-center justify-center rounded-[12px] bg-white text-[#111] shadow-sm transition hover:bg-white/90"
            >
              <ShoppingBag className="h-[18px] w-[18px]" strokeWidth={1.7} />
              {count > 0 ? (
                <span className="absolute -top-1 -right-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-cyan px-1 text-[10px] font-bold text-navy">
                  {count}
                </span>
              ) : null}
            </button>
            <button
              type="button"
              aria-label="Menu"
              onClick={() => setMenuOpen(true)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-[12px] bg-white text-[#111] shadow-sm transition hover:bg-white/90 lg:hidden"
            >
              <Menu className="h-[18px] w-[18px]" strokeWidth={1.7} />
            </button>
          </div>
        </div>
      </header>

      <MenuDrawer
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        active={active}
        onSelect={setActive}
      />

      {createPortal(
        <div
          className={`sticky-nav-pill fixed top-5 left-1/2 z-[9999] -translate-x-1/2 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            isSticky
              ? 'pointer-events-auto translate-y-0 opacity-100'
              : 'pointer-events-none -translate-y-3 opacity-0'
          }`}
        >
          <NavPill
            navRef={stickyNavRef}
            active={active}
            onSelect={setActive}
            showPill={isSticky}
            className="hidden w-fit items-center rounded-full border border-white/10 bg-black px-1.5 py-1.5 shadow-xl shadow-black/40 backdrop-blur-xl lg:flex"
          />
        </div>,
        document.body,
      )}

      {createPortal(
        <SideActionDock
          visible={isSticky && !cartOpen && !menuOpen}
          cartCount={count}
          onCart={() => {
            setMenuOpen(false)
            openCart()
          }}
          onMenu={() => setMenuOpen(true)}
        />,
        document.body,
      )}
    </>
  )
}
