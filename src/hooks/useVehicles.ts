// src/hooks/useVehicles.ts
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { Vehicle } from '../types'

export function useVehicles() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)

  const fetchVehicles = async () => {
    const { data } = await supabase
      .from('vehicles')
      .select('*')
      .eq('active', true)
      .order('id')
    setVehicles(data ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchVehicles() }, [])

  return { vehicles, loading, refetch: fetchVehicles }
}
