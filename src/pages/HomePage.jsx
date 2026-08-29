import Hero from '../components/Hero'
import Features from '../components/Features'
import Trust from '../components/Trust'
import BestSellers from '../components/BestSellers'
import Categories from '../components/Categories'
import PartnerSourcing from '../components/PartnerSourcing'
import VolumePricing from '../components/VolumePricing'
import Footer from '../components/Footer'
import PageTransition from '../components/PageTransition'
import Seo from '../components/Seo'
import { absoluteUrl, pageSeo, siteOrigin } from '../data/seo'
import { siteContact } from '../data/site'

export default function HomePage() {
  const seo = pageSeo.home
  const origin = siteOrigin()

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'Peptide Ops',
      url: origin || absoluteUrl('/'),
      email: siteContact.email,
      telephone: siteContact.phoneTel,
      description: seo.description,
      logo: absoluteUrl('/images/logo.png'),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'Peptide Ops',
      url: origin || absoluteUrl('/'),
      description: seo.description,
    },
  ]

  return (
    <PageTransition>
      <Seo {...seo} jsonLd={jsonLd} />
      <main>
        <Hero />
        <Features />
        <Trust />
        <BestSellers />
        <Categories />
        <div className="bg-white py-16 md:py-24">
          <div className="mx-auto flex max-w-10xl flex-col gap-6 px-5 md:gap-8 md:px-8">
            <VolumePricing />
            <PartnerSourcing />
          </div>
        </div>
      </main>
      <Footer />
    </PageTransition>
  )
}

