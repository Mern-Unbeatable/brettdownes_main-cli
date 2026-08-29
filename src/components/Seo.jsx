import { Helmet } from 'react-helmet-async'
import {
  DEFAULT_DESCRIPTION,
  DEFAULT_OG_IMAGE,
  DEFAULT_TITLE,
  SITE_NAME,
  absoluteUrl,
  pageTitle,
} from '../data/seo'

/**
 * Per-route document head: title, description, canonical, robots, Open Graph.
 */
export default function Seo({
  title,
  description = DEFAULT_DESCRIPTION,
  path,
  image = DEFAULT_OG_IMAGE,
  noIndex = false,
  type = 'website',
  jsonLd,
}) {
  const fullTitle = pageTitle(title) || DEFAULT_TITLE
  const canonical = absoluteUrl(path || (typeof window !== 'undefined' ? window.location.pathname : '/'))
  const ogImage = absoluteUrl(image || DEFAULT_OG_IMAGE)
  const robots = noIndex ? 'noindex, nofollow' : 'index, follow'

  const graph = Array.isArray(jsonLd) ? jsonLd : jsonLd ? [jsonLd] : []

  return (
    <Helmet prioritizeSeoTags>
      <html lang="en" />
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="robots" content={robots} />
      <meta name="googlebot" content={robots} />
      <link rel="canonical" href={canonical} />

      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:locale" content="en_US" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {graph.map((node, index) => (
        <script
          // Stable enough for helmet; content is deterministic per page.
          key={node['@type'] ? `${node['@type']}-${index}` : `ld-${index}`}
          type="application/ld+json"
        >
          {JSON.stringify(node)}
        </script>
      ))}
    </Helmet>
  )
}
