import { useEffect, useRef, useState } from 'react'
import { NavLink } from 'react-router-dom'
import avatarBackground from '../../assets/figma/avatar-background.svg'
import avatarChevron from '../../assets/figma/avatar-chevron.svg'
import docMindIcon from '../../assets/figma/docmind-icon.svg'
import Icon from '../ui/Icon.jsx'
import ProfileMenu from './ProfileMenu.jsx'

const navItems = [{ label: 'Dashboard', to: '/' }, { label: 'Chat', to: '/chat' }, { label: 'Documents', to: '/documents' }]

const desktopLink = ({ isActive }) => `inline-flex h-11 items-center rounded-lg px-4 text-sm font-medium no-underline transition-colors ${isActive ? 'bg-primary text-heading' : 'text-muted hover:bg-white/5 hover:text-heading'}`

const mobileLink = ({ isActive }) => `flex min-h-11 items-center rounded-lg px-3 text-sm font-medium no-underline transition-colors ${isActive ? 'bg-primary text-heading' : 'text-muted hover:bg-white/5 hover:text-heading'}`

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
    <header className="h-20 px-5 sm:px-8 lg:px-12">
      <div className="relative mx-auto flex h-full max-w-[1344px] items-center justify-between">
        <NavLink className="flex min-h-11 items-center gap-2.5 text-xl font-bold text-heading no-underline sm:text-2xl" to="/"><img alt="" src={docMindIcon} /><span>DocMind</span></NavLink>
        <nav aria-label="Primary navigation" className="hidden items-center gap-1 sm:flex">
          {navItems.map((item) => <NavLink className={desktopLink} end={item.to === '/'} key={item.to} to={item.to}>{item.label}</NavLink>)}
        </nav>
        <div className="relative ml-auto mr-3 sm:hidden" ref={navigationRef}>
          <button
            aria-expanded={navigationOpen}
            aria-label="Open navigation"
            className="grid size-11 place-items-center rounded-lg border border-border bg-surface text-heading transition-colors hover:bg-white/5"
            onClick={() => { setNavigationOpen((open) => !open); setProfileOpen(false) }}
            type="button"
          >
            <Icon name="menu" size={20} />
          </button>
          {navigationOpen && (
            <nav aria-label="Mobile navigation" className="absolute right-0 top-14 z-50 w-52 rounded-xl border border-border bg-surface p-1.5 shadow-2xl">
              {navItems.map((item) => <NavLink className={mobileLink} end={item.to === '/'} key={item.to} onClick={() => setNavigationOpen(false)} to={item.to}>{item.label}</NavLink>)}
            </nav>
          )}
        </div>
        <div className="relative" ref={profileRef}>
          <button aria-expanded={profileOpen} aria-haspopup="menu" aria-label="Open profile menu" className="flex h-11 items-center gap-1 rounded-full text-heading" onClick={() => { setProfileOpen((open) => !open); setNavigationOpen(false) }} type="button">
            <span className="relative grid size-9 shrink-0 place-items-center text-base font-semibold">
              <img alt="" className="absolute inset-0 size-full" src={avatarBackground} />
              <span className="relative">A</span>
            </span>
            <span className={`grid size-6 shrink-0 place-items-center transition-transform duration-200 ${profileOpen ? 'rotate-180' : ''}`}>
              <img alt="" className="size-full" src={avatarChevron} />
            </span>
          </button>
          {profileOpen && <ProfileMenu onClose={() => setProfileOpen(false)} />}
        </div>
      </div>
    </header>
  )
}
