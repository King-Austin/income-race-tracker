import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Profile } from '../types'

export function useProfile(userId?: string) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) return
    setLoading(true)
    supabase.from('profiles').select('*').eq('id', userId).single()
      .then(({ data }) => { setProfile(data as Profile | null); setLoading(false) })
  }, [userId])

  const updateProfile = async (updates: Partial<Pick<Profile, 'username' | 'monthly_goal' | 'avatar_url'>>) => {
    if (!userId) return
    const result = await supabase.from('profiles').update(updates).eq('id', userId).select().single()
    if (result.error) throw new Error(result.error.message)
    const data = result.data as Profile | null
    setProfile(data)
    return data
  }

  const uploadAvatar = async (file: File) => {
    if (!userId) return
    const ext = file.name.split('.').pop()
    const path = `${userId}/avatar.${ext}`
    const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
    if (error) throw error
    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
    return updateProfile({ avatar_url: publicUrl })
  }

  return { profile, loading, updateProfile, uploadAvatar }
}
