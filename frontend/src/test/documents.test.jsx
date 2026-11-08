import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { renderApp } from './renderApp.jsx'

const handbook = {
  id: 'doc-123',
  name: 'Employee Handbook.pdf',
  type: 'PDF',
  status: 'ready',
  status_label: 'Ready',
  chunks: 120,
  uploaded_at: '2026-11-05T10:24:00Z',
  size_bytes: 2516582,
  size: '2.4 MB',
  source: 'Upload',
  storage: 'documents/user_001/doc_123.pdf',
  content_url: 'http://localhost:8000/api/v1/documents/doc-123/content',
  download_url: 'http://localhost:8000/api/v1/documents/doc-123/download',
  rag_stage: 'ready',
  indexed_at: '2026-11-05T10:25:00Z',
  embedding_model: 'intfloat/e5-base-v2',
  vector_collection: 'docmind',
  failure_reason: null,
}

const policies = {
  ...handbook,
  id: 'doc-456',
  name: 'Company Policies.docx',
  type: 'DOCX',
  chunks: 87,
  uploaded_at: '2026-11-04T15:10:00Z',
}

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function documentsResponse(documents = [handbook, policies]) {
  return jsonResponse({ data: documents, meta: { current_page: 1, total: documents.length } })
}

async function openActions(user) {
  await user.click(await screen.findByRole('button', { name: 'Actions' }))
}

