import { useEffect, useId, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  ChevronDown,
  FlaskConical,
  Globe2,
  PackageSearch,
  ShieldCheck,
  Snowflake,
  Truck,
} from 'lucide-react'
import PageHeader from '../components/PageHeader'
import PageTransition from '../components/PageTransition'
import Footer from '../components/Footer'
import FaqCategoryDock from '../components/FaqCategoryDock'
import { faqCategories } from '../data/faqs'
import { siteContact } from '../data/site'

const categoryIcons = {
  'custom-sourcing': PackageSearch,
  international: Globe2,
  quality: FlaskConical,
  compliance: ShieldCheck,
  storage: Snowflake,
  shipping: Truck,
}

const SUPPORT_EMAIL = 'support@peptideopslogistics.com'

function FaqAnswer({ answer, featured = false }) {
  if (!answer.includes(SUPPORT_EMAIL)) {
    return answer
  }

  const [before, after] = answer.split(SUPPORT_EMAIL)
  return (
    <>
      {before}
      <a
        href={`mailto:${siteContact.email}`}
        className={`inline break-all font-medium underline underline-offset-2 transition ${
          featured
            ? 'text-cyan decoration-cyan/40 hover:text-white'
            : 'text-cyan-dim decoration-cyan/40 hover:text-ink'
        }`}
      >
        {siteContact.email}
      </a>
      {after}
    </>
  )
}

