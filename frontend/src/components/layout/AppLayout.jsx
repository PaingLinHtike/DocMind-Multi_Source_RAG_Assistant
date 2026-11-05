import { Outlet } from 'react-router-dom'
import TopNav from './TopNav.jsx'

export default function AppLayout() {
  return (
    <div className="ambient-canvas relative min-h-screen overflow-hidden bg-canvas text-heading">
      <div className="relative z-10">
        <TopNav />
        <main><Outlet /></main>
      </div>
    </div>
  )
}
