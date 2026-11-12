import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/authSessionStore.js'
import Icon from '../ui/Icon.jsx'

const menuRow = 'flex min-h-11 items-center gap-3 rounded-[2px] px-3 text-sm font-medium text-text no-underline transition-colors hover:bg-surface-muted'

export default function ProfileMenu({ onClose }) {
  const navigate = useNavigate()
  const { logout, user } = useAuth()
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleLogout() {
    setSubmitting(true)
    setError('')
    try {
      await logout()
      onClose()
      navigate('/signin', { replace: true })
    } catch (requestError) {
      setError(requestError.message)
      setSubmitting(false)
    }
  }

  return (
    <div className="menu-enter absolute right-0 top-14 z-50 flex w-72 flex-col rounded-[2px] border border-border-strong bg-surface p-2" role="menu">
      <div className="flex items-center gap-3 border-b border-border px-2 pb-3 pt-1">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-accent text-sm font-semibold text-white">{user?.name?.trim().charAt(0).toLocaleUpperCase() || '?'}</span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-text">{user?.name}</p>
          <p className="truncate text-xs text-text-muted">{user?.email}</p>
        </div>
      </div>
      <div className="mt-2">
        <Link className={menuRow} onClick={onClose} to="/upload"><Icon name="upload" size={18} /><span>Upload document</span></Link>
        <Link className={menuRow} onClick={onClose} to="/settings"><Icon name="settings" size={18} /><span>Settings</span></Link>
      </div>
      {error && <p className="mt-2 text-sm text-danger" role="alert">{error}</p>}
      <button className="mt-2 flex min-h-11 w-full items-center gap-3 rounded-[2px] bg-danger-soft px-3 text-sm font-medium text-danger transition-colors hover:bg-danger-soft-hover disabled:opacity-60" disabled={submitting} onClick={handleLogout} type="button"><Icon name="logout" size={18} /><span>{submitting ? 'Logging out…' : 'Log out'}</span></button>
    </div>
  )
}
