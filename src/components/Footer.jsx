import { Link } from 'react-router-dom'
import Logo from './Logo'
import { navLinks, siteContact } from '../data/site'

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
            Precision. Purity. Performance. Research peptides verified for modern science.
          </p>
          <div className="mt-6 space-y-1 text-sm text-muted">
            <p>
              <a href={`tel:${siteContact.phoneTel}`} className="transition hover:text-ink">
                {siteContact.phoneDisplay}
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

      <div className="mx-auto mt-12 flex max-w-10xl flex-col items-center justify-between gap-4 border-t border-fog-deep px-5 pt-6 text-xs text-muted sm:flex-row md:px-8">
        <p>© {new Date().getFullYear()} Peptide Ops. Research use only.</p>
        <div className="flex items-center gap-3">
          <img
            src="/images/visa.svg"
            alt="Visa"
            className="h-8 w-auto rounded border border-fog-deep bg-white object-contain px-2 py-1"
          />
          <img
            src="/images/mastercard.svg"
            alt="Mastercard"
            className="h-8 w-auto rounded border border-fog-deep bg-white object-contain px-2 py-1"
          />
        </div>
      </div>
    </footer>
  )
}
