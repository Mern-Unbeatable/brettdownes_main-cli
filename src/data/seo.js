/** Site-wide SEO defaults for Peptide Ops (gated research portal). */

export const SITE_NAME = 'Peptide Ops'
export const SITE_TAGLINE = 'Precision. Purity. Performance.'
export const DEFAULT_TITLE = `${SITE_NAME} — ${SITE_TAGLINE}`
export const DEFAULT_DESCRIPTION =
  'Research-grade lyophilized peptides with verified purity and certificates of analysis. Institutional access for qualified researchers. For Research Use Only.'
export const DEFAULT_OG_IMAGE = '/images/logo.png'
export const TWITTER_HANDLE = ''

/** Production site origin — hardcoded for static hosting (no VITE_SITE_URL needed). */
export const SITE_ORIGIN = 'https://peptideopslogistics.com'

/** Absolute site origin for canonicals / Open Graph. */
export function siteOrigin() {
  return SITE_ORIGIN
}

export function absoluteUrl(path = '/') {
  const origin = siteOrigin()
  if (!path) return origin || '/'
  if (/^https?:\/\//i.test(path)) return path
  const normalized = path.startsWith('/') ? path : `/${path}`
  return origin ? `${origin}${normalized}` : normalized
}

export function pageTitle(title) {
  if (!title) return DEFAULT_TITLE
  if (title.includes(SITE_NAME)) return title
  return `${title} | ${SITE_NAME}`
}

/** Static route SEO copy (keywords tailored to RUO research peptides). */
export const pageSeo = {
  home: {
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    path: '/',
  },
  shop: {
    title: 'Shop Research Peptides',
    description:
      'Browse research-grade lyophilized peptides and blends with verified purity. Shop Peptide Ops catalogue for institutional research use only.',
    path: '/shop',
  },
  faq: {
    title: 'FAQ — Shipping, Quality & Access',
    description:
      'Answers about Peptide Ops access, shipping, storage, certificates of analysis, custom sourcing, and research-use compliance.',
    path: '/faq',
  },
  contact: {
    title: 'Contact',
    description:
      'Contact Peptide Ops Logistics for institutional orders, COAs, tracking, and research compound sourcing. Keizer, OR.',
    path: '/contact',
  },
  coa: {
    title: 'Certificates of Analysis (COA)',
    description:
      'View certificates of analysis for Peptide Ops research peptides — HPLC and mass spectrometry documentation from qualified manufacturing partners.',
    path: '/coa',
  },
  terms: {
    title: 'Terms of Service',
    description:
      'Peptide Ops terms of service for research-use-only peptide ordering, eligibility, payment, shipping, and liability.',
    path: '/terms',
  },
  privacy: {
    title: 'Privacy Policy',
    description:
      'How Peptide Ops collects, uses, and protects account, order, and analytics data for the research portal.',
    path: '/privacy',
  },
  checkout: {
    title: 'Checkout',
    description: 'Complete your Peptide Ops research order.',
    path: '/checkout',
    noIndex: true,
  },
  checkoutSuccess: {
    title: 'Order Confirmed',
    description: 'Your Peptide Ops order was received.',
    path: '/checkout/success',
    noIndex: true,
  },
  checkoutCancel: {
    title: 'Checkout Cancelled',
    description: 'Payment was cancelled. Your cart is still available.',
    path: '/checkout/cancel',
    noIndex: true,
  },
  resetPassword: {
    title: 'Reset Password',
    description: 'Reset your Peptide Ops research portal password.',
    path: '/reset-password',
    noIndex: true,
  },
  dashboard: {
    title: 'Dashboard',
    description: 'Peptide Ops researcher dashboard.',
    path: '/dashboard',
    noIndex: true,
  },
  admin: {
    title: 'Admin',
    description: 'Peptide Ops admin console.',
    path: '/admin',
    noIndex: true,
  },
}

export function productSeo(product) {
  if (!product) {
    return {
      title: 'Product',
      description: DEFAULT_DESCRIPTION,
      noIndex: true,
    }
  }

  const doseHint = product.variants?.map((v) => v.dose).filter(Boolean).slice(0, 3).join(', ')
  const summary = (product.summary || product.description || '').replace(/\s+/g, ' ').trim()
  const description = (
    summary ||
    `${product.name} research peptide${doseHint ? ` (${doseHint})` : ''} from Peptide Ops. For Research Use Only; not for human consumption.`
  ).slice(0, 160)

  return {
    title: product.name,
    description,
    path: `/shop/${product.slug}`,
    image: product.image || product.variants?.[0]?.image || DEFAULT_OG_IMAGE,
    type: 'product',
  }
}
