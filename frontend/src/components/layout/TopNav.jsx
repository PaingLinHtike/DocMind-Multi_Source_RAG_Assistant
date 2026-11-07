import { useEffect, useRef, useState } from 'react'
import { NavLink } from 'react-router-dom'
import BrandMark from '../ui/BrandMark.jsx'
import Icon from '../ui/Icon.jsx'
import ProfileMenu from './ProfileMenu.jsx'

const navItems = [
  { label: 'Overview', to: '/dashboard', icon: 'dashboard' },
  { label: 'Chat', to: '/chat', icon: 'chat' },
  { label: 'Documents', to: '/documents', icon: 'documents' },
  { label: 'Upload', to: '/upload', icon: 'upload' },
  { label: 'Settings', to: '/settings', icon: 'settings' },
]

const navLink = ({ isActive }) => `flex min-h-11 items-center gap-3 rounded-[2px] border-l-2 px-3 text-sm font-medium no-underline transition-colors ${isActive ? 'border-accent bg-surface-muted text-text' : 'border-transparent text-text-secondary hover:bg-surface-muted hover:text-text'}`

export default function TopNav() {
  const [profileOpen, setProfileOpen] = useState(false)
  const [navigationOpen, setNavigationOpen] = useState(false)
  const shellRef = useRef(null)

  useEffect(() => {
    function closeOnEscape(event) {
      if (event.key === 'Escape') { setProfileOpen(false); setNavigationOpen(false) }
    }
    function closeOnOutsideClick(event) {
      if (shellRef.current && !shellRef.current.contains(event.target)) { setProfileOpen(false); setNavigationOpen(false) }
    }
    document.addEventListener('keydown', closeOnEscape)
    document.addEventListener('pointerdown', closeOnOutsideClick)
    return () => {
      document.removeEventListener('keydown', closeOnEscape)
      document.removeEventListener('pointerdown', closeOnOutsideClick)
    }
  }, [])

  return (
    <header aria-label="Application shell" className="fixed inset-x-0 top-0 z-50 flex h-16 items-center border-b border-border bg-canvas px-6 lg:inset-y-0 lg:right-auto lg:h-screen lg:w-60 lg:flex-col lg:items-stretch lg:border-b-0 lg:border-r lg:py-6" ref={shellRef}>
      <NavLink className="flex min-h-11 items-center gap-3 text-xl font-semibold text-text no-underline" to="/dashboard">
        <BrandMark className="text-accent" size={24} /><span>DocMind</span>
      </NavLink>

      <nav aria-label="Primary navigation" className="mt-10 hidden flex-col gap-1 lg:flex">
        {navItems.map((item) => <NavLink className={navLink} end={item.to === '/dashboard'} key={item.to} to={item.to}><Icon name={item.icon} /><span>{item.label}</span></NavLink>)}
      </nav>

      <div className="relative ml-auto lg:ml-0 lg:mt-auto">
        <button aria-expanded={navigationOpen} aria-label="Open navigation" className="mr-2 grid size-11 place-items-center rounded-[2px] border border-border-strong bg-surface text-text lg:hidden" onClick={() => { setNavigationOpen((open) => !open); setProfileOpen(false) }} type="button"><Icon name="menu" /></button>
        {navigationOpen && (
          <nav aria-label="Mobile navigation" className="menu-enter absolute right-14 top-0 z-50 w-56 rounded-[2px] border border-border-strong bg-surface p-2 lg:hidden">
            {navItems.map((item) => <NavLink className={navLink} end={item.to === '/dashboard'} key={item.to} onClick={() => setNavigationOpen(false)} to={item.to}><Icon name={item.icon} /><span>{item.label}</span></NavLink>)}
          </nav>
        )}
      </div>

      <div className="relative ml-0">
        <button aria-expanded={profileOpen} aria-haspopup="menu" aria-label="Open profile menu" className="flex min-h-11 items-center gap-2 rounded-[2px] text-text lg:w-full lg:px-2" onClick={() => { setProfileOpen((open) => !open); setNavigationOpen(false) }} type="button">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-accent text-sm font-semibold text-white">A</span>
          <span className="hidden min-w-0 flex-1 text-left text-sm font-medium lg:block">Aung</span>
          <span className={`grid size-6 place-items-center transition-transform ${profileOpen ? 'rotate-180' : ''}`}><Icon name="chevronDown" size={16} /></span>
        </button>
        {profileOpen && <ProfileMenu onClose={() => setProfileOpen(false)} />}
      </div>
    </header>
  )
}
