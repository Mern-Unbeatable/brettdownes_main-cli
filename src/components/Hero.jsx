import { useLayoutEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import gsap from 'gsap'
import { FileCheck2 } from 'lucide-react'
import Navbar from './Navbar'

function MoleculeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <circle cx="4" cy="9" r="2.2" fill="currentColor" />
      <circle cx="14" cy="4.5" r="2.2" fill="currentColor" />
      <circle cx="14" cy="13.5" r="2.2" fill="currentColor" />
      <path d="M5.8 8.2L12.2 5.2M5.8 9.8L12.2 12.8" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  )
}

function PurityIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden>
      <circle cx="11" cy="11" r="9" stroke="currentColor" strokeWidth="1.6" opacity="0.35" />
      <path
        d="M11 2a9 9 0 0 1 9 9"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="11" cy="11" r="3.2" fill="currentColor" />
    </svg>
  )
}

export default function Hero() {
  const rootRef = useRef(null)

  useLayoutEffect(() => {
    const root = rootRef.current
    if (!root) return undefined

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined

    const ctx = gsap.context(() => {
      const bg = root.querySelector('[data-hero-bg]')
      const titleLines = root.querySelectorAll('[data-hero-line]')
      const cta = root.querySelector('[data-hero-cta]')
      const copy = root.querySelector('[data-hero-copy]')
      const badges = root.querySelectorAll('[data-hero-badge]')

      if (bg) gsap.set(bg, { scale: 1.12 })

      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })

      if (bg) {
        tl.to(bg, { scale: 1, duration: 1.6 }, 0)
      }

      tl.fromTo(
        titleLines,
        { opacity: 0, y: 36 },
        { opacity: 1, y: 0, duration: 0.85, stagger: 0.12 },
        0.15,
      )
        .fromTo(
          cta,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.7 },
          0.45,
        )
        .fromTo(
          copy,
          { opacity: 0, y: 16 },
          { opacity: 1, y: 0, duration: 0.7 },
          0.55,
        )
        .fromTo(
          badges,
          { opacity: 0, y: 18 },
          { opacity: 1, y: 0, duration: 0.65, stagger: 0.1 },
          0.7,
        )
    }, root)

    return () => ctx.revert()
  }, [])

  return (
    <section
      ref={rootRef}
      id="home"
      className="relative bg-white px-3 pt-3 pb-3 sm:px-4 sm:pt-4 sm:pb-4"
    >
      <div className="relative isolate mx-auto w-full max-w-12xl min-h-[calc(100vh-24px)] overflow-hidden rounded-[28px] bg-[#0a0b0d] sm:min-h-[calc(100vh-32px)] sm:rounded-[36px] md:rounded-[44px]">
        <img
          data-hero-bg
          src="/images/hero.png"
          alt="Peptide Ops research vial"
          className="absolute inset-0 h-full w-full object-cover object-center will-change-transform"
          draggable={false}
        />

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/75 via-black/45 to-transparent sm:from-black/70 sm:via-black/40 lg:from-black/45 lg:via-black/18 lg:to-transparent xl:from-black/35 xl:via-black/12" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/40 to-transparent lg:from-black/25 lg:h-28" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/45 to-transparent lg:from-black/30 lg:h-32" />

        <Navbar />

        <div className="relative z-10 mx-auto flex min-h-[calc(100vh-24px)] w-full flex-col px-6 pt-[100px] pb-8 sm:min-h-[calc(100vh-32px)] md:px-10 md:pt-[105px] md:pb-10 lg:px-12">
          <div className="flex flex-1 items-center">
            <div className="w-full max-w-[min(100%,440px)] lg:max-w-[480px]">
              <h1 className="font-display font-extrabold tracking-[-0.04em] text-white uppercase">
                <span
                  data-hero-line
                  className="block whitespace-nowrap text-[30px] leading-[1.05] sm:text-[34px] md:text-[40px] lg:text-[44px] xl:text-[50px]"
                >
                  Precision peptides.
                </span>
                <span
                  data-hero-line
                  className="mt-[0.06em] block whitespace-nowrap text-[30px] leading-[1.05] sm:text-[34px] md:text-[40px] lg:text-[44px] xl:text-[50px]"
                >
                  Powerful research.
                </span>
              </h1>

              <Link
                data-hero-cta
                to="/shop"
                className="mt-8 inline-flex items-center gap-2.5 rounded-[12px] bg-cyan px-[22px] py-[13px] text-[15px] font-semibold text-[#0a1218] transition hover:brightness-110"
              >
                Shop Now
                <MoleculeIcon />
              </Link>

              <p
                data-hero-copy
                className="mt-5 max-w-[340px] text-[13px] font-medium leading-[1.55] text-white sm:text-[14px]"
              >
                High-purity lyophilized peptides for laboratory research. Verified identity, batch
                documentation, and Research Use Only labeling.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-end justify-between gap-3">
            <div
              data-hero-badge
              className="flex items-center gap-3 rounded-full border border-white/15 bg-white/10 px-4 py-2.5 backdrop-blur-xl sm:px-5 sm:py-3"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/5 text-white sm:h-10 sm:w-10">
                <PurityIcon />
              </span>
              <p className="text-[13px] font-medium text-white sm:text-[15px]">Purity ≥ 99.5%</p>
            </div>

            <div
              data-hero-badge
              className="flex items-center gap-3 rounded-[16px] bg-white px-4 py-2.5 shadow-lg shadow-black/25 sm:px-5 sm:py-3"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#111] text-white sm:h-10 sm:w-10">
                <FileCheck2 className="h-[16px] w-[16px] sm:h-[18px] sm:w-[18px]" strokeWidth={1.8} />
              </span>
              <p className="text-[13px] font-medium text-[#111] sm:text-[15px]">
                Tested in ISO - certified labs
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
