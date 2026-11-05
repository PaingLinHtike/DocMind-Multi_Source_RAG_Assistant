import { useEffect, useRef, useState } from 'react'
import { NavLink } from 'react-router-dom'
import avatarBackground from '../../assets/figma/avatar-background.svg'
import avatarChevron from '../../assets/figma/avatar-chevron.svg'
import docMindIcon from '../../assets/figma/docmind-icon.svg'
import ProfileMenu from './ProfileMenu.jsx'

const navItems = [{ label: 'Dashboard', to: '/' }, { label: 'Chat', to: '/chat' }, { label: 'Documents', to: '/documents' }]

export default function TopNav() {
  const [profileOpen, setProfileOpen] = useState(false)
  const profileRef = useRef(null)
  useEffect(() => {
    const closeOnEscape = (event) => event.key === 'Escape' && setProfileOpen(false)
    const closeOnOutsideClick = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) setProfileOpen(false)
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
        <div className="relative" ref={profileRef}>
          <button aria-expanded={profileOpen} aria-haspopup="menu" aria-label="Open profile menu" className="relative h-11 w-[62px] rounded-full text-heading" onClick={() => setProfileOpen((open) => !open)} type="button">
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
