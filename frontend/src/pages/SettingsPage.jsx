import { useState } from 'react'
import Icon from '../components/ui/Icon.jsx'
import PageHeading from '../components/ui/PageHeading.jsx'

const inputClasses = 'h-11 w-full min-w-0 rounded-lg border border-border bg-[#202a47] px-3 text-sm text-heading outline-none focus:border-primary-border'
const SETTINGS_STORAGE_KEY = 'docmind.account-settings.v1'
const DEFAULT_ACCOUNT = { name: 'Aung', email: 'aung@example.com', password: 'docmind123' }

// Prototype-only: this browser storage keeps the password in plain text.
// Production must persist credentials through an authenticated backend instead.
function readAccountSettings() {
  try {
    const stored = window.localStorage.getItem(SETTINGS_STORAGE_KEY)
    if (!stored) return { ...DEFAULT_ACCOUNT }

    const parsed = JSON.parse(stored)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return { ...DEFAULT_ACCOUNT }

    return {
      name: typeof parsed.name === 'string' ? parsed.name : DEFAULT_ACCOUNT.name,
      email: typeof parsed.email === 'string' ? parsed.email : DEFAULT_ACCOUNT.email,
      password: typeof parsed.password === 'string' ? parsed.password : DEFAULT_ACCOUNT.password,
    }
  } catch {
    return { ...DEFAULT_ACCOUNT }
  }
}

export default function SettingsPage() {
  const [account, setAccount] = useState(readAccountSettings)
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [feedback, setFeedback] = useState('')

  function handleFieldChange(field, value) {
    setAccount((current) => ({ ...current, [field]: value }))
  }

  function handleSave(event) {
    event.preventDefault()

    try {
      window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(account))
      setFeedback('Account changes saved.')
    } catch {
      setFeedback('Unable to save changes in this browser.')
    }
  }

  return (
    <section className="mx-auto w-full max-w-[1290px] px-6 pb-12 pt-10 lg:px-0">
      <PageHeading title="Settings" subtitle="Manage your account information and security settings." />

      <form className="mt-10 min-h-[360px] rounded-xl border border-border bg-surface px-6 py-6 sm:px-8" onSubmit={handleSave}>
        <h2 className="text-2xl font-semibold">Account</h2>
        <p className="mt-2 text-sm text-muted">Update your account information and security settings.</p>

        <div className="account-fields mt-6 grid gap-4 lg:grid-cols-[200px_minmax(0,480px)] lg:items-center lg:gap-x-10">
          <label className="text-sm font-medium" htmlFor="account-name">Name</label>
          <input className={inputClasses} id="account-name" onChange={(event) => handleFieldChange('name', event.target.value)} value={account.name} />

          <label className="text-sm font-medium" htmlFor="account-email">Email</label>
          <input className={inputClasses} id="account-email" onChange={(event) => handleFieldChange('email', event.target.value)} type="email" value={account.email} />

          <label className="text-sm font-medium" htmlFor="account-password">Password</label>
          <div className="grid min-w-0 gap-3 sm:grid-cols-[minmax(0,1fr)_150px]">
            <div className="relative min-w-0">
              <input className={`${inputClasses} pr-12`} id="account-password" onChange={(event) => handleFieldChange('password', event.target.value)} type={passwordVisible ? 'text' : 'password'} value={account.password} />
              <button aria-label={passwordVisible ? 'Hide password' : 'Show password'} className="absolute right-0 top-0 grid size-11 place-items-center rounded-lg text-heading transition-colors hover:bg-white/5" onClick={() => setPasswordVisible((visible) => !visible)} type="button">
                <Icon name={passwordVisible ? 'eyeOff' : 'eye'} size={18} />
              </button>
            </div>
            <button className="h-11 rounded-lg border border-border bg-[#202a47] text-sm font-medium transition-colors hover:bg-white/5" onClick={() => setFeedback(`Password change link sent to ${account.email}.`)} type="button">Change Password</button>
          </div>

          <div className="flex justify-end lg:col-start-2">
            <button className="h-11 w-full rounded-lg border border-primary-border bg-primary text-sm font-semibold text-heading transition-colors hover:bg-primary/90 sm:w-auto sm:px-6" type="submit">Save Changes</button>
          </div>

          {feedback && <p aria-live="polite" className="max-w-[480px] break-all rounded-lg border border-border bg-[#202a47] px-4 py-3 text-sm lg:col-start-2">{feedback}</p>}
        </div>
      </form>
    </section>
  )
}
