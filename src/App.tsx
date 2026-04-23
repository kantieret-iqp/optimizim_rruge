// src/App.tsx
import { useState } from 'react'
import { DeliveryMap } from './components/DeliveryMap'
import { StopList } from './components/StopList'
import { StopForm } from './components/StopForm'
import { StatsBar } from './components/StatsBar'
import { Modal } from './components/Modal'
import { useRouteOptimizer } from './hooks/useRouteOptimizer'
import { useStops } from './hooks/useStops'
import { useVehicles } from './hooks/useVehicles'
import type { RouteMode } from './types'

// Depot default — Tiranë qendër
const DEPOT_LAT = 41.3275
const DEPOT_LNG = 19.8187

export default function App() {
  const [mode, setMode] = useState<RouteMode>('tsp')
  const [showForm, setShowForm] = useState(false)
  const [clickedCoords, setClickedCoords] = useState<{ lat: number; lng: number } | null>(null)

  const { stops, loading: stopsLoading, addStop, deleteStop } = useStops()
  const { vehicles } = useVehicles()
  const { result, loading: routeLoading, optimize } = useRouteOptimizer({ mode })

  const handleMapClick = (lat: number, lng: number) => {
    setClickedCoords({ lat, lng })
    setShowForm(true)
  }

  const handleAddStop = async (stopData: Parameters<typeof addStop>[0]) => {
    await addStop(stopData)
    setShowForm(false)
    setClickedCoords(null)
  }

  const routeStops = result?.raw ?? []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      {/* Top bar */}
      <StatsBar
        result={result}
        loading={routeLoading}
        vehicles={vehicles}
        mode={mode}
        onOptimize={optimize}
        onModeChange={setMode}
      />

      {/* Main layout */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Sidebar */}
        <div style={{
          width: 280, flexShrink: 0,
          background: 'var(--bg2)',
          borderRight: '1px solid var(--border)',
          padding: '14px 12px',
          overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
        }}>
          {stopsLoading ? (
            <div style={{ color: 'var(--text3)', fontSize: 12 }}>Duke ngarkuar...</div>
          ) : (
            <StopList
              stops={stops}
              routeStops={routeStops}
              onDelete={deleteStop}
              onAdd={() => setShowForm(true)}
            />
          )}

          {/* Vehicle legend for VRP */}
          {mode === 'vrp' && vehicles.length > 0 && (
            <div style={{
              marginTop: 'auto', paddingTop: 12,
              borderTop: '1px solid var(--border)',
            }}>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Automjetet</div>
              {vehicles.map((v, i) => {
                const colors = ['#3d8ef8', '#22c98a', '#f59e0b', '#ef4444', '#a78bfa']
                return (
                  <div key={v.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: colors[i % colors.length], flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: 'var(--text2)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.name}</span>
                    <span style={{ fontSize: 11, color: 'var(--text3)' }}>{v.capacity}u</span>
                  </div>
                )
              })}
            </div>
          )}

          {/* Realtime indicator */}
          <div style={{
            marginTop: 10, display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 8px', background: 'var(--bg3)',
            borderRadius: 6, border: '1px solid var(--border)',
          }}>
            <div style={{
              width: 6, height: 6, borderRadius: '50%',
              background: 'var(--green)',
              animation: 'pulse 2s ease-in-out infinite',
            }} />
            <span style={{ fontSize: 10, color: 'var(--text3)' }}>Realtime aktiv — azhurnohet automatikisht</span>
          </div>
        </div>

        {/* Map */}
        <div style={{ flex: 1, padding: 12 }}>
          <DeliveryMap
            stops={stops}
            routeStops={routeStops}
            depotLat={DEPOT_LAT}
            depotLng={DEPOT_LNG}
            onMapClick={handleMapClick}
          />
        </div>
      </div>

      {/* Add Stop Modal */}
      {showForm && (
        <Modal title="Shto pikë dorëzimi" onClose={() => { setShowForm(false); setClickedCoords(null) }}>
          <StopForm
            initialLat={clickedCoords?.lat}
            initialLng={clickedCoords?.lng}
            onSave={handleAddStop}
            onCancel={() => { setShowForm(false); setClickedCoords(null) }}
          />
        </Modal>
      )}
    </div>
  )
}
