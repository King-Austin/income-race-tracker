import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useProfile } from '../hooks/useProfile'
import { useToast } from '../components/Toast'
import ScreenHeader from '../components/ScreenHeader'
import Avatar from '../components/Avatar'
import BottomNav from '../components/BottomNav'

export default function Settings() {
  const { userId, signOut, session } = useAuth()
  const { profile, updateProfile, uploadAvatar } = useProfile(userId)
  const toast = useToast()
  const fileRef = useRef<HTMLInputElement>(null)
  
  const [displayName, setDisplayName] = useState('')
  const [username, setUsername] = useState('')
  const [goal, setGoal] = useState('')
  const [exchangeRate, setExchangeRate] = useState('1500')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (profile) {
      setUsername(profile.username)
      setGoal(profile.monthly_goal > 0 ? String(profile.monthly_goal) : '')
    }
    
    // Load local storage items
    if (userId) {
      setDisplayName(localStorage.getItem(`displayName_${userId}`) || '')
    }
    setExchangeRate(localStorage.getItem('exchangeRate') || '1500')
  }, [profile, userId])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    try {
      // Update Supabase profile
      await updateProfile({
        username: username.trim() || profile?.username,
        monthly_goal: parseFloat(goal) || 0,
      })
      
      // Update localStorage items
      if (userId) {
        localStorage.setItem(`displayName_${userId}`, displayName.trim())
      }
      localStorage.setItem('exchangeRate', exchangeRate.trim() || '1500')
      
      toast('Settings saved successfully', 'success')
    } catch (err: unknown) {
      toast((err as Error).message, 'error')
    } finally {
      setBusy(false)
    }
  }

  const handleAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setBusy(true)
    try {
      await uploadAvatar(file)
      toast('Avatar updated', 'success')
    } catch (err: unknown) {
      toast((err as Error).message, 'error')
    } finally {
      setBusy(false)
    }
  }

  const userEmail = session?.user?.email ?? '…'

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-page)', height: '100%', overflowY: 'auto', paddingBottom: 120 }}>
      <ScreenHeader title="Settings" />

      {/* Avatar upload section */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px 20px 24px', gap: 12 }}>
        <button onClick={() => fileRef.current?.click()} style={{ position: 'relative', border: 'none', background: 'none', cursor: 'pointer' }}>
          <Avatar url={profile?.avatar_url} name={profile?.username} size={80} />
          <span style={{
            position: 'absolute', bottom: 2, right: 2,
            background: 'var(--green)', color: '#FFFFFF',
            width: 24, height: 24, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
            fontWeight: 'bold', border: '2px solid #FFFFFF',
            boxShadow: 'var(--shadow)',
          }}>+</span>
        </button>
        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatar} />
        <p style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>Tap to change profile picture</p>
      </div>

      <form onSubmit={handleSave} style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Card 1: Account Settings */}
        <div style={{
          backgroundColor: '#FFFFFF', borderRadius: 'var(--radius)',
          padding: 20, boxShadow: 'var(--shadow)', display: 'flex', flexDirection: 'column', gap: 14
        }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--green)', marginBottom: 4 }}>Account Information</h3>
          
          <div>
            <label style={labelStyle}>Email Address</label>
            <input
              type="text"
              value={userEmail}
              disabled
              style={{
                ...inputStyle,
                background: 'var(--bg-page)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border)',
                cursor: 'not-allowed'
              }}
            />
          </div>

          <div>
            <label style={labelStyle}>Display Name</label>
            <input
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder="e.g. Austin King"
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Username</label>
            <input
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="e.g. austin"
              required
              style={inputStyle}
            />
            <p style={{ marginTop: 4, fontSize: 11, color: 'var(--text-tertiary)' }}>
              Your unique username used for race leaderboards.
            </p>
          </div>
        </div>

        {/* Card 2: Tracking Settings */}
        <div style={{
          backgroundColor: '#FFFFFF', borderRadius: 'var(--radius)',
          padding: 20, boxShadow: 'var(--shadow)', display: 'flex', flexDirection: 'column', gap: 14
        }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--green)', marginBottom: 4 }}>Goals & Currency</h3>

          <div>
            <label style={labelStyle}>Monthly Income Goal (₦)</label>
            <input
              type="number"
              min="0"
              step="1"
              value={goal}
              onChange={e => setGoal(e.target.value)}
              placeholder="e.g. 1500000"
              style={inputStyle}
            />
            <p style={{ marginTop: 4, fontSize: 11, color: 'var(--text-tertiary)' }}>
              Target income you want to reach in Naira (₦) each month.
            </p>
          </div>

          <div>
            <label style={labelStyle}>USD to NGN Exchange Rate (₦/$)</label>
            <input
              type="number"
              min="1"
              step="0.01"
              value={exchangeRate}
              onChange={e => setExchangeRate(e.target.value)}
              placeholder="e.g. 1500"
              required
              style={inputStyle}
            />
            <p style={{ marginTop: 4, fontSize: 11, color: 'var(--text-tertiary)' }}>
              Used to convert USD log inputs to Naira. Currently ₦{parseFloat(exchangeRate || '0').toLocaleString()}/$1.
            </p>
          </div>
        </div>

        {/* Save button */}
        <button
          type="submit"
          disabled={busy}
          style={{
            padding: '14px 0',
            background: 'var(--green)', color: '#FFFFFF',
            borderRadius: 12, fontSize: 14, fontWeight: 600,
            opacity: busy ? 0.6 : 1,
            boxShadow: '0 4px 12px rgba(27, 94, 59, 0.15)',
            border: 'none', cursor: 'pointer', marginTop: 8
          }}
        >
          {busy ? 'Saving changes…' : 'Save changes'}
        </button>
      </form>

      {/* Sign out section */}
      <div style={{ padding: '24px 20px 0' }}>
        <button
          onClick={signOut}
          style={{
            width: '100%', padding: '14px 0',
            color: '#DC2626', background: '#FFFFFF',
            border: '1px solid rgba(220, 38, 38, 0.2)',
            borderRadius: 12, fontSize: 14, fontWeight: 600,
            cursor: 'pointer', transition: 'background-color 0.2s',
            boxShadow: 'var(--shadow)'
          }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(220, 38, 38, 0.03)'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = '#FFFFFF'}
        >
          Sign out
        </button>
      </div>

      {/* Credit footer */}
      <div style={{
        marginTop: 32,
        textAlign: 'center',
        fontSize: 11,
        color: 'var(--text-tertiary)',
        fontWeight: 500,
      }}>
        Built with ♥ by{' '}
        <a 
          href="https://nworahebuka.nworahsoft.codes" 
          target="_blank" 
          rel="noopener noreferrer"
          style={{ color: 'var(--green)', textDecoration: 'underline', fontWeight: 600 }}
        >
          King Austin
        </a>
      </div>

      <BottomNav />
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 11, fontWeight: 600,
  color: 'var(--text-secondary)', marginBottom: 6,
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px 14px',
  background: '#FFFFFF', border: '1px solid var(--border-mid)',
  borderRadius: 10, color: 'var(--text-primary)', fontSize: 14,
  outline: 'none', transition: 'border-color 0.15s',
}
