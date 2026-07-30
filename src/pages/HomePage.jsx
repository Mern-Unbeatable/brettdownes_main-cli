import Hero from '../components/Hero'
import Features from '../components/Features'
import Trust from '../components/Trust'
import BestSellers from '../components/BestSellers'
import Categories from '../components/Categories'
import PartnerSourcing from '../components/PartnerSourcing'
import VolumePricing from '../components/VolumePricing'
import Footer from '../components/Footer'
import PageTransition from '../components/PageTransition'

export default function HomePage() {
  return (
    <PageTransition>
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
