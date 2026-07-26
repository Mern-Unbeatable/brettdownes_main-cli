export const navLinks = [
  { label: 'Home', to: '/' },
  { label: 'Shop', to: '/shop' },
  { label: 'Contact', to: '/contact' },
]

const IMG = {
  glp: '/images/product-glp1.png',
  mots: '/images/product-motsc.png',
  bpc: '/images/product-bpc157.png',
  tb: '/images/product-tb500.png',
}

export const products = [
  {
    id: 'glp-1',
    slug: 'glp-1',
    name: 'GLP-1',
    category: 'Peptides',
    image: IMG.glp,
    purity: '≥ 99.5%',
    form: 'Lyophilized',
    summary: 'Research-grade GLP-1 analog for metabolic pathway and receptor studies.',
    description:
      'GLP-1 is supplied as a high-purity lyophilized peptide for controlled laboratory research. Each batch is verified for identity, purity, and consistency so studies start from a reliable baseline.',
    highlights: [
      'Triple-stage purity verification',
      'Batch Certificate of Analysis available',
      'Research use only',
    ],
    variants: [
      { id: 'glp-5', dose: '5mg', price: 95, sku: 'PO-GLP-5', image: IMG.glp },
      { id: 'glp-10', dose: '10mg', price: 110, sku: 'PO-GLP-10', image: IMG.mots },
      { id: 'glp-20', dose: '20mg', price: 185, sku: 'PO-GLP-20', image: IMG.bpc },
    ],
  },
  {
    id: 'mots-c',
    slug: 'mots-c',
    name: 'MOTS-C',
    category: 'Peptides',
    image: IMG.mots,
    purity: '≥ 99.5%',
    form: 'Lyophilized',
    summary: 'Mitochondrial-derived peptide for cellular energy and metabolic research.',
    description:
      'MOTS-C is a mitochondrial open reading frame peptide used in research focused on metabolic signaling and cellular energy pathways. Packaged for precise reconstitution and repeatable dosing protocols.',
    highlights: [
      'ISO-aligned lab testing',
      'Stable lyophilized format',
      'Multiple vial strengths',
    ],
    variants: [
      { id: 'mots-5', dose: '5mg', price: 80, sku: 'PO-MOTS-5', image: IMG.mots },
      { id: 'mots-10', dose: '10mg', price: 95, sku: 'PO-MOTS-10', image: IMG.glp },
      { id: 'mots-15', dose: '15mg', price: 130, sku: 'PO-MOTS-15', image: IMG.tb },
    ],
  },
  {
    id: 'bpc-157',
    slug: 'bpc-157',
    name: 'BPC-157',
    category: 'Peptides',
    image: IMG.bpc,
    purity: '≥ 99.5%',
    form: 'Lyophilized',
    summary: 'Body protection compound peptide for regenerative and tissue research models.',
    description:
      'BPC-157 is a synthetic peptide fragment researched for recovery and tissue-response pathways. Peptide Ops supplies verified lots with clear labeling for laboratory workflows.',
    highlights: [
      'High batch consistency',
      'Clear dose labeling',
      'Research documentation on request',
    ],
    variants: [
      { id: 'bpc-5', dose: '5mg', price: 85, sku: 'PO-BPC-5', image: IMG.bpc },
      { id: 'bpc-10', dose: '10mg', price: 145, sku: 'PO-BPC-10', image: IMG.tb },
      { id: 'bpc-kit', dose: '5mg × 10', price: 720, sku: 'PO-BPC-KIT', image: IMG.glp },
    ],
  },
  {
    id: 'tb-500',
    slug: 'tb-500',
    name: 'TB-500',
    category: 'Peptides',
    image: IMG.tb,
    purity: '≥ 99.5%',
    form: 'Lyophilized',
    summary: 'Thymosin Beta-4 fragment for mobility and recovery pathway research.',
    description:
      'TB-500 is offered in multiple vial sizes for labs studying regenerative signaling. Each version shares the same verified compound profile with dose-specific packaging.',
    highlights: [
      'Same compound, multiple doses',
      'Purity ≥ 99.5%',
      'Cold-chain packing available',
    ],
    variants: [
      { id: 'tb-5', dose: '5mg', price: 90, sku: 'PO-TB-5', image: IMG.tb },
      { id: 'tb-10', dose: '10mg', price: 155, sku: 'PO-TB-10', image: IMG.bpc },
      { id: 'tb-20', dose: '20mg', price: 270, sku: 'PO-TB-20', image: IMG.mots },
    ],
  },
  {
    id: '5-amino-1mq',
    slug: '5-amino-1mq',
    name: '5-amino-1mq',
    category: 'Blends',
    image: IMG.glp,
    purity: '≥ 99%',
    form: 'Lyophilized',
    summary: 'NNMT-pathway research compound available in multiple strengths.',
    description:
      '5-amino-1mq is prepared for metabolic enzyme research. Choose the vial strength that matches your protocol while keeping the same research-grade specification.',
    highlights: [
      'Multiple vial options',
      'Research-only labeling',
      'Verified lot tracking',
    ],
    variants: [
      { id: 'amino-5', dose: '5mg', price: 75, sku: 'PO-1MQ-5', image: IMG.glp },
      { id: 'amino-10', dose: '10mg', price: 95, sku: 'PO-1MQ-10', image: IMG.mots },
      { id: 'amino-50', dose: '50mg', price: 310, sku: 'PO-1MQ-50', image: IMG.tb },
    ],
  },
  {
    id: 'cjc-1295',
    slug: 'cjc-1295',
    name: 'CJC-1295',
    category: 'Peptides',
    image: IMG.mots,
    purity: '≥ 99.5%',
    form: 'Lyophilized',
    summary: 'GHRH analog peptide for growth-hormone axis research applications.',
    description:
      'CJC-1295 is supplied in verified lyophilized vials. Select from no-DAC research formats across common laboratory dose sizes.',
    highlights: [
      'Consistent peptide profile',
      'Dose variants in stock',
      'COA per batch',
    ],
    variants: [
      { id: 'cjc-2', dose: '2mg', price: 120, sku: 'PO-CJC-2', image: IMG.mots },
      { id: 'cjc-5', dose: '5mg', price: 195, sku: 'PO-CJC-5', image: IMG.glp },
      { id: 'cjc-10', dose: '10mg', price: 340, sku: 'PO-CJC-10', image: IMG.bpc },
    ],
  },
  {
    id: 'ipamorelin',
    slug: 'ipamorelin',
    name: 'Ipamorelin',
    category: 'Peptides',
    image: IMG.bpc,
    purity: '≥ 99.5%',
    form: 'Lyophilized',
    summary: 'Selective ghrelin-receptor agonist peptide for endocrine research.',
    description:
      'Ipamorelin is offered in multiple vial strengths for comparative and longitudinal study designs. Same compound quality across every version.',
    highlights: [
      'High selectivity research profile',
      'Multiple dose versions',
      'Lab-ready packaging',
    ],
    variants: [
      { id: 'ipa-2', dose: '2mg', price: 70, sku: 'PO-IPA-2', image: IMG.bpc },
      { id: 'ipa-5', dose: '5mg', price: 88, sku: 'PO-IPA-5', image: IMG.tb },
      { id: 'ipa-10', dose: '10mg', price: 150, sku: 'PO-IPA-10', image: IMG.glp },
    ],
  },
  {
    id: 'nad-plus',
    slug: 'nad-plus',
    name: 'NAD+',
    category: 'Capsules',
    image: IMG.tb,
    purity: '≥ 99%',
    form: 'Capsule / Vial',
    summary: 'Nicotinamide adenine dinucleotide for cellular energy research protocols.',
    description:
      'NAD+ is available in capsule and research vial formats so teams can standardize around the same compound with different delivery versions.',
    highlights: [
      'Capsule and vial options',
      'Documented purity',
      'Research use only',
    ],
    variants: [
      { id: 'nad-50', dose: '50mg', price: 95, sku: 'PO-NAD-50', image: IMG.tb },
      { id: 'nad-100', dose: '100mg', price: 145, sku: 'PO-NAD-100', image: IMG.mots },
      { id: 'nad-cap', dose: '250mg caps', price: 165, sku: 'PO-NAD-CAP', image: IMG.bpc },
    ],
  },
]

export function getProductBySlug(slug) {
  return products.find((p) => p.slug === slug)
}

export function formatPrice(value) {
  return `$${Number(value).toFixed(2)}`
}

export function lowestPrice(product) {
  return Math.min(...product.variants.map((v) => v.price))
}
