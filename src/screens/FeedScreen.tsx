import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useIncome } from '../hooks/useIncome'
import { useProfile } from '../hooks/useProfile'
import Avatar from '../components/Avatar'
import BottomNav from '../components/BottomNav'
import ScreenHeader from '../components/ScreenHeader'
import IncomeDetailModal from '../components/IncomeDetailModal'
import { parseDescription, fmt } from '../lib/utils'

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default function FeedScreen() {
  const { userId } = useAuth()
  const { profile } = useProfile(userId)
  const { records, loading } = useIncome(userId)
  const [selectedRecord, setSelectedRecord] = useState<any>(null)

  const displayName = userId ? (localStorage.getItem(`displayName_${userId}`) || profile?.username || 'You') : 'You'

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-page)', height: '100%', overflowY: 'auto', paddingBottom: 110 }}>
      <ScreenHeader title="History" subtitle="Your personal income logs" />

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13, fontWeight: 500 }}>
          Loading history…
        </div>
      ) : records.length === 0 ? (
        <div style={{
          margin: '20px 20px 0',
          padding: '48px 24px',
          backgroundColor: '#FFFFFF',
          borderRadius: 'var(--radius)',
          boxShadow: 'var(--shadow)',
          border: '1px solid var(--border)',
          textAlign: 'center',
          color: 'var(--text-tertiary)'
        }}>
          <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>Nothing here yet</p>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
            You haven't logged any income yet. Tap the floating "+" button below to log your first win!
          </p>
        </div>
      ) : (
        <div style={{
          margin: '12px 20px 0',
          padding: '12px 20px',
          backgroundColor: '#FFFFFF',
          borderRadius: 'var(--radius)',
          boxShadow: 'var(--shadow)',
          border: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {records.map((item, idx) => {
            const { text } = parseDescription(item.description)

            return (
              <div 
                key={item.id} 
                onClick={() => setSelectedRecord(item)}
                style={{
                  display: 'flex',
                  gap: 12,
                  padding: '14px 0',
                  borderBottom: idx === records.length - 1 ? 'none' : '1px solid var(--border)',
                  alignItems: 'center',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                }}
              >
                <Avatar url={profile?.avatar_url} name={profile?.username} size={36} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 2 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                      {displayName} <span style={{ color: 'var(--text-secondary)', fontSize: 11, fontWeight: 500 }}>(you)</span>
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 500 }}>{timeAgo(item.recorded_at)}</span>
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>
                    logged <span style={{ color: 'var(--green)', fontWeight: 700 }}>+{fmt(item.amount)}</span>
                    {text && <span style={{ color: 'var(--text-tertiary)', fontWeight: 400 }}> · {text}</span>}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <BottomNav />

      {/* Detail Modal */}
      {selectedRecord && (
        <IncomeDetailModal 
          record={selectedRecord}
          onClose={() => setSelectedRecord(null)}
        />
      )}
    </div>
  )
}
