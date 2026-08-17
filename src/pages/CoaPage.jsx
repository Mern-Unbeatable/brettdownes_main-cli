import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Beaker,
  ExternalLink,
  FileCheck2,
  FileText,
  FlaskConical,
  RefreshCw,
  Search,
  X,
} from 'lucide-react'
import PageHeader from '../components/PageHeader'
import PageTransition from '../components/PageTransition'
import Footer from '../components/Footer'
import { siteContact } from '../data/site'
import { api, assetUrl } from '../lib/api'
import { isImageDocument, pdfViewerUrl } from '../utils/coaFiles'
import { lockBodyScroll, unlockBodyScroll } from '../hooks/lockBodyScroll'

const pillars = [
  {
    icon: FileCheck2,
    title: 'Supplier & Manufacturer COAs:',
    text: 'Every product we source is accompanied by verifiable analytical certificates (HPLC / Mass Spectrometry) directly from our qualified manufacturing partners. Because these originate at the synthesis facility, the entity name on these certificates may reflect our source laboratory.',
  },
  {
    icon: FlaskConical,
    title: 'Independent Verification:',
    text: 'To ensure purity, safety, and potency, we also send product lines out for independent, third-party laboratory verification. As these tests are completed, lot-matched certificates featuring our company name are published directly to this archive.',
  },
  {
    icon: RefreshCw,
    title: 'Continuous Updates:',
    text: 'We test across our entire product catalog to verify compound identity and purity standards. All available manufacturer documentation and independent lab reports are updated here in real time so you always know exactly what you are researching.',
  },
]

