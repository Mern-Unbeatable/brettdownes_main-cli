export const PRODUCT_CATEGORIES = ['Peptides', 'Blends']

export function normalizeCategory(value) {
  const raw = String(value || '').trim().toLowerCase()
  if (raw.includes('blend')) return 'Blends'
  return 'Peptides'
}