describe('Documents', () => {
  it('loads the collection and filters it client-side', async () => {
    const user = userEvent.setup()
    let resolveDocuments
    vi.stubGlobal('fetch', vi.fn(() => new Promise((resolve) => { resolveDocuments = resolve })))
    renderApp({ route: '/documents' })

    expect(screen.getByRole('status')).toHaveTextContent('Loading documents')
    resolveDocuments(documentsResponse())
    expect(await screen.findByText('Employee Handbook.pdf')).toBeInTheDocument()

    await user.type(screen.getByPlaceholderText('Search documents...'), 'policies')
    expect(screen.getByText('Company Policies.docx')).toBeInTheDocument()
    expect(screen.queryByText('Employee Handbook.pdf')).not.toBeInTheDocument()
  })

  it('renders server-empty and search-empty states', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(documentsResponse([])))
    const first = renderApp({ route: '/documents' })
    expect(await screen.findByText('No documents uploaded yet.')).toBeInTheDocument()
    first.unmount()

    const user = userEvent.setup()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(documentsResponse()))
    renderApp({ route: '/documents' })
    await screen.findByText('Employee Handbook.pdf')
    await user.type(screen.getByPlaceholderText('Search documents...'), 'missing file')
    expect(screen.getByText('No documents match “missing file”.')).toBeInTheDocument()
  })

  it('renders collection failures and expires a 401 session', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ message: 'Documents unavailable.' }, 500)))
    const first = renderApp({ route: '/documents' })
    expect(await screen.findByRole('alert')).toHaveTextContent('Documents unavailable.')
    first.unmount()

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ message: 'Unauthenticated.' }, 401)))
    renderApp({ route: '/documents' })
    expect(await screen.findByRole('heading', { name: 'Welcome back' })).toBeInTheDocument()
  })

  it('loads a document directly and renders a 404 state', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ data: handbook })))
    const first = renderApp({ route: '/documents/doc-123' })
    expect(await screen.findByRole('heading', { name: 'Employee Handbook.pdf' })).toBeInTheDocument()
    const localizedUpload = new Date(handbook.uploaded_at).toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
    })
    expect(screen.getByText(`Uploaded ${localizedUpload}`)).toBeInTheDocument()
    expect(screen.getByText('2.4 MB')).toBeInTheDocument()
    expect(screen.queryByText('Storage')).not.toBeInTheDocument()
    expect(screen.queryByText(handbook.storage)).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'RAG indexing pipeline' })).toBeInTheDocument()
    expect(screen.getByText('Preprocessing')).toBeInTheDocument()
    expect(screen.getByText('intfloat/e5-base-v2')).toBeInTheDocument()
    first.unmount()

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ message: 'Not Found.' }, 404)))
    renderApp({ route: '/documents/missing' })
    expect(await screen.findByRole('heading', { name: 'Document not found' })).toBeInTheDocument()
  })

  it('persists rename and index actions before updating the detail', async () => {
    const user = userEvent.setup()
    document.cookie = 'XSRF-TOKEN=csrf-token; path=/'
    const renamed = { ...handbook, name: 'Employee Handbook (Renamed).pdf' }
    const indexing = { ...renamed, status: 'pending', status_label: 'Pending', rag_stage: 'queued', chunks: null }
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(jsonResponse({ data: handbook }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(jsonResponse({ data: renamed }))
      .mockResolvedValueOnce(jsonResponse({ data: indexing }, 202)))
    renderApp({ route: '/documents/doc-123' })
    await screen.findByRole('heading', { name: 'Employee Handbook.pdf' })

    await openActions(user)
    await user.click(screen.getByRole('button', { name: 'Rename' }))
    expect(await screen.findByRole('heading', { name: 'Employee Handbook (Renamed).pdf' })).toBeInTheDocument()
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/api/v1/documents/doc-123'), expect.objectContaining({
      body: JSON.stringify({ name: 'Employee Handbook (Renamed).pdf' }),
      method: 'PATCH',
    }))

    await openActions(user)
    await user.click(screen.getByRole('button', { name: 'Index' }))
    expect(await screen.findByText('Indexing started.')).toBeInTheDocument()
    expect(screen.getByText('Pending')).toBeInTheDocument()
    expect(fetch).toHaveBeenLastCalledWith(expect.stringContaining('/api/v1/documents/doc-123/index'), expect.objectContaining({ method: 'POST' }))
  })

  it('offers Stop for an active run and returns the document to Uploaded', async () => {
    const user = userEvent.setup()
    document.cookie = 'XSRF-TOKEN=csrf-token; path=/'
    const pending = { ...handbook, status: 'pending', status_label: 'Pending', rag_stage: 'queued', chunks: null }
    const uploaded = { ...pending, status: 'uploaded', status_label: 'Uploaded', rag_stage: 'uploaded' }
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(jsonResponse({ data: pending }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(jsonResponse({ data: uploaded })))
    renderApp({ route: '/documents/doc-123' })
    await screen.findByRole('heading', { name: 'Employee Handbook.pdf' })

    await openActions(user)
    expect(screen.getByRole('button', { name: 'Stop' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Index' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Stop' }))

    expect(await screen.findByText('Indexing stopped.')).toBeInTheDocument()
    expect(screen.getAllByText('Uploaded').length).toBeGreaterThan(0)
    expect(fetch).toHaveBeenLastCalledWith(expect.stringContaining('/api/v1/documents/doc-123/index'), expect.objectContaining({ method: 'DELETE' }))
  })

  it('shows Ready after completed indexing and a readable reason after failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(jsonResponse({ data: handbook })))
    const ready = renderApp({ route: '/documents/doc-123' })
    expect(await screen.findByText('Ready for semantic search')).toBeInTheDocument()
    expect(screen.getAllByText('Ready').length).toBeGreaterThan(0)
    ready.unmount()

    const failed = {
      ...handbook,
      status: 'failed',
      status_label: 'Failed',
      rag_stage: 'failed',
      failure_reason: 'This document could not be read. It may be empty, damaged, or unsupported.',
    }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(jsonResponse({ data: failed })))
    renderApp({ route: '/documents/doc-123' })

    expect(await screen.findByRole('alert')).toHaveTextContent('This document could not be read')
  })

  it('retains the prior document when a mutation fails', async () => {
    const user = userEvent.setup()
    document.cookie = 'XSRF-TOKEN=csrf-token; path=/'
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(jsonResponse({ data: handbook }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(jsonResponse({ message: 'Rename failed.' }, 500)))
    renderApp({ route: '/documents/doc-123' })
    await screen.findByRole('heading', { name: 'Employee Handbook.pdf' })

    await openActions(user)
    await user.click(screen.getByRole('button', { name: 'Rename' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Rename failed.')
    expect(screen.getByRole('heading', { name: 'Employee Handbook.pdf' })).toBeInTheDocument()
  })

  it('deletes on the server and navigates to the refreshed collection', async () => {
    const user = userEvent.setup()
    document.cookie = 'XSRF-TOKEN=csrf-token; path=/'
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(jsonResponse({ data: handbook }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(documentsResponse([])))
    renderApp({ route: '/documents/doc-123' })
    await screen.findByRole('heading', { name: 'Employee Handbook.pdf' })

    await openActions(user)
    await user.click(screen.getByRole('button', { name: 'Delete' }))

    expect(await screen.findByRole('heading', { name: 'Documents' })).toBeInTheDocument()
    expect(await screen.findByText('No documents uploaded yet.')).toBeInTheDocument()
  })

  it('opens protected content and downloads a protected Blob', async () => {
    const user = userEvent.setup()
    const createObjectURL = vi.fn(() => 'blob:document')
    const revokeObjectURL = vi.fn()
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: createObjectURL })
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: revokeObjectURL })
    vi.stubGlobal('open', vi.fn())
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(jsonResponse({ data: handbook }))
      .mockResolvedValueOnce(new Response(new Blob(['pdf'], { type: 'application/pdf' })))
      .mockResolvedValueOnce(new Response(new Blob(['pdf'], { type: 'application/pdf' }))))
    renderApp({ route: '/documents/doc-123' })
    await screen.findByRole('heading', { name: 'Employee Handbook.pdf' })

    await openActions(user)
    await user.click(screen.getByRole('button', { name: 'View original' }))
    expect(window.open).toHaveBeenCalledWith('blob:document', '_blank', 'noopener,noreferrer')

    await openActions(user)
    await user.click(screen.getByRole('button', { name: 'Download' }))
    expect(click).toHaveBeenCalled()
    expect(createObjectURL).toHaveBeenCalledTimes(2)
    expect(within(document.body).queryByRole('link', { name: 'Employee Handbook.pdf' })).not.toBeInTheDocument()
  })
})
