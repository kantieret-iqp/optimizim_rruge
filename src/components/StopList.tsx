// src/components/StopList.tsx
import type { Stop, RouteStop } from '../types'

interface Props {
  stops: Stop[]
  routeStops: RouteStop[]
  onDelete: (id: number) => void
  onAdd: () => void
}

const VEHICLE_COLORS = ['#3d8ef8', '#22c98a', '#f59e0b', '#ef4444', '#a78bfa']

export function StopList({ stops, routeStops, onDelete, onAdd }: Props) {
  // Build a map of stop_id → route info
  const routeMap = new Map(routeStops.map(r => [r.stop_id, r]))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 11, color: 'var(--text2)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Pikat ({stops.length})
        </span>
        <button onClick={onAdd} style={addBtnStyle}>+ Shto</button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 5 }}>
        {stops.length === 0 && (
          <div style={{ color: 'var(--text3)', fontSize: 12, padding: '20px 0', textAlign: 'center' }}>
            Nuk ka pika dorëzimi.<br />Klikoni "+ Shto" ose hartën.
          </div>
        )}
        {stops.map(stop => {
          const route = routeMap.get(stop.id)
          const vColor = route?.vehicle_id
            ? VEHICLE_COLORS[(route.vehicle_id - 1) % VEHICLE_COLORS.length]
            : 'var(--text3)'

          return (
            <div key={stop.id} style={itemStyle}>
              <div style={{
                width: 26, height: 26, borderRadius: '50%',
                background: route ? vColor : 'var(--bg3)',
                border: `2px solid ${route ? vColor + '40' : 'var(--border)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, fontWeight: 600, color: route ? '#fff' : 'var(--text3)',
                flexShrink: 0,
              }}>
                {route ? route.seq : '—'}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {stop.name}
                  </span>
                  {stop.priority === 1 && <span style={{ fontSize: 10, color: '#f59e0b' }}>⚡</span>}
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 1 }}>
                  {stop.tw_open && (
                    <span style={{ fontSize: 10, color: 'var(--text3)' }}>⏰ {stop.tw_open}–{stop.tw_close}</span>
                  )}
                  {route && (
                    <span style={{ fontSize: 10, color: 'var(--text3)' }}>
                      +{route.dist_from_prev_km.toFixed(1)} km
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={() => onDelete(stop.id)}
                style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: 16, padding: '2px 4px', lineHeight: 1, flexShrink: 0 }}
                title="Fshi pikën"
              >
                ×
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const addBtnStyle: React.CSSProperties = {
  background: 'var(--accent)', color: '#fff', border: 'none',
  borderRadius: 6, padding: '4px 10px', fontSize: 12,
  fontWeight: 500, cursor: 'pointer',
}

const itemStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 10,
  padding: '8px 10px',
  background: 'var(--bg3)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius)',
  transition: 'border-color 0.15s',
  animation: 'fadeIn 0.2s ease',
}
