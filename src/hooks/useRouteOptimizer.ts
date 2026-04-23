// src/hooks/useRouteOptimizer.ts
import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import type { OptimizeResult, RouteMode } from '../types'

interface Options {
  mode: RouteMode
  vehicleId?: number
  debounceMs?: number
}

export function useRouteOptimizer({ mode, vehicleId, debounceMs = 300 }: Options) {
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
          vehicle_id: vehicleId ?? null,
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
  }, [mode, vehicleId])

  const debouncedOptimize = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(optimize, debounceMs)
  }, [optimize, debounceMs])

  // Realtime listener — rillogarit kur ndryshon tabela stops
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
  }, [mode, vehicleId])

  return { result, loading, error, optimize }
}