export default function CoaPage() {
  const [documents, setDocuments] = useState([])
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .get('/api/coa')
      .then((data) => setDocuments(data.documents || []))
      .catch(() => setDocuments([]))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!selected) return undefined
    lockBodyScroll()
    const onKey = (event) => {
      if (event.key === 'Escape') setSelected(null)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      unlockBodyScroll()
      window.removeEventListener('keydown', onKey)
    }
  }, [selected])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return documents
    return documents.filter((document) =>
      `${document.name} ${document.content} ${document.product?.name || ''} ${document.product?.category || ''}`
        .toLowerCase()
        .includes(term),
    )
  }, [documents, search])

  const groups = useMemo(
    () =>
      [...new Set(filtered.map((document) => document.productId))].map((productId) => ({
        product: filtered.find((document) => document.productId === productId)?.product,
        documents: filtered.filter((document) => document.productId === productId),
      })),
    [filtered],
  )

  return (
    <PageTransition>
      <PageHeader />

      <main className="bg-white py-14 md:py-20">
        <div className="mx-auto max-w-5xl px-5 md:px-8">
          <div data-reveal="up" className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan/30 bg-cyan/5 px-3.5 py-1.5">
              <Beaker className="h-3.5 w-3.5 text-cyan-dim" strokeWidth={2} />
              <span className="text-[11px] font-bold tracking-[0.22em] text-ink uppercase">
                Quality & transparency
              </span>
            </div>
            <h1 className="mt-5 font-display text-2xl font-bold tracking-tight text-ink md:text-3xl">
              Our Commitment to Product Quality &amp; Testing Transparency
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-muted md:text-base">
              Direct supplier certificates, independent third-party verification, and continuous
              updates across our research catalog.
            </p>
          </div>

          <section data-reveal="up" data-reveal-delay="0.1" className="mt-12">
            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-[11px] font-bold tracking-[0.18em] text-cyan-dim uppercase">
                  Testing archive
                </p>
                <h2 className="mt-1 font-display text-xl font-bold text-ink md:text-2xl">
                  Certificates of Analysis
                </h2>
                <p className="mt-1 text-sm text-muted">
                  Search by product, certificate, batch or laboratory details.
                </p>
              </div>
              <div className="relative w-full md:max-w-sm">
                <Search className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-muted" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search the COA library"
                  className="w-full rounded-2xl border border-black/10 bg-fog py-3 pr-4 pl-11 text-sm text-ink outline-none transition focus:border-cyan focus:bg-white"
                />
              </div>
            </div>

            {loading ? (
              <div className="flex min-h-48 items-center justify-center rounded-3xl bg-fog">
                <span className="h-7 w-7 animate-spin rounded-full border-2 border-black/10 border-t-cyan" />
              </div>
            ) : groups.length ? (
              <div className="space-y-8">
                {groups.map(({ product, documents: productDocuments }) => (
                  <div key={product?.id}>
                    <div className="mb-3 flex items-center gap-3">
                      <img
                        src={assetUrl(product?.image)}
                        alt=""
                        className="h-11 w-11 rounded-xl bg-fog object-cover"
                      />
                      <div>
                        <h3 className="font-display text-base font-bold text-ink">{product?.name}</h3>
                        <p className="text-[11px] text-muted">
                          {productDocuments.length} certificate{productDocuments.length === 1 ? '' : 's'}
                        </p>
                      </div>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      {productDocuments.map((document) => (
                        <button
                          key={document.id}
                          type="button"
                          onClick={() => setSelected(document)}
                          className="group flex cursor-pointer items-start gap-4 rounded-2xl border border-black/7 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-cyan/40 hover:shadow-md"
                        >
                          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cyan/10 text-cyan-dim transition group-hover:bg-cyan group-hover:text-navy">
                            <FileText className="h-5 w-5" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block font-display text-[15px] font-bold text-ink">
                              {document.name}
                            </span>
                            <span className="mt-1 block text-[12px] text-muted">
                              {document.documentUrl
                                ? isImageDocument(document.documentUrl)
                                  ? 'Image certificate attached'
                                  : 'PDF certificate attached'
                                : 'Certificate details'}
                            </span>
                            <span className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-bold tracking-wide text-cyan-dim uppercase">
                              View certificate
                              {document.documentUrl ? <ExternalLink className="h-3 w-3" /> : null}
                            </span>
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-black/12 bg-fog px-6 py-14 text-center">
                <FileText className="mx-auto h-8 w-8 text-muted" />
                <p className="mt-3 font-display text-base font-bold text-ink">
                  {documents.length ? 'No matching certificates' : 'Certificates are being prepared'}
                </p>
                <p className="mx-auto mt-1 max-w-md text-sm text-muted">
                  {documents.length
                    ? 'Try a different product, batch or certificate name.'
                    : 'Published batch documents will appear here as laboratory results are finalized.'}
                </p>
              </div>
            )}
          </section>

          <div
            data-reveal="up"
            data-reveal-delay="0.08"
            className="mt-10 rounded-3xl border border-cyan/25 bg-gradient-to-br from-cyan/10 via-fog to-white p-6 md:p-8"
          >
            <p className="font-display text-base font-bold text-ink md:text-lg">
              Direct Supplier Certificates · Independent Third-Party Testing · Full Transparency
            </p>
            <ul className="mt-6 space-y-5">
              {pillars.map((item) => {
                const Icon = item.icon
                return (
                  <li key={item.title} className="flex gap-4">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-cyan shadow-sm ring-1 ring-cyan/20">
                      <Icon className="h-5 w-5" strokeWidth={1.8} />
                    </span>
                    <div>
                      <p className="font-display text-sm font-semibold text-ink">{item.title}</p>
                      <p className="mt-1 text-sm leading-relaxed text-muted">{item.text}</p>
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>

          <p
            data-reveal="up"
            data-reveal-delay="0.12"
            className="mt-8 text-center text-sm leading-relaxed text-muted"
          >
            Thank you for your trust and support as we maintain complete transparency across our
            research catalog.
          </p>

          <div
            data-reveal="up"
            data-reveal-delay="0.16"
            className="mt-10 flex flex-wrap items-center justify-center gap-3"
          >
            <Link
              to="/shop"
              className="rounded-xl bg-cyan px-5 py-3 text-sm font-semibold text-navy transition hover:brightness-110"
            >
              Browse products
            </Link>
            <a
              href={`mailto:${siteContact.email}?subject=${encodeURIComponent('COA / certificate request')}`}
              className="rounded-xl bg-fog px-5 py-3 text-sm font-semibold text-ink transition hover:bg-fog-deep"
            >
              Request a certificate
            </a>
          </div>
        </div>
      </main>

      <Footer />

      {createPortal(
        <AnimatePresence>
          {selected ? (
            <div className="fixed inset-0 z-[10070] flex items-end justify-center sm:items-center sm:p-5">
              <motion.button
                type="button"
                aria-label="Close certificate"
                onClick={() => setSelected(null)}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-navy/65 backdrop-blur-[3px]"
              />
              <motion.div
                role="dialog"
                aria-modal="true"
                aria-labelledby="coa-document-title"
                initial={{ opacity: 0, y: 24, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 18, scale: 0.98 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                className="relative flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl"
              >
                <div className="flex shrink-0 items-start justify-between gap-4 border-b border-black/8 px-5 py-4 md:px-7">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold tracking-[0.18em] text-cyan-dim uppercase">
                      {selected.product?.name}
                    </p>
                    <h2 id="coa-document-title" className="mt-1 truncate font-display text-lg font-bold text-ink">
                      {selected.name}
                    </h2>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {selected.documentUrl ? (
                      <a
                        href={assetUrl(selected.documentUrl)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-xl bg-fog px-3 py-2 text-[12px] font-semibold text-ink transition hover:bg-fog-deep"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Open full size
                      </a>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => setSelected(null)}
                      aria-label="Close"
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-fog text-ink transition hover:bg-fog-deep"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div
                  className={`min-h-0 flex-1 overflow-y-auto ${
                    selected.documentUrl ? 'grid lg:grid-cols-[0.38fr_0.62fr]' : ''
                  }`}
                >
                  <div className="p-5 md:p-7">
                    <p className="text-[10px] font-bold tracking-[0.16em] text-muted uppercase">
                      Certificate details
                    </p>
                    <div className="mt-3 whitespace-pre-line text-sm leading-7 text-ink">
                      {selected.content || 'No additional certificate notes were provided.'}
                    </div>
                  </div>
                  {selected.documentUrl ? (
                    <div className="border-t border-black/8 bg-fog p-4 md:p-5 lg:border-t-0 lg:border-l">
                      {isImageDocument(selected.documentUrl) ? (
                        <img
                          src={assetUrl(selected.documentUrl)}
                          alt={selected.name}
                          className="mx-auto max-h-[70vh] w-full rounded-2xl bg-white object-contain shadow-sm"
                        />
                      ) : (
                        <object
                          data={pdfViewerUrl(assetUrl(selected.documentUrl))}
                          type="application/pdf"
                          aria-label={`${selected.name} certificate`}
                          className="h-[70vh] w-full rounded-2xl bg-white shadow-sm"
                        >
                          <div className="flex h-full flex-col items-center justify-center gap-3 rounded-2xl bg-white p-6 text-center">
                            <FileText className="h-8 w-8 text-muted" />
                            <p className="text-sm text-muted">
                              Your browser cannot display this certificate inline.
                            </p>
                            <a
                              href={assetUrl(selected.documentUrl)}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-xl bg-cyan px-4 py-2.5 text-sm font-semibold text-navy"
                            >
                              Open certificate
                            </a>
                          </div>
                        </object>
                      )}
                    </div>
                  ) : null}
                </div>
              </motion.div>
            </div>
          ) : null}
        </AnimatePresence>,
        document.body,
      )}
    </PageTransition>
  )
}
