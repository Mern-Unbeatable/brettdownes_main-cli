import { useLayoutEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const EASE = 'power3.out'

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function fromVars(type) {
  switch (type) {
    case 'left':
      return { opacity: 0, x: -48, y: 0, scale: 1 }
    case 'right':
      return { opacity: 0, x: 48, y: 0, scale: 1 }
    case 'scale':
      return { opacity: 0, x: 0, y: 24, scale: 0.94 }
    case 'pop':
      return { opacity: 0, x: 0, y: 40, scale: 0.82 }
    case 'fade':
      return { opacity: 0, x: 0, y: 0, scale: 1 }
    case 'up':
    default:
      return { opacity: 0, x: 0, y: 48, scale: 1 }
  }
}

function easeFor(type) {
  return type === 'pop' ? 'back.out(1.85)' : EASE
}

function collect(scope, selector) {
  const list = [...scope.querySelectorAll(selector)]
  if (scope.matches?.(selector)) list.unshift(scope)
  return list
}

function animateReveal(el, { immediate }) {
  const type = el.getAttribute('data-reveal') || 'up'
  const delay = Number(el.getAttribute('data-reveal-delay') || 0)
  const duration = Number(
    el.getAttribute('data-reveal-duration') || (type === 'pop' ? 0.75 : 0.9),
  )
  const start = el.getAttribute('data-reveal-start') || 'top 88%'

  gsap.fromTo(el, fromVars(type), {
    opacity: 1,
    x: 0,
    y: 0,
    scale: 1,
    duration,
    delay,
    ease: easeFor(type),
    ...(immediate
      ? {}
      : {
          scrollTrigger: {
            trigger: el,
            start,
            toggleActions: 'play none none none',
          },
        }),
  })
}

function animateStagger(group, { immediate }) {
  const children = group.querySelectorAll(':scope > *')
  if (!children.length) return

  const delay = Number(group.getAttribute('data-reveal-delay') || 0)
  const stagger = Number(group.getAttribute('data-stagger') || 0.1)
  const start = group.getAttribute('data-reveal-start') || 'top 86%'

  gsap.fromTo(
    children,
    { opacity: 0, y: 40, scale: 0.98 },
    {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: 0.75,
      delay,
      stagger,
      ease: EASE,
      ...(immediate
        ? {}
        : {
            scrollTrigger: {
              trigger: group,
              start,
              toggleActions: 'play none none none',
            },
          }),
    },
  )
}

/**
 * Animate all [data-reveal] / [data-reveal-stagger] inside a scope.
 * Returns a cleanup function (gsap.context.revert).
 */
export function setupReveals(scope, { immediate = false } = {}) {
  if (!scope || prefersReducedMotion()) {
    if (scope) {
      scope.querySelectorAll('[data-reveal], [data-reveal-stagger] > *').forEach((el) => {
        gsap.set(el, { clearProps: 'all', opacity: 1 })
      })
      if (scope.matches?.('[data-reveal-stagger]')) {
        ;[...scope.children].forEach((el) => gsap.set(el, { clearProps: 'all', opacity: 1 }))
      }
    }
    return () => {}
  }

  const ctx = gsap.context(() => {
    collect(scope, '[data-reveal]').forEach((el) => {
      if (el.closest('[data-reveal-managed]') && !immediate) return
      if (el.parentElement?.hasAttribute('data-reveal-stagger')) return
      animateReveal(el, { immediate })
    })

    collect(scope, '[data-reveal-stagger]').forEach((group) => {
      if (group.hasAttribute('data-reveal-managed') && !immediate) return
      if (
        group.closest('[data-reveal-managed]') &&
        !group.hasAttribute('data-reveal-managed') &&
        !immediate
      ) {
        return
      }
      animateStagger(group, { immediate })
    })
  }, scope)

  requestAnimationFrame(() => ScrollTrigger.refresh())

  return () => ctx.revert()
}

/** Run reveal animations when `ref` mounts or `deps` change. */
export function useGsapReveal(ref, deps = [], { immediate = true } = {}) {
  useLayoutEffect(() => {
    const el = ref?.current
    if (!el) return undefined
    return setupReveals(el, { immediate })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}
