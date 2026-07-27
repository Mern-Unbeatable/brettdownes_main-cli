import { Link } from 'react-router-dom'

function MoleculeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <circle cx="4" cy="9" r="2.2" fill="currentColor" />
      <circle cx="14" cy="4.5" r="2.2" fill="currentColor" />
      <circle cx="14" cy="13.5" r="2.2" fill="currentColor" />
      <path d="M5.8 8.2L12.2 5.2M5.8 9.8L12.2 12.8" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  )
}

export default function CapsuleCTA() {
  return (
    <section className="bg-white py-10 md:py-16">
      <div className="mx-auto max-w-12xl px-5 md:px-8">
        <div className="relative isolate min-h-[520px] overflow-hidden rounded-3xl sm:min-h-[580px] md:min-h-[620px] lg:min-h-[660px]">
          <img
            src="/images/capsule-form.png"
            alt="Research peptide packaging"
            className="absolute inset-0 h-full w-full object-cover object-[78%_center] sm:object-[72%_center] md:object-[68%_center] lg:object-[62%_center] xl:object-[55%_center]"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />

          <div
            data-reveal="left"
            className="relative z-10 flex h-full min-h-[520px] flex-col justify-center px-8 py-12 sm:min-h-[580px] md:min-h-[620px] md:px-12 md:py-16 lg:min-h-[660px]"
          >
            <p className="text-sm font-semibold tracking-wide text-[#f5d76e] sm:text-[15px]">
              No pill form available yet.
            </p>
            <h2 className="mt-3 font-display text-[30px] font-bold tracking-tight text-white uppercase leading-[1.1] sm:text-[34px] md:text-[40px] lg:text-[44px] xl:text-[48px]">
              Research powders
              <br />
              for laboratory use
            </h2>
            <p className="mt-5 max-w-md text-sm font-medium leading-relaxed text-white/90">
              We currently offer lyophilized research powders only. Capsule formats are not available
              at this time — Research Use Only.
            </p>
            <Link
              to="/shop"
              className="mt-8 inline-flex w-fit items-center gap-2 rounded-full bg-cyan px-6 py-3 text-sm font-semibold text-navy transition hover:bg-white"
            >
              Shop Now
              <MoleculeIcon />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
