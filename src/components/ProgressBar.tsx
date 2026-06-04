type Props = {
  value: number   // 0–1
  color?: string
  height?: number
}

export default function ProgressBar({ value, color = 'var(--green)', height = 4 }: Props) {
  const pct = Math.min(100, Math.max(0, value * 100))
  return (
    <div style={{ width: '100%', height, background: '#EAE6DF', borderRadius: height / 2, overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: height / 2, transition: 'width 0.4s ease' }} />
    </div>
  )
}
