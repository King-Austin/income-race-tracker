import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useRaces } from '../hooks/useRaces'
import { useToast } from '../components/Toast'
import type { Race } from '../types'

function fmt(n: number) {
  const formatted = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(n)
  return `₦${formatted}`
}

export default function InvitePage() {
  const { inviteCode } = useParams<{ inviteCode: string }>()
  const navigate = useNavigate()
  const { userId, session } = useAuth()
  const { joinByCode } = useRaces(userId)
  const toast = useToast()
  const [race, setRace] = useState<Race | null | 'not-found'>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!inviteCode) return
    supabase.from('races').select('*').eq('invite_code', inviteCode.toUpperCase()).eq('is_active', true).single()
      .then(res => setRace((res.data as Race | null) ?? 'not-found'))
  }, [inviteCode])

  const handleJoin = async () => {
    if (!session) {
      sessionStorage.setItem('pendingInvite', inviteCode!)
      navigate('/login')
      return
    }
    setBusy(true)
    try {
      const joined = await joinByCode(inviteCode!)
      toast('Joined the race successfully!', 'success')
      navigate(`/races/${joined.id}`, { replace: true })
    } catch (err: unknown) {
      const msg = (err as Error).message
      if (msg === 'Already a member' && race && race !== 'not-found') {
        navigate(`/races/${(race as Race).id}`, { replace: true })
      } else {
        toast(msg, 'error')
      }
    } finally {
      setBusy(false)
    }
  }

  if (race === null) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text-tertiary)',
        fontSize: 13,
        fontWeight: 500,
        backgroundColor: 'var(--bg-page)'
      }}>
        Loading invite details…
      </div>
    )
  }

  if (race === 'not-found') {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
        textAlign: 'center',
        backgroundColor: 'var(--bg-page)'
      }}>
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 'var(--radius)',
          padding: '40px 24px',
          boxShadow: 'var(--shadow)',
          border: '1px solid var(--border)',
          width: '100%'
        }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>Race not found</h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.4 }}>
            This invite link may be expired or invalid. Check the code and try again.
          </p>
          <button
            onClick={() => navigate('/')}
            style={{
              padding: '12px 24px',
              background: 'var(--green)',
              color: '#FFFFFF',
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Go to dashboard
          </button>
        </div>
      </div>
    )
  }

  // Format month
  let formattedMonth = race.month_year
  try {
    formattedMonth = new Date(race.month_year + '-02').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  } catch (e) {}

  return (
    <div style={{
      height: '100%',
      overflowY: 'auto',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      padding: '32px 24px',
      backgroundColor: 'var(--bg-page)'
    }}>
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 'var(--radius)',
        padding: '40px 24px',
        boxShadow: 'var(--shadow-lg)',
        border: '1px solid var(--border)',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        <span style={{
          display: 'inline-block',
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          color: 'var(--green)',
          background: 'var(--green-dim)',
          padding: '4px 12px',
          borderRadius: 20,
          marginBottom: 20
        }}>
          You're Invited
        </span>
        
        <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8, lineHeight: 1.2 }}>
          {race.name}
        </h1>
        
        {race.description && (
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.4 }}>
            {race.description}
          </p>
        )}
        
        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: 32 }}>
          {formattedMonth} · {fmt(race.target_amount)} target
        </p>

        <button
          onClick={handleJoin}
          disabled={busy}
          style={{
            width: '100%',
            padding: '14px 0',
            background: 'var(--green)',
            color: '#FFFFFF',
            borderRadius: 12,
            fontSize: 15,
            fontWeight: 600,
            cursor: 'pointer',
            border: 'none',
            opacity: busy ? 0.6 : 1,
            boxShadow: '0 4px 12px rgba(27, 94, 59, 0.15)'
          }}
        >
          {busy ? 'Processing…' : session ? 'Join Race' : 'Sign Up to Join'}
        </button>
        
        {session && (
          <button
            onClick={() => navigate('/')}
            style={{
              marginTop: 16,
              color: 'var(--text-secondary)',
              fontSize: 13,
              fontWeight: 500,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            Maybe later
          </button>
        )}
      </div>
    </div>
  )
}
