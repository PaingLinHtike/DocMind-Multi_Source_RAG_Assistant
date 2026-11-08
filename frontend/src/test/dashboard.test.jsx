import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { renderApp } from './renderApp.jsx'

const dashboard = {
  user: { id: 'user-1', name: 'Paing', email: 'paing@example.com', created_at: '2026-11-01T00:00:00Z' },
  metrics: {
    documents: { value: 12, change: null }, conversations: { value: 28, change: null },
    messages: { value: 146, change: null }, storage_bytes: { value: 85983232, change: null },
  },
  chat_activity: [
    { date: '2026-11-02', count: 1 }, { date: '2026-11-03', count: 4 }, { date: '2026-11-04', count: 2 },
    { date: '2026-11-05', count: 7 }, { date: '2026-11-06', count: 3 }, { date: '2026-11-07', count: 0 }, { date: '2026-11-08', count: 5 },
  ],
  recent_conversations: [
    { id: 'conversation-1', title: 'Annual leave policy', created_at: '2026-11-08T08:00:00Z', updated_at: '2026-11-08T08:00:00Z' },
    { id: 'conversation-2', title: 'Working hours', created_at: '2026-11-07T08:00:00Z', updated_at: '2026-11-07T08:00:00Z' },
  ],
  recent_uploads: [{ id: 'document-1', name: 'Employee Handbook.pdf', uploaded_at: '2026-11-05T10:24:00Z' }],
}

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}

describe('Dashboard', () => {
  it('shows a loading state until dashboard data arrives', async () => {
    let resolveDashboard
    vi.stubGlobal('fetch', vi.fn(() => new Promise((resolve) => { resolveDashboard = resolve })))
    renderApp()
    expect(screen.getByRole('status')).toHaveTextContent('Loading dashboard')
    resolveDashboard(jsonResponse({ data: dashboard }))
    expect(await screen.findByRole('heading', { name: 'Good morning, Paing' })).toBeInTheDocument()
  })

  it('renders backend metrics and data in the ruled dashboard design', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ data: dashboard })))
    renderApp()
    expect(await screen.findByRole('heading', { name: 'Good morning, Paing' })).toBeInTheDocument()

    const statistics = screen.getByRole('list', { name: 'Library statistics' })
    for (const value of ['12', '28', '146', '82 MB']) expect(within(statistics).getByText(value)).toBeInTheDocument()
    expect(screen.queryByText('Chat Activity')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Ask your documents anything/i })).toHaveAttribute('href', '/chat')

    const conversations = screen.getByRole('region', { name: 'Recent conversations' })
    for (const [number, title] of [['01', 'Annual leave policy'], ['02', 'Working hours']]) {
      const link = within(conversations).getByRole('link', { name: new RegExp(title) })
      expect(within(link).getByText(number)).toBeInTheDocument()
    }
    const library = screen.getByRole('region', { name: 'Library' })
    expect(within(library).getByText('12 documents')).toBeInTheDocument()
    expect(within(library).getByText('Employee Handbook.pdf')).toBeInTheDocument()
  })

  it('renders empty backend states', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ data: { ...dashboard, recent_conversations: [], recent_uploads: [] } })))
    renderApp()
    expect(await screen.findByText('No recent conversations yet.')).toBeInTheDocument()
    expect(screen.getByText('No uploads yet.')).toBeInTheDocument()
  })

  it('allows a failed dashboard request to be retried', async () => {
    const user = userEvent.setup()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(jsonResponse({ message: 'Dashboard unavailable.' }, 500)).mockResolvedValueOnce(jsonResponse({ data: dashboard })))
    renderApp()
    expect(await screen.findByRole('alert')).toHaveTextContent('Dashboard unavailable.')
    await user.click(screen.getByRole('button', { name: 'Try again' }))
    expect(await screen.findByRole('heading', { name: 'Good morning, Paing' })).toBeInTheDocument()
  })

  it('returns to Sign In when the authenticated session expires', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ message: 'Unauthenticated.' }, 401)))
    renderApp()
    expect(await screen.findByRole('heading', { name: 'Welcome back' })).toBeInTheDocument()
  })
})
