import Hero from '../components/Hero'
import Features from '../components/Features'
import Trust from '../components/Trust'
import BestSellers from '../components/BestSellers'
import Categories from '../components/Categories'
import CapsuleCTA from '../components/CapsuleCTA'
import PartnerSourcing from '../components/PartnerSourcing'
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
        <CapsuleCTA />
        <div className="bg-white pb-16 md:pb-24">
          <div className="mx-auto max-w-10xl px-5 md:px-8">
            <PartnerSourcing />
          </div>
        </div>
      </main>
      <Footer />
    </PageTransition>
  )
}
