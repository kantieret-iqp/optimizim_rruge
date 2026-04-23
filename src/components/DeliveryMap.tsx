// src/components/DeliveryMap.tsx
import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { RouteStop, RouteLine, Stop } from '../types'

// Fix Leaflet default icon paths
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

interface Props {
  stops: Stop[]
  routeStops: RouteStop[]
  routeLines?: RouteLine[]
  depotLat: number
  depotLng: number
  onMapClick?: (lat: number, lng: number) => void
  onDepotMove?: (lat: number, lng: number) => void
}

const VEHICLE_COLORS = ['#3d8ef8', '#22c98a', '#f59e0b', '#ef4444', '#a78bfa']

function createMarkerIcon(label: string, color: string, size = 32) {
  return L.divIcon({
    className: '',
    html: `<div style="
      width:${size}px;height:${size}px;border-radius:50%;
      background:${color};border:2.5px solid #fff;
      display:flex;align-items:center;justify-content:center;
      font-family:'DM Sans',sans-serif;font-size:${size < 32 ? 10 : 12}px;
      font-weight:600;color:#fff;
      box-shadow:0 2px 8px rgba(0,0,0,0.5);
      cursor:pointer;
    ">${label}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}

export function DeliveryMap({ stops, routeStops, routeLines, depotLat, depotLng, onMapClick, onDepotMove }: Props) {
  const mapRef = useRef<L.Map | null>(null)
  const layerRef = useRef<L.LayerGroup | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Init map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    const map = L.map(containerRef.current, { zoomControl: true, attributionControl: false })
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map)
    map.setView([depotLat, depotLng], 12)
    layerRef.current = L.layerGroup().addTo(map)

    if (onMapClick) {
      map.on('click', (e) => onMapClick(e.latlng.lat, e.latlng.lng))
    }

    mapRef.current = map
    return () => { map.remove(); mapRef.current = null }
  }, [])

  // Update markers and route lines when data changes
  useEffect(() => {
    if (!mapRef.current || !layerRef.current) return
    layerRef.current.clearLayers()

    // Depot marker — draggable
    const depotMarker = L.marker([depotLat, depotLng], {
      icon: createMarkerIcon('D', '#3d8ef8', 36),
      draggable: !!onDepotMove,
    })
      .bindPopup('<b>Depot kryesor</b><br>' + (onDepotMove ? 'Zvarrit për ta zhvendosur' : 'Pika fillestare'))
      .addTo(layerRef.current)

    if (onDepotMove) {
      depotMarker.on('dragend', (e) => {
        const { lat, lng } = (e.target as L.Marker).getLatLng()
        onDepotMove(lat, lng)
      })
    }

    if (routeStops.length > 0) {
      // Group by vehicle for VRP coloring
      const byVehicle = new Map<string, RouteStop[]>()
      routeStops.forEach((s) => {
        const key = s.vehicle_id ? String(s.vehicle_id) : '1'
        if (!byVehicle.has(key)) byVehicle.set(key, [])
        byVehicle.get(key)!.push(s)
      })

      // Draw route lines: OSRM road geometry if available, else straight polyline
      const addAnimated = (layer: L.Layer) => {
        layer.addTo(layerRef.current!)
        const el = (layer as L.Path).getElement?.()
        if (el) el.classList.add('route-animated')
      }

      if (routeLines?.length) {
        routeLines.forEach((rl) => {
          if (rl.geojson) {
            const gjLayer = L.geoJSON(rl.geojson as Parameters<typeof L.geoJSON>[0], {
              style: { color: rl.color, weight: 4, opacity: 0.9 },
            })
            gjLayer.addTo(layerRef.current!)
            gjLayer.eachLayer((l) => {
              const el = (l as L.Path).getElement?.()
              if (el) el.classList.add('route-animated')
            })
          } else {
            const vstops = byVehicle.get(rl.vehicle_id ? String(rl.vehicle_id) : '1') ?? []
            const latlngs: L.LatLngTuple[] = [
              [depotLat, depotLng],
              ...vstops.map((s) => [s.lat, s.lng] as L.LatLngTuple),
              [depotLat, depotLng],
            ]
            addAnimated(L.polyline(latlngs, { color: rl.color, weight: 4, opacity: 0.9 }))
          }
        })
      } else {
        let vIdx = 0
        byVehicle.forEach((vstops) => {
          const color = VEHICLE_COLORS[vIdx % VEHICLE_COLORS.length]
          vIdx++
          const latlngs: L.LatLngTuple[] = [
            [depotLat, depotLng],
            ...vstops.map((s) => [s.lat, s.lng] as L.LatLngTuple),
            [depotLat, depotLng],
          ]
          addAnimated(L.polyline(latlngs, { color, weight: 4, opacity: 0.9 }))
        })
      }

      // Stop markers (always from routeStops)
      let vIdx = 0
      byVehicle.forEach((vstops) => {
        const color = routeLines?.[vIdx]?.color ?? VEHICLE_COLORS[vIdx % VEHICLE_COLORS.length]
        vIdx++
        vstops.forEach((s) => {
          if (s.stop_id === 0) return
          const isUrgent = s.priority === 1
          const icon = createMarkerIcon(
            String(s.seq),
            isUrgent ? '#f59e0b' : color,
            28
          )
          L.marker([s.lat, s.lng], { icon })
            .bindPopup(`
              <div style="min-width:160px">
                <div style="font-weight:600;margin-bottom:4px">${s.stop_name}</div>
                <div style="color:#888;font-size:12px">Sekuenca: #${s.seq}</div>
                ${s.tw_open ? `<div style="color:#888;font-size:12px">⏰ ${s.tw_open} – ${s.tw_close}</div>` : ''}
                ${s.dist_from_prev_km > 0 ? `<div style="color:#888;font-size:12px">+${s.dist_from_prev_km.toFixed(1)} km</div>` : ''}
                ${isUrgent ? '<div style="color:#f59e0b;font-size:12px">⚡ Urgjent</div>' : ''}
              </div>
            `)
            .addTo(layerRef.current!)
        })
      })

      // Fit map to all points
      const allLatLngs: L.LatLngTuple[] = [
        [depotLat, depotLng],
        ...routeStops.map((s) => [s.lat, s.lng] as L.LatLngTuple),
      ]
      mapRef.current.fitBounds(L.latLngBounds(allLatLngs), { padding: [40, 40] })
    } else {
      // No route — just show stops
      stops.forEach((s) => {
        L.marker([s.lat, s.lng], {
          icon: createMarkerIcon(String(s.id), '#555d72', 26),
        })
          .bindPopup(`<b>${s.name}</b>${s.address ? `<br>${s.address}` : ''}`)
          .addTo(layerRef.current!)
      })
    }
  }, [stops, routeStops, depotLat, depotLng])

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%', borderRadius: 'var(--radius-lg)' }}
    />
  )
}
