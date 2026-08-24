const FILLET_BL =
  'pointer-events-none absolute h-3 w-3 [mask-image:radial-gradient(circle_12px_at_100%_100%,transparent_98%,#000_100%)]'

const FILLET_BR =
  'pointer-events-none absolute h-3 w-3 [mask-image:radial-gradient(circle_12px_at_0%_100%,transparent_98%,#000_100%)]'

function CornerBadge({ label, tone = 'cyan', corner = 'left' }) {
  const text = String(label || '').trim()
  if (!text) return null

  const styles =
    tone === 'stock'
      ? { box: 'bg-ink text-white', fillet: 'bg-ink' }
      : tone === 'hot'
        ? { box: 'bg-rose-600 text-white', fillet: 'bg-rose-600' }
        : { box: 'bg-cyan text-navy', fillet: 'bg-cyan' }

  if (corner === 'right') {
    return (
      <span
        className={`absolute top-0 right-0 z-10 rounded-tr-[inherit] rounded-bl-xl px-2.5 py-1.5 text-[9px] font-extrabold tracking-[0.14em] uppercase sm:px-3 sm:text-[10px] ${styles.box}`}
      >
        {text}
        <span aria-hidden className={`${FILLET_BR} top-0 right-full ${styles.fillet}`} />
        <span aria-hidden className={`${FILLET_BR} top-full right-0 ${styles.fillet} [mask-image:radial-gradient(circle_12px_at_0%_0%,transparent_98%,#000_100%)]`} />
      </span>
    )
  }

  return (
    <span
      className={`absolute top-0 left-0 z-10 rounded-tl-[inherit] rounded-br-xl px-2.5 py-1.5 text-[9px] font-extrabold tracking-[0.14em] uppercase sm:px-3 sm:text-[10px] ${styles.box}`}
    >
      {text}
      <span aria-hidden className={`${FILLET_BL} top-0 left-full ${styles.fillet}`} />
      <span aria-hidden className={`${FILLET_BL} top-full left-0 ${styles.fillet} [mask-image:radial-gradient(circle_12px_at_100%_0%,transparent_98%,#000_100%)]`} />
    </span>
  )
}

/**
 * Corner tags with inverted fillets. When out of stock and a marketing badge
 * (HOT / FEATURED / etc.) both apply, Out of stock stays top-left and the
 * marketing badge moves to top-right so neither is hidden.
 */
export default function ProductBadge({ label, outOfStock = false }) {
  const marketing = String(label || '').trim()
  const hot = marketing.toUpperCase() === 'HOT'

  if (!outOfStock && !marketing) return null

  if (outOfStock && marketing) {
    return (
      <>
        <CornerBadge label="Out of stock" tone="stock" corner="left" />
        <CornerBadge label={marketing} tone={hot ? 'hot' : 'cyan'} corner="right" />
      </>
    )
  }

  if (outOfStock) {
    return <CornerBadge label="Out of stock" tone="stock" corner="left" />
  }

  return <CornerBadge label={marketing} tone={hot ? 'hot' : 'cyan'} corner="left" />
}

/** True when every variant has zero (or missing) stock. */
export function isProductOutOfStock(product) {
  const variants = product?.variants || []
  if (!variants.length) return true
  return variants.every((variant) => Number(variant.stock ?? variant.quantity ?? 0) <= 0)
}

/** True when this dose/variant cannot be ordered. */
export function isVariantOutOfStock(variant) {
  return Number(variant?.stock ?? variant?.quantity ?? 0) <= 0
}

/** First in-stock variant, or null if the product is fully out. */
export function firstInStockVariant(product) {
  return (product?.variants || []).find((variant) => !isVariantOutOfStock(variant)) || null
}
