import { Outlet } from 'react-router-dom'
import purpleAmbient from '../../assets/figma/purple-ambient.svg'
import tealAmbient from '../../assets/figma/teal-ambient.svg'
import TopNav from './TopNav.jsx'

export default function AppLayout() {
  return (
    <div className="ambient-canvas relative min-h-screen overflow-hidden bg-canvas text-heading">
      <img alt="" className="pointer-events-none fixed right-[-305px] top-[-175px]" src={tealAmbient} />
      <img alt="" className="pointer-events-none fixed bottom-[-295px] left-[-355px]" src={purpleAmbient} />
      <div className="relative z-10">
        <TopNav />
        <main><Outlet /></main>
      </div>
    </div>
  )
}
