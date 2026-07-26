const WHATSAPP_NUMBER = '18005550199'
const WHATSAPP_MESSAGE = 'Hi Peptide Ops — I have a research inquiry.'

export default function WhatsAppFloat() {
  const href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      className="whatsapp-float fixed right-5 bottom-5 z-[9998] flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_8px_24px_rgba(37,211,102,0.45)] transition duration-300 hover:scale-110 hover:bg-[#20bd5a] hover:shadow-[0_10px_28px_rgba(37,211,102,0.55)] md:right-7 md:bottom-7 md:h-16 md:w-16"
    >
      <svg viewBox="0 0 32 32" className="h-7 w-7 md:h-8 md:w-8" fill="currentColor" aria-hidden>
        <path d="M19.11 17.53c-.28-.14-1.64-.81-1.9-.9-.25-.1-.44-.14-.62.14-.19.28-.72.9-.88 1.08-.16.19-.33.21-.6.07-.28-.14-1.17-.43-2.23-1.37-.82-.73-1.38-1.64-1.54-1.91-.16-.28-.02-.43.12-.57.13-.13.28-.33.42-.5.14-.16.19-.28.28-.47.1-.19.05-.35-.02-.5-.07-.14-.62-1.49-.85-2.04-.22-.53-.45-.46-.62-.47h-.53c-.19 0-.5.07-.76.35-.26.28-1 1-1 2.43s1.02 2.82 1.17 3.01c.14.19 2 3.05 4.84 4.28.68.29 1.21.47 1.62.6.68.22 1.3.19 1.79.11.55-.08 1.64-.67 1.87-1.32.23-.65.23-1.2.16-1.32-.07-.11-.25-.18-.53-.32z" />
        <path d="M16.02 3C8.84 3 3 8.83 3 16c0 2.29.61 4.45 1.68 6.32L3 29l6.85-1.8A12.93 12.93 0 0 0 16.02 29C23.2 29 29 23.17 29 16S23.2 3 16.02 3zm0 23.67c-2.1 0-4.05-.56-5.74-1.54l-.41-.24-4.06 1.07 1.08-3.96-.27-.41A10.6 10.6 0 0 1 5.35 16c0-5.88 4.79-10.67 10.67-10.67S26.69 10.12 26.69 16s-4.79 10.67-10.67 10.67z" />
      </svg>
      <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-[#25D366]/40" />
    </a>
  )
}
