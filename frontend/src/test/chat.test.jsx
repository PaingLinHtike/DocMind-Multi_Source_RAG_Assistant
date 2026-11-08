import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { renderApp } from './renderApp.jsx'

const summaries = [
  { id: 'conversation-1', title: 'Annual leave policy', created_at: '2026-11-07T10:00:00Z', updated_at: '2026-11-08T10:00:00Z' },
  { id: 'conversation-2', title: 'Working hours', created_at: '2026-11-06T10:00:00Z', updated_at: '2026-11-07T10:00:00Z' },
]

const firstThread = {
  ...summaries[0],
  messages: [
    { id: 'message-user', role: 'user', content: 'How many annual leave days?', status: 'completed', failure_reason: null, created_at: '2026-11-08T10:01:00Z', citations: [] },
    {
      id: 'message-assistant', role: 'assistant', content: 'Employees receive 20 days. [1] [2]', status: 'completed', failure_reason: null,
      created_at: '2026-11-08T10:02:00Z',
      citations: [
        { id: 'citation-1', document_id: 'doc-1', document_name: 'Employee Handbook.pdf', chunk_id: 'chunk-1', page_number: 17, citation_number: 1, snippet: 'Employees receive 20 days.' },
        { id: 'citation-2', document_id: 'doc-2', document_name: 'Leave Policy.pdf', chunk_id: 'chunk-2', page_number: 4, citation_number: 2, snippet: 'Annual leave entitlement.' },
      ],
    },
  ],
}

const secondThread = { ...summaries[1], messages: [] }

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function conversationList(items = summaries) {
  return jsonResponse({ data: items, meta: { current_page: 1, total: items.length } })
}

async function loadFirstThread() {
  expect(await screen.findByRole('heading', { name: 'Annual leave policy' })).toBeInTheDocument()
}

