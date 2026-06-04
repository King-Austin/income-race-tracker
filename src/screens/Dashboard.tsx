import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useProfile } from '../hooks/useProfile'
import { useIncome } from '../hooks/useIncome'
import { useRaces } from '../hooks/useRaces'
import ProgressBar from '../components/ProgressBar'
import Avatar from '../components/Avatar'
import BottomNav from '../components/BottomNav'
import IncomeDetailModal from '../components/IncomeDetailModal'
import { parseDescription, fmt } from '../lib/utils'

function now() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { userId } = useAuth()
  const { profile } = useProfile(userId)
  const { records, monthTotal, reload } = useIncome(userId)
  const { races } = useRaces(userId)
  const [selectedRecord, setSelectedRecord] = useState<any>(null)

  const monthYear = now()
  const total = monthTotal(monthYear)
  const goal = profile?.monthly_goal ?? 0
  const progress = goal > 0 ? total / goal : 0

  const recent = records.slice(0, 5)
  const displayName = userId ? (localStorage.getItem(`displayName_${userId}`) || profile?.username) : profile?.username

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-page)', height: '100%', overflowY: 'auto', paddingBottom: 100 }}>
      {/* Header */}
      <div style={{ padding: '48px 20px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: 2 }}>
              {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </p>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--green)', letterSpacing: '-0.5px' }}>
              Hey, {displayName ?? '…'}
            </h1>
          </div>
          <button onClick={() => navigate('/settings')} style={{ border: 'none', background: 'none' }}>
            <Avatar url={profile?.avatar_url} name={profile?.username} size={42} />
          </button>
        </div>
      </div>

      {/* Goal card */}
      <div style={{
        margin: '0 20px 20px',
        padding: 24,
        background: '#FFFFFF',
        borderRadius: 'var(--radius)',
        boxShadow: 'var(--shadow)',
        border: '1px solid var(--border)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
            Monthly Goal Progress
          </span>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--green)' }}>
            {goal > 0 ? `${fmt(goal)} goal` : 'No goal set'}
          </span>
        </div>
        
        <p style={{ fontSize: 36, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 16, letterSpacing: '-1px' }}>
          {fmt(total)}
        </p>
        
        <ProgressBar value={progress} color="var(--green)" height={8} />
        
        {goal > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontSize: 11, fontWeight: 500, color: 'var(--text-tertiary)' }}>
            <span>{Math.round(progress * 100)}% filled</span>
            <span>{goal > total ? `${fmt(goal - total)} left` : 'Goal achieved! 🎉'}</span>
          </div>
        )}
      </div>

      {/* Log income inline button */}
      <div style={{ padding: '0 20px 24px' }}>
        <button
          onClick={() => navigate('/income/add')}
          style={{
            width: '100%', padding: '14px 0',
            background: 'var(--green)', color: '#FFFFFF',
            borderRadius: 12, fontSize: 14, fontWeight: 600,
            boxShadow: '0 4px 12px rgba(27, 94, 59, 0.15)',
          }}
        >
          + Log Income
        </button>
      </div>

      {/* Active races */}
      {races.length > 0 && (
        <div style={{ padding: '0 20px 24px' }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Active Races
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {races.slice(0, 3).map(race => {
              const raceProgress = race.target_amount > 0 ? total / race.target_amount : 0
              return (
                <button
                  key={race.id}
                  onClick={() => navigate(`/races/${race.id}`)}
                  style={{
                    padding: 16,
                    background: '#FFFFFF',
                    border: '1px solid var(--border)',
                    borderRadius: 16,
                    textAlign: 'left',
                    width: '100%',
                    boxShadow: 'var(--shadow)',
                    cursor: 'pointer',
                    transition: 'transform 0.15s ease',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, alignItems: 'center' }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{race.name}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', background: 'var(--bg-page)', padding: '4px 8px', borderRadius: 20 }}>
                      {race.memberCount} members
                    </span>
                  </div>
                  <ProgressBar value={raceProgress} color="var(--amber)" height={6} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 11, fontWeight: 500, color: 'var(--text-tertiary)' }}>
                    <span>Target: {fmt(race.target_amount)}</span>
                    <span>{Math.round(raceProgress * 100)}%</span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Recent activity */}
      <div style={{ padding: '0 20px 24px', flexGrow: 1 }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Recent Activity
        </p>
        
        {recent.length > 0 ? (
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 'var(--radius)',
            padding: '12px 20px',
            boxShadow: 'var(--shadow)',
            border: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {recent.map((r, idx) => {
              const { text } = parseDescription(r.description)
              return (
                <div 
                  key={r.id} 
                  onClick={() => setSelectedRecord(r)}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '14px 0',
                    borderBottom: idx === recent.length - 1 ? 'none' : '1px solid var(--border)',
                    cursor: 'pointer'
                  }}
                >
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{text}</p>
                    <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2, fontWeight: 500 }}>
                      {new Date(r.recorded_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--green)' }}>
                    +{fmt(r.amount)}
                  </span>
                </div>
              )
            })}
          </div>
        ) : (
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 'var(--radius)',
            padding: '40px 20px',
            boxShadow: 'var(--shadow)',
            border: '1px solid var(--border)',
            textAlign: 'center',
            color: 'var(--text-tertiary)',
            fontSize: 13,
            fontWeight: 500
          }}>
            No income logged this month. Tap "+ Log Income" to get started!
          </div>
        )}
      </div>

      <BottomNav />

      {/* Detail Modal */}
      {selectedRecord && (
        <IncomeDetailModal 
          record={selectedRecord}
          onClose={() => setSelectedRecord(null)}
          onUpdate={reload}
        />
      )}
    </div>
  )
}
