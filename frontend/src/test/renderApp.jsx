import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'
import App from '../App.jsx'

export const authenticatedUser = {
  id: 'user-1',
  name: 'Aung',
  email: 'aung@example.com',
  created_at: '2026-11-01T10:00:00.000000Z',
}

export const defaultDashboard = {
  user: authenticatedUser,
  metrics: {
    documents: { value: 12, change: null },
    conversations: { value: 28, change: null },
    messages: { value: 146, change: null },
    storage_bytes: { value: 85983232, change: null },
  },
  chat_activity: ['2026-11-02', '2026-11-03', '2026-11-04', '2026-11-05', '2026-11-06', '2026-11-07', '2026-11-08'].map((date) => ({ date, count: 0 })),
  recent_conversations: [{
    id: 'conversation-1',
    title: 'Annual leave policy',
    created_at: '2026-11-08T08:00:00Z',
    updated_at: '2026-11-08T08:00:00Z',
  }],
  recent_uploads: [],
}

export function renderApp({ route = '/dashboard', authenticated = true, hydrateSession = false } = {}) {
  if (!vi.isMockFunction(globalThis.fetch)) {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ data: defaultDashboard }), {
      headers: { 'Content-Type': 'application/json' },
    })))
  }

  return render(
    <MemoryRouter initialEntries={[route]}>
      <App initialUser={hydrateSession ? undefined : (authenticated ? authenticatedUser : null)} />
    </MemoryRouter>,
  )
}
