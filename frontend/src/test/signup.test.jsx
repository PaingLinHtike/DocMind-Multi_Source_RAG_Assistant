import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { renderApp } from './renderApp.jsx'

async function fillValidIdentity(user, password) {
  await user.type(screen.getByLabelText('Full name'), 'Test User')
  await user.type(screen.getByLabelText('Email'), 'test@example.com')
  await user.type(screen.getByLabelText('Password'), password)
  await user.type(screen.getByLabelText('Confirm password'), password)
  await user.click(screen.getByRole('checkbox', { name: /I agree to the Terms and Privacy Policy/i }))
}

describe('Sign Up', () => {
  it('reports required and malformed fields while retaining entered values', async () => {
    const user = userEvent.setup()
    renderApp({ route: '/signup', authenticated: false })

    await user.click(screen.getByRole('button', { name: 'Create account' }))
    expect(screen.getByText('Enter your full name.')).toBeInTheDocument()
    expect(screen.getByText('Enter a valid email address.')).toBeInTheDocument()
    expect(screen.getByText('Enter a password.')).toBeInTheDocument()
    expect(screen.getByText('Confirm your password.')).toBeInTheDocument()
    expect(screen.getByText('Accept the Terms and Privacy Policy.')).toBeInTheDocument()
    expect(screen.getAllByRole('alert')).toHaveLength(5)
    expect(screen.getByLabelText('Full name')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByLabelText('Password')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByLabelText('Confirm password')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByRole('checkbox', { name: /I agree to the Terms and Privacy Policy/i })).toHaveAttribute('aria-invalid', 'true')

    const name = screen.getByLabelText('Full name')
    const email = screen.getByLabelText('Email')
    const password = screen.getByLabelText('Password')
    const confirmation = screen.getByLabelText('Confirm password')
    await user.type(name, 'Test User')
    await user.type(email, 'invalid-email')
    await user.type(password, 'abcdefg')
    await user.type(confirmation, 'different')
    await user.click(screen.getByRole('button', { name: 'Create account' }))

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
    renderApp({ route: '/signup', authenticated: false })
    await fillValidIdentity(user, invalidPassword)

    await user.click(screen.getByRole('button', { name: 'Create account' }))

    expect(screen.getByText('Use 8+ characters with uppercase, lowercase, number, and symbol.')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Create your account' })).toBeInTheDocument()
  })

  it('toggles both password fields independently without changing their values', async () => {
    const user = userEvent.setup()
    renderApp({ route: '/signup', authenticated: false })
    const password = screen.getByLabelText('Password')
    const confirmation = screen.getByLabelText('Confirm password')
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

  it('shows every password requirement unmet and links the list to the password field', () => {
    renderApp({ route: '/signup', authenticated: false })

    const list = screen.getByRole('list')
    const items = within(list).getAllByRole('listitem')
    const description = document.getElementById('signup-password-description')

    expect(items).toHaveLength(5)
    expect(description).toHaveTextContent('Password requirements')
    for (const label of [
      'At least 8 characters',
      'One uppercase letter',
      'One lowercase letter',
      'One number',
      'One symbol',
    ]) {
      expect(within(list).getByText(label)).toBeInTheDocument()
      expect(description).toHaveTextContent(label)
    }
    expect(within(list).getAllByText('Not met:')).toHaveLength(5)
    expect(screen.getByLabelText('Password')).toHaveAttribute('aria-describedby', 'signup-password-description')
    expect(description).toContainElement(list)
    expect(list).toHaveAttribute('aria-live', 'polite')
    expect(list).toHaveAttribute('aria-atomic', 'false')
    expect(screen.getByLabelText('Confirm password')).not.toHaveAttribute('aria-describedby')
  })

  it.each([
    ['', [false, false, false, false, false]],
    ['Aa1!aaa', [false, true, true, true, true]],
    ['aa1!aaaa', [true, false, true, true, true]],
    ['AA1!AAAA', [true, true, false, true, true]],
    ['Aa!!aaaa', [true, true, true, false, true]],
    ['Aa11aaaa', [true, true, true, true, false]],
    ['Aa1!aaaa', [true, true, true, true, true]],
    ['Ää1!AAAA', [true, true, false, true, true]],
    ['ÄÄ1!aaaa', [true, false, true, true, true]],
    ['Aa1 aaaa', [true, true, true, true, true]],
  ])('marks requirements for %j', async (password, states) => {
    const user = userEvent.setup()
    renderApp({ route: '/signup', authenticated: false })
    if (password) await user.type(screen.getByLabelText('Password'), password)

    const list = screen.getByRole('list')
    const items = within(list).getAllByRole('listitem')

    items.forEach((item, index) => {
      expect(item).toHaveClass(states[index] ? 'text-success' : 'text-text-muted')
      expect(within(item).getByText(states[index] ? 'Met:' : 'Not met:')).toBeInTheDocument()

      const icon = item.querySelector('svg')
      expect(icon).toHaveAttribute('width', '16')
      expect(icon).toHaveAttribute('aria-hidden', 'true')
      if (states[index]) expect(icon.querySelector('path')).not.toBeNull()
      else expect(icon.querySelector('circle')).not.toBeNull()
    })
  })

  it('keeps the checklist linked when the password error appears', async () => {
    const user = userEvent.setup()
    renderApp({ route: '/signup', authenticated: false })
    await user.type(screen.getByLabelText('Password'), 'short')
    await user.click(screen.getByRole('button', { name: 'Create account' }))

    expect(screen.getByText('Use 8+ characters with uppercase, lowercase, number, and symbol.')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toHaveAttribute(
      'aria-describedby',
      'signup-password-error signup-password-description',
    )

    const list = screen.getByRole('list')
    const description = document.getElementById('signup-password-description')
    expect(within(list).getAllByRole('listitem')).toHaveLength(5)
    expect(description).toContainElement(list)
    expect(description).toHaveTextContent('Password requirements')
    for (const label of [
      'At least 8 characters',
      'One uppercase letter',
      'One lowercase letter',
      'One number',
      'One symbol',
    ]) {
      expect(description).toHaveTextContent(label)
    }
  })

  it('keeps requirement state when password visibility is toggled', async () => {
    const user = userEvent.setup()
    renderApp({ route: '/signup', authenticated: false })
    await user.type(screen.getByLabelText('Password'), 'Aa1!aaaa')

    const list = screen.getByRole('list')
    expect(within(list).getAllByText('Met:')).toHaveLength(5)

    await user.click(screen.getByRole('button', { name: 'Show password' }))
    expect(within(list).getAllByText('Met:')).toHaveLength(5)
  })

  it('accepts an eight-character compliant password and redirects with success feedback', async () => {
    const user = userEvent.setup()
    renderApp({ route: '/signup', authenticated: false })
    await fillValidIdentity(user, 'Aa1!aaaa')

    await user.click(screen.getByRole('button', { name: 'Create account' }))

    expect(screen.getByRole('heading', { name: 'Welcome back' })).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Sign-up complete. This demo does not create accounts; use the demo credentials to sign in.')
  })
})
