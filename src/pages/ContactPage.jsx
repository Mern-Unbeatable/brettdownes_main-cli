import { useState } from 'react'
import { Mail, MapPin, Phone, Send } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import PageTransition from '../components/PageTransition'
import Footer from '../components/Footer'
import { siteContact } from '../data/site'
import Seo from '../components/Seo'
import { pageSeo } from '../data/seo'

export default function ContactPage() {
  const [sent, setSent] = useState(false)

  const onSubmit = (e) => {
    e.preventDefault()
    setSent(true)
  }

  return (
    <PageTransition>
      <Seo {...pageSeo.contact} />
      <PageHeader
        title="Contact"
        subtitle="Reach Peptide Ops Logistics for institutional orders, certificates, tracking, and research compound sourcing."
        image="/images/contact-hero-peptides.webp"
      />

      <main className="bg-white py-14 md:py-20">
        <div className="mx-auto max-w-10xl px-5 md:px-8">
          <div className="grid gap-10 md:grid-cols-2 md:gap-14">
            <div data-reveal="left">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan" />
                <span className="text-[11px] font-bold tracking-[0.28em] text-ink uppercase">
                  Get in touch
                </span>
              </div>
              <h2 className="mt-4 font-display text-2xl font-bold tracking-tight text-ink md:text-3xl">
                We respond to research inquiries within one business day.
              </h2>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-muted">
                Share your order details, batch questions, or shipping needs. No spam — only clear
                operational replies.
              </p>

              <ul data-reveal-stagger data-stagger="0.12" className="mt-10 space-y-5">
                <li className="flex gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-cyan/40 text-cyan">
                    <MapPin className="h-5 w-5" strokeWidth={1.8} />
                  </span>
                  <div>
                    <p className="font-display text-sm font-semibold text-ink">Address</p>
                    <p className="mt-1 text-sm leading-relaxed text-muted">
                      Peptide Ops Logistics
                      <br />
                      4472 River Rd N
                      <br />
                      PMB #1020
                      <br />
                      Keizer, OR 97303
                    </p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-cyan/40 text-cyan">
                    <Phone className="h-5 w-5" strokeWidth={1.8} />
                  </span>
                  <div>
                    <p className="font-display text-sm font-semibold text-ink">WhatsApp</p>
                    <p className="mt-1 text-sm text-muted">
                      <a href={`tel:${siteContact.phoneTel}`} className="transition hover:text-ink">
                        {siteContact.phoneDisplay}
                      </a>
                    </p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-cyan/40 text-cyan">
                    <Mail className="h-5 w-5" strokeWidth={1.8} />
                  </span>
                  <div>
                    <p className="font-display text-sm font-semibold text-ink">Email</p>
                    <p className="mt-1 text-sm text-muted">
                      <a href={`mailto:${siteContact.email}`} className="transition hover:text-ink">
                        {siteContact.email}
                      </a>
                    </p>
                  </div>
                </li>
              </ul>
            </div>

            <div data-reveal="right" data-reveal-delay="0.1" className="rounded-3xl bg-fog p-6 md:p-8">
              <form onSubmit={onSubmit} className="space-y-4">
                <div>
                  <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-ink">
                    Name
                  </label>
                  <input
                    id="name"
                    name="name"
                    required
                    className="w-full rounded-xl border border-black/8 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-cyan"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-ink">
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    className="w-full rounded-xl border border-black/8 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-cyan"
                    placeholder="you@email.com"
                  />
                </div>
                <div>
                  <label htmlFor="subject" className="mb-1.5 block text-sm font-medium text-ink">
                    Subject
                  </label>
                  <input
                    id="subject"
                    name="subject"
                    required
                    className="w-full rounded-xl border border-black/8 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-cyan"
                    placeholder="Order, certificate, shipping…"
                  />
                </div>
                <div>
                  <label htmlFor="message" className="mb-1.5 block text-sm font-medium text-ink">
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    required
                    rows={5}
                    className="w-full resize-y rounded-xl border border-black/8 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-cyan"
                    placeholder="How can we help?"
                  />
                </div>

                <button
                  type="submit"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-cyan px-6 py-3.5 text-sm font-semibold text-ink transition hover:bg-cyan-dim"
                >
                  Send message
                  <Send className="h-4 w-4" strokeWidth={2.2} />
                </button>

                {sent ? (
                  <p className="text-center text-sm font-medium text-cyan-dim">
                    Message ready — we will reply shortly.
                  </p>
                ) : null}
              </form>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </PageTransition>
  )
}
