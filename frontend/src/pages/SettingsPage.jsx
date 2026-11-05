import { useState } from 'react'
import Icon from '../components/ui/Icon.jsx'
import PageHeading from '../components/ui/PageHeading.jsx'

const inputClasses = 'h-11 w-full min-w-0 rounded-lg border border-border bg-[#202a47] px-3 text-sm text-heading outline-none focus:border-primary-border'

export default function SettingsPage() {
  const [name, setName] = useState('Aung')
  const [email, setEmail] = useState('aung@example.com')
  const [password, setPassword] = useState('docmind123')
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [feedback, setFeedback] = useState('')

  return (
    <section className="mx-auto w-full max-w-[1290px] px-6 pb-12 pt-10 lg:px-0">
      <PageHeading title="Settings" subtitle="Manage your account information and security settings." />

      <div className="mt-10 min-h-[360px] rounded-xl border border-border bg-surface px-6 py-6 sm:px-8">
        <h2 className="text-2xl font-semibold">Account</h2>
        <p className="mt-2 text-sm text-muted">Update your account information and security settings.</p>

        <div className="mt-6 grid gap-4 lg:grid-cols-[200px_minmax(0,866px)] lg:items-center lg:gap-x-10">
          <label className="text-sm font-medium" htmlFor="account-name">Name</label>
          <input className={inputClasses} id="account-name" onChange={(event) => setName(event.target.value)} value={name} />

          <label className="text-sm font-medium" htmlFor="account-email">Email</label>
          <input className={inputClasses} id="account-email" onChange={(event) => setEmail(event.target.value)} type="email" value={email} />

          <label className="text-sm font-medium" htmlFor="account-password">Password</label>
          <div className="grid min-w-0 gap-3 sm:grid-cols-[minmax(0,626px)_272px]">
            <div className="relative min-w-0">
              <input className={`${inputClasses} pr-12`} id="account-password" onChange={(event) => setPassword(event.target.value)} type={passwordVisible ? 'text' : 'password'} value={password} />
              <button aria-label={passwordVisible ? 'Hide password' : 'Show password'} className="absolute right-0 top-0 grid size-11 place-items-center rounded-lg text-heading transition-colors hover:bg-white/5" onClick={() => setPasswordVisible((visible) => !visible)} type="button">
                <Icon name={passwordVisible ? 'eyeOff' : 'eye'} size={18} />
              </button>
            </div>
            <button className="h-11 rounded-lg border border-border bg-[#202a47] text-sm font-medium transition-colors hover:bg-white/5" onClick={() => setFeedback(`Password change link sent to ${email}.`)} type="button">Change Password</button>
          </div>
        </div>

        {feedback && <p aria-live="polite" className="ml-auto mt-4 max-w-[866px] rounded-lg border border-border bg-[#202a47] px-4 py-3 text-sm">{feedback}</p>}
      </div>
    </section>
  )
}
