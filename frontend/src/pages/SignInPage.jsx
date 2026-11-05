import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { validateCredentials } from '../auth/auth.js'
import AuthField from '../components/auth/AuthField.jsx'
import AuthLayout from '../components/auth/AuthLayout.jsx'
import Icon from '../components/ui/Icon.jsx'

export default function SignInPage() {
  const navigate = useNavigate()
  const location = useLocation()
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
    navigate('/')
  }

  const passwordToggle = (
    <button
      aria-label={passwordVisible ? 'Hide password' : 'Show password'}
      className="mr-1 grid size-11 shrink-0 place-items-center rounded-lg text-muted transition-colors hover:bg-white/5 hover:text-heading"
      onClick={() => setPasswordVisible((visible) => !visible)}
      type="button"
    >
      <Icon name={passwordVisible ? 'eyeOff' : 'eye'} size={20} />
    </button>
  )

  return (
    <AuthLayout variant="signin">
      <h1 className="text-3xl font-bold leading-tight sm:text-4xl">Welcome back</h1>
      <p className="mt-2 text-base text-muted sm:text-lg">Sign in to access your AI document workspace.</p>

      {location.state?.signupComplete && <p className="mt-5 rounded-lg border border-success/50 bg-success/10 px-4 py-3 text-sm text-heading" role="status">Sign-up complete. This demo does not create accounts; use the demo credentials to sign in.</p>}

      <form className="mt-6 space-y-4" noValidate onSubmit={handleSubmit}>
        <AuthField autoComplete="email" id="signin-email" icon="mail" label="Email" onChange={(event) => { setEmail(event.target.value); setError('') }} placeholder="you@example.com" type="email" value={email} />
        <AuthField autoComplete="current-password" id="signin-password" icon="lock" label="Password" onChange={(event) => { setPassword(event.target.value); setError('') }} placeholder="Enter your password" trailingControl={passwordToggle} type={passwordVisible ? 'text' : 'password'} value={password} />

        {error && <p className="rounded-lg border border-red-400/50 bg-red-500/10 px-4 py-3 text-sm text-red-200" role="alert">{error}</p>}

        <div className="flex min-h-11 flex-wrap items-center justify-between gap-2 text-sm">
          <label className="flex min-h-11 cursor-pointer items-center gap-3">
            <input className="size-5 accent-[#7544f5]" type="checkbox" />
            <span>Remember me</span>
          </label>
          <button className="min-h-11 px-1 font-medium text-[#c07aff] transition-colors hover:text-[#d7aaff]" type="button">Forgot password?</button>
        </div>

        <button className="min-h-12 w-full rounded-xl border border-[#9a62ff] bg-gradient-to-r from-[#7544f5] to-[#6831ef] text-base font-semibold text-white transition-colors hover:from-[#8153f7] hover:to-[#7544f5]" type="submit">Sign In</button>
      </form>

      <p className="mt-7 text-center text-base text-muted">Don't have an account? <Link className="ml-2 font-semibold text-[#c07aff] no-underline hover:text-[#d7aaff]" to="/signup">Sign Up</Link></p>
    </AuthLayout>
  )
}
