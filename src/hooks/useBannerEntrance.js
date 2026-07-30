import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Choreographed scroll entrance for CTA banners (volume / custom sourcing).
 * Marks the root with data-reveal-managed so PageTransition skips generic reveals.
 */
export function useBannerEntrance() {
  const ref = useRef(null)

  useLayoutEffect(() => {
    const root = ref.current
    if (!root) return undefined

    root.setAttribute('data-reveal-managed', '')

    if (prefersReducedMotion()) {
      gsap.set(root, { clearProps: 'all', opacity: 1 })
      return undefined
    }

    const items = root.querySelectorAll('[data-banner-item]')
    const cta = root.querySelector('[data-banner-cta]')
    const accent = root.querySelector('[data-banner-accent]')

    const ctx = gsap.context(() => {
      gsap.set(root, { opacity: 0, y: 40, scale: 0.9, transformOrigin: '50% 80%' })
      if (items.length) gsap.set(items, { opacity: 0, y: 14 })
      if (cta) gsap.set(cta, { opacity: 0, y: 12, scale: 0.94 })
      if (accent) gsap.set(accent, { scaleY: 0, transformOrigin: 'top center' })

      const tl = gsap.timeline({
        defaults: { ease: 'power3.out' },
        scrollTrigger: {
          trigger: root,
          start: 'top 88%',
          toggleActions: 'play none none none',
        },
      })

      tl.to(root, {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.5,
        ease: 'back.out(1.7)',
      })

      if (accent) {
        tl.to(
          accent,
          { scaleY: 1, duration: 0.35, ease: 'power2.out' },
          '-=0.28',
        )
      }

      if (items.length) {
        tl.to(
          items,
          {
            opacity: 1,
            y: 0,
            duration: 0.35,
            stagger: 0.06,
            ease: 'power2.out',
          },
          '-=0.22',
        )
      }

      if (cta) {
        tl.to(
          cta,
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.32,
            ease: 'back.out(2)',
          },
          '-=0.1',
        )
        tl.to(cta, {
          scale: 1.04,
          duration: 0.14,
          yoyo: true,
          repeat: 1,
          ease: 'power1.inOut',
        })
      }
    }, root)

    requestAnimationFrame(() => ScrollTrigger.refresh())

    return () => ctx.revert()
  }, [])

  return ref
}
