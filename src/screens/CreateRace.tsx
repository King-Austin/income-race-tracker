import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useRaces } from '../hooks/useRaces'
import { useToast } from '../components/Toast'
import ScreenHeader from '../components/ScreenHeader'

function currentMonthYear() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export default function CreateRace() {
  const navigate = useNavigate()
  const { userId } = useAuth()
  const { createRace } = useRaces(userId)
  const toast = useToast()
  
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [target, setTarget] = useState('')
  const [monthYear, setMonthYear] = useState(currentMonthYear())
  const [busy, setBusy] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const targetNum = parseFloat(target)
    if (isNaN(targetNum) || targetNum <= 0) {
      toast('Enter a valid target amount', 'error')
      return
    }
    setBusy(true)
    try {
      const race = await createRace({
        name: name.trim(),
        description: description.trim() || undefined,
        targetAmount: targetNum,
        monthYear
      })
      toast('Race created successfully!', 'success')
      navigate(`/races/${race.id}`, { replace: true })
    } catch (err: unknown) {
      toast((err as Error).message, 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-page)', height: '100%', overflowY: 'auto', paddingBottom: 40 }}>
      <ScreenHeader title="New Race" back="/races" />

      <form onSubmit={handleSubmit} style={{ flex: 1, padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 18 }}>
        
        {/* Name */}
        <div>
          <label style={labelStyle}>Race name</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. June Hustle"
            required
            autoFocus
            style={inputStyle}
          />
        </div>

        {/* Description */}
        <div>
          <label style={labelStyle}>Description (optional)</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="What's this race about?"
            rows={3}
            style={{ ...inputStyle, resize: 'none' }}
          />
        </div>

        {/* Target */}
        <div>
          <label style={labelStyle}>Monthly target (₦)</label>
          <input
            type="number"
            min="1"
            step="1"
            value={target}
            onChange={e => setTarget(e.target.value)}
            placeholder="e.g. 500000"
            required
            style={inputStyle}
          />
          <p style={{ marginTop: 6, fontSize: 11, color: 'var(--text-tertiary)' }}>
            The target income in Naira (₦) each member aims to hit.
          </p>
        </div>

        {/* Month */}
        <div>
          <label style={labelStyle}>Month</label>
          <input
            type="month"
            value={monthYear}
            onChange={e => setMonthYear(e.target.value)}
            required
            style={inputStyle}
          />
        </div>

        {/* Footer info & submit button */}
        <div style={{ marginTop: 'auto', paddingBottom: 24, paddingTop: 16 }}>
          <div style={{
            padding: 14,
            background: 'var(--green-dim)',
            border: '1px solid rgba(27, 94, 59, 0.15)',
            borderRadius: 10,
            marginBottom: 16
          }}>
            <p style={{ fontSize: 12, color: 'var(--green)', fontWeight: 500, lineHeight: 1.4 }}>
              After creating, you'll receive a unique invite code to share with friends so they can join the race.
            </p>
          </div>
          
          <button
            type="submit"
            disabled={busy}
            style={{
              width: '100%', padding: '14px 0',
              background: 'var(--green)', color: '#FFFFFF',
              borderRadius: 12, fontSize: 14, fontWeight: 600,
              opacity: busy ? 0.6 : 1,
              boxShadow: '0 4px 12px rgba(27, 94, 59, 0.15)',
            }}
          >
            {busy ? 'Creating race…' : 'Create race'}
          </button>
        </div>
      </form>
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 12, fontWeight: 600,
  color: 'var(--text-secondary)', marginBottom: 8,
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px 14px',
  background: '#FFFFFF', border: '1px solid var(--border-mid)',
  borderRadius: 12, color: 'var(--text-primary)', fontSize: 14,
  outline: 'none', transition: 'border-color 0.15s'
}
