import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../components/Toast'

export default function Login() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [busy, setBusy] = useState(false)
  const { signIn, signUp } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    try {
      if (mode === 'signin') {
        const { error } = await signIn(email, password)
        if (error) throw error
      } else {
        if (!username.trim()) throw new Error('Username is required')
        await signUp(email, password, username.trim())
      }

      // Check for pending invite
      const pendingInvite = sessionStorage.getItem('pendingInvite')
      if (pendingInvite) {
        sessionStorage.removeItem('pendingInvite')
        navigate(`/join/${pendingInvite}`, { replace: true })
      } else {
        navigate(from, { replace: true })
      }
    } catch (err: unknown) {
      toast((err as Error).message ?? 'Something went wrong', 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{
      height: '100%',
      overflowY: 'auto',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      padding: '32px 24px',
      backgroundColor: 'var(--green)',
      color: '#FFFFFF',
    }}>
      {/* Favicon Circle */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%',
          backgroundColor: '#D4A853', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 10px rgba(0, 0, 0, 0.15)',
        }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32" fill="none">
            <path d="M9 22L14 17L18 20L24 12" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M19 12H24V17" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      {/* App Header */}
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: '#D4A853', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 4 }}>
          Income Race Tracker
        </h1>
        <p style={{ fontSize: 13, color: 'rgba(255, 255, 255, 0.85)', fontWeight: 400 }}>
          Set a goal. Log every win. Watch it fill up.
        </p>
      </div>

      {/* White Card Container */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 'var(--radius)',
        padding: '28px 24px',
        boxShadow: 'var(--shadow-lg)',
        color: 'var(--text-primary)',
      }}>
        <h2 style={{
          fontSize: 22,
          fontWeight: 700,
          color: 'var(--text-primary)',
          marginBottom: 20,
        }}>
          {mode === 'signin' ? 'Welcome back' : 'Create account'}
        </h2>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {mode === 'signup' && (
            <Field label="Username" value={username} onChange={setUsername} placeholder="e.g. austin" />
          )}
          <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" />
          <Field label="Password" type="password" value={password} onChange={setPassword} placeholder="••••••••" />

          <button
            type="submit"
            disabled={busy}
            style={{
              marginTop: 8,
              background: 'var(--green)',
              color: '#FFFFFF',
              padding: '14px 0',
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 600,
              letterSpacing: '0.05em',
              opacity: busy ? 0.6 : 1,
              transition: 'opacity 0.2s',
            }}
          >
            {busy ? 'Processing…' : mode === 'signin' ? 'Sign In' : 'Sign Up'}
          </button>
        </form>
      </div>

      {/* Toggle mode */}
      <button
        onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
        style={{
          marginTop: 24,
          color: 'rgba(255, 255, 255, 0.85)',
          fontSize: 13,
          fontWeight: 500,
          textAlign: 'center',
          textDecoration: 'underline',
        }}
      >
        {mode === 'signin' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
      </button>
    </div>
  )
}

function Field({ label, type = 'text', value, onChange, placeholder }: {
  label: string; type?: string; value: string
  onChange: (v: string) => void; placeholder?: string
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        required
        style={{
          width: '100%', padding: '12px 14px',
          background: '#FFFFFF', border: '1px solid var(--border-mid)',
          borderRadius: 10, color: 'var(--text-primary)', fontSize: 14,
          outline: 'none',
          transition: 'border-color 0.15s',
        }}
      />
    </div>
  )
}
