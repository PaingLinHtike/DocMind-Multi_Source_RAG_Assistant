import { useState } from 'react'
import Button from '../components/ui/Button.jsx'
import Field from '../components/ui/Field.jsx'
import Icon from '../components/ui/Icon.jsx'
import PageHeading from '../components/ui/PageHeading.jsx'

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
  const [feedbackVersion, setFeedbackVersion] = useState(0)

  function announceFeedback(message) {
    setFeedback(message)
    setFeedbackVersion((version) => version + 1)
  }

  function handleFieldChange(field, value) {
    setAccount((current) => ({ ...current, [field]: value }))
    setFeedback('')
  }

  function handleSave(event) {
    event.preventDefault()

    try {
      window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(account))
      announceFeedback('Account changes saved.')
    } catch {
      announceFeedback('Unable to save changes in this browser.')
    }
  }

  return (
    <section className="mx-auto w-full max-w-[1290px] px-6 pb-12 pt-10 lg:px-8">
      <PageHeading title="Settings" subtitle="Manage your account information and security settings." />

      <form className="mt-10 min-h-[360px] border-t border-border py-8" onSubmit={handleSave}>
        <h2 className="font-display text-2xl font-medium">Account</h2>
        <p className="mt-2 text-sm text-text-secondary">Update your account information and security settings.</p>

        <div className="account-fields mt-6 grid w-full max-w-[480px] gap-5">
          <Field
            id="account-name"
            label="Name"
            leadingIcon={<Icon className="text-text-secondary" name="user" />}
            onChange={(event) => handleFieldChange('name', event.target.value)}
            value={account.name}
          />

          <Field
            id="account-email"
            label="Email"
            leadingIcon={<Icon className="text-text-secondary" name="mail" />}
            onChange={(event) => handleFieldChange('email', event.target.value)}
            type="email"
            value={account.email}
          />

          <div className="grid min-w-0 gap-3 sm:grid-cols-[minmax(0,1fr)_150px] sm:items-end">
            <Field
              className="min-w-0"
              id="account-password"
              inputClassName="pr-1"
              label="Password"
              leadingIcon={<Icon className="text-text-secondary" name="lock" />}
              onChange={(event) => handleFieldChange('password', event.target.value)}
              trailingControl={(
                <button aria-label={passwordVisible ? 'Hide password' : 'Show password'} className="grid size-11 place-items-center rounded-[2px] text-text-secondary transition-colors hover:bg-surface-muted hover:text-accent" onClick={() => setPasswordVisible((visible) => !visible)} type="button">
                  <Icon name={passwordVisible ? 'eyeOff' : 'eye'} size={18} />
                </button>
              )}
              type={passwordVisible ? 'text' : 'password'}
              value={account.password}
            />
            <Button className="w-full" onClick={() => announceFeedback(`Password change link sent to ${account.email}.`)} type="button" variant="secondary">Change password</Button>
          </div>

          <div className="flex justify-start">
            <Button className="w-full sm:w-auto" type="submit">Save changes</Button>
          </div>

          <p aria-atomic="true" aria-live="polite" className={feedback ? 'max-w-[480px] rounded-[2px] border-l-2 border-accent bg-surface px-4 py-3 text-sm text-text' : 'sr-only'} role="status">
            <span className="break-all" key={feedbackVersion}>{feedback}</span>
          </p>
        </div>
      </form>
    </section>
  )
}
