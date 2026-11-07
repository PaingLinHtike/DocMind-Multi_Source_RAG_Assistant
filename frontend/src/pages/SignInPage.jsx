import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { validateCredentials } from '../auth/auth.js'
import { useAuth } from '../auth/authSessionStore.js'
import AuthField from '../components/auth/AuthField.jsx'
import AuthLayout from '../components/auth/AuthLayout.jsx'
import Button from '../components/ui/Button.jsx'
import Icon from '../components/ui/Icon.jsx'

export default function SignInPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [error, setError] = useState('')

  function handleSubmit(event) {
    event.preventDefault()
    if (!email.trim() || !password) {
      setError('Enter your email and password.')
      return
    }
    if (!validateCredentials(email, password)) {
      setError('Email or password is incorrect.')
      return
    }
    login()
    navigate('/dashboard', { replace: true })
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

      {location.state?.signupComplete && <p className="mt-5 rounded-[2px] border border-success bg-success-soft px-4 py-3 text-sm text-success" role="status">Sign-up complete. This demo does not create accounts; use the demo credentials to sign in.</p>}

      <form className="mt-6 space-y-4" noValidate onSubmit={handleSubmit}>
        <AuthField autoComplete="email" id="signin-email" icon="mail" label="Email" onChange={(event) => { setEmail(event.target.value); setError('') }} placeholder="you@example.com" type="email" value={email} />
        <AuthField autoComplete="current-password" id="signin-password" icon="lock" label="Password" onChange={(event) => { setPassword(event.target.value); setError('') }} placeholder="Enter your password" trailingControl={passwordToggle} type={passwordVisible ? 'text' : 'password'} value={password} />

        {error && <p className="rounded-[2px] border border-danger bg-danger-soft px-4 py-3 text-sm text-danger" role="alert">{error}</p>}

        <div className="flex min-h-11 items-center text-sm">
          <button className="ml-auto min-h-11 px-1 font-medium text-accent transition-colors hover:text-accent-hover" type="button">Forgot password?</button>
        </div>

        <Button className="w-full" size="large" type="submit">Sign in</Button>
      </form>

      <p className="mt-7 text-center text-base text-text-secondary">Don't have an account? <Link className="ml-2 font-semibold text-accent no-underline hover:text-accent-hover" to="/signup">Create account</Link></p>
    </AuthLayout>
  )
}
