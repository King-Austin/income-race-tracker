import { useNavigate } from 'react-router-dom'

type Props = {
  title: string
  subtitle?: string
  back?: boolean | string
  action?: React.ReactNode
}

export default function ScreenHeader({ title, subtitle, back, action }: Props) {
  const navigate = useNavigate()

  const handleBack = () => {
    if (typeof back === 'string') navigate(back)
    else navigate(-1)
  }

  return (
    <header style={{
      display: 'flex', flexDirection: 'column',
      padding: '48px 20px 12px',
      gap: 4
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%' }}>
        {back !== undefined && (
          <button onClick={handleBack} style={{ color: 'var(--green)', fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 4 }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
          </button>
        )}
        <h1 style={{ 
          flex: 1, 
          fontFamily: 'var(--font-serif)', 
          fontSize: 22, 
          fontWeight: 700, 
          color: 'var(--green)', 
          letterSpacing: '-0.5px' 
        }}>
          {title}
        </h1>
        {action}
      </div>
      {subtitle && (
        <p style={{
          fontSize: 13,
          color: 'var(--text-secondary)',
          fontWeight: 500,
          paddingLeft: back !== undefined ? 32 : 0
        }}>
          {subtitle}
        </p>
      )}
    </header>
  )
}
