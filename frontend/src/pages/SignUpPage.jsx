import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getPasswordValidation } from '../auth/auth.js'
import { useAuth } from '../auth/authSessionStore.js'
import AuthField from '../components/auth/AuthField.jsx'
import AuthLayout from '../components/auth/AuthLayout.jsx'
import PasswordRequirements from '../components/auth/PasswordRequirements.jsx'
import Button from '../components/ui/Button.jsx'
import Icon from '../components/ui/Icon.jsx'

const initialForm = { name: '', email: '', password: '', confirmation: '', termsAccepted: false }
const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function SignUpPage() {
  const navigate = useNavigate()
  const { register } = useAuth()
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState({})
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [confirmationVisible, setConfirmationVisible] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: '' }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const nextErrors = {}
    if (!form.name.trim()) nextErrors.name = 'Enter your full name.'
    if (!validEmail.test(form.email.trim())) nextErrors.email = 'Enter a valid email address.'
    if (!form.password) nextErrors.password = 'Enter a password.'
    else if (!getPasswordValidation(form.password).valid) nextErrors.password = 'Use 8+ characters with uppercase, lowercase, number, and symbol.'
    if (!form.confirmation) nextErrors.confirmation = 'Confirm your password.'
    else if (form.password !== form.confirmation) nextErrors.confirmation = 'Passwords do not match.'
    if (!form.termsAccepted) nextErrors.termsAccepted = 'Accept the Terms and Privacy Policy.'

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setSubmitting(true)
    setFormError('')
    try {
      await register({
        name: form.name.trim(),
        email: form.email.trim().toLocaleLowerCase(),
        password: form.password,
        password_confirmation: form.confirmation,
        terms_accepted: form.termsAccepted,
      })
      navigate('/dashboard', { replace: true })
    } catch (requestError) {
      const serverErrors = Object.fromEntries(Object.entries(requestError.errors || {}).map(([field, messages]) => [field === 'password_confirmation' ? 'confirmation' : field, messages[0]]))
      setErrors(serverErrors)
      if (Object.keys(serverErrors).length === 0) setFormError(requestError.message)
    } finally {
      setSubmitting(false)
    }
  }

  function visibilityToggle(field) {
    const isConfirmation = field === 'confirmation'
    const visible = isConfirmation ? confirmationVisible : passwordVisible
    const setVisible = isConfirmation ? setConfirmationVisible : setPasswordVisible
    const label = isConfirmation ? 'confirm password' : 'password'

    return (
      <button
        aria-label={`${visible ? 'Hide' : 'Show'} ${label}`}
        className="mr-1 grid size-11 shrink-0 place-items-center rounded-[2px] text-text-muted transition-colors hover:bg-surface-muted hover:text-text"
        onClick={() => setVisible((current) => !current)}
        type="button"
      >
        <Icon name={visible ? 'eyeOff' : 'eye'} size={20} />
      </button>
    )
  }

  return (
    <AuthLayout variant="signup">
      <h1 className="font-display text-[2rem] font-medium leading-[1.1] text-text lg:text-[2.5rem]">Create your account</h1>
      <p className="mt-2 text-base text-text-secondary">Start building your private AI knowledge workspace.</p>

      <form className="mt-5 space-y-3" noValidate onSubmit={handleSubmit}>
        <AuthField autoComplete="name" error={errors.name} id="signup-name" icon="user" label="Full name" onChange={(event) => updateField('name', event.target.value)} placeholder="Full name" type="text" value={form.name} />
        <AuthField autoComplete="email" error={errors.email} id="signup-email" icon="mail" label="Email" onChange={(event) => updateField('email', event.target.value)} placeholder="Email" type="email" value={form.email} />
        <AuthField autoComplete="new-password" description={<PasswordRequirements password={form.password} />} error={errors.password} id="signup-password" icon="lock" label="Password" onChange={(event) => updateField('password', event.target.value)} placeholder="Password" trailingControl={visibilityToggle('password')} type={passwordVisible ? 'text' : 'password'} value={form.password} />
        <AuthField autoComplete="new-password" error={errors.confirmation} id="signup-confirm-password" icon="lock" label="Confirm password" onChange={(event) => updateField('confirmation', event.target.value)} placeholder="Confirm password" trailingControl={visibilityToggle('confirmation')} type={confirmationVisible ? 'text' : 'password'} value={form.confirmation} />

        <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm text-text-secondary">
          <input aria-describedby={errors.termsAccepted ? 'signup-terms-error' : undefined} aria-invalid={Boolean(errors.termsAccepted)} checked={form.termsAccepted} className="size-5 shrink-0 accent-accent" onChange={(event) => updateField('termsAccepted', event.target.checked)} type="checkbox" />
          <span>I agree to the <span className="font-medium text-accent">Terms</span> and <span className="font-medium text-accent">Privacy Policy</span></span>
        </label>
        {errors.termsAccepted && <p className="text-sm text-danger" id="signup-terms-error" role="alert">{errors.termsAccepted}</p>}
        {formError && <p className="rounded-[2px] border border-danger bg-danger-soft px-4 py-3 text-sm text-danger" role="alert">{formError}</p>}

        <Button className="w-full" disabled={submitting} size="large" type="submit">{submitting ? 'Creating account…' : 'Create account'}</Button>
      </form>

      <p className="mt-6 text-center text-base text-text-secondary">Already have an account? <Link className="ml-2 font-semibold text-accent no-underline hover:text-accent-hover" to="/signin">Sign in</Link></p>
    </AuthLayout>
  )
}
