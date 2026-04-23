// src/types/index.ts

export interface Vehicle {
  id: number
  name: string
  capacity: number
  active: boolean
  created_at: string
}

export interface Stop {
  id: number
  name: string
  address: string | null
  lat: number
  lng: number
  demand: number
  tw_open: string | null
  tw_close: string | null
  service_sec: number
  priority: number
  active: boolean
  notes: string | null
  created_at: string
}

export interface Depot {
  id: number
  name: string
  lat: number
  lng: number
}

export interface Route {
  id: number
  vehicle_id: number
  date: string
  stop_sequence: RouteStop[]
  total_dist_km: number
  total_stops: number
  status: 'pending' | 'active' | 'completed'
  created_at: string
}

export interface RouteStop {
  seq: number
  stop_id: number
  stop_name: string
  lat: number
  lng: number
  dist_from_prev_km: number
  tw_open: string | null
  tw_close: string | null
  priority: number
  vehicle_id?: number
  vehicle_name?: string
}

export interface RouteLine {
  vehicle_id: number | null
  color: string
  geojson: GeoJSONFeature | null
}

export interface OptimizeResult {
  success: boolean
  mode: 'tsp' | 'vrp'
  total_km: string
  total_stops: number
  raw: RouteStop[]
  route_lines?: RouteLine[]
}

export interface GeoJSONFeatureCollection {
  type: 'FeatureCollection'
  features: GeoJSONFeature[]
}

export interface GeoJSONFeature {
  type: 'Feature'
  geometry: {
    type: string
    coordinates: number[] | number[][]
  }
  properties: Record<string, unknown>
}

export type RouteMode = 'tsp' | 'vrp'
