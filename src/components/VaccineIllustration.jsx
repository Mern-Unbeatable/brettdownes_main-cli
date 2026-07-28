/**
 * Storyset "Vaccine development" illustration.
 * Uses the exported PNG; swap to the animated SVG later if needed.
 */
export default function VaccineIllustration({ className = '' }) {
  return (
    <img
      src="/images/vaccine-development.png"
      alt=""
      aria-hidden
      className={`pointer-events-none select-none object-contain ${className}`}
      draggable={false}
    />
  )
}
