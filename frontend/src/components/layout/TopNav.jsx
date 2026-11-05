import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import ProfileMenu from './ProfileMenu.jsx'

const navItems = [{ label: 'Dashboard', to: '/' }, { label: 'Chat', to: '/chat' }, { label: 'Documents', to: '/documents' }]

export default function TopNav() {
  const [profileOpen, setProfileOpen] = useState(false)
  useEffect(() => {
    const closeOnEscape = (event) => event.key === 'Escape' && setProfileOpen(false)
    document.addEventListener('keydown', closeOnEscape)
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [])
  return (
    <header className="h-[78px] px-5 sm:px-8 lg:px-12">
      <div className="relative mx-auto flex h-full max-w-[1344px] items-center justify-between">
        <NavLink className="flex items-center gap-2.5 text-xl font-bold text-heading no-underline sm:text-[26px]" to="/"><span aria-hidden="true" className="text-primary-border">▱</span><span>DocMind</span></NavLink>
        <nav aria-label="Primary navigation" className="hidden items-center gap-3 sm:flex">
          {navItems.map((item) => <NavLink className={({ isActive }) => `rounded-full px-6 py-2.5 text-sm font-medium text-heading no-underline transition ${isActive ? 'border border-primary-border bg-primary' : 'border border-transparent hover:bg-white/5'}`} end={item.to === '/'} key={item.to} to={item.to}>{item.label}</NavLink>)}
        </nav>
        <div className="relative">
          <button aria-expanded={profileOpen} aria-haspopup="menu" aria-label="Open profile menu" className="flex items-center gap-2 rounded-full text-heading" onClick={() => setProfileOpen((open) => !open)} type="button"><span className="grid size-11 place-items-center rounded-full bg-[#6555ee] text-xl font-semibold">A</span><span aria-hidden="true" className="text-muted">⌄</span></button>
          {profileOpen && <ProfileMenu onClose={() => setProfileOpen(false)} />}
        </div>
      </div>
    </header>
  )
}
