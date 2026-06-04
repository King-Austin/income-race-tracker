import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { FeedItem, Profile, IncomeRecord } from '../types'

export function useFeed(userId?: string) {
  const [feed, setFeed] = useState<FeedItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) return
    setLoading(true)

    const load = async () => {
      const membershipRes = await supabase.from('race_members').select('race_id').eq('user_id', userId)
      const raceIds = (membershipRes.data as { race_id: string }[] | null)?.map(m => m.race_id) ?? []

      let memberIds: string[] = [userId]
      if (raceIds.length) {
        const allMembersRes = await supabase.from('race_members').select('user_id').in('race_id', raceIds)
        const peerIds = (allMembersRes.data as { user_id: string }[] | null)?.map(m => m.user_id) ?? []
        memberIds = [...new Set([userId, ...peerIds])]
      }

      const incomeRes = await supabase.from('income_records').select('*').in('user_id', memberIds).order('recorded_at', { ascending: false }).limit(30)
      const incomeRows = incomeRes.data as IncomeRecord[] | null

      if (!incomeRows?.length) { setFeed([]); setLoading(false); return }

      const profileRes = await supabase.from('profiles').select('*').in('id', memberIds)
      const profileMap = new Map(((profileRes.data as Profile[] | null) ?? []).map(p => [p.id, p]))

      const feedItems: FeedItem[] = incomeRows.map(r => ({
        id: r.id,
        user: profileMap.get(r.user_id) ?? { id: r.user_id, username: 'Unknown', avatar_url: null, monthly_goal: 0, created_at: '' },
        amount: r.amount,
        description: r.description,
        recorded_at: r.recorded_at,
      }))

      setFeed(feedItems)
      setLoading(false)
    }

    load()
  }, [userId])

  return { feed, loading }
}
