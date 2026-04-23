// src/components/StatsBar.tsx
import type { OptimizeResult, Vehicle } from '../types'

interface Props {
  result: OptimizeResult | null
  loading: boolean
  vehicles: Vehicle[]
  mode: 'tsp' | 'vrp'
  onOptimize: () => void
  onModeChange: (m: 'tsp' | 'vrp') => void
}

export function StatsBar({ result, loading, vehicles, mode, onOptimize, onModeChange }: Props) {
  const totalKm = parseFloat(result?.total_km ?? '0')
  const fuelEst = (totalKm * 0.08).toFixed(1)

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

      {/* Mode toggle */}
      <div style={{ display: 'flex', background: 'var(--bg3)', borderRadius: 8, padding: 2, gap: 2 }}>
        {(['tsp', 'vrp'] as const).map(m => (
          <button
            key={m}
            onClick={() => onModeChange(m)}
            style={{
              padding: '4px 14px', borderRadius: 6, border: 'none',
              background: mode === m ? 'var(--accent)' : 'transparent',
              color: mode === m ? '#fff' : 'var(--text2)',
              fontSize: 12, fontWeight: 500, cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {m === 'tsp' ? `1 Shofer` : `${vehicles.length} Shoferë`}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 16, flex: 1 }}>
        <Stat label="Distanca" value={result ? `${result.total_km} km` : '—'} color="var(--accent)" />
        <Stat label="Pika" value={result ? String(result.total_stops) : '—'} />
        <Stat label="Karburant" value={result ? `${fuelEst} L` : '—'} color="var(--green)" />
        <Stat label="Shoferë" value={String(vehicles.length)} />
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
