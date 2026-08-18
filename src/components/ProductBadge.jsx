const FILLET =
  'pointer-events-none absolute h-3 w-3 [mask-image:radial-gradient(circle_12px_at_100%_100%,transparent_98%,#000_100%)] [mask-repeat:no-repeat]'

/**
 * Corner tag with inverted (concave) fillets, so the label reads as cut into the
 * image corner rather than floating on top of it. Needs a rounded, clipped parent.
 */
export default function ProductBadge({ label }) {
  const text = String(label || '').trim()
  if (!text) return null

  const hot = text.toUpperCase() === 'HOT'

  return (
    <span
      className={`absolute top-0 left-0 z-10 rounded-tl-[inherit] rounded-br-xl px-2.5 py-1.5 text-[9px] font-extrabold tracking-[0.14em] uppercase sm:px-3 sm:text-[10px] ${
        hot ? 'bg-rose-600 text-white' : 'bg-cyan text-navy'
      }`}
    >
      {text}
      <span aria-hidden className={`${FILLET} top-0 left-full ${hot ? 'bg-rose-600' : 'bg-cyan'}`} />
      <span aria-hidden className={`${FILLET} top-full left-0 ${hot ? 'bg-rose-600' : 'bg-cyan'}`} />
    </span>
  )
}
