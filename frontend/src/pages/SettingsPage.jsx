import { useState } from 'react'
import { updatePassword, updateProfile } from '../api/account.js'
import { useAuth } from '../auth/authSessionStore.js'
import Button from '../components/ui/Button.jsx'
import Field from '../components/ui/Field.jsx'
import Icon from '../components/ui/Icon.jsx'
import PageHeading from '../components/ui/PageHeading.jsx'

const emptyPassword = { currentPassword: '', password: '', passwordConfirmation: '' }

function firstErrors(errors, fieldMap = {}) {
  return Object.fromEntries(Object.entries(errors || {}).map(([field, messages]) => [fieldMap[field] || field, messages[0]]))
}

export default function SettingsPage() {
  const { user, refreshUser, handleUnauthorized } = useAuth()
  const [profile, setProfile] = useState({ name: user?.name || '', email: user?.email || '' })
  const [password, setPassword] = useState(emptyPassword)
  const [profileErrors, setProfileErrors] = useState({})
  const [passwordErrors, setPasswordErrors] = useState({})
  const [profileFeedback, setProfileFeedback] = useState('')
  const [passwordFeedback, setPasswordFeedback] = useState('')
  const [profilePending, setProfilePending] = useState(false)
  const [passwordPending, setPasswordPending] = useState(false)
  const [passwordVisible, setPasswordVisible] = useState(false)

  function changeProfile(field, value) {
    setProfile((current) => ({ ...current, [field]: value }))
    setProfileErrors((current) => ({ ...current, [field]: '' }))
    setProfileFeedback('')
  }

  function changePassword(field, value) {
    setPassword((current) => ({ ...current, [field]: value }))
    setPasswordErrors((current) => ({ ...current, [field]: '' }))
    setPasswordFeedback('')
  }

  async function handleProfileSubmit(event) {
    event.preventDefault()
    setProfilePending(true); setProfileErrors({}); setProfileFeedback('')
    try {
      await updateProfile({ name: profile.name.trim(), email: profile.email.trim().toLocaleLowerCase() })
      const refreshedUser = await refreshUser()
      setProfile({ name: refreshedUser.name, email: refreshedUser.email })
      setProfileFeedback('Account changes saved.')
    } catch (requestError) {
      if (!handleUnauthorized(requestError)) {
        const errors = firstErrors(requestError.errors)
        setProfileErrors(errors)
        if (Object.keys(errors).length === 0) setProfileFeedback(requestError.message)
      }
    } finally { setProfilePending(false) }
  }

  async function handlePasswordSubmit(event) {
    event.preventDefault()
    setPasswordPending(true); setPasswordErrors({}); setPasswordFeedback('')
    try {
      await updatePassword(password)
      setPassword(emptyPassword)
      setPasswordFeedback('Password updated.')
    } catch (requestError) {
      if (!handleUnauthorized(requestError)) {
        const errors = firstErrors(requestError.errors, { current_password: 'currentPassword', password_confirmation: 'passwordConfirmation' })
        setPasswordErrors(errors)
        if (Object.keys(errors).length === 0) setPasswordFeedback(requestError.message)
      }
    } finally { setPasswordPending(false) }
  }

  const passwordType = passwordVisible ? 'text' : 'password'
  const passwordToggle = (
    <button aria-label={passwordVisible ? 'Hide passwords' : 'Show passwords'} className="grid size-11 place-items-center rounded-[2px] text-text-secondary transition-colors hover:bg-surface-muted hover:text-accent" onClick={() => setPasswordVisible((visible) => !visible)} type="button">
      <Icon name={passwordVisible ? 'eyeOff' : 'eye'} size={18} />
    </button>
  )

  return (
    <section className="mx-auto w-full max-w-[1290px] px-6 pb-12 pt-10 lg:px-8">
      <PageHeading title="Settings" subtitle="Manage your account information and security settings." />

      <form className="mt-10 border-t border-border py-8" onSubmit={handleProfileSubmit}>
        <h2 className="font-display text-2xl font-medium">Account</h2>
        <p className="mt-2 text-sm text-text-secondary">Update your account information.</p>
        <div className="account-fields mt-6 grid w-full max-w-[480px] gap-5">
          <Field error={profileErrors.name} id="account-name" label="Name" leadingIcon="user" onChange={(event) => changeProfile('name', event.target.value)} value={profile.name} />
          <Field error={profileErrors.email} id="account-email" label="Email" leadingIcon="mail" onChange={(event) => changeProfile('email', event.target.value)} type="email" value={profile.email} />
          <div className="flex justify-start"><Button className="w-full sm:w-auto" disabled={profilePending} type="submit">{profilePending ? 'Saving…' : 'Save changes'}</Button></div>
          {profileFeedback && <p aria-live="polite" className={`max-w-[480px] break-all border-l-2 px-4 py-3 text-sm ${Object.keys(profileErrors).length ? 'border-danger bg-danger-soft text-danger' : 'border-accent bg-surface text-text'}`} role={Object.keys(profileErrors).length ? 'alert' : 'status'}>{profileFeedback}</p>}
        </div>
      </form>

      <form className="border-t border-border py-8" onSubmit={handlePasswordSubmit}>
        <h2 className="font-display text-2xl font-medium">Security</h2>
        <p className="mt-2 text-sm text-text-secondary">Choose a strong new password for your account.</p>
        <div className="mt-6 grid w-full max-w-[480px] gap-5">
          <Field autoComplete="current-password" error={passwordErrors.currentPassword} id="current-password" label="Current Password" leadingIcon="lock" onChange={(event) => changePassword('currentPassword', event.target.value)} type={passwordType} value={password.currentPassword} />
          <Field autoComplete="new-password" error={passwordErrors.password} id="new-password" label="New Password" leadingIcon="lock" onChange={(event) => changePassword('password', event.target.value)} trailingControl={passwordToggle} type={passwordType} value={password.password} />
          <Field autoComplete="new-password" error={passwordErrors.passwordConfirmation} id="confirm-new-password" label="Confirm New Password" leadingIcon="lock" onChange={(event) => changePassword('passwordConfirmation', event.target.value)} type={passwordType} value={password.passwordConfirmation} />
          <div className="flex justify-start"><Button className="w-full sm:w-auto" disabled={passwordPending} type="submit" variant="secondary">{passwordPending ? 'Changing…' : 'Change password'}</Button></div>
          {passwordFeedback && <p aria-live="polite" className={`max-w-[480px] break-all border-l-2 px-4 py-3 text-sm ${Object.keys(passwordErrors).length ? 'border-danger bg-danger-soft text-danger' : 'border-accent bg-surface text-text'}`} role={Object.keys(passwordErrors).length ? 'alert' : 'status'}>{passwordFeedback}</p>}
        </div>
      </form>
    </section>
  )
}
