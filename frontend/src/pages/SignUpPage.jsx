import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getPasswordValidation } from '../auth/auth.js'
import AuthField from '../components/auth/AuthField.jsx'
import AuthLayout from '../components/auth/AuthLayout.jsx'
import Icon from '../components/ui/Icon.jsx'

const initialForm = { name: '', email: '', password: '', confirmation: '', termsAccepted: false }
const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function SignUpPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState({})
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [confirmationVisible, setConfirmationVisible] = useState(false)

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: '' }))
  }

  function handleSubmit(event) {
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
    if (Object.keys(nextErrors).length === 0) navigate('/signin', { state: { signupComplete: true } })
  }

  function visibilityToggle(field) {
    const isConfirmation = field === 'confirmation'
    const visible = isConfirmation ? confirmationVisible : passwordVisible
    const setVisible = isConfirmation ? setConfirmationVisible : setPasswordVisible
    const label = isConfirmation ? 'confirm password' : 'password'

    return (
      <button
        aria-label={`${visible ? 'Hide' : 'Show'} ${label}`}
        className="mr-1 grid size-11 shrink-0 place-items-center rounded-lg text-muted transition-colors hover:bg-white/5 hover:text-heading"
        onClick={() => setVisible((current) => !current)}
        type="button"
      >
        <Icon name={visible ? 'eyeOff' : 'eye'} size={20} />
      </button>
    )
  }

  return (
    <AuthLayout variant="signup">
      <h1 className="text-3xl font-bold leading-tight sm:text-4xl">Create your account</h1>
      <p className="mt-2 text-base text-muted sm:text-lg">Start building your private AI knowledge workspace.</p>

      <form className="mt-5 space-y-3" noValidate onSubmit={handleSubmit}>
        <AuthField autoComplete="name" error={errors.name} id="signup-name" icon="user" label="Full Name" onChange={(event) => updateField('name', event.target.value)} placeholder="Full Name" type="text" value={form.name} />
        <AuthField autoComplete="email" error={errors.email} id="signup-email" icon="mail" label="Email" onChange={(event) => updateField('email', event.target.value)} placeholder="Email" type="email" value={form.email} />
        <AuthField autoComplete="new-password" error={errors.password} id="signup-password" icon="lock" label="Password" onChange={(event) => updateField('password', event.target.value)} placeholder="Password" trailingControl={visibilityToggle('password')} type={passwordVisible ? 'text' : 'password'} value={form.password} />
        <AuthField autoComplete="new-password" error={errors.confirmation} id="signup-confirm-password" icon="lock" label="Confirm Password" onChange={(event) => updateField('confirmation', event.target.value)} placeholder="Confirm Password" trailingControl={visibilityToggle('confirmation')} type={confirmationVisible ? 'text' : 'password'} value={form.confirmation} />

        <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm text-muted">
          <input aria-describedby={errors.termsAccepted ? 'signup-terms-error' : undefined} aria-invalid={Boolean(errors.termsAccepted)} checked={form.termsAccepted} className="size-5 shrink-0 accent-[#7544f5]" onChange={(event) => updateField('termsAccepted', event.target.checked)} type="checkbox" />
          <span>I agree to the <span className="font-medium text-[#c07aff]">Terms</span> and <span className="font-medium text-[#c07aff]">Privacy Policy</span></span>
        </label>
        {errors.termsAccepted && <p className="text-sm text-red-300" id="signup-terms-error" role="alert">{errors.termsAccepted}</p>}

        <button className="min-h-12 w-full rounded-xl border border-[#9a62ff] bg-gradient-to-r from-[#7544f5] to-[#6831ef] text-base font-semibold text-white transition-colors hover:from-[#8153f7] hover:to-[#7544f5]" type="submit">Create Account</button>
      </form>

      <p className="mt-6 text-center text-base text-muted">Already have an account? <Link className="ml-2 font-semibold text-[#c07aff] no-underline hover:text-[#d7aaff]" to="/signin">Sign In</Link></p>
    </AuthLayout>
  )
}
