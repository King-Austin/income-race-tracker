import type { Database } from './database'

export type Profile = Database['public']['Tables']['profiles']['Row']
export type Race = Database['public']['Tables']['races']['Row']
export type RaceMember = Database['public']['Tables']['race_members']['Row']
export type IncomeRecord = Database['public']['Tables']['income_records']['Row']

export type RaceWithOwner = Race & { owner: Profile }

export type LeaderboardEntry = {
  user: Profile
  total: number
  rank: number
  isOwner: boolean
}

export type FeedItem = {
  id: string
  user: Profile
  amount: number
  description: string | null
  recorded_at: string
  race?: { id: string; name: string }
}
