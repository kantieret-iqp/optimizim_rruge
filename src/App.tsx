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
import { useDepot } from './hooks/useDepot'
import { useIsMobile } from './hooks/useIsMobile'

export default function App() {
  const [vehicleCount, setVehicleCount] = useState(1)
  const [showForm, setShowForm] = useState(false)
  const [showPanel, setShowPanel] = useState(false)
  const [clickedCoords, setClickedCoords] = useState<{ lat: number; lng: number } | null>(null)

  const isMobile = useIsMobile()
  const { depot, moveDepot } = useDepot()
  const { stops, loading: stopsLoading, addStop, deleteStop } = useStops()
  const { vehicles } = useVehicles()
  const { result, loading: routeLoading, optimize } = useRouteOptimizer({ vehicleCount })

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
  const COLORS = ['#3d8ef8', '#22c98a', '#f59e0b', '#ef4444', '#a78bfa', '#6366f1']

  const vehicleLegend = vehicleCount > 1 && vehicles.length > 0 && (
    <div style={{ paddingTop: 12, borderTop: '1px solid var(--border)' }}>
      <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Automjetet</div>
      {vehicles.slice(0, vehicleCount).map((v, i) => (
        <div key={v.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: COLORS[i % COLORS.length], flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: 'var(--text2)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.name}</span>
          <span style={{ fontSize: 11, color: 'var(--text3)' }}>{v.capacity}u</span>
        </div>
      ))}
    </div>
  )

  const realtimeIndicator = (
    <div style={{
      marginTop: 10, display: 'flex', alignItems: 'center', gap: 6,
      padding: '6px 8px', background: 'var(--bg3)',
      borderRadius: 6, border: '1px solid var(--border)',
    }}>
      <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', animation: 'pulse 2s ease-in-out infinite' }} />
      <span style={{ fontSize: 10, color: 'var(--text3)' }}>Realtime aktiv — azhurnohet automatikisht</span>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <StatsBar
        result={result}
        loading={routeLoading}
        maxVehicles={vehicles.length || 6}
        vehicleCount={vehicleCount}
        onOptimize={optimize}
        onVehicleCountChange={setVehicleCount}
        isMobile={isMobile}
      />

      {/* Main layout */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>

        {/* Sidebar — desktop only */}
        {!isMobile && (
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
              <StopList stops={stops} routeStops={routeStops} onDelete={deleteStop} onAdd={() => setShowForm(true)} />
            )}
            <div style={{ marginTop: 'auto' }}>
              {vehicleLegend}
              {realtimeIndicator}
            </div>
          </div>
        )}

        {/* Map */}
        <div style={{ flex: 1, padding: isMobile ? 0 : 12 }}>
          <DeliveryMap
            stops={stops}
            routeStops={routeStops}
            routeLines={result?.route_lines}
            depotLat={depot.lat}
            depotLng={depot.lng}
            onMapClick={handleMapClick}
            onDepotMove={moveDepot}
          />
        </div>

        {/* Mobile: floating panel toggle button */}
        {isMobile && (
          <button
            onClick={() => setShowPanel(p => !p)}
            style={{
              position: 'fixed',
              bottom: showPanel ? 'calc(55vh + 12px)' : 16,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 1100,
              background: 'var(--accent)',
              color: '#fff',
              border: 'none',
              borderRadius: 24,
              padding: '10px 22px',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(0,0,0,0.35)',
              transition: 'bottom 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            {showPanel ? '✕ Mbyll' : `☰ Pikat (${stops.length})`}
          </button>
        )}

        {/* Mobile: bottom sheet panel */}
        {isMobile && (
          <div style={{
            position: 'fixed',
            bottom: showPanel ? 0 : '-55vh',
            left: 0, right: 0,
            height: '55vh',
            background: 'var(--bg2)',
            borderTop: '2px solid var(--border)',
            borderRadius: '16px 16px 0 0',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            transition: 'bottom 0.3s ease',
            overflow: 'hidden',
          }}>
            {/* drag handle */}
            <div
              onClick={() => setShowPanel(false)}
              style={{ padding: '10px 0 4px', textAlign: 'center', cursor: 'pointer', flexShrink: 0 }}
            >
              <div style={{ width: 36, height: 4, background: 'var(--border)', borderRadius: 2, margin: '0 auto' }} />
            </div>

            <div style={{ flex: 1, overflow: 'hidden', padding: '0 12px 12px', display: 'flex', flexDirection: 'column' }}>
              {stopsLoading ? (
                <div style={{ color: 'var(--text3)', fontSize: 12 }}>Duke ngarkuar...</div>
              ) : (
                <StopList stops={stops} routeStops={routeStops} onDelete={deleteStop} onAdd={() => { setShowPanel(false); setShowForm(true) }} />
              )}
              {vehicleLegend}
              {realtimeIndicator}
            </div>
          </div>
        )}
      </div>

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
