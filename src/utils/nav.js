export function activeFromPath(pathname) {
  if (pathname.startsWith('/shop')) return 'Shop'
  if (pathname.startsWith('/compliance')) return 'Compliance'
  if (pathname.startsWith('/contact')) return 'Contact'
  return 'Home'
}
