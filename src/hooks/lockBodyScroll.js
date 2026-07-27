/** Lock page scroll without layout shift when the scrollbar disappears. */
export function lockBodyScroll() {
  const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
  document.body.classList.add('drawer-open')
  if (scrollbarWidth > 0) {
    document.body.style.paddingRight = `${scrollbarWidth}px`
  }
}

export function unlockBodyScroll() {
  document.body.classList.remove('drawer-open')
  document.body.style.paddingRight = ''
}
