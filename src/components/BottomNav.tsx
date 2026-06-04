import { useNavigate, useLocation } from 'react-router-dom'

export default function BottomNav() {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const isTabActive = (path: string) => {
    if (path === '/') return pathname === '/'
    return pathname.startsWith(path)
  }

  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
      width: 'min(390px, 100vw)',
      background: '#FFFFFF',
      borderTop: '1px solid var(--border)',
      display: 'flex', 
      padding: '6px 0 12px',
      zIndex: 100,
      alignItems: 'center',
      boxShadow: '0 -4px 16px rgba(0, 0, 0, 0.03)',
      height: '64px',
    }}>
      {/* Home */}
      <button
        onClick={() => navigate('/')}
        style={{
          flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
          color: isTabActive('/') ? 'var(--green)' : 'var(--text-tertiary)',
          fontSize: 10, fontWeight: 500,
          transition: 'color 0.15s',
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill={isTabActive('/') ? 'var(--green-dim)' : 'none'} stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
        <span style={{ marginTop: 2 }}>Home</span>
      </button>

      {/* History */}
      <button
        onClick={() => navigate('/feed')}
        style={{
          flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
          color: isTabActive('/feed') ? 'var(--green)' : 'var(--text-tertiary)',
          fontSize: 10, fontWeight: 500,
          transition: 'color 0.15s',
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
        <span style={{ marginTop: 2 }}>History</span>
      </button>

      {/* Floating Add Button */}
      <div style={{
        flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center',
        position: 'relative', height: '100%',
      }}>
        <button
          onClick={() => navigate('/income/add')}
          style={{
            position: 'absolute',
            top: '-24px',
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: 'var(--green)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(27, 94, 59, 0.3)',
            border: '4px solid #FFFFFF',
            transition: 'transform 0.1s ease',
          }}
          onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
          onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      </div>

      {/* Races */}
      <button
        onClick={() => navigate('/races')}
        style={{
          flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
          color: isTabActive('/races') ? 'var(--green)' : 'var(--text-tertiary)',
          fontSize: 10, fontWeight: 500,
          transition: 'color 0.15s',
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill={isTabActive('/races') ? 'var(--green-dim)' : 'none'} stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
          <line x1="4" y1="22" x2="4" y2="15" />
        </svg>
        <span style={{ marginTop: 2 }}>Races</span>
      </button>

      {/* Settings */}
      <button
        onClick={() => navigate('/settings')}
        style={{
          flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
          color: isTabActive('/settings') ? 'var(--green)' : 'var(--text-tertiary)',
          fontSize: 10, fontWeight: 500,
          transition: 'color 0.15s',
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill={isTabActive('/settings') ? 'var(--green-dim)' : 'none'} stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
        <span style={{ marginTop: 2 }}>Settings</span>
      </button>
    </nav>
  )
}
