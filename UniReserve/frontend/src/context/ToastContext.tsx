/** Notificaciones efimeras de exito y error. */
import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

interface Toast {
  id: number
  mensaje: string
  tipo: 'ok' | 'error'
}

interface ToastContextValue {
  exito: (mensaje: string) => void
  error: (mensaje: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const agregar = useCallback((mensaje: string, tipo: 'ok' | 'error') => {
    const id = Date.now() + Math.random()
    setToasts((prev) => [...prev, { id, mensaje, tipo }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4500)
  }, [])

  const valor = useMemo<ToastContextValue>(
    () => ({
      exito: (m: string) => agregar(m, 'ok'),
      error: (m: string) => agregar(m, 'error'),
    }),
    [agregar],
  )

  return (
    <ToastContext.Provider value={valor}>
      {children}
      <div className="toast-stack" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast--${t.tipo}`}>
            {t.mensaje}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast debe usarse dentro de <ToastProvider>')
  return ctx
}
