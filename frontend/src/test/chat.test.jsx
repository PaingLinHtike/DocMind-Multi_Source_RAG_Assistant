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

const markdownAnswer = 'The document lists these features [1]:\n\n- **Allergy Detection** (needs user management): warns users.\n- **Meal Logging**: saves meals.\n\nRead the `requirements.txt` file for setup details [1].'

const markdownThread = {
  ...firstThread,
  messages: [
    firstThread.messages[0],
    { ...firstThread.messages[1], content: markdownAnswer, citations: [] },
  ],
}

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
      .mockResolvedValueOnce(jsonResponse({ data: pendingMessage }, 202))
      .mockResolvedValue(jsonResponse({ data: { ...firstThread, messages: [pendingMessage] } })))
    renderApp({ route: '/chat' })
    await loadFirstThread()
    const input = screen.getByPlaceholderText('Ask a question about your documents...')

    await user.type(input, 'What is the remote work policy?')
    await user.click(screen.getByRole('button', { name: 'Send question' }))

    expect(await screen.findAllByText('What is the remote work policy?')).toHaveLength(1)
    expect(screen.getByText('Generating answer…')).toBeInTheDocument()
    expect(screen.queryByText(/I found this in your documents/)).not.toBeInTheDocument()
    expect(input).toHaveValue('')
  })

  it('keeps sources collapsed until the reader opens them and then renders every citation', async () => {
    const user = userEvent.setup()
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(conversationList())
      .mockResolvedValueOnce(jsonResponse({ data: firstThread })))
    renderApp({ route: '/chat' })
    await loadFirstThread()

    const sources = screen.getByRole('button', { name: 'Sources (2)' })
    expect(sources).toHaveAttribute('aria-expanded', 'false')
    expect(document.getElementById(sources.getAttribute('aria-controls'))).not.toBeInTheDocument()

    await user.click(sources)

    const panel = document.getElementById(sources.getAttribute('aria-controls'))
    expect(sources).toHaveAttribute('aria-expanded', 'true')
    expect(within(panel).getByText('Employee Handbook.pdf')).toBeInTheDocument()
    expect(within(panel).getByText('Page 17')).toBeInTheDocument()
    expect(within(panel).getByText('Employees receive 20 days.')).toBeInTheDocument()
    expect(within(panel).getByText('Leave Policy.pdf')).toBeInTheDocument()
    expect(within(panel).getByText('Page 4')).toBeInTheDocument()
    expect(within(panel).getByText('Annual leave entitlement.')).toBeInTheDocument()
  })

  it('shows an assistant response placeholder right after asking and swaps in the answer automatically', async () => {
    const user = userEvent.setup()
    document.cookie = 'XSRF-TOKEN=csrf-token; path=/'
    const pendingMessage = { id: 'message-pending', role: 'user', content: 'What is the remote work policy?', status: 'pending', failure_reason: null, created_at: '2026-11-08T10:03:00Z', citations: [] }
    const completedAnswer = {
      id: 'message-answer', role: 'assistant', content: 'Remote work is allowed three days per week.', status: 'completed', failure_reason: null,
      created_at: '2026-11-08T10:03:02Z', citations: [],
    }
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(conversationList())
      .mockResolvedValueOnce(jsonResponse({ data: { ...firstThread, messages: [] } }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(jsonResponse({ data: pendingMessage }, 202))
      .mockResolvedValueOnce(jsonResponse({ data: { ...firstThread, messages: [pendingMessage] } }))
      .mockResolvedValueOnce(jsonResponse({ data: { ...firstThread, messages: [{ ...pendingMessage, status: 'completed' }, completedAnswer] } }))
      .mockResolvedValue(jsonResponse({ data: { ...firstThread, messages: [{ ...pendingMessage, status: 'completed' }, completedAnswer] } })))
    renderApp({ route: '/chat' })
    await loadFirstThread()
    const input = screen.getByPlaceholderText('Ask a question about your documents...')

    await user.type(input, 'What is the remote work policy?')
    await user.click(screen.getByRole('button', { name: 'Send question' }))

    expect(await screen.findByText('Generating answer…')).toBeInTheDocument()
    expect(await screen.findByText('Remote work is allowed three days per week.', {}, { timeout: 3000 })).toBeInTheDocument()
    expect(screen.queryByText('Generating answer…')).not.toBeInTheDocument()
  })

  it('renders bold markdown in assistant answers instead of literal asterisks', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(conversationList())
      .mockResolvedValueOnce(jsonResponse({ data: markdownThread })))
    renderApp({ route: '/chat' })
    await loadFirstThread()

    expect(screen.getByText('Allergy Detection').tagName).toBe('STRONG')
    expect(screen.getByText('Meal Logging').tagName).toBe('STRONG')
    expect(screen.queryByText(/\*\*/)).not.toBeInTheDocument()
  })

  it('renders markdown bullet lines as a real list', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(conversationList())
      .mockResolvedValueOnce(jsonResponse({ data: markdownThread })))
    renderApp({ route: '/chat' })
    await loadFirstThread()

    const list = screen.getByRole('list')
    const items = within(list).getAllByRole('listitem')
    expect(items).toHaveLength(2)
    expect(within(items[0]).getByText('Allergy Detection')).toBeInTheDocument()
    expect(within(items[1]).getByText('Meal Logging')).toBeInTheDocument()
  })

  it('renders inline code without backticks', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(conversationList())
      .mockResolvedValueOnce(jsonResponse({ data: markdownThread })))
    renderApp({ route: '/chat' })
    await loadFirstThread()

    expect(screen.getByText('requirements.txt').tagName).toBe('CODE')
    expect(screen.queryByText(/`requirements\.txt`/)).not.toBeInTheDocument()
  })

  it('keeps raw HTML in assistant answers inert', async () => {
    const unsafeThread = {
      ...firstThread,
      messages: [
        firstThread.messages[0],
        { ...firstThread.messages[1], content: 'Raw <img src=x onerror=alert(1)> **safe** text', citations: [] },
      ],
    }
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(conversationList())
      .mockResolvedValueOnce(jsonResponse({ data: unsafeThread })))
    const { container } = renderApp({ route: '/chat' })
    await loadFirstThread()

    expect(container.querySelector('img')).not.toBeInTheDocument()
    expect(container.textContent).toContain('<img src=x onerror=alert(1)>')
    expect(screen.getByText('safe').tagName).toBe('STRONG')
  })

  it('expires the session when conversation loading returns 401', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ message: 'Unauthenticated.' }, 401)))
    renderApp({ route: '/chat' })

    expect(await screen.findByRole('heading', { name: 'Welcome back' })).toBeInTheDocument()
  })
})
