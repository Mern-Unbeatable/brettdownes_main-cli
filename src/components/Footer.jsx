import { Link } from 'react-router-dom'
import Logo from './Logo'
import { navLinks, siteContact } from '../data/site'

function whatsappHref() {
  return `https://wa.me/${siteContact.whatsapp}?text=${encodeURIComponent(siteContact.whatsappMessage)}`
}

export default function Footer() {
  return (
    <footer className="border-t border-fog-deep bg-white pt-14 pb-8">
      <div
        data-reveal-stagger
        data-stagger="0.1"
        className="mx-auto grid max-w-10xl gap-10 px-5 sm:grid-cols-2 lg:grid-cols-4 md:px-8"
      >
        <div className="flex flex-col items-center text-center sm:col-span-2 lg:col-span-2 lg:items-start lg:text-left">
          <Logo className="h-[150px] w-auto max-w-full" />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">
            Precision. Purity. Documentation. Lyophilized research use only.
          </p>
          <div className="mt-6 space-y-1 text-sm text-muted">
            <p className="flex items-center justify-center gap-2.5 lg:justify-start">
              <a href={`tel:${siteContact.phoneTel}`} className="transition hover:text-ink">
                {siteContact.phoneDisplay}
              </a>
              <a
                href={whatsappHref()}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Chat on WhatsApp"
                className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#25D366] text-white transition hover:scale-105 hover:bg-[#20bd5a]"
              >
                <svg viewBox="0 0 32 32" className="h-4 w-4" fill="currentColor" aria-hidden>
                  <path d="M19.11 17.53c-.28-.14-1.64-.81-1.9-.9-.25-.1-.44-.14-.62.14-.19.28-.72.9-.88 1.08-.16.19-.33.21-.6.07-.28-.14-1.17-.43-2.23-1.37-.82-.73-1.38-1.64-1.54-1.91-.16-.28-.02-.43.12-.57.13-.13.28-.33.42-.5.14-.16.19-.28.28-.47.1-.19.05-.35-.02-.5-.07-.14-.62-1.49-.85-2.04-.22-.53-.45-.46-.62-.47h-.53c-.19 0-.5.07-.76.35-.26.28-1 1-1 2.43s1.02 2.82 1.17 3.01c.14.19 2 3.05 4.84 4.28.68.29 1.21.47 1.62.6.68.22 1.3.19 1.79.11.55-.08 1.64-.67 1.87-1.32.23-.65.23-1.2.16-1.32-.07-.11-.25-.18-.53-.32z" />
                  <path d="M16.02 3C8.84 3 3 8.83 3 16c0 2.29.61 4.45 1.68 6.32L3 29l6.85-1.8A12.93 12.93 0 0 0 16.02 29C23.2 29 29 23.17 29 16S23.2 3 16.02 3zm0 23.67c-2.1 0-4.05-.56-5.74-1.54l-.41-.24-4.06 1.07 1.08-3.96-.27-.41A10.6 10.6 0 0 1 5.35 16c0-5.88 4.79-10.67 10.67-10.67S26.69 10.12 26.69 16s-4.79 10.67-10.67 10.67z" />
                </svg>
              </a>
            </p>
            <p>
              <a href={`mailto:${siteContact.email}`} className="transition hover:text-ink">
                {siteContact.email}
              </a>
            </p>
          </div>
        </div>

        <div className="hidden lg:block">
          <h3 className="font-display text-sm font-semibold tracking-wide text-ink">Menu</h3>
          <ul className="mt-4 space-y-2">
            {navLinks.map((item) => (
              <li key={item.label}>
                <Link to={item.to} className="text-sm text-muted transition hover:text-ink">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="text-center sm:col-span-2 lg:col-span-1 lg:text-left">
          <h3 className="font-display text-sm font-semibold tracking-wide text-ink">Address</h3>
          <address className="mt-4 space-y-1 text-sm not-italic leading-relaxed text-muted">
            <p>Peptide Ops Logistics</p>
            <p>4472 River Rd N</p>
            <p>PMB #1020</p>
            <p>Keizer, OR 97303</p>
          </address>
        </div>
      </div>

      <div className="mx-auto mt-12 flex max-w-10xl items-center justify-center border-t border-fog-deep px-5 pt-6 md:px-8">
        <div className="flex flex-wrap items-center justify-center gap-3">
          <img
            src="/images/visa.svg"
            alt="Visa"
            className="h-10 w-auto rounded border border-fog-deep bg-white object-contain px-2.5 py-1.5"
          />
          <img
            src="/images/mastercard.svg"
            alt="Mastercard"
            className="h-10 w-auto rounded border border-fog-deep bg-white object-contain px-2.5 py-1.5"
          />
          <img
            src="/images/amex.svg"
            alt="American Express"
            className="h-10 w-auto rounded border border-fog-deep bg-white object-contain px-2.5 py-1.5"
          />
        </div>
      </div>
    </footer>
  )
}
