import fs from 'node:fs'
import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const API_TARGET = process.env.VITE_API_PROXY || 'http://localhost:4000'

const SITEMAP_PATHS = ['/', '/shop', '/faq', '/contact', '/coa', '/terms', '/privacy']

function absoluteSitemapPlugin(siteUrl) {
  const origin = String(siteUrl || '').replace(/\/$/, '')
  if (!origin) return null

  return {
    name: 'absolute-sitemap',
    closeBundle() {
      const urls = SITEMAP_PATHS.map((route) => {
        const loc = route === '/' ? `${origin}/` : `${origin}${route}`
        const priority = route === '/' ? '1.0' : route === '/shop' ? '0.9' : '0.6'
        return `  <url>\n    <loc>${loc}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>${priority}</priority>\n  </url>`
      }).join('\n')

      const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
      const outDir = path.resolve(process.cwd(), 'dist')
      fs.mkdirSync(outDir, { recursive: true })
      fs.writeFileSync(path.join(outDir, 'sitemap.xml'), xml)

      const robots = `User-agent: *\nAllow: /\nAllow: /shop\nAllow: /faq\nAllow: /contact\nAllow: /coa\nAllow: /terms\nAllow: /privacy\n\nDisallow: /checkout\nDisallow: /checkout/\nDisallow: /dashboard\nDisallow: /dashboard/\nDisallow: /admin\nDisallow: /admin/\nDisallow: /reset-password\n\nSitemap: ${origin}/sitemap.xml\n`
      fs.writeFileSync(path.join(outDir, 'robots.txt'), robots)
    },
  }
}

const SITE_ORIGIN = 'https://peptideopslogistics.com'

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