describe('Chat', () => {
  it('loads summaries and selects the first authoritative thread', async () => {
    let resolveList
    vi.stubGlobal('fetch', vi.fn((url) => {
      if (url.endsWith('/api/v1/conversations')) return new Promise((resolve) => { resolveList = resolve })
      return Promise.resolve(jsonResponse({ data: firstThread }))
    }))
    renderApp({ route: '/chat' })

    expect(screen.getByRole('status')).toHaveTextContent('Loading conversations')
    resolveList(conversationList())
    await loadFirstThread()
    expect(screen.getByText('How many annual leave days?')).toBeInTheDocument()
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/api/v1/conversations/conversation-1'), expect.any(Object))
  })

  it('renders an empty account and persists an explicit new chat', async () => {
    const user = userEvent.setup()
    document.cookie = 'XSRF-TOKEN=csrf-token; path=/'
    const created = { id: 'conversation-new', title: 'New Chat', created_at: '2026-11-08T10:00:00Z', updated_at: '2026-11-08T10:00:00Z' }
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(conversationList([]))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(jsonResponse({ data: created }, 201)))
    renderApp({ route: '/chat' })

    expect(await screen.findByText('No recent chats.')).toBeInTheDocument()
    expect(screen.getByText('Create a chat to start asking questions.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Send question' })).toBeDisabled()

    await user.click(screen.getByRole('button', { name: 'New Chat' }))

    expect(await screen.findByRole('heading', { name: 'New Chat' })).toBeInTheDocument()
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/api/v1/conversations'), expect.objectContaining({
      method: 'POST', body: JSON.stringify({}),
    }))
  })

  it('loads another thread lazily when selected', async () => {
    const user = userEvent.setup()
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(conversationList())
      .mockResolvedValueOnce(jsonResponse({ data: firstThread }))
      .mockResolvedValueOnce(jsonResponse({ data: secondThread })))
    renderApp({ route: '/chat' })
    await loadFirstThread()

    await user.click(screen.getByRole('button', { name: 'Working hours' }))

    expect(await screen.findByRole('heading', { name: 'Working hours' })).toBeInTheDocument()
    expect(screen.getByText('Ask your first question to begin.')).toBeInTheDocument()
  })

  it('persists rename and delete mutations', async () => {
    const user = userEvent.setup()
    document.cookie = 'XSRF-TOKEN=csrf-token; path=/'
    const renamed = { ...summaries[0], title: 'Vacation policy' }
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(conversationList())
      .mockResolvedValueOnce(jsonResponse({ data: firstThread }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(jsonResponse({ data: renamed }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(jsonResponse({ data: secondThread })))
    renderApp({ route: '/chat' })
    await loadFirstThread()

    await user.click(screen.getByRole('button', { name: 'Actions for Annual leave policy' }))
    await user.click(screen.getByRole('menuitem', { name: 'Rename' }))
    const input = screen.getByRole('textbox', { name: 'Rename Annual leave policy' })
    await user.clear(input)
    await user.type(input, 'Vacation policy{Enter}')
    expect(await screen.findByRole('heading', { name: 'Vacation policy' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Actions for Vacation policy' }))
    await user.click(screen.getByRole('menuitem', { name: 'Delete' }))
    expect(await screen.findByRole('heading', { name: 'Working hours' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Vacation policy' })).not.toBeInTheDocument()
  })

  it('keeps a failed rename draft open and associates validation with the title field', async () => {
    const user = userEvent.setup()
    document.cookie = 'XSRF-TOKEN=csrf-token; path=/'
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(conversationList())
      .mockResolvedValueOnce(jsonResponse({ data: firstThread }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(jsonResponse({
        message: 'The title field must not be greater than 255 characters.',
        errors: { title: ['The title field must not be greater than 255 characters.'] },
      }, 422)))
    renderApp({ route: '/chat' })
    await loadFirstThread()

    await user.click(screen.getByRole('button', { name: 'Actions for Annual leave policy' }))
    await user.click(screen.getByRole('menuitem', { name: 'Rename' }))
    const input = screen.getByRole('textbox', { name: 'Rename Annual leave policy' })
    await user.clear(input)
    await user.type(input, 'Vacation policy{Enter}')

    expect(await screen.findByText('The title field must not be greater than 255 characters.')).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Rename Annual leave policy' })).toHaveValue('Vacation policy')
    expect(screen.getByRole('textbox', { name: 'Rename Annual leave policy' })).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByRole('heading', { name: 'Annual leave policy' })).toBeInTheDocument()
  })

  it('renders exactly one pending user message and never synthesizes an assistant answer', async () => {
    const user = userEvent.setup()
    document.cookie = 'XSRF-TOKEN=csrf-token; path=/'
    const pendingMessage = { id: 'message-pending', role: 'user', content: 'What is the remote work policy?', status: 'pending', failure_reason: null, created_at: '2026-11-08T10:03:00Z', citations: [] }
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(conversationList())
      .mockResolvedValueOnce(jsonResponse({ data: { ...firstThread, messages: [] } }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(jsonResponse({ data: pendingMessage }, 202)))
    renderApp({ route: '/chat' })
    await loadFirstThread()
    const input = screen.getByPlaceholderText('Ask a question about your documents...')

    await user.type(input, 'What is the remote work policy?')
    await user.click(screen.getByRole('button', { name: 'Send question' }))

    expect(await screen.findAllByText('What is the remote work policy?')).toHaveLength(1)
    expect(screen.getByText('Pending')).toBeInTheDocument()
    expect(screen.queryByText(/I found this in your documents/)).not.toBeInTheDocument()
    expect(input).toHaveValue('')
  })

  it('renders every citation on a completed assistant message', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(conversationList())
      .mockResolvedValueOnce(jsonResponse({ data: firstThread })))
    renderApp({ route: '/chat' })
    await loadFirstThread()

    const sources = screen.getByRole('button', { name: 'Sources (2)' })
    const panel = document.getElementById(sources.getAttribute('aria-controls'))
    expect(within(panel).getByText('Employee Handbook.pdf')).toBeInTheDocument()
    expect(within(panel).getByText('Page 17')).toBeInTheDocument()
    expect(within(panel).getByText('Employees receive 20 days.')).toBeInTheDocument()
    expect(within(panel).getByText('Leave Policy.pdf')).toBeInTheDocument()
    expect(within(panel).getByText('Page 4')).toBeInTheDocument()
    expect(within(panel).getByText('Annual leave entitlement.')).toBeInTheDocument()
  })

  it('expires the session when conversation loading returns 401', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ message: 'Unauthenticated.' }, 401)))
    renderApp({ route: '/chat' })

    expect(await screen.findByRole('heading', { name: 'Welcome back' })).toBeInTheDocument()
  })
})
