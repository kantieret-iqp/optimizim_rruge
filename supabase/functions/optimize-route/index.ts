// supabase/functions/optimize-route/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { mode, vehicle_id, date } = await req.json()

    let data, error
    if (mode === 'vrp') {
      ;({ data, error } = await supabase.rpc('calculate_route_vrp', {
        p_date: date ?? new Date().toISOString().split('T')[0],
      }))
    } else {
      ;({ data, error } = await supabase.rpc('calculate_route_tsp', {
        p_vehicle_id: vehicle_id ?? null,
        p_date: date ?? new Date().toISOString().split('T')[0],
      }))
    }

    if (error) throw error

    const totalKm = (data ?? []).reduce(
      (sum: number, r: Record<string, number>) => sum + (r.dist_from_prev_km ?? 0), 0
    )

    const geojson = {
      type: 'FeatureCollection',
      features: (data ?? []).map((r: Record<string, unknown>) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [r.lng, r.lat] },
        properties: r,
      })),
    }

    const route_line = {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: (data ?? []).map((r: Record<string, unknown>) => [r.lng, r.lat]),
      },
      properties: { total_km: totalKm.toFixed(2) },
    }

    return new Response(
      JSON.stringify({ success: true, mode, total_km: totalKm.toFixed(2), total_stops: (data ?? []).length, geojson, route_line, raw: data }),
      { headers: { ...cors, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gabim i panjohur'
    return new Response(
      JSON.stringify({ success: false, error: msg }),
      { headers: { ...cors, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
