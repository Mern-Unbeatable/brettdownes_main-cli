import fs from 'node:fs'
import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const API_TARGET = process.env.VITE_API_PROXY || 'http://localhost:4000'

const SITEMAP_PATHS = [
  { path: '/', changefreq: 'weekly', priority: '1.0' },
  { path: '/faq', changefreq: 'monthly', priority: '0.7' },
  { path: '/contact', changefreq: 'monthly', priority: '0.7' },
  { path: '/coa', changefreq: 'weekly', priority: '0.6' },
  { path: '/terms', changefreq: 'yearly', priority: '0.3' },
  { path: '/privacy', changefreq: 'yearly', priority: '0.3' },
]

function absoluteSitemapPlugin(siteUrl) {
  const origin = String(siteUrl || '').replace(/\/$/, '')
  if (!origin) return null

  return {
    name: 'absolute-sitemap',
    closeBundle() {
      const urls = SITEMAP_PATHS.map(({ path: route, changefreq, priority }) => {
        const loc = route === '/' ? `${origin}/` : `${origin}${route}`
        return `  <url>\n    <loc>${loc}</loc>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`
      }).join('\n')

      const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
      const outDir = path.resolve(process.cwd(), 'dist')
      fs.mkdirSync(outDir, { recursive: true })
      fs.writeFileSync(path.join(outDir, 'sitemap.xml'), xml)

      const robots = `User-agent: *\nAllow: /\nAllow: /faq\nAllow: /contact\nAllow: /coa\nAllow: /terms\nAllow: /privacy\n\nDisallow: /shop\nDisallow: /shop/\nDisallow: /checkout\nDisallow: /checkout/\nDisallow: /dashboard\nDisallow: /dashboard/\nDisallow: /admin\nDisallow: /admin/\nDisallow: /reset-password\n\nSitemap: ${origin}/sitemap.xml\n`
      fs.writeFileSync(path.join(outDir, 'robots.txt'), robots)
    },
  }
}

const SITE_ORIGIN = 'https://www.peptideopslogistics.com'

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), absoluteSitemapPlugin(SITE_ORIGIN)].filter(Boolean),
    server: {
      // Proxying keeps the session cookie same-origin during development.
      proxy: {
        '/api': { target: API_TARGET, changeOrigin: true },
        '/uploads': { target: API_TARGET, changeOrigin: true },
      },
    },
  }
})
