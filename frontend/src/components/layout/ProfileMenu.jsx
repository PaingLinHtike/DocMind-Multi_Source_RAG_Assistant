import { Link } from 'react-router-dom'

export default function ProfileMenu({ onClose }) {
  return (
    <div className="absolute right-0 top-[60px] z-50 w-[302px] rounded-2xl border border-border bg-surface p-4 shadow-2xl" role="menu">
      <div className="flex items-center gap-3 border-b border-border pb-4">
        <span className="grid size-12 place-items-center rounded-full bg-[#6555ee] text-xl font-semibold">A</span>
        <div><p className="font-semibold text-heading">Aung</p><p className="text-sm text-muted">aung@example.com</p></div>
      </div>
      <div className="space-y-1 py-3">
        <Link className="block rounded-lg px-3 py-3 text-heading hover:bg-white/5" onClick={onClose} to="/upload">Upload Document</Link>
        <Link className="block rounded-lg px-3 py-3 text-heading hover:bg-white/5" onClick={onClose} to="/settings">Settings</Link>
      </div>
      <button className="w-full border-t border-border px-3 pt-4 text-left text-heading" onClick={onClose} type="button">Log Out</button>
    </div>
  )
}
