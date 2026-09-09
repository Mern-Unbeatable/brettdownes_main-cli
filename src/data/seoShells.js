/** Crawlable SEO shells for public routes (used at build + static HTML). */

export const SITE_ORIGIN = 'https://www.peptideopslogistics.com'

export const PUBLIC_SEO_SHELLS = [
  {
    route: '/',
    title: 'Peptide Ops Logistics — Precision. Purity. Performance.',
    description:
      'Peptide Ops Logistics (peptideopslogistics.com) supplies research-grade lyophilized peptides with verified purity and certificates of analysis. Institutional access for qualified researchers. For Research Use Only.',
    h1: 'Peptide Ops Logistics — research-grade peptides',
    h2: 'Precision. Purity. Performance.',
    paragraphs: [
      'Peptide Ops Logistics (peptideopslogistics.com) supplies research-grade lyophilized peptides with batch-verified purity and certificates of analysis for qualified institutional researchers. Products are for research use only and are not for human consumption.',
      'Every lot is documented for identity and purity so laboratories can run controlled in vitro protocols with confidence. Explore our FAQ for shipping and storage guidance, review certificates of analysis, or contact our team for institutional orders and custom sourcing through our partner network.',
    ],
  },
  {
    route: '/faq',
    title: 'FAQ — Shipping, Quality & Access | Peptide Ops Logistics',
    description:
      'Peptide Ops Logistics FAQ covering portal access, shipping timelines, cold-chain storage, certificates of analysis, custom sourcing, and research-use-only compliance.',
    h1: 'Frequently asked questions — Peptide Ops Logistics',
    h2: 'Help for research buyers',
    paragraphs: [
      'Find answers about Peptide Ops Logistics account verification, order processing, domestic shipping, storage of lyophilized peptides, and how to request certificates of analysis for your research protocols.',
      'Still need help? Contact Peptide Ops Logistics support for institutional orders, tracking questions, or compound sourcing. All products remain for research use only and are not for human consumption.',
    ],
  },
  {
    route: '/contact',
    title: 'Contact Us | Peptide Ops Logistics',
    description:
      'Contact Peptide Ops Logistics for institutional peptide orders, COAs, tracking, and research compound sourcing. Phone, email, and inquiry form available.',
    h1: 'Contact Peptide Ops Logistics',
    h2: 'Research inquiries',
    paragraphs: [
      'Reach Peptide Ops Logistics for institutional orders, certificates of analysis, shipment tracking, and custom research compound sourcing. We typically respond to research inquiries within one business day.',
      'Email Support@peptideopslogistics.com or call 503-877-5390. Visit peptideopslogistics.com for FAQ, COA archives, and portal access details. Products are for research use only.',
    ],
  },
  {
    route: '/coa',
    title: 'Certificates of Analysis (COA) | Peptide Ops Logistics',
    description:
      'Browse Peptide Ops Logistics certificates of analysis for research peptides — HPLC and mass spectrometry documentation from qualified manufacturing partners.',
    h1: 'Certificates of Analysis — Peptide Ops Logistics',
    h2: 'Quality & testing transparency',
    paragraphs: [
      'Peptide Ops Logistics publishes certificates of analysis so researchers can verify identity, purity, and lot documentation before ordering lyophilized reference materials.',
      'Search COAs by product or batch, then contact our team if you need additional documentation. Catalogue access is for approved researchers. For research use only; not for human consumption.',
    ],
  },
  {
    route: '/terms',
    title: 'Terms of Service | Peptide Ops Logistics',
    description:
      'Peptide Ops Logistics terms of service for research-use-only peptide ordering, eligibility, payment, shipping, returns, and liability on peptideopslogistics.com.',
    h1: 'Terms of Service — Peptide Ops Logistics',
    h2: 'Using this research portal',
    paragraphs: [
      'These Terms of Service govern use of the Peptide Ops Logistics website and research portal at peptideopslogistics.com, including account registration, ordering, payment, and shipping of research-use-only materials.',
      'By creating an account or placing an order you agree to eligibility requirements and RUO restrictions. Contact Support@peptideopslogistics.com with questions about these terms.',
    ],
  },
  {
    route: '/privacy',
    title: 'Privacy Policy | Peptide Ops Logistics',
    description:
      'How Peptide Ops Logistics collects, uses, and protects account, order, and analytics data for the research portal at peptideopslogistics.com.',
    h1: 'Privacy Policy — Peptide Ops Logistics',
    h2: 'Your data on our portal',
    paragraphs: [
      'This Privacy Policy explains how Peptide Ops Logistics collects and uses personal information when you create an account, place an order, or contact support through peptideopslogistics.com.',
      'We share data only with operational providers such as payment and shipping partners, and we do not sell personal information. Contact Support@peptideopslogistics.com for privacy requests.',
    ],
  },
]

export const SEO_NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/faq', label: 'FAQ' },
  { href: '/contact', label: 'Contact' },
  { href: '/coa', label: 'Certificates of Analysis (COA)' },
  { href: '/terms', label: 'Terms of Service' },
  { href: '/privacy', label: 'Privacy Policy' },
]
