import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Profile, IncomeRecord } from '../types'
import ProgressBar from '../components/ProgressBar'
import Avatar from '../components/Avatar'
import ScreenHeader from '../components/ScreenHeader'
import IncomeDetailModal from '../components/IncomeDetailModal'
import { parseDescription, fmt } from '../lib/utils'

export default function MemberProfile() {
  const { raceId, userId } = useParams<{ raceId: string; userId: string }>()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [records, setRecords] = useState<IncomeRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRecord, setSelectedRecord] = useState<any>(null)

  useEffect(() => {
    if (!userId) return
    Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).single(),
      supabase.from('income_records').select('*').eq('user_id', userId).order('recorded_at', { ascending: false }).limit(20),
    ]).then(([pRes, rRes]) => {
      setProfile(pRes.data as Profile | null)
      setRecords((rRes.data as IncomeRecord[] | null) ?? [])
      setLoading(false)
    })
  }, [userId])

  if (loading) {
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
        Loading member profile…
      </div>
    )
  }
  if (!profile) return null

  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const monthTotal = records
    .filter(r => {
      const d = new Date(r.recorded_at)
      return d.getFullYear() === year && d.getMonth() + 1 === month
    })
    .reduce((s, r) => s + r.amount, 0)
  const progress = profile.monthly_goal > 0 ? monthTotal / profile.monthly_goal : 0

  // Check if this is the current logged-in user to fetch their custom display name
  const memberDisplayName = localStorage.getItem(`displayName_${profile.id}`) || profile.username

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-page)', height: '100%', overflowY: 'auto', paddingBottom: 80 }}>
      <ScreenHeader title="Member Details" back={`/races/${raceId}`} />

      {/* Member identity block */}
      <div style={{
        margin: '0 20px 20px',
        padding: 20,
        background: '#FFFFFF',
        borderRadius: 'var(--radius)',
        boxShadow: 'var(--shadow)',
        border: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        gap: 16
      }}>
        <Avatar url={profile.avatar_url} name={profile.username} size={56} />
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>
            {memberDisplayName}
          </h2>
          {profile.monthly_goal > 0 && (
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2, fontWeight: 500 }}>
              Goal: {fmt(profile.monthly_goal)}/mo
            </p>
          )}
        </div>
      </div>

      {/* This month's progress card */}
      <div style={{
        margin: '0 20px 20px',
        padding: 20,
        background: '#FFFFFF',
        borderRadius: 'var(--radius)',
        boxShadow: 'var(--shadow)',
        border: '1px solid var(--border)'
      }}>
        <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', marginBottom: 8 }}>
          This Month's Income
        </p>
        <p style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 12 }}>
          {fmt(monthTotal)}
        </p>
        {profile.monthly_goal > 0 && (
          <>
            <ProgressBar value={progress} color="var(--green)" height={6} />
            <p style={{ marginTop: 8, fontSize: 11, fontWeight: 500, color: 'var(--text-tertiary)' }}>
              {Math.round(progress * 100)}% of {fmt(profile.monthly_goal)} goal filled
            </p>
          </>
        )}
      </div>

      {/* Recent activity list */}
      <div style={{ padding: '0 20px 24px' }}>
        <p style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', marginBottom: 12 }}>
          Recent Income logs
        </p>
        
        {records.length === 0 ? (
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 'var(--radius)',
            padding: 24,
            boxShadow: 'var(--shadow)',
            border: '1px solid var(--border)',
            textAlign: 'center',
            color: 'var(--text-tertiary)',
            fontSize: 13,
            fontWeight: 500
          }}>
            No income logs recorded yet.
          </div>
        ) : (
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 'var(--radius)',
            padding: '12px 20px',
            boxShadow: 'var(--shadow)',
            border: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {records.slice(0, 10).map((r, idx) => {
              const { text } = parseDescription(r.description)
              return (
                <div 
                  key={r.id} 
                  onClick={() => setSelectedRecord(r)}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 0',
                    borderBottom: idx === records.length - 1 || idx === 9 ? 'none' : '1px solid var(--border)',
                    cursor: 'pointer'
                  }}
                >
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{text}</p>
                    <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2, fontWeight: 500 }}>
                      {new Date(r.recorded_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--green)' }}>
                    +{fmt(r.amount)}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>

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
