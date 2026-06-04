type Props = {
  url?: string | null
  name?: string
  size?: number
}

export default function Avatar({ url, name = '?', size = 36 }: Props) {
  const initial = name.charAt(0).toUpperCase()
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: url ? 'transparent' : '#EAE6DF',
      border: '1px solid var(--border)',
      overflow: 'hidden', flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.4, color: 'var(--text-secondary)',
      fontWeight: 600,
      fontFamily: 'var(--font-mono)',
    }}>
      {url ? <img src={url} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initial}
    </div>
  )
}
