import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './lib/supabase'
import { ToastProvider } from './components/Toast'
import Login from './screens/Login'
import Dashboard from './screens/Dashboard'
import AddIncome from './screens/AddIncome'
import Settings from './screens/Settings'
import RacesList from './screens/RacesList'
import RaceDetail from './screens/RaceDetail'
import MemberProfile from './screens/MemberProfile'
import FeedScreen from './screens/FeedScreen'
import CreateRace from './screens/CreateRace'
import InvitePage from './screens/InvitePage'

function AuthGate({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null | undefined>(undefined)
  const location = useLocation()

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, s) => setSession(s))
    return () => subscription.unsubscribe()
  }, [])

  if (session === undefined) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-tertiary)', fontSize: 12 }}>
        Loading…
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/join/:inviteCode" element={<InvitePage />} />
          <Route path="/" element={<AuthGate><Dashboard /></AuthGate>} />
          <Route path="/income/add" element={<AuthGate><AddIncome /></AuthGate>} />
          <Route path="/settings" element={<AuthGate><Settings /></AuthGate>} />
          <Route path="/races" element={<AuthGate><RacesList /></AuthGate>} />
          <Route path="/races/create" element={<AuthGate><CreateRace /></AuthGate>} />
          <Route path="/races/:raceId" element={<AuthGate><RaceDetail /></AuthGate>} />
          <Route path="/races/:raceId/member/:userId" element={<AuthGate><MemberProfile /></AuthGate>} />
          <Route path="/feed" element={<AuthGate><FeedScreen /></AuthGate>} />
          <Route path="/history" element={<AuthGate><FeedScreen /></AuthGate>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ToastProvider>
    </BrowserRouter>
  )
}
