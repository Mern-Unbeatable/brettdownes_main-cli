function isKit(item) {
  return /\bkit\b/i.test(`${item.name || ''} ${item.dose || ''} ${item.sku || ''}`)
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
