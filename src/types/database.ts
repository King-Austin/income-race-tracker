export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string
          avatar_url: string | null
          monthly_goal: number
          created_at: string
        }
        Insert: {
          id: string
          username: string
          avatar_url?: string | null
          monthly_goal?: number
        }
        Update: {
          username?: string
          avatar_url?: string | null
          monthly_goal?: number
        }
      }
      races: {
        Row: {
          id: string
          name: string
          description: string | null
          invite_code: string
          owner_id: string
          target_amount: number
          month_year: string
          is_active: boolean
          created_at: string
        }
        Insert: {
          name: string
          description?: string | null
          invite_code: string
          owner_id: string
          target_amount: number
          month_year: string
          is_active?: boolean
        }
        Update: {
          name?: string
          description?: string | null
          target_amount?: number
          is_active?: boolean
        }
      }
      race_members: {
        Row: {
          id: string
          race_id: string
          user_id: string
          joined_at: string
        }
        Insert: {
          race_id: string
          user_id: string
        }
        Update: Record<string, never>
      }
      income_records: {
        Row: {
          id: string
          user_id: string
          amount: number
          description: string | null
          recorded_at: string
        }
        Insert: {
          user_id: string
          amount: number
          description?: string | null
        }
        Update: Record<string, never>
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
