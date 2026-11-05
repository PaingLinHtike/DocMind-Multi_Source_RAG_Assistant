import { Link, useNavigate } from 'react-router-dom'
import profileAvatar from '../../assets/figma/profile-avatar.svg'
import profileSettings from '../../assets/figma/profile-settings.svg'
import profileUpload from '../../assets/figma/profile-upload.svg'
import { useAuth } from '../../auth/authSessionStore.js'
import Icon from '../ui/Icon.jsx'

const menuRow = 'flex min-h-11 items-center gap-3 rounded-lg px-2.5 text-sm font-medium text-heading no-underline transition-colors hover:bg-white/5'

export default function ProfileMenu({ onClose }) {
  const navigate = useNavigate()
  const { logout } = useAuth()

  function handleLogout() {
    onClose()
    logout()
    navigate('/signin', { replace: true })
  }

  return (
    <div className="menu-enter absolute right-0 top-14 z-50 flex w-72 flex-col rounded-xl border border-[#806ac9] bg-surface p-3 shadow-2xl" role="menu">
      <div className="flex items-center gap-3 border-b border-border px-1 pb-3">
        <span className="relative grid size-10 shrink-0 place-items-center text-base font-semibold">
          <img alt="" className="absolute inset-0 size-full" src={profileAvatar} />
          <span className="relative">A</span>
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-heading">Aung</p>
          <p className="truncate text-xs text-muted">aung@example.com</p>
        </div>
      </div>
      <div className="mt-2 space-y-0.5">
        <Link className={menuRow} onClick={onClose} to="/upload">
          <span className="grid size-[18px] shrink-0 place-items-center"><img alt="" className="size-full" src={profileUpload} /></span>
          <span>Upload Document</span>
        </Link>
        <Link className={menuRow} onClick={onClose} to="/settings">
          <span className="grid size-[18px] shrink-0 place-items-center"><img alt="" className="size-full" src={profileSettings} /></span>
          <span>Settings</span>
        </Link>
      </div>
      <button className="mt-2 flex min-h-11 w-full items-center gap-3 rounded-lg bg-red-500/10 px-2.5 text-sm font-medium text-red-200 transition-colors hover:bg-red-500/15" onClick={handleLogout} type="button">
        <span className="grid size-[18px] shrink-0 place-items-center"><Icon name="logout" size={18} /></span>
        <span>Log Out</span>
      </button>
    </div>
  )
}
