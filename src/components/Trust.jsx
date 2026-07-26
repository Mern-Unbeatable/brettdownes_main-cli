export default function Trust() {
  return (
    <section className="bg-white py-16 md:py-24 lg:py-28">
      <div className="mx-auto flex max-w-10xl flex-col items-center gap-10 px-6 md:flex-row md:gap-14 md:px-10 lg:gap-[72px] lg:px-12">
        <div data-reveal="left" className="w-full md:w-[48%] md:shrink-0">
          <h2 className="m-0 font-sans text-[26px] font-bold leading-[1.35] tracking-[-0.02em] text-black sm:text-[30px] md:text-[34px] lg:text-[38px] lg:leading-[1.3]">
            Every batch undergoes triple-stage verification — purity, potency, and
            sterility.
          </h2>
          <p className="m-0 mt-4 font-sans text-[15px] font-normal leading-[1.7] text-gray-500 sm:mt-5 sm:text-[16px] md:text-[17px]">
            We publish our certificates transparently, because trust should be measurable.
          </p>
        </div>

        <div
          data-reveal="right"
          data-reveal-delay="0.12"
          className="w-full overflow-hidden rounded-[20px] md:w-[52%] md:rounded-[24px]"
        >
          <img
            src="/images/lab-line.png"
            alt="Peptide production line"
            className="block h-auto w-full object-cover aspect-[16/11] min-h-[240px]"
          />
        </div>
      </div>
    </section>
  )
}
