import Hero from '../components/Hero'
import Features from '../components/Features'
import Trust from '../components/Trust'
import BestSellers from '../components/BestSellers'
import Categories from '../components/Categories'
import CapsuleCTA from '../components/CapsuleCTA'
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
      </main>
      <Footer />
    </PageTransition>
  )
}
