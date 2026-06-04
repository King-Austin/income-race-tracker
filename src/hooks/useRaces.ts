import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Race, Profile } from '../types'

export type RaceWithMeta = Race & {
  owner: Pick<Profile, 'username' | 'avatar_url'>
  memberCount: number
}

export function useRaces(userId?: string) {
  const [races, setRaces] = useState<RaceWithMeta[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    if (!userId) return
    setLoading(true)

    const membershipRes = await supabase.from('race_members').select('race_id').eq('user_id', userId)
    const memberships = membershipRes.data as { race_id: string }[] | null

    if (!memberships?.length) { setRaces([]); setLoading(false); return }

    const raceIds = memberships.map(m => m.race_id)

    const raceRes = await supabase.from('races').select('*').in('id', raceIds).eq('is_active', true).order('created_at', { ascending: false })
    const raceRows = raceRes.data as Race[] | null

    if (!raceRows) { setRaces([]); setLoading(false); return }

    const enriched: RaceWithMeta[] = await Promise.all(
      raceRows.map(async (race) => {
        const [ownerRes, countRes] = await Promise.all([
          supabase.from('profiles').select('username, avatar_url').eq('id', race.owner_id).single(),
          supabase.from('race_members').select('*', { count: 'exact', head: true }).eq('race_id', race.id),
        ])
        const owner = ownerRes.data as Pick<Profile, 'username' | 'avatar_url'> | null
        return {
          ...race,
          owner: owner ?? { username: 'Unknown', avatar_url: null },
          memberCount: countRes.count ?? 0,
        }
      })
    )

    setRaces(enriched)
    setLoading(false)
  }

  useEffect(() => { load() }, [userId])

  const createRace = async (params: { name: string; description?: string; targetAmount: number; monthYear: string }) => {
    if (!userId) throw new Error('Not authenticated')
    const inviteCode = Math.random().toString(36).slice(2, 8).toUpperCase()
    const insertRes = await supabase.from('races').insert({
      name: params.name,
      description: params.description ?? null,
      invite_code: inviteCode,
      owner_id: userId,
      target_amount: params.targetAmount,
      month_year: params.monthYear,
      is_active: true,
    }).select().single()
    if (insertRes.error) throw new Error(insertRes.error.message)
    const race = insertRes.data as Race

    await supabase.from('race_members').insert({ race_id: race.id, user_id: userId })
    await load()
    return race
  }

  const joinByCode = async (inviteCode: string) => {
    if (!userId) throw new Error('Not authenticated')
    const raceRes = await supabase.from('races').select('id').eq('invite_code', inviteCode.toUpperCase()).eq('is_active', true).single()
    if (raceRes.error || !raceRes.data) throw new Error('Race not found or expired')
    const race = raceRes.data as { id: string }

    const joinRes = await supabase.from('race_members').insert({ race_id: race.id, user_id: userId })
    if (joinRes.error?.code === '23505') throw new Error('Already a member')
    if (joinRes.error) throw new Error(joinRes.error.message)

    await load()
    return race
  }

  const leaveRace = async (raceId: string) => {
    if (!userId) return
    await supabase.from('race_members').delete().eq('race_id', raceId).eq('user_id', userId)
    setRaces(r => r.filter(x => x.id !== raceId))
  }

  const deleteRace = async (raceId: string) => {
    await supabase.from('races').delete().eq('id', raceId)
    setRaces(r => r.filter(x => x.id !== raceId))
  }

  return { races, loading, createRace, joinByCode, leaveRace, deleteRace, reload: load }
}
