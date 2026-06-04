import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useRaces } from '../hooks/useRaces'
import { useIncome } from '../hooks/useIncome'
import ProgressBar from '../components/ProgressBar'
import BottomNav from '../components/BottomNav'
import ScreenHeader from '../components/ScreenHeader'

function fmt(n: number) {
  const formatted = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(n)
  return `₦${formatted}`
}

export default function RacesList() {
  const navigate = useNavigate()
  const { userId } = useAuth()
  const { races, loading } = useRaces(userId)
  const { monthTotal } = useIncome(userId)

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-page)', height: '100%', overflowY: 'auto', paddingBottom: 120 }}>
      <ScreenHeader
        title="Races"
        subtitle="Compete with friends toward a goal"
        action={
          <button
            onClick={() => navigate('/races/create')}
            style={{
              background: 'var(--green)', color: '#FFFFFF',
              padding: '6px 14px', borderRadius: 20, fontSize: 12,
              fontWeight: 600, boxShadow: '0 2px 8px rgba(27, 94, 59, 0.15)'
            }}
          >
            + New
          </button>
        }
      />

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13, fontWeight: 500 }}>
          Loading races…
        </div>
      ) : races.length === 0 ? (
        <div style={{
          margin: '20px 20px 0',
          padding: '48px 24px',
          backgroundColor: '#FFFFFF',
          borderRadius: 'var(--radius)',
          boxShadow: 'var(--shadow)',
          border: '1px solid var(--border)',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}>
          {/* Trophy SVG Icon */}
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#D4A853" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 16 }}>
            <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
            <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
            <path d="M4 22h16" />
            <path d="M10 14.66V17c0 .55-.45 1-1 1H4v2h16v-2h-5c-.55 0-1-.45-1-1v-2.34" />
            <path d="M12 2a6 6 0 0 1 6 6v5a6 6 0 0 1-6 6 6 6 0 0 1-6-6V8a6 6 0 0 1 6-6z" fill="rgba(212, 168, 83, 0.1)" />
          </svg>
          
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, color: 'var(--text-primary)' }}>No races yet</h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.4, maxWidth: 240 }}>
            Compete with friends by creating a race or joining one with an invite link.
          </p>
          <button
            onClick={() => navigate('/races/create')}
            style={{
              padding: '12px 24px',
              background: 'var(--green)',
              color: '#FFFFFF',
              borderRadius: 12,
              fontSize: 13,
              fontWeight: 600,
              boxShadow: '0 4px 12px rgba(27, 94, 59, 0.15)',
            }}
          >
            Start a race
          </button>
        </div>
      ) : (
        <div style={{ padding: '12px 20px 0', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {races.map(race => {
            const userMonthTotal = monthTotal(race.month_year)
            const raceProgress = race.target_amount > 0 ? userMonthTotal / race.target_amount : 0
            
            // Format Month Year nicely, e.g., "June 2026"
            let formattedMonth = race.month_year
            try {
              formattedMonth = new Date(race.month_year + '-02').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
            } catch (e) {}

            return (
              <button
                key={race.id}
                onClick={() => navigate(`/races/${race.id}`)}
                style={{
                  padding: 20,
                  background: '#FFFFFF',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  textAlign: 'left',
                  width: '100%',
                  boxShadow: 'var(--shadow)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                  transition: 'transform 0.15s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
                  <span style={{ fontSize: 15, color: 'var(--text-primary)', fontWeight: 700 }}>{race.name}</span>
                  <span style={{
                    fontSize: 11, fontWeight: 600,
                    color: 'var(--green)', background: 'var(--green-dim)',
                    padding: '3px 8px', borderRadius: 20,
                  }}>
                    {formattedMonth}
                  </span>
                </div>
                
                {race.description && (
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    {race.description}
                  </p>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, fontWeight: 500, color: 'var(--text-tertiary)', marginTop: 2 }}>
                  <span>{race.memberCount} members competing</span>
                  <span>Goal: {fmt(race.target_amount)}</span>
                </div>
                
                <ProgressBar value={raceProgress} color="var(--amber)" height={6} />
                
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)' }}>
                  <span>Your total: {fmt(userMonthTotal)}</span>
                  <span style={{ color: 'var(--green)' }}>{Math.round(raceProgress * 100)}% complete</span>
                </div>
              </button>
            )
          })}
        </div>
      )}

      <BottomNav />
    </div>
  )
}
