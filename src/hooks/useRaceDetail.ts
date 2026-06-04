import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Race, Profile, LeaderboardEntry } from '../types'

export type RaceDetailData = {
  race: Race & { owner: Profile }
  leaderboard: LeaderboardEntry[]
  members: { user: Profile; isOwner: boolean }[]
}

export function useRaceDetail(raceId: string, _currentUserId?: string) {
  const [data, setData] = useState<RaceDetailData | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!raceId) return
    setLoading(true)

    const raceRes = await supabase.from('races').select('*').eq('id', raceId).single()
    const race = raceRes.data as Race | null
    if (!race) { setLoading(false); return }

    const ownerRes = await supabase.from('profiles').select('*').eq('id', race.owner_id).single()
    const owner = ownerRes.data as Profile | null

    const memberRes = await supabase.from('race_members').select('user_id').eq('race_id', raceId)
    const memberIds = (memberRes.data as { user_id: string }[] | null)?.map(m => m.user_id) ?? []

    const profileRes = await supabase.from('profiles').select('*').in('id', memberIds)
    const profileMap = new Map(((profileRes.data as Profile[] | null) ?? []).map(p => [p.id, p]))

    const [year, month] = race.month_year.split('-')
    const startDate = `${year}-${month}-01`
    const endDate = new Date(Number(year), Number(month), 1).toISOString().slice(0, 10)

    const incomeRes = await supabase.from('income_records').select('user_id, amount').in('user_id', memberIds).gte('recorded_at', startDate).lt('recorded_at', endDate)
    const incomeRows = incomeRes.data as { user_id: string; amount: number }[] | null

    const totals = new Map<string, number>()
    for (const row of incomeRows ?? []) {
      totals.set(row.user_id, (totals.get(row.user_id) ?? 0) + row.amount)
    }

    const fallback = (uid: string): Profile => ({ id: uid, username: 'Unknown', avatar_url: null, monthly_goal: 0, created_at: '' })

    const leaderboard: LeaderboardEntry[] = memberIds
      .map(uid => ({
        user: profileMap.get(uid) ?? fallback(uid),
        total: totals.get(uid) ?? 0,
        rank: 0,
        isOwner: uid === race.owner_id,
      }))
      .sort((a, b) => b.total - a.total)
      .map((entry, i) => ({ ...entry, rank: i + 1 }))

    const members = memberIds.map(uid => ({
      user: profileMap.get(uid) ?? fallback(uid),
      isOwner: uid === race.owner_id,
    }))

    setData({ race: { ...race, owner: owner ?? fallback(race.owner_id) }, leaderboard, members })
    setLoading(false)
  }, [raceId])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (!raceId) return
    const channel = supabase.channel(`race-${raceId}-income`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'income_records' }, () => load())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [raceId, load])

  const removeMember = async (userId: string) => {
    await supabase.from('race_members').delete().eq('race_id', raceId).eq('user_id', userId)
    await load()
  }

  return { data, loading, reload: load, removeMember }
}
