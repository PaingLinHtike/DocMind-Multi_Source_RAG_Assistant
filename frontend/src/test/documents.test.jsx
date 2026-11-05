import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderApp } from './renderApp.jsx'

const expectedRows = [
  ['Employee Handbook.pdf', 'PDF', 'Ready', '120', 'Nov 5, 2026 10:24 AM'],
  ['Company Policies.docx', 'DOCX', 'Ready', '87', 'Nov 4, 2026 3:10 PM'],
  ['Company Website', 'WEB', 'Processing', '—', 'Nov 4, 2026 11:02 AM'],
  ['Benefits Guide.pdf', 'PDF', 'Failed', '—', 'Nov 3, 2026 6:45 PM'],
]

afterEach(() => vi.unstubAllGlobals())

describe('Documents prototype', () => {
  it('shows all Figma document rows and metadata', () => {
    renderApp({ route: '/documents' })

    expect(screen.getByRole('heading', { name: 'Documents' })).toBeInTheDocument()
    expect(screen.getByText('Manage your uploaded files and knowledge sources.')).toBeInTheDocument()

    for (const rowData of expectedRows) {
      const row = screen.getByRole('link', { name: new RegExp(rowData[0]) })
      for (const value of rowData) expect(within(row).getByText(value)).toBeInTheDocument()
    }
  })

  it('filters case-insensitively and shows an intentional empty state', async () => {
    const user = userEvent.setup()
    renderApp({ route: '/documents' })
    const search = screen.getByPlaceholderText('Search documents...')

    await user.type(search, 'company')
    expect(screen.getByText('Company Policies.docx')).toBeInTheDocument()
    expect(screen.getByText('Company Website')).toBeInTheDocument()
    expect(screen.queryByText('Employee Handbook.pdf')).not.toBeInTheDocument()

    await user.clear(search)
    await user.type(search, 'missing file')
    expect(screen.getByText('No documents match “missing file”.')).toBeInTheDocument()
  })

  it('navigates to the exact document details and metadata', async () => {
    const user = userEvent.setup()
    renderApp({ route: '/documents' })

    await user.click(screen.getByRole('link', { name: /Employee Handbook\.pdf/ }))
    expect(screen.getByRole('heading', { name: 'Employee Handbook.pdf' })).toBeInTheDocument()
    expect(screen.getByText('Uploaded Nov 5, 2026 10:24 AM')).toBeInTheDocument()
    for (const value of ['Type', 'PDF', 'Chunks', '120', 'Size', '2.4 MB', 'Source', 'Upload', 'Storage', 'documents/user_001/doc_123.pdf']) {
      expect(screen.getByText(value)).toBeInTheDocument()
    }
  })

  it('opens the actions menu and dismisses it with Escape or an outside click', async () => {
    const user = userEvent.setup()
    renderApp({ route: '/documents/doc-123' })
    const actions = screen.getByRole('button', { name: 'Actions' })

    await user.click(actions)
    for (const action of ['View Original', 'Download', 'Reindex', 'Rename', 'Delete']) {
      expect(screen.getByRole('button', { name: action })).toBeInTheDocument()
    }

    await user.keyboard('{Escape}')
    expect(screen.queryByRole('button', { name: 'Reindex' })).not.toBeInTheDocument()

    await user.click(actions)
    await user.click(screen.getByRole('heading', { name: 'Overview' }))
    expect(screen.queryByRole('button', { name: 'Reindex' })).not.toBeInTheDocument()
  })

  it('simulates reindex, rename, and delete without network calls', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const user = userEvent.setup()
    renderApp({ route: '/documents/doc-123' })

    await user.click(screen.getByRole('button', { name: 'Actions' }))
    await user.click(screen.getByRole('button', { name: 'Reindex' }))
    expect(screen.getByText('Reindexing started.')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Actions' }))
    await user.click(screen.getByRole('button', { name: 'Rename' }))
    expect(screen.getByRole('heading', { name: 'Employee Handbook (Renamed).pdf' })).toBeInTheDocument()
    expect(screen.getByText('Document renamed.')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Actions' }))
    await user.click(screen.getByRole('button', { name: 'Delete' }))
    expect(screen.getByRole('heading', { name: 'Document deleted' })).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