function FaqItem({ item, open, onToggle }) {
  const panelId = useId()
  const buttonId = useId()
  const featured = Boolean(item.featured)

  if (featured) {
    return (
      <div className="relative overflow-hidden rounded-3xl bg-navy">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-20 left-1/2 h-44 w-[120%] -translate-x-1/2 bg-[radial-gradient(ellipse_at_center,rgba(0,245,212,0.22),transparent_70%)]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 w-1.5 bg-cyan"
        />
        <div className="relative px-4 sm:px-6 md:px-8">
          <h3>
            <button
              type="button"
              id={buttonId}
              aria-expanded={open}
              aria-controls={panelId}
              onClick={onToggle}
              className="flex w-full items-start justify-between gap-3 py-4 text-left transition sm:gap-4 sm:py-5"
            >
              <span className="min-w-0 flex-1 font-display text-[15px] font-semibold leading-snug text-white break-words hyphens-auto sm:text-base">
                {item.question}
              </span>
              <span
                className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition ${
                  open
                    ? 'border-cyan bg-cyan text-navy'
                    : 'border-white/20 bg-white/10 text-white'
                }`}
              >
                <ChevronDown
                  className={`h-4 w-4 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
                  strokeWidth={2.2}
                />
              </span>
            </button>
          </h3>
          <div
            id={panelId}
            role="region"
            aria-labelledby={buttonId}
            className={`grid transition-[grid-template-rows] duration-300 ease-out ${
              open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
            }`}
          >
            <div className="overflow-hidden">
              <p className="pb-5 text-sm leading-relaxed break-words hyphens-auto text-white/65 sm:text-[15px]">
                <FaqAnswer answer={item.answer} featured />
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="border-b border-black/8 last:border-b-0">
      <h3>
        <button
          type="button"
          id={buttonId}
          aria-expanded={open}
          aria-controls={panelId}
          onClick={onToggle}
          className="flex w-full items-start justify-between gap-3 py-4 text-left transition sm:gap-4 sm:py-5"
        >
          <span className="min-w-0 flex-1 font-display text-[15px] font-semibold leading-snug text-ink break-words hyphens-auto sm:text-base">
            {item.question}
          </span>
          <span
            className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition ${
              open
                ? 'border-cyan bg-cyan text-navy'
                : 'border-black/10 bg-fog text-ink'
            }`}
          >
            <ChevronDown
              className={`h-4 w-4 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
              strokeWidth={2.2}
            />
          </span>
        </button>
      </h3>
      <div
        id={panelId}
        role="region"
        aria-labelledby={buttonId}
        className={`grid transition-[grid-template-rows] duration-300 ease-out ${
          open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
      >
        <div className="overflow-hidden">
          <p className="pb-5 text-sm leading-relaxed break-words hyphens-auto text-muted sm:text-[15px]">
            <FaqAnswer answer={item.answer} />
          </p>
        </div>
      </div>
    </div>
  )
}

export default function FaqPage() {
  const [activeCategory, setActiveCategory] = useState(faqCategories[0].id)
  const [openKey, setOpenKey] = useState(`${faqCategories[0].id}-0`)
  const [dockVisible, setDockVisible] = useState(false)
  const [topicsOpen, setTopicsOpen] = useState(false)
  const scrollingToRef = useRef(null)
  const chipsRef = useRef(null)

  useEffect(() => {
    const hash = window.location.hash.replace('#', '')
    if (!hash) return
    const match = faqCategories.find((c) => c.id === hash)
    if (match) {
      setActiveCategory(match.id)
      setOpenKey(`${match.id}-0`)
      window.requestAnimationFrame(() => {
        document.getElementById(match.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
    }
  }, [])

  useEffect(() => {
    const sections = faqCategories
      .map((c) => document.getElementById(c.id))
      .filter(Boolean)

    if (!sections.length) return undefined

    const observer = new IntersectionObserver(
      (entries) => {
        if (scrollingToRef.current) return
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)
        if (visible[0]?.target?.id) {
          setActiveCategory(visible[0].target.id)
        }
      },
      { rootMargin: '-20% 0px -55% 0px', threshold: [0.15, 0.35, 0.6] },
    )

    sections.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const chips = chipsRef.current
    if (!chips) return undefined

    let timer = 0
    const observer = new IntersectionObserver(
      ([entry]) => {
        window.clearTimeout(timer)
        timer = window.setTimeout(() => {
          setDockVisible(!entry.isIntersecting)
        }, 120)
      },
      { threshold: 0, rootMargin: '-8px 0px 0px 0px' },
    )

    observer.observe(chips)
    return () => {
      window.clearTimeout(timer)
      observer.disconnect()
    }
  }, [])

  const scrollToCategory = (id, { delay = 0 } = {}) => {
    setActiveCategory(id)
    scrollingToRef.current = id

    const run = () => {
      const el = document.getElementById(id)
      if (!el) {
        scrollingToRef.current = null
        return
      }

      const offset = 112
      const top = el.getBoundingClientRect().top + window.scrollY - offset
      window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' })

      const clear = () => {
        if (scrollingToRef.current === id) scrollingToRef.current = null
        window.removeEventListener('scrollend', clear)
      }
      window.addEventListener('scrollend', clear, { once: true })
      window.setTimeout(clear, 1400)
    }

    if (delay > 0) {
      window.setTimeout(run, delay)
    } else {
      run()
    }
  }

  return (
    <PageTransition>
      <PageHeader
        title=" "
        image="/images/faq-hero-peptides.webp"
      />

      <main className="bg-white py-12 md:py-20">
        <div className="mx-auto max-w-10xl px-5 md:px-8">
          <div className="mb-10 md:mb-14" data-reveal="up" data-reveal-start="top 100%">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan" />
              <span className="text-[11px] font-bold tracking-[0.28em] text-ink uppercase">
                Help center
              </span>
            </div>
            <h2 className="mt-4 max-w-2xl font-display text-2xl font-bold tracking-tight text-ink md:text-3xl">
              Frequently asked questions
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted sm:text-[15px]">
              Clear guidance for researchers ordering lyophilized reference compounds. Still need
              help? Reach our support team anytime.
            </p>
          </div>

          {/* Mobile / tablet category chips */}
          <div
            ref={chipsRef}
            data-reveal="up"
            data-reveal-delay="0.06"
            data-reveal-start="top 100%"
            className="mb-8 lg:hidden"
          >
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {faqCategories.map((cat) => {
                const Icon = categoryIcons[cat.id]
                const active = activeCategory === cat.id
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => scrollToCategory(cat.id)}
                    className={`inline-flex min-w-0 items-center justify-center gap-1.5 rounded-xl px-2.5 py-2.5 text-center text-[12px] font-semibold leading-snug transition sm:gap-2 sm:px-3 sm:text-[13px] ${
                      active
                        ? 'bg-navy text-white'
                        : 'bg-fog text-ink hover:bg-fog-deep'
                    }`}
                  >
                    {Icon ? <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={2} /> : null}
                    <span className="min-w-0 truncate">{cat.shortTitle || cat.title}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="grid gap-10 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-14 xl:grid-cols-[280px_minmax(0,1fr)]">
            {/* Desktop sticky category nav */}
            <aside data-reveal="left" data-reveal-start="top 100%" className="hidden lg:block">
              <nav
                aria-label="FAQ categories"
                className="sticky top-28 space-y-1 rounded-3xl border border-black/8 bg-fog/60 p-3"
              >
                {faqCategories.map((cat) => {
                  const Icon = categoryIcons[cat.id]
                  const active = activeCategory === cat.id
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => scrollToCategory(cat.id)}
                      className={`flex w-full items-center gap-3 rounded-2xl px-3.5 py-3 text-left text-sm font-medium transition ${
                        active
                          ? 'bg-navy text-white shadow-sm'
                          : 'text-ink/75 hover:bg-white hover:text-ink'
                      }`}
                    >
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                          active ? 'bg-cyan text-navy' : 'bg-white text-cyan-dim'
                        }`}
                      >
                        {Icon ? <Icon className="h-4 w-4" strokeWidth={2} /> : null}
                      </span>
                      <span className="min-w-0 leading-snug break-words">{cat.title}</span>
                    </button>
                  )
                })}
              </nav>
            </aside>

            <div className="min-w-0 space-y-8 md:space-y-10">
              {faqCategories.map((cat, catIndex) => {
                const Icon = categoryIcons[cat.id]
                return (
                  <section
                    key={cat.id}
                    id={cat.id}
                    data-reveal="up"
                    data-reveal-delay={String(Math.min(catIndex * 0.04, 0.16))}
                    data-reveal-start="top 100%"
                    className="scroll-mt-28"
                  >
                    <div className="mb-3 flex items-center gap-3 sm:mb-4">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan/30 bg-cyan/10 text-cyan-dim">
                        {Icon ? <Icon className="h-5 w-5" strokeWidth={1.9} /> : null}
                      </span>
                      <h2 className="min-w-0 font-display text-lg font-bold tracking-tight text-ink break-words sm:text-xl">
                        {cat.title}
                      </h2>
                    </div>

                    {cat.items.every((item) => item.featured) ? (
                      <div className="space-y-3">
                        {cat.items.map((item, index) => {
                          const key = `${cat.id}-${index}`
                          return (
                            <FaqItem
                              key={key}
                              item={item}
                              open={openKey === key}
                              onToggle={() =>
                                setOpenKey((prev) => (prev === key ? '' : key))
                              }
                            />
                          )
                        })}
                      </div>
                    ) : (
                      <div className="rounded-3xl border border-black/8 bg-white px-4 sm:px-6 md:px-8">
                        {cat.items.map((item, index) => {
                          const key = `${cat.id}-${index}`
                          return (
                            <FaqItem
                              key={key}
                              item={item}
                              open={openKey === key}
                              onToggle={() =>
                                setOpenKey((prev) => (prev === key ? '' : key))
                              }
                            />
                          )
                        })}
                      </div>
                    )}
                  </section>
                )
              })}

              <div
                data-reveal="up"
                data-reveal-start="top 100%"
                className="relative overflow-hidden rounded-3xl bg-navy px-6 py-10 md:px-10 md:py-12"
              >
                <div
                  aria-hidden
                  className="pointer-events-none absolute -top-24 left-1/2 h-56 w-[120%] -translate-x-1/2 bg-[radial-gradient(ellipse_at_center,rgba(0,245,212,0.22),transparent_70%)]"
                />
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-y-0 left-0 w-1.5 bg-cyan"
                />
                <div className="relative max-w-2xl">
                  <p className="text-[11px] font-bold tracking-[0.28em] text-cyan uppercase">
                    Still have questions?
                  </p>
                  <h2 className="mt-3 font-display text-2xl font-bold tracking-tight text-white md:text-3xl">
                    Talk with our research support team
                  </h2>
                  <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/65 sm:text-[15px]">
                    For batch CoAs, custom sourcing, or shipping questions, email us or send a
                    message through the contact form. We respond within one business day.
                  </p>
                  <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                    <Link
                      to="/contact"
                      className="group inline-flex items-center justify-center gap-2 rounded-xl bg-cyan px-6 py-3.5 text-sm font-semibold text-navy transition hover:brightness-110"
                    >
                      Contact us
                      <ArrowRight
                        className="h-4 w-4 transition group-hover:translate-x-0.5"
                        strokeWidth={2.25}
                      />
                    </Link>
                    <a
                      href={`mailto:${siteContact.email}`}
                      className="inline-flex items-center justify-center break-all rounded-xl border border-white/15 px-6 py-3.5 text-sm font-medium text-white transition hover:border-white/30 hover:bg-white/5"
                    >
                      {siteContact.email}
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      <FaqCategoryDock
        visible={dockVisible}
        open={topicsOpen}
        onOpen={() => setTopicsOpen(true)}
        onClose={() => setTopicsOpen(false)}
        categories={faqCategories}
        categoryIcons={categoryIcons}
        activeCategory={activeCategory}
        onSelect={scrollToCategory}
      />
    </PageTransition>
  )
}
