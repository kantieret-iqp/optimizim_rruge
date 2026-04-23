// src/hooks/useRouteOptimizer.ts
import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import type { OptimizeResult, RouteMode } from '../types'

interface Options {
  vehicleCount: number  // 1 = TSP, 2+ = VRP
  debounceMs?: number
}

export function useRouteOptimizer({ vehicleCount, debounceMs = 300 }: Options) {
  const mode: RouteMode = vehicleCount === 1 ? 'tsp' : 'vrp'
  const [result, setResult] = useState<OptimizeResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const optimize = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error: fnError } = await supabase.functions.invoke('optimize-route', {
        body: {
          mode,
          vehicle_count: vehicleCount,
          date: new Date().toISOString().split('T')[0],
        },
      })
      if (fnError) throw fnError
      if (!data?.success) throw new Error(data?.error ?? 'Gabim i panjohur')
      setResult(data as OptimizeResult)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gabim gjatë llogaritjes')
    } finally {
      setLoading(false)
    }
  }, [mode, vehicleCount])

  const debouncedOptimize = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(optimize, debounceMs)
  }, [optimize, debounceMs])

  useEffect(() => {
    optimize()
    const channel = supabase
      .channel('stops-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'stops' }, debouncedOptimize)
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [vehicleCount])

  return { result, loading, error, optimize }
}
