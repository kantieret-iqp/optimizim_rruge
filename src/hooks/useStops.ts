// src/hooks/useStops.ts
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { Stop } from '../types'

export function useStops() {
  const [stops, setStops] = useState<Stop[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStops = async () => {
    const { data, error } = await supabase
      .from('stops')
      .select('*')
      .eq('active', true)
      .order('created_at', { ascending: true })
    if (error) setError(error.message)
    else setStops(data ?? [])
    setLoading(false)
  }

  const addStop = async (stop: Omit<Stop, 'id' | 'created_at' | 'active'>) => {
    const { error } = await supabase.from('stops').insert({ ...stop, active: true })
    if (error) throw error
    await fetchStops()
  }

  const updateStop = async (id: number, updates: Partial<Stop>) => {
    const { error } = await supabase.from('stops').update(updates).eq('id', id)
    if (error) throw error
    await fetchStops()
  }

  const deleteStop = async (id: number) => {
    const { error } = await supabase.from('stops').update({ active: false }).eq('id', id)
    if (error) throw error
    await fetchStops()
  }

  useEffect(() => {
    fetchStops()
    const channel = supabase
      .channel('stops-crud')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'stops' }, fetchStops)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  return { stops, loading, error, addStop, updateStop, deleteStop, refetch: fetchStops }
}
