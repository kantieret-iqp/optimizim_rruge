// src/hooks/useDepot.ts
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

interface Depot { lat: number; lng: number }

const FALLBACK: Depot = { lat: 41.3275, lng: 19.8187 }

export function useDepot() {
  const [depot, setDepot] = useState<Depot>(FALLBACK)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('depot').select('lat,lng').limit(1).single().then(({ data }) => {
      if (data) setDepot({ lat: data.lat, lng: data.lng })
      setLoading(false)
    })
  }, [])

  const moveDepot = async (lat: number, lng: number) => {
    setDepot({ lat, lng }) // optimistic update
    await supabase.from('depot').update({ lat, lng }).neq('id', 0)
  }

  return { depot, loading, moveDepot }
}
