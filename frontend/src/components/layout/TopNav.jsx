import { useEffect, useRef, useState } from 'react'
import { NavLink } from 'react-router-dom'
import avatarBackground from '../../assets/figma/avatar-background.svg'
import avatarChevron from '../../assets/figma/avatar-chevron.svg'
import docMindIcon from '../../assets/figma/docmind-icon.svg'
import ProfileMenu from './ProfileMenu.jsx'

const navItems = [{ label: 'Dashboard', to: '/' }, { label: 'Chat', to: '/chat' }, { label: 'Documents', to: '/documents' }]

export default function TopNav() {
  const [profileOpen, setProfileOpen] = useState(false)
  const [navigationOpen, setNavigationOpen] = useState(false)
  const profileRef = useRef(null)
  const navigationRef = useRef(null)
  useEffect(() => {
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') {
        setProfileOpen(false)
        setNavigationOpen(false)
      }
    }
    const closeOnOutsideClick = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) setProfileOpen(false)
      if (navigationRef.current && !navigationRef.current.contains(event.target)) setNavigationOpen(false)
    }
    document.addEventListener('keydown', closeOnEscape)
    document.addEventListener('pointerdown', closeOnOutsideClick)
    return () => {
      document.removeEventListener('keydown', closeOnEscape)
      document.removeEventListener('pointerdown', closeOnOutsideClick)
    }
  }, [])
  return (
    <header className="h-[78px] px-5 sm:px-8 lg:px-12">
      <div className="relative mx-auto flex h-full max-w-[1344px] items-center justify-between">
        <NavLink className="flex items-center gap-2.5 text-xl font-bold text-heading no-underline sm:text-[26px]" to="/"><img alt="" src={docMindIcon} /><span>DocMind</span></NavLink>
        <nav aria-label="Primary navigation" className="hidden items-center gap-3 sm:flex">
          {navItems.map((item) => <NavLink className={({ isActive }) => `rounded-full px-6 py-2.5 text-sm font-medium text-heading no-underline transition ${isActive ? 'border border-primary-border bg-primary' : 'border border-transparent hover:bg-white/5'}`} end={item.to === '/'} key={item.to} to={item.to}>{item.label}</NavLink>)}
        </nav>
        <div className="relative ml-auto mr-3 sm:hidden" ref={navigationRef}>
          <button
            aria-expanded={navigationOpen}
            aria-label="Open navigation"
            className="grid size-11 place-items-center rounded-full border border-border bg-surface"
            onClick={() => { setNavigationOpen((open) => !open); setProfileOpen(false) }}
            type="button"
          >
            <span aria-hidden="true" className="grid gap-1"><span className="block h-0.5 w-5 bg-heading" /><span className="block h-0.5 w-5 bg-heading" /><span className="block h-0.5 w-5 bg-heading" /></span>
          </button>
          {navigationOpen && (
            <nav aria-label="Mobile navigation" className="absolute right-0 top-[54px] z-50 w-52 rounded-2xl border border-border bg-surface p-2 shadow-2xl">
              {navItems.map((item) => <NavLink className={({ isActive }) => `block rounded-xl px-4 py-3 text-heading no-underline ${isActive ? 'bg-primary' : 'hover:bg-white/5'}`} end={item.to === '/'} key={item.to} onClick={() => setNavigationOpen(false)} to={item.to}>{item.label}</NavLink>)}
            </nav>
          )}
        </div>
        <div className="relative" ref={profileRef}>
          <button aria-expanded={profileOpen} aria-haspopup="menu" aria-label="Open profile menu" className="relative h-11 w-[62px] rounded-full text-heading" onClick={() => { setProfileOpen((open) => !open); setNavigationOpen(false) }} type="button">
            <span className="absolute -left-[15px] -top-2"><img alt="" src={avatarBackground} /></span>
            <span className="absolute left-0 top-1.5 w-8 text-center text-xl font-semibold">A</span>
            <span className="absolute left-[42px] top-0.5"><img alt="" src={avatarChevron} /></span>
          </button>
          {profileOpen && <ProfileMenu onClose={() => setProfileOpen(false)} />}
        </div>
      </div>
    </header>
  )
}
