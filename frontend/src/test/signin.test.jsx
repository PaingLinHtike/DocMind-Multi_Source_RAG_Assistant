import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { renderApp } from './renderApp.jsx'

describe('Sign In', () => {
  it('reports missing and incorrect credentials without clearing the form or navigating', async () => {
    const user = userEvent.setup()
    renderApp({ route: '/signin', authenticated: false })

    await user.click(screen.getByRole('button', { name: 'Sign In' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Enter your email and password.')

    const email = screen.getByLabelText('Email')
    const password = screen.getByLabelText('Password')
    await user.type(email, 'user@gmail.com')
    await user.type(password, 'userUSER1234@')
    await user.click(screen.getByRole('button', { name: 'Sign In' }))

    expect(screen.getByRole('alert')).toHaveTextContent('Email or password is incorrect.')
    expect(email).toHaveValue('user@gmail.com')
    expect(password).toHaveValue('userUSER1234@')
    expect(screen.getByRole('heading', { name: 'Welcome back' })).toBeInTheDocument()
  })

  it('toggles password visibility and Remember me without changing the password', async () => {
    const user = userEvent.setup()
    renderApp({ route: '/signin', authenticated: false })

    const password = screen.getByLabelText('Password')
    const remember = screen.getByRole('checkbox', { name: 'Remember me' })
    await user.type(password, 'userUSER1234@@')

    expect(password).toHaveAttribute('type', 'password')
    await user.click(screen.getByRole('button', { name: 'Show password' }))
    expect(password).toHaveAttribute('type', 'text')
    expect(password).toHaveValue('userUSER1234@@')
    expect(screen.getByRole('button', { name: 'Hide password' })).toBeInTheDocument()

    expect(remember).not.toBeChecked()
    await user.click(remember)
    expect(remember).toBeChecked()
  })

  it('normalizes the email and navigates to the Dashboard with the exact dummy password', async () => {
    const user = userEvent.setup()
    renderApp({ route: '/signin', authenticated: false })

    await user.type(screen.getByLabelText('Email'), '  USER@GMAIL.COM ')
    await user.type(screen.getByLabelText('Password'), 'userUSER1234@@')
    await user.click(screen.getByRole('button', { name: 'Sign In' }))

    expect(screen.getByRole('heading', { name: 'Good morning, Aung' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Welcome back' })).not.toBeInTheDocument()
  })

  it('announces successful account creation passed through route state', () => {
    renderApp({ route: { pathname: '/signin', state: { signupComplete: true } }, authenticated: false })

    expect(screen.getByRole('status')).toHaveTextContent('Sign-up complete. This demo does not create accounts; use the demo credentials to sign in.')
  })
})
