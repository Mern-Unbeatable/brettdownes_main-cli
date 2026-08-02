import { Dna, Leaf, Search } from 'lucide-react'

/** Lucide-style bacteria icon (not in this lucide version) */
function Bacteria({ className, strokeWidth = 2 }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <circle cx="12" cy="12" r="7" />
      <circle cx="12" cy="12" r="2" />
      <circle cx="8" cy="9" r="1" fill="currentColor" stroke="none" />
      <circle cx="15" cy="8.5" r="1" fill="currentColor" stroke="none" />
      <circle cx="16" cy="14" r="1" fill="currentColor" stroke="none" />
      <circle cx="9" cy="15" r="1" fill="currentColor" stroke="none" />
      <path d="M12 5v-2M12 21v-2M5 12H3M21 12h-2M7.05 7.05L5.6 5.6M18.4 18.4l-1.45-1.45M16.95 7.05L18.4 5.6M5.6 18.4l1.45-1.45" />
    </svg>
  )
}

const features = [
  {
    icon: Dna,
    title: 'Molecular Research',
    text: 'Peptides supplied for controlled research and in vitro pathway studies.',
  },
  {
    icon: Search,
    title: 'Verified Specs',
    text: 'Identity and purity specs documented for research protocols.',
  },
  {
    icon: Leaf,
    title: 'RUO Labeling',
    text: 'Packaged and labeled for research use only — not for human consumption.',
  },
]

export default function Features() {
  return (
    <section className="bg-white py-[70px] md:py-24">
      <div className="mx-auto flex max-w-10xl flex-col gap-14 px-6 md:flex-row md:items-start md:gap-0 md:px-10 lg:px-12">
        <div
          data-reveal="left"
          className="flex w-full shrink-0 items-center gap-2.5 md:w-[220px] lg:w-[260px]"
        >
          <Bacteria className="h-[18px] w-[18px] text-[#00c9a7]" strokeWidth={2} />
          <h2 className="text-[13px] font-bold tracking-[0.12em] text-black uppercase">
            About Peptides
          </h2>
        </div>

        <div
          data-reveal-stagger
          data-stagger="0.14"
          className="grid flex-1 grid-cols-1 gap-12 sm:grid-cols-3 sm:gap-8 lg:gap-12"
        >
          {features.map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex flex-row items-start gap-4 sm:flex-col sm:gap-0">
              <span className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-[#e2e5e9] bg-white sm:mb-5">
                <Icon className="h-6 w-6 text-[#00c9a7]" strokeWidth={1.6} />
              </span>
              <div className="min-w-0">
                <h3 className="text-[16px] font-bold tracking-tight text-black">{title}</h3>
                <p className="mt-2 max-w-[260px] text-[14px] leading-[1.6] text-[#6b7280]">
                  {text}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
