import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react'

const ToastContext = createContext(null)

const VARIANTS = {
  error: {
    label: 'Error',
    Icon: AlertCircle,
    accent: '#f43f5e',
    glow: 'rgba(244, 63, 94, 0.28)',
    iconBg: 'rgba(244, 63, 94, 0.14)',
    iconColor: '#fb7185',
    bar: 'linear-gradient(90deg, #f43f5e, #e11d48)',
    border: 'rgba(244, 63, 94, 0.35)',
    ring: 'rgba(244, 63, 94, 0.14)',
  },
  success: {
    label: 'Success',
    Icon: CheckCircle2,
    accent: '#00f5d4',
    glow: 'rgba(0, 245, 212, 0.28)',
    iconBg: 'rgba(0, 245, 212, 0.14)',
    iconColor: '#00f5d4',
    bar: 'linear-gradient(90deg, #00f5d4, #00c4ab)',
    border: 'rgba(0, 245, 212, 0.25)',
    ring: 'rgba(0, 245, 212, 0.08)',
  },
  warning: {
    label: 'Notice',
    Icon: AlertTriangle,
    accent: '#f59e0b',
    glow: 'rgba(245, 158, 11, 0.24)',
    iconBg: 'rgba(245, 158, 11, 0.14)',
    iconColor: '#fbbf24',
    bar: 'linear-gradient(90deg, #f59e0b, #d97706)',
    border: 'rgba(245, 158, 11, 0.3)',
    ring: 'rgba(245, 158, 11, 0.1)',
  },
  info: {
    label: 'Info',
    Icon: Info,
    accent: '#00f5d4',
    glow: 'rgba(0, 245, 212, 0.2)',
    iconBg: 'rgba(0, 245, 212, 0.1)',
    iconColor: '#00f5d4',
    bar: 'linear-gradient(90deg, #00f5d4, #00c4ab)',
    border: 'rgba(0, 245, 212, 0.25)',
    ring: 'rgba(0, 245, 212, 0.08)',
  },
}

function ToastItem({ toast, onDismiss }) {
  const meta = VARIANTS[toast.type] || VARIANTS.info
  const { Icon } = meta
  const [paused, setPaused] = useState(false)
  const remainingRef = useRef(toast.duration)
  const startedRef = useRef(Date.now())
  const timerRef = useRef(null)

  useEffect(() => {
    if (paused) {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current)
        timerRef.current = null
      }
      remainingRef.current = Math.max(0, remainingRef.current - (Date.now() - startedRef.current))
      return undefined
    }

    startedRef.current = Date.now()
    timerRef.current = window.setTimeout(() => {
      onDismiss(toast.id)
    }, Math.max(remainingRef.current, 0))

    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }
  }, [paused, toast.id, onDismiss])

  return (
    <motion.li
      layout="position"
      role="status"
      aria-live="polite"
      initial={{ opacity: 0, y: -14, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{
        opacity: 0,
        y: -10,
        scale: 0.97,
        transition: { duration: 0.18, ease: [0.4, 0, 0.2, 1] },
      }}
      transition={{
        opacity: { duration: 0.2, ease: [0.22, 1, 0.36, 1] },
        scale: { duration: 0.22, ease: [0.22, 1, 0.36, 1] },
        y: { type: 'spring', stiffness: 420, damping: 32, mass: 0.75 },
        layout: { type: 'spring', stiffness: 380, damping: 34, mass: 0.8 },
      }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className="pointer-events-auto relative mx-auto w-[min(100%,220px)] list-none overflow-hidden rounded-md bg-[#0a121c]/92 backdrop-blur-xl md:mx-0 md:w-[min(92vw,300px)] md:rounded-xl"
      style={{
        border: `1px solid ${meta.border}`,
        boxShadow: `0 12px 32px rgba(5,11,20,0.5), 0 0 0 1px ${meta.ring}, 0 0 24px ${meta.glow}`,
      }}
    >
      <div
        className="pointer-events-none absolute inset-y-0 left-0 w-[2px]"
        style={{ background: meta.accent }}
        aria-hidden
      />

      <div className="flex gap-1.5 px-2 py-1.5 pl-2.5 md:gap-2 md:px-2.5 md:py-2.5 md:pl-3">
        <div
          className="mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded md:h-7 md:w-7 md:rounded-lg"
          style={{ background: meta.iconBg, color: meta.iconColor }}
        >
          <Icon className="h-2.5 w-2.5 md:h-3.5 md:w-3.5" strokeWidth={2.2} />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[7px] font-bold tracking-[0.12em] text-white/45 uppercase md:text-[9px] md:tracking-[0.16em]">
            {toast.title || meta.label}
          </p>
          <p className="mt-0.5 text-[10px] leading-snug font-medium text-white md:text-[12px]">
            {toast.message}
          </p>
        </div>

        <button
          type="button"
          onClick={() => onDismiss(toast.id)}
          className="mt-0 flex h-5 w-5 shrink-0 items-center justify-center rounded text-white/40 transition hover:bg-white/10 hover:text-white md:h-6 md:w-6"
          aria-label="Dismiss notification"
        >
          <X className="h-2.5 w-2.5 md:h-3 md:w-3" strokeWidth={2.4} />
        </button>
      </div>

      <div className="h-px w-full bg-white/5 md:h-[1.5px]">
        <div
          className="toast-progress-bar h-full origin-left"
          style={{
            background: meta.bar,
            animationDuration: `${toast.duration}ms`,
            animationPlayState: paused ? 'paused' : 'running',
          }}
        />
      </div>
    </motion.li>
  )
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const idBase = useId()
  const seq = useRef(0)

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const push = useCallback(
    (type, message, options = {}) => {
      seq.current += 1
      const id = `${idBase}-${seq.current}`
      const toast = {
        id,
        type,
        message,
        title: options.title,
        duration: options.duration ?? (type === 'error' ? 4200 : 3400),
      }
      // Newest last in array → top of flex-col-reverse stack
      setToasts((prev) => [...prev.slice(-2), toast])
      return id
    },
    [idBase],
  )

  const api = useMemo(
    () => ({
      push,
      dismiss,
      error: (message, options) => push('error', message, { title: 'Error', ...options }),
      success: (message, options) => push('success', message, { title: 'Success', ...options }),
      warning: (message, options) => push('warning', message, { title: 'Notice', ...options }),
      info: (message, options) => push('info', message, { title: 'Info', ...options }),
    }),
    [push, dismiss],
  )

  return (
    <ToastContext.Provider value={api}>
      {children}
      {createPortal(
        <ul
          data-peptide-toaster
          className="pointer-events-none fixed inset-x-0 top-0 flex w-full flex-col-reverse items-center gap-1.5 px-3 pt-[max(0.5rem,env(safe-area-inset-top))] md:items-end md:gap-2.5 md:px-5 md:pt-5"
          style={{ zIndex: 2147483647 }}
          aria-label="Notifications"
        >
          <AnimatePresence initial={false}>
            {toasts.map((toast) => (
              <ToastItem key={toast.id} toast={toast} onDismiss={dismiss} />
            ))}
          </AnimatePresence>
        </ul>,
        document.body,
      )}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
