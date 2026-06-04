import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { IncomeRecord } from '../types'

export function useIncome(userId?: string) {
  const [records, setRecords] = useState<IncomeRecord[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    if (!userId) return
    setLoading(true)
    const res = await supabase.from('income_records').select('*').eq('user_id', userId).order('recorded_at', { ascending: false }).limit(50)
    setRecords((res.data as IncomeRecord[] | null) ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [userId])

  const addRecord = async (amount: number, description?: string, recordedAt?: string) => {
    if (!userId) throw new Error('Not authenticated')
    const res = await supabase.from('income_records').insert({ 
      user_id: userId, 
      amount, 
      description: description ?? null,
      ...(recordedAt ? { recorded_at: new Date(recordedAt).toISOString() } : {})
    } as any).select().single()
    if (res.error) throw new Error(res.error.message)
    const data = res.data as IncomeRecord
    setRecords(r => [data, ...r])
    return data
  }

  const monthTotal = (monthYear: string) => {
    const [year, month] = monthYear.split('-')
    return records
      .filter(r => {
        const d = new Date(r.recorded_at)
        return d.getFullYear() === Number(year) && d.getMonth() + 1 === Number(month)
      })
      .reduce((sum, r) => sum + r.amount, 0)
  }

  return { records, loading, addRecord, monthTotal, reload: load }
}
