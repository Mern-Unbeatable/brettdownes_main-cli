export const PRODUCT_CATEGORIES = ['Peptides', 'Blends', 'Other']

/** Categories eligible for the 25% full-kit bulk reward. */
export const KIT_DISCOUNT_CATEGORIES = ['Peptides', 'Blends']

export function normalizeCategory(value) {
  const raw = String(value || '').trim().toLowerCase()
  if (raw.includes('blend')) return 'Blends'
  if (raw.includes('other')) return 'Other'
  return 'Peptides'
}

export function isKitDiscountCategory(category) {
  return KIT_DISCOUNT_CATEGORIES.includes(normalizeCategory(category))
}
