import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Calendar from './pages/Calendar'
import Students from './pages/Students'
import Materials from './pages/Materials'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/students" element={<Students />} />
          <Route path="/materials" element={<Materials />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
