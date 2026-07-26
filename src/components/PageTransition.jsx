import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { setupReveals } from '../hooks/useGsapReveal'

gsap.registerPlugin(ScrollTrigger)

export default function PageTransition({ children }) {
  const rootRef = useRef(null)

  useLayoutEffect(() => {
    window.scrollTo(0, 0)
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0

    const root = rootRef.current
    if (!root) return undefined

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const ctx = gsap.context(() => {
      if (reduced) {
        gsap.set(root, { opacity: 1 })
        return
      }

      gsap.fromTo(
        root,
        { opacity: 0 },
        { opacity: 1, duration: 0.4, ease: 'power2.out' },
      )
    }, root)

    const cleanupReveals = setupReveals(root)

    const t1 = window.setTimeout(() => ScrollTrigger.refresh(), 80)
    const t2 = window.setTimeout(() => ScrollTrigger.refresh(), 320)

    return () => {
      window.clearTimeout(t1)
      window.clearTimeout(t2)
      cleanupReveals()
      ctx.revert()
    }
  }, [])

  return (
    <div ref={rootRef} className="min-h-screen bg-white">
      {children}
    </div>
  )
}
