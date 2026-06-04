import { useState, useEffect } from 'react'
import { parseDescription, fmt } from '../lib/utils'
import { useAuth } from '../hooks/useAuth'
import { useIncome } from '../hooks/useIncome'
import { useToast } from './Toast'
import type { IncomeRecord } from '../types'

type Props = {
  record: IncomeRecord | null
  onClose: () => void
  onUpdate?: () => void
}

function ScreenshotAttachment({ src, alt }: { src: string; alt: string }) {
  const [error, setError] = useState(false)
  const [isMaximized, setIsMaximized] = useState(false)
  
  if (error) return null

  return (
    <>
      <div 
        onClick={() => setIsMaximized(true)}
        style={{
          width: '100%',
          borderRadius: 'var(--radius-sm)',
          overflow: 'hidden',
          border: '1px solid var(--border-mid)',
          boxShadow: 'var(--shadow)',
          backgroundColor: '#FFFFFF',
          padding: 6,
          cursor: 'zoom-in',
          transition: 'transform 0.2s',
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.01)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
      >
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

      {isMaximized && (
        <div 
          onClick={() => setIsMaximized(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'zoom-out',
            padding: 16,
          }}
        >
          <button
            onClick={(e) => {
              e.stopPropagation()
              setIsMaximized(false)
            }}
            style={{
              position: 'absolute',
              top: 20,
              right: 20,
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.2)',
              color: '#FFFFFF',
              border: 'none',
              fontSize: 18,
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ✕
          </button>
          <img 
            src={src} 
            alt={alt}
            style={{
              maxWidth: '95%',
              maxHeight: '90%',
              objectFit: 'contain',
              borderRadius: 8,
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
            }}
          />
        </div>
      )}
    </>
  )
}

export default function IncomeDetailModal({ record, onClose, onUpdate }: Props) {
  if (!record) return null

  const { userId } = useAuth()
  const { updateRecord, deleteRecord } = useIncome(userId)
  const toast = useToast()

  const isOwner = userId === record.user_id
  const standardSources = ['Salary', 'Freelance', 'Side Hustle', 'Investment', 'Gift']

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

  const isCustomSource = !standardSources.includes(source)

  // Edit states
  const [isEditing, setIsEditing] = useState(false)
  const [editAmount, setEditAmount] = useState(String(record.amount))
  const [editSource, setEditSource] = useState(isCustomSource ? 'Other' : source)
  const [editCustomSource, setEditCustomSource] = useState(isCustomSource ? source : '')
  const [editNote, setEditNote] = useState(note)
  const [editDate, setEditDate] = useState(new Date(record.recorded_at).toISOString().split('T')[0])
  const [busy, setBusy] = useState(false)

  // Reset edit states if record changes
  useEffect(() => {
    if (record) {
      const { text: t } = parseDescription(record.description)
      let s = t
      let n = ''
      if (t.includes(' - ')) {
        const parts = t.split(' - ')
        s = parts[0]
        n = parts.slice(1).join(' - ')
      }
      const isCust = !standardSources.includes(s)

      setEditAmount(String(record.amount))
      setEditSource(isCust ? 'Other' : s)
      setEditCustomSource(isCust ? s : '')
      setEditNote(n)
      setEditDate(new Date(record.recorded_at).toISOString().split('T')[0])
      setIsEditing(false)
    }
  }, [record])

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this income log?')) return
    setBusy(true)
    try {
      await deleteRecord(record.id)
      toast('Income log deleted', 'success')
      if (onUpdate) onUpdate()
      onClose()
    } catch (err: unknown) {
      toast((err as Error).message ?? 'Failed to delete record', 'error')
    } finally {
      setBusy(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    const num = parseFloat(editAmount)
    if (isNaN(num) || num <= 0) {
      toast('Enter a valid amount', 'error')
      return
    }

    setBusy(true)
    try {
      const finalSource = editSource === 'Other' ? (editCustomSource.trim() || 'Other') : editSource
      const finalNote = editNote.trim()
      let recordDescription = finalNote ? `${finalSource} - ${finalNote}` : finalSource

      // Preserve existing images base64 data if present
      if (images.length > 0) {
        recordDescription = `${recordDescription} ||| ${images.join(' | ')}`
      }

      await updateRecord(record.id, num, recordDescription, editDate)
      toast('Income log updated', 'success')
      setIsEditing(false)
      if (onUpdate) onUpdate()
      onClose()
    } catch (err: unknown) {
      toast((err as Error).message ?? 'Failed to update record', 'error')
    } finally {
      setBusy(false)
    }
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
            {isEditing ? 'Edit Income Log' : 'Income Log Details'}
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

        {isEditing ? (
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Amount input */}
            <div>
              <label style={labelStyle}>Amount (₦)</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={editAmount}
                onChange={e => setEditAmount(e.target.value)}
                required
                style={inputStyle}
              />
            </div>

            {/* Date input */}
            <div>
              <label style={labelStyle}>Date</label>
              <input
                type="date"
                value={editDate}
                onChange={e => setEditDate(e.target.value)}
                required
                style={inputStyle}
              />
            </div>

            {/* Source dropdown */}
            <div>
              <label style={labelStyle}>Source</label>
              <select
                value={editSource}
                onChange={e => setEditSource(e.target.value)}
                style={inputStyle}
              >
                <option value="Salary">Salary</option>
                <option value="Freelance">Freelance</option>
                <option value="Side Hustle">Side Hustle</option>
                <option value="Investment">Investment</option>
                <option value="Gift">Gift</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Custom Source specify */}
            {editSource === 'Other' && (
              <div>
                <label style={labelStyle}>Specify Source</label>
                <input
                  type="text"
                  value={editCustomSource}
                  onChange={e => setEditCustomSource(e.target.value)}
                  placeholder="e.g. Consulting"
                  required
                  style={inputStyle}
                />
              </div>
            )}

            {/* Note Input */}
            <div>
              <label style={labelStyle}>Note (optional)</label>
              <input
                type="text"
                value={editNote}
                onChange={e => setEditNote(e.target.value)}
                placeholder="e.g. bonus payment…"
                style={inputStyle}
              />
            </div>

            {/* Form Actions (Save & Cancel) */}
            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                disabled={busy}
                style={{
                  flex: 1,
                  padding: '12px 0',
                  background: '#FFFFFF',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'center',
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy}
                style={{
                  flex: 1,
                  padding: '12px 0',
                  background: 'var(--green)',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: 12,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(27, 94, 59, 0.15)',
                  textAlign: 'center',
                }}
              >
                {busy ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </form>
        ) : (
          <>
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

            {/* Owner Actions */}
            {isOwner && (
              <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
                <button
                  onClick={() => setIsEditing(true)}
                  disabled={busy}
                  style={{
                    flex: 1,
                    padding: '12px 0',
                    background: '#FFFFFF',
                    color: 'var(--green)',
                    border: '1px solid var(--green)',
                    borderRadius: 12,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: 'var(--shadow)',
                    textAlign: 'center',
                  }}
                >
                  ✏️ Edit Log
                </button>
                <button
                  onClick={handleDelete}
                  disabled={busy}
                  style={{
                    flex: 1,
                    padding: '12px 0',
                    background: '#FFF5F5',
                    color: '#E53E3E',
                    border: '1px solid #FED7D7',
                    borderRadius: 12,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: 'var(--shadow)',
                    textAlign: 'center',
                  }}
                >
                  🗑️ Delete Log
                </button>
              </div>
            )}
          </>
        )}

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
