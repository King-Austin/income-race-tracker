import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

export function useAuth() {
  const [session, setSession] = useState<Session | null | undefined>(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, s) => setSession(s))
    return () => subscription.unsubscribe()
  }, [])

  const signUp = async (email: string, password: string, username: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
    if (data.user) {
      // Create the profile row. upsert + ignoreDuplicates ensures this
      // never fails even if the row somehow already exists.
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert(
          { id: data.user.id, username, monthly_goal: 0 },
          { onConflict: 'id', ignoreDuplicates: false }
        )
      if (profileError) throw profileError
    }
    return data
  }

  const signIn = (email: string, password: string) =>
    supabase.auth.signInWithPassword({ email, password })

  const signOut = () => supabase.auth.signOut()

  return { session, signUp, signIn, signOut, userId: session?.user?.id }
}
