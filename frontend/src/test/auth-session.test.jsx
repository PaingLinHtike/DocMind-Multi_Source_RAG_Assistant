import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { renderApp } from './renderApp.jsx'

const sessionKey = 'docmind.authenticated'

describe('authentication session routing', () => {
  it('starts unauthenticated users on Sign In', () => {
    renderApp({ route: '/', authenticated: false })

    expect(screen.getByRole('heading', { name: 'Welcome back' })).toBeInTheDocument()
  })

  it.each(['/dashboard', '/documents/employee-handbook'])('redirects unauthenticated access to %s back to Sign In', (route) => {
    renderApp({ route, authenticated: false })

    expect(screen.getByRole('heading', { name: 'Welcome back' })).toBeInTheDocument()
  })

  it('does not accept a tampered session marker', () => {
    window.sessionStorage.setItem(sessionKey, 'yes')
    renderApp({ route: '/dashboard', preserveSession: true })

    expect(screen.getByRole('heading', { name: 'Welcome back' })).toBeInTheDocument()
  })

  it.each(['/signin', '/signup'])('redirects authenticated access to %s back to the Dashboard', (route) => {
    renderApp({ route, authenticated: true })

    expect(screen.getByRole('heading', { name: 'Good morning, Aung' })).toBeInTheDocument()
  })

  it('stores a session and navigates valid credentials to the Dashboard', async () => {
    const user = userEvent.setup()
    renderApp({ route: '/signin', authenticated: false })

    await user.type(screen.getByLabelText('Email'), 'user@gmail.com')
    await user.type(screen.getByLabelText('Password'), 'userUSER1234@@')
    await user.click(screen.getByRole('button', { name: 'Sign In' }))

    expect(screen.getByRole('heading', { name: 'Good morning, Aung' })).toBeInTheDocument()
    expect(window.sessionStorage.getItem(sessionKey)).toBe('true')
  })

  it('restores an authenticated session after the application remounts', async () => {
    const user = userEvent.setup()
    const firstRender = renderApp({ route: '/signin', authenticated: false })
    await user.type(screen.getByLabelText('Email'), 'user@gmail.com')
    await user.type(screen.getByLabelText('Password'), 'userUSER1234@@')
    await user.click(screen.getByRole('button', { name: 'Sign In' }))
    firstRender.unmount()

    renderApp({ route: '/dashboard', preserveSession: true })

    expect(screen.getByRole('heading', { name: 'Good morning, Aung' })).toBeInTheDocument()
  })

  it('logs out from a protected route and keeps that route inaccessible', async () => {
    const user = userEvent.setup()
    const authenticatedRender = renderApp({ route: '/documents', authenticated: true })
    await user.click(screen.getByRole('button', { name: 'Open profile menu' }))
    await user.click(screen.getByRole('button', { name: 'Log Out' }))

    expect(screen.getByRole('heading', { name: 'Welcome back' })).toBeInTheDocument()
    expect(window.sessionStorage.getItem(sessionKey)).toBeNull()
    authenticatedRender.unmount()

    renderApp({ route: '/documents', preserveSession: true })

    expect(screen.getByRole('heading', { name: 'Welcome back' })).toBeInTheDocument()
  })
})
