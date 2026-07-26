import { Menu, ShoppingBag } from 'lucide-react'

export default function SideActionDock({ visible, cartCount = 0, onCart, onMenu }) {
  return (
    <div
      className={`side-action-dock fixed top-1/2 right-0 z-[9997] -translate-y-1/2 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
        visible
          ? 'pointer-events-auto translate-x-0 opacity-100'
          : 'pointer-events-none translate-x-[120%] opacity-0'
      }`}
    >
      <div className="group relative flex flex-col gap-2 rounded-l-[18px] border border-r-0 border-white/15 bg-black/85 p-2 shadow-[0_12px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl transition-transform duration-300 hover:-translate-x-1">
        <span
          aria-hidden
          className="absolute top-1/2 -left-1 h-10 w-1 -translate-y-1/2 rounded-full bg-cyan/80 shadow-[0_0_10px_rgba(0,245,212,0.55)]"
        />

        <button
          type="button"
          aria-label="Cart"
          onClick={onCart}
          className="relative flex h-11 w-11 items-center justify-center rounded-[12px] bg-white text-[#111] shadow-sm transition hover:scale-105 hover:bg-cyan"
        >
          <ShoppingBag className="h-[18px] w-[18px]" strokeWidth={1.7} />
          {cartCount > 0 ? (
            <span className="absolute -top-1 -left-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-cyan px-1 text-[10px] font-bold text-navy">
              {cartCount}
            </span>
          ) : null}
        </button>

        {onMenu ? (
          <button
            type="button"
            aria-label="Menu"
            onClick={onMenu}
            className="flex h-11 w-11 items-center justify-center rounded-[12px] bg-white text-[#111] shadow-sm transition hover:scale-105 hover:bg-cyan lg:hidden"
          >
            <Menu className="h-[18px] w-[18px]" strokeWidth={1.7} />
          </button>
        ) : null}
      </div>
    </div>
  )
}
