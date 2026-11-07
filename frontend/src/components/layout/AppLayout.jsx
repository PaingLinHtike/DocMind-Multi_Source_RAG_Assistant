import { Outlet } from 'react-router-dom'
import TopNav from './TopNav.jsx'

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-canvas text-text">
      <TopNav />
      <main className="min-h-screen pt-16"><Outlet /></main>
    </div>
  )
}
