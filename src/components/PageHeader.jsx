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
import { activeFromPath } from '../utils/nav'

gsap.registerPlugin(ScrollTrigger)

function NavPill({ navRef, active, className, showPill = true, light = false }) {
  const itemRefs = useRef({})
  const skipAnim = useRef(true)
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
    if (!pill.ready) return undefined
    const id = window.requestAnimationFrame(() => {
      skipAnim.current = false
    })
    return () => window.cancelAnimationFrame(id)
  }, [pill.ready])

  useEffect(() => {
    window.addEventListener('resize', measurePill)
    return () => window.removeEventListener('resize', measurePill)
  }, [active])

  return (
    <nav ref={navRef} className={className}>
      {showPill && pill.ready ? (
        <motion.span
          aria-hidden
          className={`absolute top-1.5 bottom-1.5 rounded-full shadow-sm ${
            light ? 'bg-ink' : 'bg-white'
          }`}
          initial={false}
          animate={{ left: pill.left, width: pill.width }}
          transition={{
            type: 'tween',
            duration: skipAnim.current ? 0 : 0.35,
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
            className={`relative z-10 inline-flex items-center rounded-full px-3.5 py-2 text-[13px] font-medium xl:px-5 xl:text-[14px] ${
              light
                ? isActive
                  ? 'text-white'
                  : 'text-ink/70 hover:text-ink'
                : isActive
                  ? 'text-[#1a1a1a]'
                  : 'text-white/90 hover:text-white'
            }`}
          >
            {link.label}
          </Link>
        )
      })}
    </nav>
  )
}

export default function PageHeader({ title, subtitle, image }) {
  const location = useLocation()
  const active = activeFromPath(location.pathname)
  const { count, openCart, cartOpen } = useCart()
  const [menuOpen, setMenuOpen] = useState(false)
  const [isSticky, setIsSticky] = useState(false)
  const headerRef = useRef(null)
  const headerNavRef = useRef(null)
  const stickyNavRef = useRef(null)
  const light = !title && !subtitle

  useLayoutEffect(() => {
    setIsSticky(false)
  }, [location.pathname])

  useEffect(() => {
    const header = headerRef.current
    if (!header) return

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: header,
        start: 'bottom top',
        onEnter: () => setIsSticky(true),
        onLeaveBack: () => setIsSticky(false),
      })
    })

    return () => ctx.revert()
  }, [location.pathname])

  return (
    <>
      <header
        ref={headerRef}
        className={`relative z-50 overflow-hidden border-b ${
          light ? 'border-black/8 bg-white' : 'border-white/10 bg-[#0a0b0d]'
        }`}
      >
        {image ? (
          <>
            <img
              src={image}
              alt=""
              aria-hidden
              className="pointer-events-none absolute inset-0 h-full w-full object-cover object-[center_42%]"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/80 via-black/55 to-black/35" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/50 to-transparent" />
          </>
        ) : null}

        <div className="relative mx-auto flex min-h-[80px] w-full max-w-12xl items-center justify-between px-6 py-2 md:px-10 lg:px-12">
          <Link to="/" className="flex shrink-0 items-center">
            <Logo className="h-[80px] w-auto" />
          </Link>

          <NavPill
            navRef={headerNavRef}
            active={active}
            showPill={!isSticky}
            light={light}
            className={`relative hidden items-center rounded-full px-1.5 py-1.5 transition-opacity duration-300 lg:flex ${
              light
                ? 'border border-black/8 bg-fog shadow-sm'
                : 'border border-white/10 bg-black/70 shadow-lg shadow-black/30 backdrop-blur-xl'
            } ${isSticky ? 'pointer-events-none opacity-0' : 'opacity-100'}`}
          />

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              aria-label="Cart"
              onClick={() => {
                setMenuOpen(false)
                openCart()
              }}
              className={`relative inline-flex h-11 w-11 items-center justify-center rounded-[12px] shadow-sm transition ${
                light
                  ? 'bg-ink text-white hover:bg-ink/90'
                  : 'bg-white text-[#111] hover:bg-white/90'
              }`}
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
              className={`inline-flex h-11 w-11 items-center justify-center rounded-[12px] shadow-sm transition lg:hidden ${
                light
                  ? 'bg-ink text-white hover:bg-ink/90'
                  : 'bg-white text-[#111] hover:bg-white/90'
              }`}
            >
              <Menu className="h-[18px] w-[18px]" strokeWidth={1.7} />
            </button>
          </div>
        </div>

        {(title || subtitle) && (
          <div
            className={`relative mx-auto max-w-12xl px-6 pt-4 md:px-10 lg:px-12 ${
              image ? 'pb-16 pt-8 md:pb-24 md:pt-12' : 'pb-10 md:pb-14'
            }`}
          >
            {title ? (
              <h1
                data-reveal="up"
                data-reveal-start="top 100%"
                className="font-display text-[30px] font-extrabold tracking-tight text-white uppercase sm:text-[34px] md:text-[40px] lg:text-[44px] xl:text-[48px]"
              >
                {title}
              </h1>
            ) : null}
            {subtitle ? (
              <p
                data-reveal="up"
                data-reveal-delay="0.1"
                data-reveal-start="top 100%"
                className="mt-3 max-w-xl text-sm leading-relaxed text-white/75 sm:text-base"
              >
                {subtitle}
              </p>
            ) : null}
          </div>
        )}
      </header>

      <MenuDrawer
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        active={active}
      />

      {createPortal(
        <div
          className={`sticky-nav-pill fixed top-5 left-1/2 z-[9999] -translate-x-1/2 transition-opacity duration-300 ${
            isSticky
              ? 'pointer-events-auto opacity-100'
              : 'pointer-events-none opacity-0'
          }`}
        >
          <NavPill
            navRef={stickyNavRef}
            active={active}
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
