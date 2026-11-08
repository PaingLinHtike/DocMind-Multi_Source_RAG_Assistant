import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { authenticatedUser, defaultDashboard, defaultDocuments, renderApp } from './renderApp.jsx'

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('authentication session routing', () => {
  it('waits for session hydration before protecting a route', async () => {
    let resolveSession
    vi.stubGlobal('fetch', vi.fn((url) => url.endsWith('/api/v1/auth/user')
      ? new Promise((resolve) => { resolveSession = resolve })
      : Promise.resolve(jsonResponse({ data: defaultDashboard }))))

    renderApp({ route: '/dashboard', hydrateSession: true })

    expect(screen.getByRole('status')).toHaveTextContent('Checking your session')
    expect(screen.queryByRole('heading', { name: 'Welcome back' })).not.toBeInTheDocument()
    resolveSession(jsonResponse({ data: authenticatedUser }))
    expect(await screen.findByRole('heading', { name: 'Good morning, Aung' })).toBeInTheDocument()
  })

  it('treats a 401 session check as a guest without showing an error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ message: 'Unauthenticated.' }, 401)))

    renderApp({ route: '/documents', hydrateSession: true })

    expect(await screen.findByRole('heading', { name: 'Welcome back' })).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it.each(['/signin', '/signup'])('redirects a hydrated user away from %s', async (route) => {
    vi.stubGlobal('fetch', vi.fn((url) => Promise.resolve(jsonResponse({
      data: url.endsWith('/api/v1/auth/user') ? authenticatedUser : defaultDashboard,
    }))))

    renderApp({ route, hydrateSession: true })

    expect(await screen.findByRole('heading', { name: 'Good morning, Aung' })).toBeInTheDocument()
  })

  it('logs out on the server before returning to Sign In', async () => {
    const user = userEvent.setup()
    document.cookie = 'XSRF-TOKEN=csrf-token; path=/'
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(jsonResponse({ data: defaultDocuments, meta: { current_page: 1, total: defaultDocuments.length } }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(new Response(null, { status: 204 })))
    renderApp({ route: '/documents' })

    await user.click(screen.getByRole('button', { name: 'Open profile menu' }))
    await user.click(screen.getByRole('button', { name: 'Log out' }))

    expect(await screen.findByRole('heading', { name: 'Welcome back' })).toBeInTheDocument()
    expect(fetch).toHaveBeenLastCalledWith(expect.stringContaining('/api/v1/auth/logout'), expect.objectContaining({ method: 'POST' }))
    expect(window.sessionStorage).toHaveLength(0)
  })
})
