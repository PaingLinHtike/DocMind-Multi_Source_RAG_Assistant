import { Link } from 'react-router-dom'
import profileAvatar from '../../assets/figma/profile-avatar.svg'
import profileSettings from '../../assets/figma/profile-settings.svg'
import profileUpload from '../../assets/figma/profile-upload.svg'

export default function ProfileMenu({ onClose }) {
  return (
    <div className="absolute right-0 top-[63px] z-50 flex h-[304px] w-[302px] flex-col rounded-2xl border border-[#806ac9] bg-surface p-4 shadow-2xl" role="menu">
      <div className="flex min-h-[67px] items-start gap-3 border-b border-border pb-4">
        <span className="relative grid size-[47px] shrink-0 place-items-center text-xl font-semibold"><img alt="" className="absolute inset-0" src={profileAvatar} /><span className="relative">A</span></span>
        <div><p className="font-semibold text-heading">Aung</p><p className="text-sm text-muted">aung@example.com</p></div>
      </div>
      <div className="flex-1 space-y-3 py-4">
        <Link className="flex h-[51px] items-center gap-4 rounded-lg px-3 text-heading hover:bg-white/5" onClick={onClose} to="/upload"><img alt="" src={profileUpload} /><span>Upload Document</span></Link>
        <Link className="flex h-[51px] items-center gap-4 rounded-lg px-3 text-heading hover:bg-white/5" onClick={onClose} to="/settings"><img alt="" src={profileSettings} /><span>Settings</span></Link>
      </div>
      <button className="h-[51px] w-full shrink-0 rounded-lg bg-[#f01616] px-3 text-center text-heading" onClick={onClose} type="button">Log Out</button>
    </div>
  )
}
