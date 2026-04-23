// supabase/functions/optimize-route/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const OSRM = 'https://router.project-osrm.org'
const COLORS = ['#3d8ef8', '#22c98a', '#f59e0b', '#ef4444', '#a78bfa']

type Coord = [number, number] // [lng, lat] — ORS convention

interface Stop {
  id: number; name: string; lat: number; lng: number
  tw_open: string | null; tw_close: string | null
  priority: number; demand: number
}

// Nearest-neighbor TSP on cost matrix
function tspNN(matrix: number[][], start = 0): number[] {
  const n = matrix.length
  const visited = new Array(n).fill(false)
  const tour: number[] = [start]
  visited[start] = true
  while (tour.length < n) {
    const cur = tour[tour.length - 1]
    let best = -1, bestCost = Infinity
    for (let j = 0; j < n; j++) {
      if (!visited[j] && matrix[cur][j] < bestCost) { best = j; bestCost = matrix[cur][j] }
    }
    if (best < 0) break
    tour.push(best); visited[best] = true
  }
  return tour
}

function haversineM(c1: Coord, c2: Coord): number {
  const R = 6371000
  const dLat = (c2[1] - c1[1]) * Math.PI / 180
  const dLng = (c2[0] - c1[0]) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(c1[1] * Math.PI / 180) * Math.cos(c2[1] * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.asin(Math.sqrt(a))
}

function buildHavMatrix(coords: Coord[]): number[][] {
  return coords.map(c1 => coords.map(c2 => haversineM(c1, c2)))
}

// OSRM Table — kthen matricën e kohëve (sekonda) ndërmjet të gjitha pikave
async function osrmTable(coords: Coord[]): Promise<number[][]> {
  const c = coords.map(([lng, lat]) => `${lng},${lat}`).join(';')
  const res = await fetch(`${OSRM}/table/v1/driving/${c}?annotations=duration`)
  if (!res.ok) throw new Error(`OSRM Table ${res.status}`)
  // deno-lint-ignore no-explicit-any
  const json = await res.json() as any
  if (json.code !== 'Ok') throw new Error(`OSRM: ${json.code} ${json.message ?? ''}`)
  return json.durations
}

// OSRM Route — kthen GeoJSON LineString të rrugës reale
async function osrmRoute(coords: Coord[]) {
  const c = coords.map(([lng, lat]) => `${lng},${lat}`).join(';')
  const res = await fetch(`${OSRM}/route/v1/driving/${c}?overview=full&geometries=geojson`)
  if (!res.ok) throw new Error(`OSRM Route ${res.status}`)
  // deno-lint-ignore no-explicit-any
  const json = await res.json() as any
  if (json.code !== 'Ok') throw new Error(`OSRM Route: ${json.code}`)
  const route = json.routes[0]
  return { type: 'Feature', geometry: route.geometry, properties: { distance_m: route.distance } }
}

async function getDistMatrix(coords: Coord[]): Promise<number[][]> {
  try {
    return await osrmTable(coords)
  } catch {
    return buildHavMatrix(coords)
  }
}

async function getRouteGeojson(coords: Coord[]) {
  try {
    return await osrmRoute(coords)
  } catch {
    return null
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
    const { mode } = await req.json()

    const { data: depotRow, error: dErr } = await supabase.from('depot').select('lat,lng').limit(1).single()
    if (dErr || !depotRow) throw new Error('Depot nuk u gjet')
    const depot = depotRow as { lat: number; lng: number }
    const depotCoord: Coord = [depot.lng, depot.lat]

    const { data: stopsData, error: sErr } = await supabase
      .from('stops').select('id,name,lat,lng,tw_open,tw_close,priority,demand')
      .eq('active', true).order('id')
    if (sErr) throw new Error(sErr.message)
    if (!stopsData?.length) throw new Error('Nuk ka pika aktive')
    const stops = stopsData as Stop[]

    // ── TSP ─────────────────────────────────────────────────────────────────
    if (mode !== 'vrp') {
      const allCoords: Coord[] = [depotCoord, ...stops.map(s => [s.lng, s.lat] as Coord)]
      const distMatrix = await getDistMatrix(allCoords)
      const tour = tspNN(distMatrix, 0) // [0, idx1, idx2, ...]

      const raw = tour.slice(1).map((idx, k) => {
        const stop = stops[idx - 1]
        const distM = distMatrix[tour[k]][idx]
        return {
          seq: k + 1,
          stop_id: stop.id, stop_name: stop.name,
          lat: stop.lat, lng: stop.lng,
          dist_from_prev_km: parseFloat((distM / 1000).toFixed(3)),
          tw_open: stop.tw_open, tw_close: stop.tw_close,
          priority: stop.priority,
        }
      })

      const totalKm = raw.reduce((s, r) => s + r.dist_from_prev_km, 0)

      const routeCoords: Coord[] = [depotCoord, ...raw.map(r => [r.lng, r.lat] as Coord), depotCoord]
      const geojson = await getRouteGeojson(routeCoords)

      return new Response(JSON.stringify({
        success: true, mode,
        total_km: totalKm.toFixed(2),
        total_stops: raw.length,
        raw,
        route_lines: [{ vehicle_id: null, color: COLORS[0], geojson }],
      }), { headers: { ...cors, 'Content-Type': 'application/json' } })
    }

    // ── VRP ──────────────────────────────────────────────────────────────────
    const { data: vrpClusters, error: vErr } = await supabase.rpc('calculate_route_vrp', {
      p_date: new Date().toISOString().split('T')[0],
    })
    if (vErr) throw new Error(vErr.message)

    // Group by vehicle
    const vehicleGroups = new Map<number, { vehicle_name: string; stop: Stop }[]>()
    for (const row of (vrpClusters ?? [])) {
      const stop = stops.find(s => s.id === row.stop_id)
      if (!stop) continue
      if (!vehicleGroups.has(row.vehicle_id)) vehicleGroups.set(row.vehicle_id, [])
      vehicleGroups.get(row.vehicle_id)!.push({ vehicle_name: row.vehicle_name, stop })
    }

    const raw: unknown[] = []
    const routeLines: unknown[] = []
    let totalKm = 0
    let vIdx = 0

    for (const [vid, group] of vehicleGroups) {
      const color = COLORS[vIdx % COLORS.length]
      const vCoords: Coord[] = [depotCoord, ...group.map(g => [g.stop.lng, g.stop.lat] as Coord)]
      const distMatrix = await getDistMatrix(vCoords)
      const tour = tspNN(distMatrix, 0)

      const vRaw = tour.slice(1).map((idx, k) => {
        const { vehicle_name, stop } = group[idx - 1]
        const distM = distMatrix[tour[k]][idx]
        const distKm = parseFloat((distM / 1000).toFixed(3))
        totalKm += distKm
        return {
          seq: k + 1,
          stop_id: stop.id, stop_name: stop.name,
          lat: stop.lat, lng: stop.lng,
          dist_from_prev_km: distKm,
          tw_open: stop.tw_open, tw_close: stop.tw_close,
          priority: stop.priority,
          vehicle_id: vid, vehicle_name,
        }
      })
      raw.push(...vRaw)

      const rCoords: Coord[] = [depotCoord, ...vRaw.map(r => [(r as any).lng, (r as any).lat] as Coord), depotCoord]
      const geojson = await getRouteGeojson(rCoords)
      routeLines.push({ vehicle_id: vid, color, geojson })
      vIdx++
    }

    return new Response(JSON.stringify({
      success: true, mode,
      total_km: totalKm.toFixed(2),
      total_stops: (raw as unknown[]).length,
      raw, route_lines: routeLines,
    }), { headers: { ...cors, 'Content-Type': 'application/json' } })

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : JSON.stringify(err)
    return new Response(JSON.stringify({ success: false, error: msg }),
      { headers: { ...cors, 'Content-Type': 'application/json' }, status: 500 })
  }
})
