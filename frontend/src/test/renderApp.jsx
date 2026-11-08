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

export const defaultDocuments = [
  {
    id: 'doc-123', name: 'Employee Handbook.pdf', type: 'PDF', status: 'ready', status_label: 'Ready',
    chunks: 120, uploaded_at: '2026-11-05T10:24:00Z', size_bytes: 2516582, size: '2.4 MB',
    source: 'Upload', storage: 'documents/user-1/doc-123.pdf',
  },
  {
    id: 'doc-web', name: 'Company Website', type: 'WEB', status: 'processing', status_label: 'Processing',
    chunks: null, uploaded_at: '2026-11-04T11:02:00Z', size_bytes: 0, size: '0 B',
    source: 'Web', storage: 'https://example.com',
  },
  {
    id: 'doc-failed', name: 'Benefits Guide.pdf', type: 'PDF', status: 'failed', status_label: 'Failed',
    chunks: null, uploaded_at: '2026-11-03T18:45:00Z', size_bytes: 1048576, size: '1 MB',
    source: 'Upload', storage: 'documents/user-1/doc-failed.pdf',
  },
]

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function defaultFetch(url) {
  if (url.endsWith('/api/v1/dashboard')) return Promise.resolve(jsonResponse({ data: defaultDashboard }))
  if (url.endsWith('/api/v1/documents')) {
    return Promise.resolve(jsonResponse({ data: defaultDocuments, meta: { current_page: 1, total: defaultDocuments.length } }))
  }
  const detailMatch = url.match(/\/api\/v1\/documents\/([^/]+)$/)
  if (detailMatch) {
    const document = defaultDocuments.find((candidate) => candidate.id === detailMatch[1]) || defaultDocuments[0]
    return Promise.resolve(jsonResponse({ data: document }))
  }
  return Promise.resolve(jsonResponse({ data: authenticatedUser }))
}

export function renderApp({ route = '/dashboard', authenticated = true, hydrateSession = false } = {}) {
  if (!vi.isMockFunction(globalThis.fetch)) {
    vi.stubGlobal('fetch', vi.fn(defaultFetch))
  }

  return render(
    <MemoryRouter initialEntries={[route]}>
      <App initialUser={hydrateSession ? undefined : (authenticated ? authenticatedUser : null)} />
    </MemoryRouter>,
  )
}
