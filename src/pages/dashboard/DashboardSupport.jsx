import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { MessageCircle, Send } from 'lucide-react'
import { api } from '../../lib/api'
import { siteContact } from '../../data/site'

function WhatsAppMark({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="currentColor" aria-hidden>
      <path d="M19.11 17.53c-.28-.14-1.64-.81-1.9-.9-.25-.1-.44-.14-.62.14-.19.28-.72.9-.88 1.08-.16.19-.33.21-.6.07-.28-.14-1.17-.43-2.23-1.37-.82-.73-1.38-1.64-1.54-1.91-.16-.28-.02-.43.12-.57.13-.13.28-.33.42-.5.14-.16.19-.28.28-.47.1-.19.05-.35-.02-.5-.07-.14-.62-1.49-.85-2.04-.22-.53-.45-.46-.62-.47h-.53c-.19 0-.5.07-.76.35-.26.28-1 1-1 2.43s1.02 2.82 1.17 3.01c.14.19 2 3.05 4.84 4.28.68.29 1.21.47 1.62.6.68.22 1.3.19 1.79.11.55-.08 1.64-.67 1.87-1.32.23-.65.23-1.2.16-1.32-.07-.11-.25-.18-.53-.32z" />
      <path d="M16.02 3C8.84 3 3 8.83 3 16c0 2.29.61 4.45 1.68 6.32L3 29l6.85-1.8A12.93 12.93 0 0 0 16.02 29C23.2 29 29 23.17 29 16S23.2 3 16.02 3zm0 23.67c-2.1 0-4.05-.56-5.74-1.54l-.41-.24-4.06 1.07 1.08-3.96-.27-.41A10.6 10.6 0 0 1 5.35 16c0-5.88 4.79-10.67 10.67-10.67S26.69 10.12 26.69 16s-4.79 10.67-10.67 10.67z" />
    </svg>
  )
}

const rowClass = (collapsed) =>
  `flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-[13px] font-medium text-white/70 transition hover:bg-white/8 hover:text-white ${
    collapsed ? 'lg:justify-center lg:px-2' : ''
  }`

export default function DashboardSupport({ collapsed = false }) {
  const [open, setOpen] = useState(false)
  const [telegramUrl, setTelegramUrl] = useState('')

  useEffect(() => {
    let cancelled = false
    api
      .get('/api/wholesale/gate')
      .then((res) => {
        if (!cancelled) setTelegramUrl(String(res.telegramUrl || '').trim())
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  const whatsappHref = `https://wa.me/${siteContact.whatsapp}?text=${encodeURIComponent(
    'Hi Peptide Ops — I need help with my account.',
  )}`

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        title={collapsed ? 'Support' : undefined}
        aria-expanded={open}
        className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-[13px] font-semibold text-cyan transition hover:bg-white/8 ${
          collapsed ? 'lg:justify-center lg:px-2' : ''
        }`}
      >
        <MessageCircle className="h-[18px] w-[18px] shrink-0" strokeWidth={1.8} />
        {!collapsed ? <span className="truncate">Support</span> : null}
      </button>
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            key="support-links"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="space-y-0.5 pt-0.5">
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                title="WhatsApp"
                className={rowClass(collapsed)}
              >
                <WhatsAppMark className="h-[18px] w-[18px] shrink-0 text-[#25D366]" />
                {!collapsed ? <span className="truncate">WhatsApp</span> : null}
              </a>
              {telegramUrl ? (
                <a
                  href={telegramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Telegram"
                  className={rowClass(collapsed)}
                >
                  <Send className="h-[18px] w-[18px] shrink-0 text-[#2AABEE]" strokeWidth={1.8} />
                  {!collapsed ? <span className="truncate">Telegram</span> : null}
                </a>
              ) : null}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
