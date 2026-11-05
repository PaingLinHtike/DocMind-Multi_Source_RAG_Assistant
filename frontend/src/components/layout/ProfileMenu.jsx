import { Link } from 'react-router-dom'
import profileAvatar from '../../assets/figma/profile-avatar.svg'
import profileSettings from '../../assets/figma/profile-settings.svg'
import profileUpload from '../../assets/figma/profile-upload.svg'

export default function ProfileMenu({ onClose }) {
  return (
    <div className="absolute right-0 top-[60px] z-50 w-[302px] rounded-2xl border border-border bg-surface p-4 shadow-2xl" role="menu">
      <div className="flex items-center gap-3 border-b border-border pb-4">
        <span className="relative grid size-[47px] shrink-0 place-items-center text-xl font-semibold"><img alt="" className="absolute inset-0" src={profileAvatar} /><span className="relative">A</span></span>
        <div><p className="font-semibold text-heading">Aung</p><p className="text-sm text-muted">aung@example.com</p></div>
      </div>
      <div className="space-y-1 py-3">
        <Link className="flex items-center gap-4 rounded-lg px-3 py-3 text-heading hover:bg-white/5" onClick={onClose} to="/upload"><img alt="" src={profileUpload} /><span>Upload Document</span></Link>
        <Link className="flex items-center gap-4 rounded-lg px-3 py-3 text-heading hover:bg-white/5" onClick={onClose} to="/settings"><img alt="" src={profileSettings} /><span>Settings</span></Link>
      </div>
      <button className="w-full border-t border-border px-3 pt-4 text-left text-heading" onClick={onClose} type="button">Log Out</button>
    </div>
  )
}
