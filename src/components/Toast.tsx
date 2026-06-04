import { createContext, useContext, useState, useCallback } from 'react'

type ToastType = 'success' | 'error' | 'info'
type ToastItem = { id: number; message: string; type: ToastType }

const ToastCtx = createContext<(msg: string, type?: ToastType) => void>(() => {})

export function useToast() {
  return useContext(ToastCtx)
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const show = useCallback((message: string, type: ToastType = 'info') => {
    const id = Date.now()
    setToasts(t => [...t, { id, message, type }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3000)
  }, [])

  return (
    <ToastCtx.Provider value={show}>
      {children}
      <div style={{ position: 'fixed', bottom: 90, left: '50%', transform: 'translateX(-50%)', width: 'min(360px, 90vw)', display: 'flex', flexDirection: 'column', gap: 8, zIndex: 9999, pointerEvents: 'none' }}>
        {toasts.map(t => (
          <div key={t.id} style={{
            background: '#FFFFFF',
            color: t.type === 'error' ? '#DC2626' : t.type === 'success' ? 'var(--green)' : 'var(--text-primary)',
            border: `1px solid ${t.type === 'error' ? 'rgba(220, 38, 38, 0.2)' : 'var(--border)'}`,
            padding: '12px 18px',
            borderRadius: 'var(--radius-sm)',
            fontSize: 13,
            fontWeight: 500,
            textAlign: 'center',
            boxShadow: 'var(--shadow-lg)',
            fontFamily: 'var(--font-mono)',
          }}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}
