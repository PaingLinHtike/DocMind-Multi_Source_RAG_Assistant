import { Link } from 'react-router-dom'
import AuthField from '../components/auth/AuthField.jsx'
import AuthLayout from '../components/auth/AuthLayout.jsx'

export default function SignInPage() {
  return (
    <AuthLayout variant="signin">
      <h1 className="text-3xl font-bold leading-tight sm:text-4xl">Welcome back</h1>
      <p className="mt-2 text-base text-muted sm:text-lg">Sign in to access your AI document workspace.</p>

      <form className="mt-6 space-y-4">
        <AuthField autoComplete="email" id="signin-email" icon="mail" label="Email" placeholder="you@example.com" type="email" />
        <AuthField autoComplete="current-password" id="signin-password" icon="lock" label="Password" placeholder="Enter your password" type="password" />

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
