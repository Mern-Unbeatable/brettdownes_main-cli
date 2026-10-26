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
        discountType: 'bulk',
        tierId: tier.id,
      }
    }
  }

  return best
}

/** Same pairing logic as the API — highest unit paid, lower unit in each pair free. */
export function calculateBogoDiscount(items, promotions = []) {
  let discountCents = 0
  let freeUnitCount = 0
  const labels = []
  const eligibleProductIds = new Set()

  for (const promo of promotions || []) {
    const idSet = new Set(promo.productIds || [])
    if (!idSet.size) continue

    const units = []
    for (const item of items || []) {
      if (!idSet.has(item.productId)) continue
      eligibleProductIds.add(item.productId)
      const unitCents = Math.round(Number(item.price || 0) * 100)
      if (!unitCents) continue
      for (let i = 0; i < Number(item.qty) || 0; i += 1) {
        units.push(unitCents)
      }
    }

    if (units.length < 2) continue
    units.sort((a, b) => b - a)
    let promoDiscount = 0
    for (let i = 1; i < units.length; i += 2) {
      promoDiscount += units[i]
      freeUnitCount += 1
    }
    if (promoDiscount > 0) {
      discountCents += promoDiscount
      labels.push(promo.name)
    }
  }

  return {
    discountCents,
    discountLabel: labels.join(' + ') || null,
    discountType: discountCents > 0 ? 'bogo' : null,
    displayTitle: 'Buy 2 Get 1 Free',
    freeUnitCount,
    eligibleProductIds: [...eligibleProductIds],
  }
}

export function pickAutomaticDiscount(bulkDiscount, bogoDiscount) {
  const bulk = bulkDiscount?.discountCents || 0
  const bogo = bogoDiscount?.discountCents || 0
  return bogo > bulk ? bogoDiscount : bulkDiscount
}
