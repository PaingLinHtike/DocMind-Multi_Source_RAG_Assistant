import { Link } from 'react-router-dom'
import AuthField from '../components/auth/AuthField.jsx'
import AuthLayout from '../components/auth/AuthLayout.jsx'

export default function SignUpPage() {
  return (
    <AuthLayout variant="signup">
      <h1 className="text-3xl font-bold leading-tight sm:text-4xl">Create your account</h1>
      <p className="mt-2 text-base text-muted sm:text-lg">Start building your private AI knowledge workspace.</p>

      <form className="mt-5 space-y-3">
        <AuthField autoComplete="name" id="signup-name" icon="user" label="Full Name" placeholder="Full Name" type="text" />
        <AuthField autoComplete="email" id="signup-email" icon="mail" label="Email" placeholder="Email" type="email" />
        <AuthField autoComplete="new-password" id="signup-password" icon="lock" label="Password" placeholder="Password" type="password" />
        <AuthField autoComplete="new-password" id="signup-confirm-password" icon="lock" label="Confirm Password" placeholder="Confirm Password" type="password" />

        <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm text-muted">
          <input className="size-5 shrink-0 accent-[#7544f5]" type="checkbox" />
          <span>I agree to the <span className="font-medium text-[#c07aff]">Terms</span> and <span className="font-medium text-[#c07aff]">Privacy Policy</span></span>
        </label>

        <button className="min-h-12 w-full rounded-xl border border-[#9a62ff] bg-gradient-to-r from-[#7544f5] to-[#6831ef] text-base font-semibold text-white transition-colors hover:from-[#8153f7] hover:to-[#7544f5]" type="submit">Create Account</button>
      </form>

      <p className="mt-6 text-center text-base text-muted">Already have an account? <Link className="ml-2 font-semibold text-[#c07aff] no-underline hover:text-[#d7aaff]" to="/signin">Sign In</Link></p>
    </AuthLayout>
  )
}
