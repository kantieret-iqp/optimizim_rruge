// src/components/StopForm.tsx
import { useState } from 'react'
import type { Stop } from '../types'

interface Props {
  initialLat?: number
  initialLng?: number
  onSave: (stop: Omit<Stop, 'id' | 'created_at' | 'active'>) => Promise<void>
  onCancel: () => void
}

export function StopForm({ initialLat, initialLng, onSave, onCancel }: Props) {
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [lat, setLat] = useState(String(initialLat ?? ''))
  const [lng, setLng] = useState(String(initialLng ?? ''))
  const [demand, setDemand] = useState('1')
  const [twOpen, setTwOpen] = useState('')
  const [twClose, setTwClose] = useState('')
  const [priority, setPriority] = useState('0')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) { setErr('Emri është i detyrueshëm'); return }
    if (!lat || !lng) { setErr('Koordinatat janë të detyrueshme'); return }
    setSaving(true)
    try {
      await onSave({
        name: name.trim(),
        address: address || null,
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        demand: parseInt(demand),
        tw_open: twOpen || null,
        tw_close: twClose || null,
        service_sec: 300,
        priority: parseInt(priority),
        notes: notes || null,
      })
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Gabim gjatë ruajtjes')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{display:'flex',flexDirection:'column',gap:12}}>
      <div style={fieldStyle}>
        <label style={labelStyle}>Emri i klientit *</label>
        <input style={inputStyle} value={name} onChange={e=>setName(e.target.value)} placeholder="p.sh. Klienti ABC" />
      </div>
      <div style={fieldStyle}>
        <label style={labelStyle}>Adresa</label>
        <input style={inputStyle} value={address} onChange={e=>setAddress(e.target.value)} placeholder="Rruga, Qyteti" />
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
        <div style={fieldStyle}>
          <label style={labelStyle}>Latitude *</label>
          <input style={inputStyle} type="number" step="any" value={lat} onChange={e=>setLat(e.target.value)} placeholder="41.3275" />
        </div>
        <div style={fieldStyle}>
          <label style={labelStyle}>Longitude *</label>
          <input style={inputStyle} type="number" step="any" value={lng} onChange={e=>setLng(e.target.value)} placeholder="19.8187" />
        </div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10}}>
        <div style={fieldStyle}>
          <label style={labelStyle}>Kërkesa (njësi)</label>
          <input style={inputStyle} type="number" min="1" value={demand} onChange={e=>setDemand(e.target.value)} />
        </div>
        <div style={fieldStyle}>
          <label style={labelStyle}>Hap (ora)</label>
          <input style={inputStyle} type="time" value={twOpen} onChange={e=>setTwOpen(e.target.value)} />
        </div>
        <div style={fieldStyle}>
          <label style={labelStyle}>Mbyll (ora)</label>
          <input style={inputStyle} type="time" value={twClose} onChange={e=>setTwClose(e.target.value)} />
        </div>
      </div>
      <div style={fieldStyle}>
        <label style={labelStyle}>Prioritet</label>
        <select style={inputStyle} value={priority} onChange={e=>setPriority(e.target.value)}>
          <option value="0">Normal</option>
          <option value="1">⚡ Urgjent</option>
        </select>
      </div>
      <div style={fieldStyle}>
        <label style={labelStyle}>Shënime</label>
        <textarea style={{...inputStyle,height:60,resize:'vertical'}} value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Instruksione shtesë..." />
      </div>
      {err && <div style={{color:'var(--red)',fontSize:12}}>{err}</div>}
      <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
        <button type="button" onClick={onCancel} style={btnSecStyle}>Anulo</button>
        <button type="submit" disabled={saving} style={btnPrimStyle}>
          {saving ? 'Duke ruajtur...' : 'Ruaj pikën'}
        </button>
      </div>
    </form>
  )
}

const fieldStyle: React.CSSProperties = { display:'flex', flexDirection:'column', gap:4 }
const labelStyle: React.CSSProperties = { fontSize:11, color:'var(--text2)', fontWeight:500, textTransform:'uppercase', letterSpacing:'0.04em' }
const inputStyle: React.CSSProperties = {
  background:'var(--bg)', border:'1px solid var(--border2)', borderRadius:'var(--radius)',
  color:'var(--text)', padding:'8px 12px', fontSize:14, fontFamily:'var(--font)',
  outline:'none', width:'100%',
}
const btnPrimStyle: React.CSSProperties = {
  background:'var(--accent)', color:'#fff', border:'none', borderRadius:'var(--radius)',
  padding:'9px 20px', fontSize:13, fontWeight:500, cursor:'pointer',
}
const btnSecStyle: React.CSSProperties = {
  background:'var(--bg3)', color:'var(--text2)', border:'1px solid var(--border)',
  borderRadius:'var(--radius)', padding:'9px 16px', fontSize:13, cursor:'pointer',
}
