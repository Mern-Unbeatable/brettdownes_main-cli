import fs from 'node:fs'
import path from 'node:path'
import { PUBLIC_SEO_SHELLS, SEO_NAV_LINKS, SITE_ORIGIN } from './src/data/seoShells.js'

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function absolute(route) {
  if (route === '/') return `${SITE_ORIGIN}/`
  return `${SITE_ORIGIN}${route}`
}

function buildStaticBlock(shell) {
  const paragraphs = shell.paragraphs
    .map((p) => `        <p>${escapeHtml(p)}</p>`)
    .join('\n')
  const links = SEO_NAV_LINKS.map(
    (item) =>
      `          <li><a href="${absolute(item.href)}">${escapeHtml(item.label)}</a></li>`,
  ).join('\n')

  return `    <div id="seo-static" style="position:absolute;left:-10000px;top:auto;width:1px;height:1px;overflow:hidden">
      <main>
        <h1>${escapeHtml(shell.h1)}</h1>
        ${paragraphs}
        <h2>${escapeHtml(shell.h2)}</h2>
        <nav aria-label="Site pages">
          <ul>
${links}
          </ul>
        </nav>
      </main>
    </div>`
}

function setMeta(html, key, keyValue, content) {
  const escaped = escapeHtml(content)
  const re = new RegExp(
    `(<meta[^>]*${key}="${keyValue}"[^>]*content=")([^"]*)(")`,
    'i',
  )
  if (re.test(html)) return html.replace(re, `$1${escaped}$3`)
  // content attribute may appear before name/property
  const reAlt = new RegExp(
    `(<meta[^>]*content=")([^"]*)("[^>]*${key}="${keyValue}"[^>]*>)`,
    'i',
  )
  if (reAlt.test(html)) return html.replace(reAlt, `$1${escaped}$3`)
  return html
}

function replaceTitle(html, title) {
  return html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(title)}</title>`)
}

function replaceCanonical(html, url) {
  return html.replace(
    /<link rel="canonical" href="[^"]*"\s*\/?>/i,
    `<link rel="canonical" href="${url}" />`,
  )
}

function replaceOgUrl(html, url) {
  return setMeta(html, 'property', 'og:url', url)
}

function injectOrReplaceStatic(html, block) {
  if (/id="seo-static"/.test(html)) {
    return html.replace(/<div id="seo-static"[\s\S]*?<\/div>(\s*)(?=<div id="root"><\/div>)/i, `${block}$1`)
  }
  return html.replace('<div id="root"></div>', `${block}\n    <div id="root"></div>`)
}

function applyShell(html, shell) {
  const url = absolute(shell.route)
  let next = html
  next = replaceTitle(next, shell.title)
  next = setMeta(next, 'name', 'description', shell.description)
  next = replaceCanonical(next, url)
  next = replaceOgUrl(next, url)
  next = setMeta(next, 'property', 'og:title', shell.title)
  next = setMeta(next, 'property', 'og:description', shell.description)
  next = setMeta(next, 'name', 'twitter:title', shell.title)
  next = setMeta(next, 'name', 'twitter:description', shell.description)
  next = injectOrReplaceStatic(next, buildStaticBlock(shell))
  return next
}

/**
 * Writes unique HTML shells per public route so non-JS SEO crawlers
 * do not treat every URL as the same homepage document.
 */
export function seoRouteShellsPlugin() {
  return {
    name: 'seo-route-shells',
    closeBundle() {
      const outDir = path.resolve(process.cwd(), 'dist')
      const indexPath = path.join(outDir, 'index.html')
      if (!fs.existsSync(indexPath)) return

      const template = fs.readFileSync(indexPath, 'utf8')

      for (const shell of PUBLIC_SEO_SHELLS) {
        const html = applyShell(template, shell)
        if (shell.route === '/') {
          fs.writeFileSync(indexPath, html)
          continue
        }
        const dir = path.join(outDir, shell.route.replace(/^\//, ''))
        fs.mkdirSync(dir, { recursive: true })
        fs.writeFileSync(path.join(dir, 'index.html'), html)
      }
    },
  }
}
