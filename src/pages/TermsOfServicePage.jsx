import PageHeader from '../components/PageHeader'
import PageTransition from '../components/PageTransition'
import Footer from '../components/Footer'
import { siteContact } from '../data/site'

const sections = [
  {
    title: '1. Research use only',
    body: 'All products sold by Peptide Ops Logistics are intended exclusively for laboratory, scientific, or research purposes. They are not for human consumption, veterinary use, diagnostic procedures, or therapeutic applications. By placing an order you confirm you are purchasing for lawful research use only.',
  },
  {
    title: '2. Eligibility',
    body: 'You must be at least 21 years of age and able to enter a binding agreement. You agree to use this site and our products in compliance with all applicable laws and institutional policies.',
  },
  {
    title: '3. Orders & pricing',
    body: 'Product availability, descriptions, and prices may change without notice. We reserve the right to refuse, cancel, or limit any order. An order is accepted when we confirm it and payment (or approved pickup payment terms) is completed.',
  },
  {
    title: '4. Payment',
    body: 'Online card payments are processed by Stripe. Your bank or card statement may show a descriptor configured for our payment account (for example, “That 3D Printer Guy”), which may differ from the Peptide Ops Logistics brand name on this website.',
  },
  {
    title: '5. Shipping & pickup',
    body: 'Delivery orders ship from our Keizer, OR facility. Live carrier rates (USPS, UPS, FedEx) may be shown at checkout when available. Warehouse pickup is available when offered at checkout. Risk of loss passes to you upon carrier acceptance for delivery orders, or upon handoff for pickup orders.',
  },
  {
    title: '6. Certificates & documentation',
    body: 'We work to provide Certificates of Analysis (COAs) and related documentation for verified batches. Availability may vary by lot. See our COA page for our current quality and transparency commitments.',
  },
  {
    title: '7. Returns',
    body: 'Because of the nature of research materials, returns are limited. Contact us promptly if a shipment arrives damaged or incorrect. Approved returns must be unused, sealed, and authorized in writing before return shipping.',
  },
  {
    title: '8. Disclaimer of warranties',
    body: 'Products are provided “as is” for research use. To the fullest extent permitted by law, we disclaim warranties of merchantability, fitness for a particular purpose, and non-infringement. Statements on this site have not been evaluated by the FDA.',
  },
  {
    title: '9. Limitation of liability',
    body: 'To the fullest extent permitted by law, Peptide Ops Logistics is not liable for indirect, incidental, special, consequential, or punitive damages arising from your use of the site or products. Our total liability for any claim related to an order is limited to the amount you paid for that order.',
  },
  {
    title: '10. Changes',
    body: 'We may update these Terms of Service from time to time. Continued use of the site after changes are posted constitutes acceptance of the updated terms.',
  },
  {
    title: '11. Contact',
    body: `Questions about these terms: ${siteContact.email} · ${siteContact.phoneDisplay}`,
  },
]

export default function TermsOfServicePage() {
  return (
    <PageTransition>
      <PageHeader />

      <main className="bg-white py-14 md:py-20">
        <div className="mx-auto max-w-3xl px-5 md:px-8">
          <div data-reveal="up">
            <h1 className="font-display text-2xl font-bold tracking-tight text-ink md:text-3xl">
              Terms of Service
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Last updated: August 2026. Please read these terms carefully before using this website
              or placing an order.
            </p>
          </div>

          <div data-reveal-stagger data-stagger="0.06" className="mt-10 space-y-8">
            {sections.map((section) => (
              <section key={section.title} className="rounded-3xl bg-fog p-6 md:p-7">
                <h2 className="font-display text-base font-bold text-ink md:text-lg">
                  {section.title}
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-muted">{section.body}</p>
              </section>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </PageTransition>
  )
}
