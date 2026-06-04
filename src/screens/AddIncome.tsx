import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useIncome } from '../hooks/useIncome'
import { useToast } from '../components/Toast'
import ScreenHeader from '../components/ScreenHeader'
import BottomNav from '../components/BottomNav'

export default function AddIncome() {
  const navigate = useNavigate()
  const { userId } = useAuth()
  const { addRecord } = useIncome(userId)
  const toast = useToast()
  
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState('NGN')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [source, setSource] = useState('Salary')
  const [customSource, setCustomSource] = useState('')
  const [description, setDescription] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [busy, setBusy] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Retrieve exchange rate from localStorage (default 1500)
  const exchangeRate = parseFloat(localStorage.getItem('exchangeRate') || '1500')

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    if (!selectedFiles.length) return

    const MAX_SIZE = 5 * 1024 * 1024 // 5MB
    const newFiles = [...files]

    for (const f of selectedFiles) {
      if (!f.type.startsWith('image/')) {
        toast(`File "${f.name}" is not an image`, 'error')
        continue
      }
      if (f.size > MAX_SIZE) {
        toast(`File "${f.name}" exceeds the 5MB size limit`, 'error')
        continue
      }
      if (newFiles.length >= 2) {
        toast('Maximum of 2 screenshots allowed', 'error')
        break
      }
      newFiles.push(f)
    }

    setFiles(newFiles)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const removeFile = (indexToRemove: number) => {
    setFiles(prev => prev.filter((_, idx) => idx !== indexToRemove))
  }

  const readFileAsDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = (e) => reject(e)
      reader.readAsDataURL(file)
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    let num = parseFloat(amount)
    if (isNaN(num) || num <= 0) {
      toast('Enter a valid amount', 'error')
      return
    }
    
    // If USD, convert to NGN
    if (currency === 'USD') {
      num = num * exchangeRate
    }
    
    setBusy(true)
    try {
      // Read images as base64 Data URLs
      const fileDataUrls: string[] = []
      for (const f of files) {
        const dataUrl = await readFileAsDataURL(f)
        fileDataUrls.push(dataUrl)
      }

      const finalSource = source === 'Other' ? (customSource.trim() || 'Other') : source
      const finalNote = description.trim()
      let recordDescription = finalNote ? `${finalSource} - ${finalNote}` : finalSource
      
      if (fileDataUrls.length > 0) {
        recordDescription = `${recordDescription} ||| ${fileDataUrls.join(' | ')}`
      }
      
      await addRecord(num, recordDescription, date)
      toast('Income logged successfully!', 'success')
      navigate('/')
    } catch (err: unknown) {
      toast((err as Error).message, 'error')
    } finally {
      setBusy(false)
    }
  }

  const convertedValue = currency === 'USD' && amount ? parseFloat(amount) * exchangeRate : null

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-page)', height: '100%', overflowY: 'auto', paddingBottom: 100 }}>
      <ScreenHeader title="Log Income" back="/" />

      <form onSubmit={handleSubmit} style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 18 }}>
        {/* Amount & Currency side-by-side */}
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 2 }}>
            <label style={labelStyle}>Amount</label>
            <div style={{ position: 'relative' }}>
              <span style={{
                position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                color: 'var(--text-secondary)', fontSize: 16, fontWeight: 600
              }}>
                {currency === 'USD' ? '$' : '₦'}
              </span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0.00"
                required
                autoFocus
                style={{
                  width: '100%', padding: '12px 14px 12px 30px',
                  background: '#FFFFFF', border: '1px solid var(--border-mid)',
                  borderRadius: 12, color: 'var(--text-primary)', fontSize: 16,
                  fontWeight: 500, outline: 'none'
                }}
              />
            </div>
          </div>
          <div style={{ flex: 1.2 }}>
            <label style={labelStyle}>Currency</label>
            <select
              value={currency}
              onChange={e => setCurrency(e.target.value)}
              style={{
                width: '100%', padding: '12px 14px',
                background: '#FFFFFF', border: '1px solid var(--border-mid)',
                borderRadius: 12, color: 'var(--text-primary)', fontSize: 14,
                fontWeight: 500, outline: 'none', height: '46px'
              }}
            >
              <option value="NGN">NGN (₦)</option>
              <option value="USD">USD ($)</option>
            </select>
          </div>
        </div>

        {/* Dynamic conversion notice */}
        {convertedValue !== null && !isNaN(convertedValue) && (
          <div style={{
            fontSize: 12, color: 'var(--green)', marginTop: -8, fontWeight: 500,
            background: 'var(--green-dim)', padding: '8px 12px', borderRadius: 8
          }}>
            = ₦{convertedValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (at ₦{exchangeRate}/$)
          </div>
        )}

        {/* Date picker */}
        <div>
          <label style={labelStyle}>Date</label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            required
            style={{
              width: '100%', padding: '12px 14px',
              background: '#FFFFFF', border: '1px solid var(--border-mid)',
              borderRadius: 12, color: 'var(--text-primary)', fontSize: 14,
              outline: 'none'
            }}
          />
        </div>

        {/* Source Dropdown */}
        <div>
          <label style={labelStyle}>Source</label>
          <select
            value={source}
            onChange={e => setSource(e.target.value)}
            style={{
              width: '100%', padding: '12px 14px',
              background: '#FFFFFF', border: '1px solid var(--border-mid)',
              borderRadius: 12, color: 'var(--text-primary)', fontSize: 14,
              outline: 'none'
            }}
          >
            <option value="Salary">Salary</option>
            <option value="Freelance">Freelance</option>
            <option value="Side Hustle">Side Hustle</option>
            <option value="Investment">Investment</option>
            <option value="Gift">Gift</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {/* Custom Source Input */}
        {source === 'Other' && (
          <div>
            <label style={labelStyle}>Specify Source</label>
            <input
              type="text"
              value={customSource}
              onChange={e => setCustomSource(e.target.value)}
              placeholder="e.g. Consulting, Selling old gear"
              required
              style={{
                width: '100%', padding: '12px 14px',
                background: '#FFFFFF', border: '1px solid var(--border-mid)',
                borderRadius: 12, color: 'var(--text-primary)', fontSize: 14,
                outline: 'none'
              }}
            />
          </div>
        )}

        {/* Note / Description */}
        <div>
          <label style={labelStyle}>Note (optional)</label>
          <input
            type="text"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="e.g. Invoice #203, bonus payment…"
            style={{
              width: '100%', padding: '12px 14px',
              background: '#FFFFFF', border: '1px solid var(--border-mid)',
              borderRadius: 12, color: 'var(--text-primary)', fontSize: 14,
              outline: 'none'
            }}
          />
        </div>

        {/* Screenshot Upload zone */}
        <div>
          <label style={labelStyle}>Payment Screenshots (Max 2, 5MB limit)</label>
          
          {/* List of uploaded files */}
          {files.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
              {files.map((f, idx) => (
                <div key={idx} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 14px', background: '#FFFFFF', border: '1px solid var(--border-mid)',
                  borderRadius: 12, boxShadow: 'var(--shadow)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {f.name}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--text-tertiary)', flexShrink: 0 }}>
                      ({(f.size / (1024 * 1024)).toFixed(2)} MB)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile(idx)}
                    style={{
                      color: '#DC2626', background: 'none', border: 'none', cursor: 'pointer',
                      fontSize: 14, fontWeight: 700, padding: 4, display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Upload Dropzone */}
          {files.length < 2 ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: '2px dashed var(--border-high)',
                borderRadius: 12,
                padding: '20px 16px',
                textAlign: 'center',
                cursor: 'pointer',
                backgroundColor: '#FFFFFF',
                transition: 'background-color 0.2s',
              }}
            >
              <div>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 6 }}>
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>
                  Click to upload screenshot {files.length === 1 ? '(2nd)' : ''}
                </p>
                <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 }}>PNG, JPG up to 5MB</p>
              </div>
            </div>
          ) : (
            <div style={{
              padding: '14px', background: 'var(--green-dim)', border: '1px solid rgba(27,94,59,0.15)',
              borderRadius: 12, textAlign: 'center', fontSize: 12, color: 'var(--green)', fontWeight: 600
            }}>
              ✓ Maximum screenshot limit of 2 files reached.
            </div>
          )}
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
        </div>

        {/* Save button */}
        <button
          type="submit"
          disabled={busy}
          style={{
            width: '100%', padding: '14px 0',
            background: 'var(--green)', color: '#FFFFFF',
            borderRadius: 12, fontSize: 14, fontWeight: 600,
            opacity: busy ? 0.6 : 1,
            boxShadow: '0 4px 12px rgba(27, 94, 59, 0.15)',
            marginTop: 10
          }}
        >
          {busy ? 'Saving…' : 'Save income'}
        </button>
      </form>

      <BottomNav />
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 12, fontWeight: 600,
  color: 'var(--text-secondary)', marginBottom: 8,
}
