import { isKitDiscountCategory } from '../data/categories'

/** Explicit kit label, or qty 10+ of one cart line — Peptides & Blends only. */
function isKit(item) {
  if (!isKitDiscountCategory(item.category)) return false
  // Safety net: bacteriostatic water never gets kit pricing even if miscategorized.
  if (/bacteriostatic/i.test(`${item.name || ''} ${item.dose || ''} ${item.barcode || ''}`)) {
    return false
  }
  if (Number(item.qty) >= 10) return true
  return /\bkit\b/i.test(`${item.name || ''} ${item.dose || ''} ${item.barcode || ''}`)
}

export function calculateBulkDiscount(items, tiers = []) {
  const subtotalCents = Math.round(
    items.reduce((sum, item) => sum + Number(item.price || 0) * item.qty, 0) * 100,
  )
  const kitSubtotalCents = Math.round(
    items
      .filter(isKit)
      .reduce((sum, item) => sum + Number(item.price || 0) * item.qty, 0) * 100,
  )

  let best = { discountCents: 0, discountLabel: null, tierId: null }

  for (const tier of tiers || []) {
    if (!tier?.enabled || !tier.percent) continue
    const baseCents = tier.scope === 'KIT' ? kitSubtotalCents : subtotalCents
    if (!baseCents || baseCents < Number(tier.minSubtotalCents || 0)) continue

    const discountCents = Math.round(baseCents * (Number(tier.percent) / 100))
    if (discountCents > best.discountCents) {
      best = {
        discountCents,
        discountLabel: `${tier.percent}% — ${tier.detail}`,
        tierId: tier.id,
      }
    }
  }

  return best
}
