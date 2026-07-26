import { useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ArrowUpRight } from 'lucide-react'

const categories = [
  {
    name: 'Peptides',
    description:
      'Clinically formulated compounds that boost repair, recovery, and performance at the cellular level.',
    image: '/images/category-peptides.png',
  },
  {
    name: 'Blends',
    description:
      'Multi-peptide formulas designed for synergy — maximizing regeneration, strength, and vitality.',
    image: '/images/category-peptides.png',
  },
  {
    name: 'L-Carnitine',
    description:
      'Supports fat metabolism, endurance, and energy production for a lean, efficient body.',
    image: '/images/category-peptides.png',
  },
  {
    name: 'Capsules',
    description: 'Clean, precisely dosed formulas for daily support and consistent performance.',
    image: '/images/capsule-form.png',
  },
  {
    name: 'Bulk',
    description:
      'Large-format research-grade peptides with verified purity and uncompromising quality.',
    image: '/images/lab-line.png',
  },
]

// Shared smooth ease — buttery open/close
const SMOOTH = 'expo.inOut'
const SOFT = 'expo.out'

function CategoryItem({ cat, isActive, onOpen }) {
  const collapsedRef = useRef(null)
  const expandedRef = useRef(null)
  const imageWrapRef = useRef(null)
  const imageRef = useRef(null)
  const titleRef = useRef(null)
  const descRef = useRef(null)
  const btnRef = useRef(null)
  const tweenRef = useRef(null)
  const primed = useRef(false)

  useLayoutEffect(() => {
    const collapsed = collapsedRef.current
    const expanded = expandedRef.current
    const imageWrap = imageWrapRef.current
    const image = imageRef.current
    const title = titleRef.current
    const desc = descRef.current
    const btn = btnRef.current
    if (!collapsed || !expanded) return

    tweenRef.current?.kill()
    gsap.killTweensOf([collapsed, expanded, imageWrap, image, title, desc, btn])

    if (!primed.current) {
      primed.current = true
      if (isActive) {
        gsap.set(collapsed, { height: 0, autoAlpha: 0, overflow: 'hidden', pointerEvents: 'none' })
        gsap.set(expanded, { height: 'auto', autoAlpha: 1, overflow: 'visible', pointerEvents: 'auto' })
        gsap.set([imageWrap, image, title, desc, btn], { clearProps: 'all' })
      } else {
        gsap.set(expanded, { height: 0, autoAlpha: 0, overflow: 'hidden', pointerEvents: 'none' })
        gsap.set(collapsed, { height: 'auto', autoAlpha: 1, overflow: 'visible', pointerEvents: 'auto' })
      }
      return
    }

    const tl = gsap.timeline({
      defaults: { ease: SMOOTH },
      overwrite: 'auto',
    })
    tweenRef.current = tl

    if (isActive) {
      // ——— OPEN ———
      gsap.set(collapsed, { pointerEvents: 'none', overflow: 'hidden' })
      gsap.set(expanded, { display: 'block', overflow: 'hidden', pointerEvents: 'none' })

      tl.to(collapsed, {
        height: 0,
        autoAlpha: 0,
        duration: 0.55,
      })
        .fromTo(
          expanded,
          { height: 0, autoAlpha: 0 },
          { height: 'auto', autoAlpha: 1, duration: 0.95 },
          0.12,
        )
        .fromTo(
          imageWrap,
          { autoAlpha: 0, x: -24, scale: 0.96 },
          { autoAlpha: 1, x: 0, scale: 1, duration: 1.05, ease: SOFT },
          0.28,
        )
        .fromTo(
          image,
          { scale: 1.08 },
          { scale: 1, duration: 1.25, ease: SOFT },
          0.28,
        )
        .fromTo(
          title,
          { autoAlpha: 0, y: 28, filter: 'blur(6px)' },
          { autoAlpha: 1, y: 0, filter: 'blur(0px)', duration: 0.95, ease: SOFT },
          0.38,
        )
        .fromTo(
          desc,
          { autoAlpha: 0, y: 18 },
          { autoAlpha: 1, y: 0, duration: 0.9, ease: SOFT },
          0.48,
        )
        .fromTo(
          btn,
          { autoAlpha: 0, scale: 0.7 },
          { autoAlpha: 1, scale: 1, duration: 0.7, ease: 'back.out(1.6)' },
          0.55,
        )
        .add(() => {
          gsap.set(expanded, { height: 'auto', overflow: 'visible', pointerEvents: 'auto' })
        })
    } else {
      // ——— CLOSE ———
      gsap.set(expanded, { pointerEvents: 'none', overflow: 'hidden' })
      gsap.set(collapsed, { overflow: 'hidden', pointerEvents: 'none' })

      tl.to([btn, desc, title], {
        autoAlpha: 0,
        y: 10,
        duration: 0.35,
        stagger: 0.04,
        ease: 'power2.in',
      })
        .to(
          imageWrap,
          {
            autoAlpha: 0,
            x: -12,
            scale: 0.98,
            duration: 0.4,
            ease: 'power2.in',
          },
          0.05,
        )
        .to(
          expanded,
          {
            height: 0,
            autoAlpha: 0,
            duration: 0.7,
          },
          0.15,
        )
        .fromTo(
          collapsed,
          { height: 0, autoAlpha: 0 },
          { height: 'auto', autoAlpha: 1, duration: 0.75 },
          0.35,
        )
        .add(() => {
          gsap.set(collapsed, { height: 'auto', overflow: 'visible', pointerEvents: 'auto' })
          gsap.set(expanded, { height: 0, overflow: 'hidden' })
        })
    }

    return () => {
      tweenRef.current?.kill()
    }
  }, [isActive])

  return (
    <li className="border-b border-[#e5e5e5]">
      <button
        ref={collapsedRef}
        type="button"
        onClick={onOpen}
        className="flex w-full cursor-pointer items-center gap-4 py-6 text-left md:gap-10 md:py-7"
      >
        <span className="w-[140px] shrink-0 text-[28px] font-bold tracking-[-0.02em] text-black sm:w-[180px] sm:text-[30px] md:w-[220px] md:text-[34px]">
          {cat.name}
        </span>
        <span className="hidden min-w-0 flex-1 text-[14px] leading-[1.55] font-normal text-[#666666] md:block md:text-[15px]">
          {cat.description}
        </span>
        <span className="ml-auto flex h-12 w-12 shrink-0 items-center justify-center rounded-[12px] border border-[#d9d9d9] bg-white text-black">
          <ArrowUpRight className="h-5 w-5" strokeWidth={2} />
        </span>
      </button>

      <div ref={expandedRef} className="will-change-[height,opacity]">
        <div className="flex flex-col gap-5 py-7 sm:flex-row sm:items-center sm:gap-8 md:gap-10 md:py-9">
          <div
            ref={imageWrapRef}
            className="w-full shrink-0 overflow-hidden rounded-[18px] sm:w-[240px] md:w-[280px] lg:w-[320px]"
          >
            <img
              ref={imageRef}
              src={cat.image}
              alt={cat.name}
              className="aspect-[4/3] h-auto w-full origin-center object-cover sm:aspect-[5/4] sm:h-[200px] md:h-[220px] lg:h-[240px]"
            />
          </div>

          <div className="flex min-w-0 flex-1 items-start justify-between gap-6">
            <div>
              <h3
                ref={titleRef}
                className="block text-[36px] leading-none font-bold tracking-[-0.03em] text-black sm:text-[40px] md:text-[44px] lg:text-[48px]"
              >
                {cat.name}
              </h3>
              <p
                ref={descRef}
                className="mt-3 block max-w-[380px] text-[14px] leading-[1.6] font-normal text-[#666666] md:mt-4 md:text-[15px]"
              >
                {cat.description}
              </p>
            </div>

            <a
              ref={btnRef}
              href="#shop"
              aria-label={`View ${cat.name}`}
              className="mt-1 flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-[12px] bg-black text-white transition hover:bg-black/85"
            >
              <ArrowUpRight className="h-5 w-5" strokeWidth={2} />
            </a>
          </div>
        </div>
      </div>
    </li>
  )
}

export default function Categories() {
  const [active, setActive] = useState('Peptides')

  return (
    <section className="bg-white py-10 md:py-16">
      <div data-reveal="up" className="mx-auto max-w-10xl px-6 md:px-10 lg:px-12">
        <ul className="border-t border-[#e5e5e5]">
          {categories.map((cat) => (
            <CategoryItem
              key={cat.name}
              cat={cat}
              isActive={active === cat.name}
              onOpen={() => setActive(cat.name)}
            />
          ))}
        </ul>
      </div>
    </section>
  )
}
