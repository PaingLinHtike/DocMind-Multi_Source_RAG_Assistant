import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { authenticatedUser, defaultDashboard, renderApp } from './renderApp.jsx'

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('Sign In', () => {
  it('requires email and password without sending a request', async () => {
    const user = userEvent.setup()
    vi.stubGlobal('fetch', vi.fn())
    renderApp({ route: '/signin', authenticated: false })

    await user.click(screen.getByRole('button', { name: 'Sign in' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Enter your email and password.')
    expect(fetch).not.toHaveBeenCalled()
  })

  it('submits normalized credentials and enters the authenticated app', async () => {
    const user = userEvent.setup()
    document.cookie = 'XSRF-TOKEN=csrf-token; path=/'
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(jsonResponse({ data: authenticatedUser }))
      .mockResolvedValueOnce(jsonResponse({ data: defaultDashboard })))
    renderApp({ route: '/signin', authenticated: false })

    await user.type(screen.getByLabelText('Email'), '  USER@EXAMPLE.COM ')
    await user.type(screen.getByLabelText('Password'), 'Strong1!')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(await screen.findByRole('heading', { name: 'Good morning, Aung' })).toBeInTheDocument()
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/api/v1/auth/login'), expect.objectContaining({
      body: JSON.stringify({ email: 'user@example.com', password: 'Strong1!' }),
      method: 'POST',
    }))
    expect(window.sessionStorage).toHaveLength(0)
  })

  it('renders Laravel credential errors and retains the form', async () => {
    const user = userEvent.setup()
    document.cookie = 'XSRF-TOKEN=csrf-token; path=/'
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(jsonResponse({
        message: 'The provided credentials are incorrect.',
        errors: { email: ['The provided credentials are incorrect.'] },
      }, 422)))
    renderApp({ route: '/signin', authenticated: false })

    await user.type(screen.getByLabelText('Email'), 'person@example.com')
    await user.type(screen.getByLabelText('Password'), 'Wrong1!')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(await screen.findByText('The provided credentials are incorrect.')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toHaveValue('person@example.com')
    expect(screen.getByLabelText('Password')).toHaveValue('Wrong1!')
  })

  it('submits a password-reset request for the entered email', async () => {
    const user = userEvent.setup()
    document.cookie = 'XSRF-TOKEN=csrf-token; path=/'
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(jsonResponse({ message: 'We have emailed your password reset link.' })))
    renderApp({ route: '/signin', authenticated: false })

    await user.type(screen.getByLabelText('Email'), 'PERSON@EXAMPLE.COM')
    await user.click(screen.getByRole('button', { name: 'Forgot password?' }))

    expect(await screen.findByRole('status')).toHaveTextContent('We have emailed your password reset link.')
    expect(fetch).toHaveBeenLastCalledWith(expect.stringContaining('/api/v1/auth/forgot-password'), expect.objectContaining({
      body: JSON.stringify({ email: 'person@example.com' }),
    }))
  })

  it('toggles password visibility without changing the value', async () => {
    const user = userEvent.setup()
    renderApp({ route: '/signin', authenticated: false })
    const password = screen.getByLabelText('Password')
    await user.type(password, 'Strong1!')

    await user.click(screen.getByRole('button', { name: 'Show password' }))

    expect(password).toHaveAttribute('type', 'text')
    expect(password).toHaveValue('Strong1!')
    expect(screen.getByRole('button', { name: 'Hide password' })).toBeInTheDocument()
  })

  it('does not render the create-account password checklist', () => {
    renderApp({ route: '/signin', authenticated: false })
    expect(screen.queryByText('Password requirements')).not.toBeInTheDocument()
    expect(document.getElementById('signin-password-description')).not.toBeInTheDocument()
  })
})
