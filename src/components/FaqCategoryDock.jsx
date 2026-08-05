import { createPortal } from 'react-dom'
import { CircleHelp } from 'lucide-react'
import SideDrawer from './SideDrawer'

export default function FaqCategoryDock({
  visible,
  open,
  onOpen,
  onClose,
  categories,
  categoryIcons,
  activeCategory,
  onSelect,
}) {
  return createPortal(
    <>
      <div
        className={`faq-category-dock fixed top-[calc(50%-5.5rem)] right-0 z-[9996] -translate-y-1/2 transition-opacity duration-300 ease-out lg:hidden ${
          visible && !open
            ? 'pointer-events-auto opacity-100'
            : 'pointer-events-none opacity-0'
        }`}
      >
        <div className="relative flex flex-col gap-2 rounded-l-[18px] border border-r-0 border-white/15 bg-black/85 p-2 shadow-[0_12px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl">
          <span
            aria-hidden
            className="absolute top-1/2 -left-1 h-10 w-1 -translate-y-1/2 rounded-full bg-cyan/80 shadow-[0_0_10px_rgba(0,245,212,0.55)]"
          />
          <button
            type="button"
            aria-label="FAQ topics"
            onClick={onOpen}
            className="flex h-11 w-11 items-center justify-center rounded-[12px] bg-white text-[#111] shadow-sm transition hover:bg-cyan"
          >
            <CircleHelp className="h-[18px] w-[18px]" strokeWidth={1.7} />
          </button>
        </div>
      </div>

      <SideDrawer open={open} onClose={onClose} title="FAQ topics">
        <nav aria-label="FAQ categories" className="flex flex-1 flex-col gap-1">
          {categories.map((cat) => {
            const Icon = categoryIcons[cat.id]
            const active = activeCategory === cat.id
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  onClose()
                  onSelect(cat.id, { delay: 340 })
                }}
                className={`flex w-full items-center gap-3 rounded-2xl px-3.5 py-3.5 text-left text-[15px] font-medium transition-colors duration-200 ${
                  active
                    ? 'bg-ink text-white'
                    : 'text-ink hover:bg-fog'
                }`}
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors duration-200 ${
                    active ? 'bg-cyan text-navy' : 'bg-fog text-cyan-dim'
                  }`}
                >
                  {Icon ? <Icon className="h-4 w-4" strokeWidth={2} /> : null}
                </span>
                <span className="min-w-0 leading-snug break-words">{cat.title}</span>
              </button>
            )
          })}
        </nav>
      </SideDrawer>
    </>,
    document.body,
  )
}
