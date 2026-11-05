import { useState } from 'react'
import PageHeading from '../components/ui/PageHeading.jsx'

const inputClasses = 'h-[51px] w-full rounded-[11px] border border-border bg-[#202a47] px-4 text-[15px] text-heading outline-none focus:border-primary-border'

export default function SettingsPage() {
  const [name, setName] = useState('Aung')
  const [email, setEmail] = useState('aung@example.com')
  const [password, setPassword] = useState('docmind123')
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [feedback, setFeedback] = useState('')

  return (
    <section className="mx-auto w-full max-w-[1290px] px-6 pb-12 pt-[41px] lg:px-0">
      <PageHeading title="Settings" subtitle="Manage your account information and security settings." />

      <div className="mt-[87px] min-h-[397px] rounded-[17px] border border-border bg-surface px-6 py-7 sm:px-8 lg:px-11">
        <h2 className="text-3xl font-semibold">Account</h2>
        <p className="mt-2 text-[17px] text-muted">Update your account information and security settings.</p>

        <div className="mt-8 grid gap-4 lg:grid-cols-[200px_minmax(0,866px)] lg:items-center lg:gap-x-11">
          <label className="text-[17px] font-medium" htmlFor="account-name">Name</label>
          <input className={inputClasses} id="account-name" onChange={(event) => setName(event.target.value)} value={name} />

          <label className="text-[17px] font-medium" htmlFor="account-email">Email</label>
          <input className={inputClasses} id="account-email" onChange={(event) => setEmail(event.target.value)} type="email" value={email} />

          <label className="text-[17px] font-medium" htmlFor="account-password">Password</label>
          <div className="grid gap-3 sm:grid-cols-[minmax(0,626px)_272px]">
            <div className="relative">
              <input className={`${inputClasses} pr-14`} id="account-password" onChange={(event) => setPassword(event.target.value)} type={passwordVisible ? 'text' : 'password'} value={password} />
              <button aria-label={passwordVisible ? 'Hide password' : 'Show password'} className="absolute right-1 top-1 grid size-[43px] place-items-center rounded-lg text-xl text-heading hover:bg-white/5" onClick={() => setPasswordVisible((visible) => !visible)} type="button"><span aria-hidden="true">◉</span></button>
            </div>
            <button className="h-[50px] rounded-[13px] border border-border bg-[#202a47] text-sm font-semibold hover:bg-white/5" onClick={() => setFeedback(`Password change link sent to ${email}.`)} type="button">Change Password</button>
          </div>
        </div>

        {feedback && <p aria-live="polite" className="ml-auto mt-4 max-w-[866px] rounded-lg border border-border bg-[#202a47] px-4 py-3 text-sm">{feedback}</p>}
      </div>
    </section>
  )
}
