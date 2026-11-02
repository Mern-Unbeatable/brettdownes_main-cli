import { bulkRewards as fallbackBulkRewards } from '../data/site'

export function formatPromoDollars(cents) {
  const dollars = Math.max(0, Number(cents) || 0) / 100
  return dollars.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: dollars % 1 === 0 ? 0 : 2,
  })
}

/**
 * Build scrolling promo copy from live tiers + free-shipping threshold.
 * Returns `{ kind: 'shipping' | 'discount', text, highlight? }` items; free delivery leads.
 */
export function buildPromoTickerMessages(tiers = [], freeShippingThresholdCents = 0) {
  const messages = []

  if (freeShippingThresholdCents > 0) {
    messages.push({
      kind: 'shipping',
      highlight: 'Free delivery',
      text: `on orders ${formatPromoDollars(freeShippingThresholdCents)}+`,
    })
  }

  const orderTiers = (tiers.length ? tiers : fallbackBulkRewards.map((row, index) => ({
    id: `fallback-${index}`,
    scope: 'ORDER',
    percent: parseInt(String(row.save).replace(/\D/g, ''), 10) || 0,
    minSubtotalCents: 0,
    detail: row.detail,
    name: row.detail,
  })))
    .filter((tier) => tier.enabled !== false && tier.percent > 0)
    .sort((a, b) => {
      const scopeOrder = (tier) => (tier.scope === 'KIT' ? 1 : 0)
      const byScope = scopeOrder(a) - scopeOrder(b)
      if (byScope !== 0) return byScope
      return (a.minSubtotalCents || 0) - (b.minSubtotalCents || 0)
    })

  for (const tier of orderTiers) {
    const min = tier.minSubtotalCents || 0
    const detail = tier.detail || tier.name || ''
    let text
    if (min > 0) {
      text = `Save ${tier.percent}% on orders ${formatPromoDollars(min)}+`
    } else if (detail) {
      text = `Save ${tier.percent}% — ${detail}`
    } else {
      text = `Save ${tier.percent}% on qualifying orders`
    }
    messages.push({ kind: 'discount', text })
  }

  if (!messages.length) {
    messages.push({
      kind: 'discount',
      text: 'Bulk savings apply automatically at checkout — no coupon needed',
    })
  }

  return messages
}
