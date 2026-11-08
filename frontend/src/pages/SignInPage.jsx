import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { requestPasswordReset } from '../api/auth.js'
import { useAuth } from '../auth/authSessionStore.js'
import AuthField from '../components/auth/AuthField.jsx'
import AuthLayout from '../components/auth/AuthLayout.jsx'
import Button from '../components/ui/Button.jsx'
import Icon from '../components/ui/Icon.jsx'

export default function SignInPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [feedback, setFeedback] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    if (!email.trim() || !password) {
      setError('Enter your email and password.')
      return
    }

    setSubmitting(true)
    setError('')
    setFieldErrors({})
    try {
      await login({ email: email.trim().toLocaleLowerCase(), password })
      navigate('/dashboard', { replace: true })
    } catch (requestError) {
      const errors = Object.fromEntries(Object.entries(requestError.errors || {}).map(([field, messages]) => [field, messages[0]]))
      setFieldErrors(errors)
      if (Object.keys(errors).length === 0) setError(requestError.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleForgotPassword() {
    const normalizedEmail = email.trim().toLocaleLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setFieldErrors({ email: 'Enter a valid email address.' })
      return
    }

    setSubmitting(true)
    setError('')
    setFeedback('')
    try {
      const response = await requestPasswordReset(normalizedEmail)
      setFeedback(response.message)
    } catch (requestError) {
      const emailError = requestError.errors?.email?.[0]
      if (emailError) setFieldErrors({ email: emailError })
      else setError(requestError.message)
    } finally {
      setSubmitting(false)
    }
  }

  const passwordToggle = (
    <button
      aria-label={passwordVisible ? 'Hide password' : 'Show password'}
      className="mr-1 grid size-11 shrink-0 place-items-center rounded-[2px] text-text-muted transition-colors hover:bg-surface-muted hover:text-text"
      onClick={() => setPasswordVisible((visible) => !visible)}
      type="button"
    >
      <Icon name={passwordVisible ? 'eyeOff' : 'eye'} size={20} />
    </button>
  )

  return (
    <AuthLayout variant="signin">
      <h1 className="font-display text-[2rem] font-medium leading-[1.1] text-text lg:text-[2.5rem]">Welcome back</h1>
      <p className="mt-2 text-base text-text-secondary">Sign in to access your AI document workspace.</p>

      <form className="mt-6 space-y-4" noValidate onSubmit={handleSubmit}>
        <AuthField autoComplete="email" error={fieldErrors.email} id="signin-email" icon="mail" label="Email" onChange={(event) => { setEmail(event.target.value); setError(''); setFieldErrors((current) => ({ ...current, email: '' })) }} placeholder="you@example.com" type="email" value={email} />
        <AuthField autoComplete="current-password" id="signin-password" icon="lock" label="Password" onChange={(event) => { setPassword(event.target.value); setError('') }} placeholder="Enter your password" trailingControl={passwordToggle} type={passwordVisible ? 'text' : 'password'} value={password} />

        {error && <p className="rounded-[2px] border border-danger bg-danger-soft px-4 py-3 text-sm text-danger" role="alert">{error}</p>}
        {feedback && <p className="rounded-[2px] border border-success bg-success-soft px-4 py-3 text-sm text-success" role="status">{feedback}</p>}

        <div className="flex min-h-11 items-center text-sm">
          <button className="ml-auto min-h-11 px-1 font-medium text-accent transition-colors hover:text-accent-hover disabled:opacity-60" disabled={submitting} onClick={handleForgotPassword} type="button">Forgot password?</button>
        </div>

        <Button className="w-full" disabled={submitting} size="large" type="submit">{submitting ? 'Signing in…' : 'Sign in'}</Button>
      </form>

      <p className="mt-7 text-center text-base text-text-secondary">Don't have an account? <Link className="ml-2 font-semibold text-accent no-underline hover:text-accent-hover" to="/signup">Create account</Link></p>
    </AuthLayout>
  )
}
