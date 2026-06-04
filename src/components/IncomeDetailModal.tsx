import { useState } from 'react'
import { parseDescription, fmt } from '../lib/utils'

type Props = {
  record: {
    amount: number
    description: string | null
    recorded_at: string
  } | null
  onClose: () => void
}

function ScreenshotAttachment({ src, alt }: { src: string; alt: string }) {
  const [error, setError] = useState(false)
  
  if (error) return null

  return (
    <div style={{
      width: '100%',
      borderRadius: 'var(--radius-sm)',
      overflow: 'hidden',
      border: '1px solid var(--border-mid)',
      boxShadow: 'var(--shadow)',
      backgroundColor: '#FFFFFF',
      padding: 6
    }}>
      <img 
        src={src} 
        alt={alt}
        onError={() => setError(true)}
        style={{
          width: '100%',
          height: 'auto',
          maxHeight: 280,
          objectFit: 'contain',
          borderRadius: 6,
          display: 'block'
        }}
      />
    </div>
  )
}

export default function IncomeDetailModal({ record, onClose }: Props) {
  if (!record) return null

  const { text, images } = parseDescription(record.description)
  
  // Format Date nicely
  const dateObj = new Date(record.recorded_at)
  const formattedDate = dateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })

  // Separate source and note if it has " - "
  let source = text
  let note = ''
  if (text.includes(' - ')) {
    const parts = text.split(' - ')
    source = parts[0]
    note = parts.slice(1).join(' - ')
  }

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(26, 26, 23, 0.4)',
      backdropFilter: 'blur(4px)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'center',
    }}>
      {/* Click outside to close */}
      <div 
        onClick={onClose} 
        style={{ position: 'absolute', width: '100%', height: '100%', cursor: 'pointer' }} 
      />

      {/* Modal Drawer Sheet */}
      <div style={{
        position: 'relative',
        width: '100%',
        maxHeight: '85%',
        backgroundColor: '#F5F1EB',
        borderTopLeftRadius: 'var(--radius)',
        borderTopRightRadius: 'var(--radius)',
        boxShadow: '0 -8px 32px rgba(0, 0, 0, 0.12)',
        padding: '24px 20px 40px',
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
        overflowY: 'auto',
        zIndex: 1001,
      }}>
        {/* Drag handle pill */}
        <div style={{
          width: 40,
          height: 5,
          backgroundColor: 'var(--border-high)',
          borderRadius: 3,
          alignSelf: 'center',
          marginBottom: -4,
        }} onClick={onClose} />

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--green)', letterSpacing: '-0.3px' }}>
            Income Log Details
          </h2>
          <button 
            onClick={onClose}
            style={{
              width: 28, height: 28, borderRadius: '50%',
              backgroundColor: '#FFFFFF', border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 'bold', color: 'var(--text-secondary)',
              cursor: 'pointer', boxShadow: 'var(--shadow)'
            }}
          >
            ✕
          </button>
        </div>

        {/* Amount Section */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 'var(--radius-sm)',
          padding: '20px',
          textAlign: 'center',
          boxShadow: 'var(--shadow)',
          border: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          gap: 4
        }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Amount Credited
          </span>
          <p style={{ fontSize: 32, fontWeight: 800, color: 'var(--green)', letterSpacing: '-1px' }}>
            {fmt(record.amount)}
          </p>
        </div>

        {/* Info Grid Card */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 'var(--radius-sm)',
          padding: '16px 20px',
          boxShadow: 'var(--shadow)',
          border: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          gap: 14
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Source</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{source}</span>
          </div>

          {note && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Note</span>
              <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>{note}</span>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Timestamp</span>
            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>{formattedDate}</span>
          </div>
        </div>

        {/* Screenshots Section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <h3 style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Attached Screenshots ({images.length})
          </h3>
          
          {images.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {images.map((img, idx) => (
                <ScreenshotAttachment 
                  key={idx}
                  src={img}
                  alt={`Screenshot attachment ${idx + 1}`}
                />
              ))}
            </div>
          ) : (
            <div style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 'var(--radius-sm)',
              padding: '24px 16px',
              textAlign: 'center',
              color: 'var(--text-tertiary)',
              fontSize: 13,
              fontWeight: 500,
              border: '1px dashed var(--border)',
            }}>
              No payment screenshots attached to this log.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
