import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

const GA_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || 'G-Y9PLBJT49R'

function ensureGtag() {
  if (typeof window === 'undefined') return
  if (window.gtag) return

  window.dataLayer = window.dataLayer || []
  window.gtag = function gtag() {
    window.dataLayer.push(arguments)
  }
  window.gtag('js', new Date())
  window.gtag('config', GA_ID, { send_page_view: false })

  const existing = document.querySelector(`script[src*="googletagmanager.com/gtag/js?id=${GA_ID}"]`)
  if (existing) return

  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`
  document.head.appendChild(script)
}

/** Loads GA4 once and sends a page_view on every client-side route change. */
export default function Analytics() {
  const { pathname, search } = useLocation()

  useEffect(() => {
    ensureGtag()
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined' || !window.gtag) return
    window.gtag('event', 'page_view', {
      page_path: `${pathname}${search}`,
      page_title: document.title,
      page_location: window.location.href,
    })
  }, [pathname, search])

  return null
}
