import { useLayoutEffect, useRef } from 'react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import gsap from 'gsap'
import { setupReveals } from '../hooks/useGsapReveal'

gsap.registerPlugin(ScrollTrigger)

export default function PageTransition({ children }) {
  const rootRef = useRef(null)

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0

    const root = rootRef.current
    if (!root) return undefined

    // Avoid an opacity:0 flash on reload — it reads as the page "shaking".
    const cleanupReveals = setupReveals(root)

    const t1 = window.setTimeout(() => ScrollTrigger.refresh(), 80)
    const t2 = window.setTimeout(() => ScrollTrigger.refresh(), 320)

    return () => {
      window.clearTimeout(t1)
      window.clearTimeout(t2)
      cleanupReveals()
    }
  }, [])

  return (
    <div ref={rootRef} className="min-h-screen bg-white">
      {children}
    </div>
  )
}
