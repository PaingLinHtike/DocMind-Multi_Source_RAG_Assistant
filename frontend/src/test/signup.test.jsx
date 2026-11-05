import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { renderApp } from './renderApp.jsx'

async function fillValidIdentity(user, password) {
  await user.type(screen.getByLabelText('Full Name'), 'Test User')
  await user.type(screen.getByLabelText('Email'), 'test@example.com')
  await user.type(screen.getByLabelText('Password'), password)
  await user.type(screen.getByLabelText('Confirm Password'), password)
  await user.click(screen.getByRole('checkbox', { name: /I agree to the Terms and Privacy Policy/i }))
}

describe('Sign Up', () => {
  it('reports required and malformed fields while retaining entered values', async () => {
    const user = userEvent.setup()
    renderApp({ route: '/signup' })

    await user.click(screen.getByRole('button', { name: 'Create Account' }))
    expect(screen.getByText('Enter your full name.')).toBeInTheDocument()
    expect(screen.getByText('Enter a valid email address.')).toBeInTheDocument()
    expect(screen.getByText('Enter a password.')).toBeInTheDocument()
    expect(screen.getByText('Confirm your password.')).toBeInTheDocument()
    expect(screen.getByText('Accept the Terms and Privacy Policy.')).toBeInTheDocument()
    expect(screen.getAllByRole('alert')).toHaveLength(5)
    expect(screen.getByLabelText('Full Name')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByLabelText('Password')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByLabelText('Confirm Password')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByRole('checkbox', { name: /I agree to the Terms and Privacy Policy/i })).toHaveAttribute('aria-invalid', 'true')

    const name = screen.getByLabelText('Full Name')
    const email = screen.getByLabelText('Email')
    const password = screen.getByLabelText('Password')
    const confirmation = screen.getByLabelText('Confirm Password')
    await user.type(name, 'Test User')
    await user.type(email, 'invalid-email')
    await user.type(password, 'abcdefg')
    await user.type(confirmation, 'different')
    await user.click(screen.getByRole('button', { name: 'Create Account' }))

    expect(screen.getByText('Enter a valid email address.')).toBeInTheDocument()
    expect(screen.getByText('Use 8+ characters with uppercase, lowercase, number, and symbol.')).toBeInTheDocument()
    expect(screen.getByText('Passwords do not match.')).toBeInTheDocument()
    expect(name).toHaveValue('Test User')
    expect(email).toHaveValue('invalid-email')
    expect(password).toHaveValue('abcdefg')
    expect(confirmation).toHaveValue('different')
  })

  it.each([
    ['fewer than eight characters', 'Aa1!aaa'],
    ['no uppercase letter', 'aa1!aaaa'],
    ['no lowercase letter', 'AA1!AAAA'],
    ['no number', 'Aa!!aaaa'],
    ['no symbol', 'Aa11aaaa'],
  ])('rejects a password with %s', async (_case, invalidPassword) => {
    const user = userEvent.setup()
    renderApp({ route: '/signup' })
    await fillValidIdentity(user, invalidPassword)

    await user.click(screen.getByRole('button', { name: 'Create Account' }))

    expect(screen.getByText('Use 8+ characters with uppercase, lowercase, number, and symbol.')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Create your account' })).toBeInTheDocument()
  })

  it('toggles both password fields independently without changing their values', async () => {
    const user = userEvent.setup()
    renderApp({ route: '/signup' })
    const password = screen.getByLabelText('Password')
    const confirmation = screen.getByLabelText('Confirm Password')
    await user.type(password, 'Aa1!aaaa')
    await user.type(confirmation, 'Aa1!aaaa')

    await user.click(screen.getByRole('button', { name: 'Show password' }))
    expect(password).toHaveAttribute('type', 'text')
    expect(confirmation).toHaveAttribute('type', 'password')
    expect(password).toHaveValue('Aa1!aaaa')

    await user.click(screen.getByRole('button', { name: 'Show confirm password' }))
    expect(confirmation).toHaveAttribute('type', 'text')
    expect(confirmation).toHaveValue('Aa1!aaaa')
  })

  it('accepts an eight-character compliant password and redirects with success feedback', async () => {
    const user = userEvent.setup()
    renderApp({ route: '/signup' })
    await fillValidIdentity(user, 'Aa1!aaaa')

    await user.click(screen.getByRole('button', { name: 'Create Account' }))

    expect(screen.getByRole('heading', { name: 'Welcome back' })).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Sign-up complete. This demo does not create accounts; use the demo credentials to sign in.')
  })
})
