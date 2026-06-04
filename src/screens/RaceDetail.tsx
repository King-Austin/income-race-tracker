import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useRaceDetail } from '../hooks/useRaceDetail'
import { useRaces } from '../hooks/useRaces'
import { useToast } from '../components/Toast'
import ProgressBar from '../components/ProgressBar'
import Avatar from '../components/Avatar'
import ScreenHeader from '../components/ScreenHeader'

function fmt(n: number) {
  const formatted = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(n)
  return `₦${formatted}`
}

export default function RaceDetail() {
  const { raceId } = useParams<{ raceId: string }>()
  const navigate = useNavigate()
  const { userId } = useAuth()
  const { data, loading, removeMember } = useRaceDetail(raceId!, userId)
  const { leaveRace, deleteRace } = useRaces(userId)
  const toast = useToast()
  const [showInvite, setShowInvite] = useState(false)
  const [busy, setBusy] = useState(false)

  if (loading || !data) {
    return (
      <div style={{
        padding: 40,
        textAlign: 'center',
        color: 'var(--text-tertiary)',
        fontSize: 13,
        fontWeight: 500,
        backgroundColor: 'var(--bg-page)',
        minHeight: '100vh'
      }}>
        Loading race details…
      </div>
    )
  }

  const { race, leaderboard } = data
  const isOwner = race.owner_id === userId
  const inviteUrl = `${window.location.origin}/join/${race.invite_code}`

  const handleCopyInvite = () => {
    navigator.clipboard.writeText(inviteUrl)
    toast('Invite link copied!', 'success')
  }

  const handleLeave = async () => {
    if (!confirm('Leave this race?')) return
    setBusy(true)
    try {
      await leaveRace(race.id)
      navigate('/races', { replace: true })
    } catch (err: unknown) {
      toast((err as Error).message, 'error')
    } finally {
      setBusy(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm(`Delete "${race.name}"? This cannot be undone.`)) return
    setBusy(true)
    try {
      await deleteRace(race.id)
      navigate('/races', { replace: true })
    } catch (err: unknown) {
      toast((err as Error).message, 'error')
    } finally {
      setBusy(false)
    }
  }

  const handleRemove = async (uid: string, name: string) => {
    if (!confirm(`Remove ${name}?`)) return
    try {
      await removeMember(uid)
      toast('Member removed', 'success')
    } catch (err: unknown) {
      toast((err as Error).message, 'error')
    }
  }

  // Format month year nicely
  let formattedMonth = race.month_year
  try {
    formattedMonth = new Date(race.month_year + '-02').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  } catch (e) {}

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-page)', height: '100%', overflowY: 'auto', paddingBottom: 100 }}>
      <ScreenHeader
        title={race.name}
        back="/races"
        action={
          <button
            onClick={() => setShowInvite(!showInvite)}
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--green)',
              border: '1px solid rgba(27, 94, 59, 0.25)',
              padding: '6px 14px',
              borderRadius: 20,
              backgroundColor: '#FFFFFF',
              boxShadow: 'var(--shadow)'
            }}
          >
            {showInvite ? 'Close Invite' : 'Invite'}
          </button>
        }
      />

      {/* Invite banner */}
      {showInvite && (
        <div style={{
          margin: '0 20px 16px',
          padding: 20,
          background: 'var(--green-dim)',
          border: '1px solid rgba(27, 94, 59, 0.15)',
          borderRadius: 'var(--radius)',
          boxShadow: 'var(--shadow)'
        }}>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--green)', marginBottom: 8 }}>
            Invite Code
          </p>
          <p style={{ fontSize: 24, fontWeight: 800, color: 'var(--green)', letterSpacing: '0.15em', marginBottom: 12 }}>
            {race.invite_code}
          </p>
          <button
            onClick={handleCopyInvite}
            style={{
              width: '100%',
              padding: '12px 0',
              background: 'var(--green)',
              color: '#FFFFFF',
              borderRadius: 12,
              fontSize: 13,
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(27, 94, 59, 0.15)'
            }}
          >
            Copy invite link
          </button>
        </div>
      )}

      {/* Race stats block */}
      <div style={{
        margin: '0 20px 20px',
        padding: 16,
        background: '#FFFFFF',
        borderRadius: 'var(--radius)',
        boxShadow: 'var(--shadow)',
        border: '1px solid var(--border)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Stat label="Target" value={fmt(race.target_amount)} />
        <div style={{ height: 28, width: 1, backgroundColor: 'var(--border)' }} />
        <Stat label="Period" value={formattedMonth} />
        <div style={{ height: 28, width: 1, backgroundColor: 'var(--border)' }} />
        <Stat label="Members" value={String(leaderboard.length)} />
      </div>

      {/* Leaderboard */}
      <div style={{ padding: '0 20px 24px' }}>
        <p style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', marginBottom: 12 }}>
          Leaderboard
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {leaderboard.map((entry, i) => {
            const progress = race.target_amount > 0 ? entry.total / race.target_amount : 0
            const isMe = entry.user.id === userId
            
            // Check for display name in localStorage if it is the current user
            const memberDisplayName = isMe 
              ? (localStorage.getItem(`displayName_${userId}`) || entry.user.username) 
              : entry.user.username

            return (
              <button
                key={entry.user.id}
                onClick={() => navigate(`/races/${race.id}/member/${entry.user.id}`)}
                style={{
                  padding: 16,
                  background: isMe ? 'var(--green-dim)' : '#FFFFFF',
                  border: isMe ? '1px solid rgba(27, 94, 59, 0.25)' : '1px solid var(--border)',
                  borderRadius: 16,
                  textAlign: 'left',
                  width: '100%',
                  boxShadow: 'var(--shadow)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                  transition: 'transform 0.1s'
                }}
                onMouseDown={e => e.currentTarget.style.transform = 'scale(0.99)'}
                onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%' }}>
                  <span style={{
                    width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                    background: i === 0 ? '#D4A853' : '#EAE6DF',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 700,
                    color: i === 0 ? '#FFFFFF' : 'var(--text-secondary)',
                  }}>
                    {entry.rank}
                  </span>
                  
                  <Avatar url={entry.user.avatar_url} name={entry.user.username} size={32} />
                  
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {memberDisplayName} {isMe && <span style={{ color: 'var(--text-secondary)', fontSize: 12, fontWeight: 500 }}>(you)</span>}
                    </p>
                    {entry.isOwner && (
                      <p style={{ fontSize: 9, color: '#D4A853', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', marginTop: 1 }}>owner</p>
                    )}
                  </div>
                  
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--green)', flexShrink: 0 }}>
                    {fmt(entry.total)}
                  </span>
                </div>
                
                <ProgressBar value={progress} color={i === 0 ? 'var(--amber)' : 'var(--green)'} height={6} />
                
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 500, color: 'var(--text-tertiary)' }}>
                  <span>{Math.round(progress * 100)}% filled</span>
                  <span>Target: {fmt(race.target_amount)}</span>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Owner controls */}
      {isOwner && (
        <div style={{ padding: '0 20px 24px' }}>
          <p style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', marginBottom: 12 }}>
            Manage Members
          </p>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 'var(--radius)',
            padding: '12px 20px',
            boxShadow: 'var(--shadow)',
            border: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {leaderboard.filter(e => e.user.id !== userId).length > 0 ? (
              leaderboard.filter(e => e.user.id !== userId).map((entry, idx, arr) => (
                <div key={entry.user.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 0',
                  borderBottom: idx === arr.length - 1 ? 'none' : '1px solid var(--border)'
                }}>
                  <Avatar url={entry.user.avatar_url} name={entry.user.username} size={30} />
                  <span style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{entry.user.username}</span>
                  <button
                    onClick={() => handleRemove(entry.user.id, entry.user.username)}
                    style={{
                      fontSize: 11, fontWeight: 600, color: '#DC2626',
                      padding: '4px 10px', border: '1px solid rgba(220,38,38,0.2)',
                      borderRadius: 8, cursor: 'pointer', background: '#FFFFFF'
                    }}
                  >
                    Remove
                  </button>
                </div>
              ))
            ) : (
              <div style={{ padding: '16px 0', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13, fontWeight: 500 }}>
                No other members yet. Invite friends to join!
              </div>
            )}
          </div>
          
          <button
            onClick={handleDelete}
            disabled={busy}
            style={{
              marginTop: 20, width: '100%', padding: '14px 0',
              color: '#DC2626', background: '#FFFFFF',
              border: '1px solid rgba(220, 38, 38, 0.2)',
              borderRadius: 12, fontSize: 13, fontWeight: 600,
              cursor: 'pointer', opacity: busy ? 0.5 : 1,
              boxShadow: 'var(--shadow)'
            }}
          >
            Delete Race
          </button>
        </div>
      )}

      {/* Non-owner leave button */}
      {!isOwner && (
        <div style={{ padding: '0 20px 24px' }}>
          <button
            onClick={handleLeave}
            disabled={busy}
            style={{
              width: '100%', padding: '14px 0',
              color: 'var(--text-secondary)', background: '#FFFFFF',
              border: '1px solid var(--border-mid)',
              borderRadius: 12, fontSize: 13, fontWeight: 600,
              cursor: 'pointer', opacity: busy ? 0.5 : 1,
              boxShadow: 'var(--shadow)'
            }}
          >
            Leave Race
          </button>
        </div>
      )}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ flex: 1, textAlign: 'center' }}>
      <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-tertiary)', marginBottom: 4 }}>
        {label}
      </p>
      <p style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)' }}>
        {value}
      </p>
    </div>
  )
}
