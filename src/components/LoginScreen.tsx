// src/components/LoginScreen.tsx
import { useState, useRef, useEffect } from 'react'

const PASSWORD = 'optimizim2026'
const STORAGE_KEY = 'vrp_auth'

export function useAuth() {
  const [authed, setAuthed] = useState(() => localStorage.getItem(STORAGE_KEY) === '1')

  const login = (pw: string) => {
    if (pw === PASSWORD) {
      localStorage.setItem(STORAGE_KEY, '1')
      setAuthed(true)
      return true
    }
    return false
  }

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY)
    setAuthed(false)
  }

  return { authed, login, logout }
}

export function LoginScreen({ onLogin }: { onLogin: (pw: string) => boolean }) {
  const [value, setValue] = useState('')
  const [error, setError] = useState(false)
  const [shake, setShake] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  const submit = () => {
    const ok = onLogin(value)
    if (!ok) {
      setError(true)
      setShake(true)
      setValue('')
      setTimeout(() => setShake(false), 500)
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg)',
    }}>
      <div style={{
        background: 'var(--bg2)',
        border: '1px solid var(--border2)',
        borderRadius: 18,
        padding: '40px 36px',
        width: '100%',
        maxWidth: 360,
        boxShadow: 'var(--shadow)',
        animation: shake ? 'shake 0.4s ease' : undefined,
      }}>
        {/* Icon */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: 'var(--bg3)',
            border: '1px solid var(--border2)',
            fontSize: 26,
            marginBottom: 14,
          }}>
            🔐
          </div>
          <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>
            VRP Delivery
          </div>
          <div style={{ fontSize: 12, color: 'var(--text3)' }}>
            Fut passwordin për të vazhduar
          </div>
        </div>

        {/* Input */}
        <div style={{ marginBottom: 14 }}>
          <input
            ref={inputRef}
            type="password"
            value={value}
            onChange={e => { setValue(e.target.value); setError(false) }}
            onKeyDown={e => e.key === 'Enter' && submit()}
            placeholder="Password"
            style={{
              width: '100%',
              padding: '10px 14px',
              background: 'var(--bg3)',
              border: `1px solid ${error ? 'var(--red)' : 'var(--border2)'}`,
              borderRadius: 10,
              color: 'var(--text)',
              fontSize: 14,
              outline: 'none',
              fontFamily: 'var(--mono)',
              letterSpacing: '0.1em',
              transition: 'border-color 0.2s',
            }}
          />
          {error && (
            <div style={{ fontSize: 12, color: 'var(--red)', marginTop: 6 }}>
              Password i gabuar. Provo përsëri.
            </div>
          )}
        </div>

        {/* Button */}
        <button
          onClick={submit}
          style={{
            width: '100%',
            padding: '11px 0',
            background: 'var(--accent)',
            color: '#fff',
            border: 'none',
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'background 0.15s',
          }}
          onMouseOver={e => (e.currentTarget.style.background = 'var(--accent2)')}
          onMouseOut={e => (e.currentTarget.style.background = 'var(--accent)')}
        >
          Hyr →
        </button>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%       { transform: translateX(-8px); }
          40%       { transform: translateX(8px); }
          60%       { transform: translateX(-6px); }
          80%       { transform: translateX(6px); }
        }
      `}</style>
    </div>
  )
}
