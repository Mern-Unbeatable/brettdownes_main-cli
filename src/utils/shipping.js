function normalizeCarrier(carrier) {
  return String(carrier || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
}

function carrierLabel(carrier) {
  const token = normalizeCarrier(carrier)
  if (token.includes('usps') || token === 'uspostal') return 'USPS'
  if (token.includes('fedex')) return 'FedEx'
  if (token.includes('ups')) return 'UPS'
  return carrier || 'Other'
}

/** Group checkout rates by carrier, cheapest first within each group. */
export function groupRatesByCarrier(rates = []) {
  const grouped = new Map()

  for (const rate of rates) {
    const label = carrierLabel(rate.carrier)
    if (!grouped.has(label)) grouped.set(label, [])
    grouped.get(label).push(rate)
  }

  const order = ['USPS', 'FedEx', 'UPS']
  const labels = [
    ...order.filter((label) => grouped.has(label)),
    ...[...grouped.keys()].filter((label) => !order.includes(label)),
  ]

  return labels.map((label) => ({
    carrier: label,
    rates: grouped.get(label).sort((a, b) => a.amountCents - b.amountCents),
  }))
}
