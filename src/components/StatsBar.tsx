// src/components/StatsBar.tsx
import type { OptimizeResult } from '../types'

interface Props {
  result: OptimizeResult | null
  loading: boolean
  maxVehicles: number
  vehicleCount: number
  onOptimize: () => void
  onVehicleCountChange: (n: number) => void
  onLogout: () => void
  isMobile?: boolean
}

export function StatsBar({ result, loading, maxVehicles, vehicleCount, onOptimize, onVehicleCountChange, onLogout, isMobile }: Props) {
  const totalKm = parseFloat(result?.total_km ?? '0')
  const fuelEst = (totalKm * 0.08).toFixed(1)
  const counts = Array.from({ length: maxVehicles }, (_, i) => i + 1)

  if (isMobile) {
    return (
      <div style={{
        background: 'var(--bg2)',
        borderBottom: '1px solid var(--border)',
        padding: '8px 12px',
      }}>
        {/* Row 1: logo + stats + optimize */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <div style={{
            width: 24, height: 24, borderRadius: 6,
            background: 'var(--accent)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', fontSize: 12, flexShrink: 0,
          }}>🚚</div>
          <div style={{ display: 'flex', gap: 12, flex: 1 }}>
            <Stat label="Km" value={result ? result.total_km : '—'} color="var(--accent)" />
            <Stat label="Pika" value={result ? String(result.total_stops) : '—'} />
            <Stat label="Karburant" value={result ? `${fuelEst}L` : '—'} color="var(--green)" />
          </div>
          <button
            onClick={onOptimize}
            disabled={loading}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              background: loading ? 'var(--bg3)' : 'var(--accent)',
              color: loading ? 'var(--text3)' : '#fff',
              border: 'none', borderRadius: 8,
              padding: '7px 14px', fontSize: 12, fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              flexShrink: 0,
            }}
          >
            {loading ? (
              <span style={{ display: 'inline-block', width: 12, height: 12, border: '2px solid var(--text3)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            ) : '▶ Optimizo'}
          </button>
        </div>
        {/* Row 2: vehicle selector + logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.05em', flexShrink: 0 }}>Shoferë:</span>
          <div style={{ display: 'flex', background: 'var(--bg3)', borderRadius: 8, padding: 2, gap: 2 }}>
            {counts.map(n => (
              <button
                key={n}
                onClick={() => onVehicleCountChange(n)}
                style={{
                  width: 32, height: 28, borderRadius: 6, border: 'none',
                  background: vehicleCount === n ? 'var(--accent)' : 'transparent',
                  color: vehicleCount === n ? '#fff' : 'var(--text2)',
                  fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {n}
              </button>
            ))}
          </div>
          <button
            onClick={onLogout}
            title="Dil"
            style={{
              marginLeft: 'auto', background: 'transparent', border: '1px solid var(--border2)',
              borderRadius: 7, padding: '4px 10px', fontSize: 11, color: 'var(--text3)',
              cursor: 'pointer',
            }}
          >
            Dil
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '10px 16px',
      background: 'var(--bg2)',
      borderBottom: '1px solid var(--border)',
      flexWrap: 'wrap',
    }}>
      {/* Logo / Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginRight: 8 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 8,
          background: 'var(--accent)', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          fontSize: 14,
        }}>🚚</div>
        <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>DeliveryRoute</span>
      </div>

      {/* Vehicle count selector */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ fontSize: 9, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Shoferë</span>
        <div style={{ display: 'flex', background: 'var(--bg3)', borderRadius: 8, padding: 2, gap: 2 }}>
          {counts.map(n => (
            <button
              key={n}
              onClick={() => onVehicleCountChange(n)}
              style={{
                width: 28, height: 24, borderRadius: 6, border: 'none',
                background: vehicleCount === n ? 'var(--accent)' : 'transparent',
                color: vehicleCount === n ? '#fff' : 'var(--text2)',
                fontSize: 12, fontWeight: 600, cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 16, flex: 1 }}>
        <Stat label="Distanca" value={result ? `${result.total_km} km` : '—'} color="var(--accent)" />
        <Stat label="Pika" value={result ? String(result.total_stops) : '—'} />
        <Stat label="Karburant" value={result ? `${fuelEst} L` : '—'} color="var(--green)" />
        <Stat label="Shoferë" value={String(vehicleCount)} />
      </div>

      {/* Optimize button */}
      <button
        onClick={onOptimize}
        disabled={loading}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: loading ? 'var(--bg3)' : 'var(--accent)',
          color: loading ? 'var(--text3)' : '#fff',
          border: 'none', borderRadius: 8,
          padding: '8px 18px', fontSize: 13, fontWeight: 500,
          cursor: loading ? 'not-allowed' : 'pointer',
          transition: 'all 0.15s',
        }}
      >
        {loading ? (
          <>
            <span style={{ display: 'inline-block', width: 12, height: 12, border: '2px solid var(--text3)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            Duke llogaritur...
          </>
        ) : '▶ Optimizo rrugën'}
      </button>

      {/* Logout button */}
      <button
        onClick={onLogout}
        title="Dil nga aplikimi"
        style={{
          background: 'transparent',
          border: '1px solid var(--border2)',
          borderRadius: 8,
          padding: '7px 12px',
          fontSize: 12,
          color: 'var(--text3)',
          cursor: 'pointer',
          transition: 'all 0.15s',
          flexShrink: 0,
        }}
        onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--red)'; e.currentTarget.style.color = 'var(--red)' }}
        onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border2)'; e.currentTarget.style.color = 'var(--text3)' }}
      >
        Dil
      </button>
    </div>
  )
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: 600, color: color ?? 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>{value}</div>
    </div>
  )
}
