import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Calendar from './pages/Calendar'
import Students from './pages/Students'
import StudentDetail from './pages/StudentDetail'
import Materials from './pages/Materials'
import BandPerformances from './pages/BandPerformances'
import BandRehearsals from './pages/BandRehearsals'
import BandSongs from './pages/BandSongs'
import BandResources from './pages/BandResources'
import Login from './pages/Login'
import { Loader2 } from 'lucide-react'

function AppGate() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Login />
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/students" element={<Students />} />
          <Route path="/students/:id" element={<StudentDetail />} />
          <Route path="/materials" element={<Materials />} />
          <Route path="/band-performances" element={<BandPerformances />} />
          <Route path="/band-rehearsals" element={<BandRehearsals />} />
          <Route path="/band-songs" element={<BandSongs />} />
          <Route path="/band-resources" element={<BandResources />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppGate />
    </AuthProvider>
  )
}
