import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import DocumentRow from '../components/documents/DocumentRow.jsx'
import { renderApp } from './renderApp.jsx'

const expectedRows = [
  ['Employee Handbook.pdf', 'PDF', 'Ready', '120', 'Nov 5, 2026 10:24 AM'],
  ['Company Policies.docx', 'DOCX', 'Ready', '87', 'Nov 4, 2026 3:10 PM'],
  ['Company Website', 'WEB', 'Processing', '—', 'Nov 4, 2026 11:02 AM'],
  ['Benefits Guide.pdf', 'PDF', 'Failed', '—', 'Nov 3, 2026 6:45 PM'],
]

afterEach(() => vi.unstubAllGlobals())

describe('Documents prototype', () => {
  it('shows a ruled document index with explicit statuses and mono metadata', () => {
    renderApp({ route: '/documents' })

    expect(screen.getByRole('heading', { name: 'Documents' })).toBeInTheDocument()
    expect(screen.getByText('Manage your uploaded files and knowledge sources.')).toBeInTheDocument()

    const upload = screen.getByRole('link', { name: 'Upload document' })
    expect(upload.querySelector('svg')).toBeInTheDocument()

    for (const rowData of expectedRows) {
      const row = screen.getByRole('link', { name: new RegExp(rowData[0]) })
      for (const value of rowData) expect(within(row).getByText(value)).toBeInTheDocument()
      expect(row).toHaveClass('min-h-[52px]')
      expect(row.querySelector('svg')).toBeInTheDocument()
      expect(within(row).getByText(rowData[4])).toHaveClass('font-mono')
    }
    for (const status of ['Ready', 'Processing', 'Failed']) expect(screen.getAllByText(status).length).toBeGreaterThan(0)
    expect(screen.getByPlaceholderText('Search documents...').closest('.field-control')).toBeInTheDocument()
  })

  it('keeps an unusually long document name locally constrained', () => {
    const document = { id: 'long', name: `${'Quarterly-policy-and-compliance-'.repeat(8)}.pdf`, type: 'PDF', status: 'Ready', chunks: '1', uploadedAt: 'Nov 7, 2026' }
    render(<MemoryRouter><DocumentRow document={document} /></MemoryRouter>)
    const name = screen.getByText(document.name)
    expect(name).toHaveClass('min-w-0', 'truncate')
    expect(name.parentElement).toHaveClass('min-w-0')
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
    const emptyState = screen.getByText('No documents match “missing file”.')
    expect(emptyState).toBeInTheDocument()
    expect(emptyState.closest('.table-scroll')).toBeNull()
    expect(screen.queryByText('Name')).not.toBeInTheDocument()
  })

  it('navigates to the exact document details and metadata', async () => {
    const user = userEvent.setup()
    renderApp({ route: '/documents' })

    await user.click(screen.getByRole('link', { name: /Employee Handbook\.pdf/ }))
    const detailsHeading = screen.getByRole('heading', { name: 'Employee Handbook.pdf' })
    expect(detailsHeading).toHaveClass('break-words')
    expect(detailsHeading).toHaveClass('text-3xl')
    const breadcrumb = screen.getByRole('navigation', { name: 'Breadcrumb' })
    expect(within(breadcrumb).getByRole('link', { name: 'Documents' })).toHaveClass('min-h-11')
    expect(screen.getByText('Uploaded Nov 5, 2026 10:24 AM')).toBeInTheDocument()
    expect(screen.getByText('Type')).toHaveClass('text-sm')
    expect(screen.getByText('2.4 MB')).toHaveClass('text-lg')
    const metadata = screen.getByText('documents/user_001/doc_123.pdf').closest('dl')
    for (const value of ['Type', 'PDF', 'Chunks', '120', 'Size', '2.4 MB', 'Source', 'Upload', 'Storage', 'documents/user_001/doc_123.pdf']) {
      expect(within(metadata).getByText(value)).toBeInTheDocument()
    }
    expect(screen.getByText('documents/user_001/doc_123.pdf')).toHaveClass('break-all', 'font-mono')
  })

  it('renders an explicit not-found state for an unknown document', () => {
    renderApp({ route: '/documents/missing-document' })
    expect(screen.getByRole('heading', { name: 'Document not found' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Return to documents' })).toHaveAttribute('href', '/documents')
  })

  it('opens the actions menu and dismisses it with Escape or an outside click', async () => {
    const user = userEvent.setup()
    renderApp({ route: '/documents/doc-123' })
    const actions = screen.getByRole('button', { name: 'Actions' })

    await user.click(actions)
    const menu = screen.getByRole('menu')
    expect(menu).toHaveClass('left-0')
    expect(menu).toHaveClass('sm:right-0')
    for (const action of ['View original', 'Download', 'Reindex', 'Rename', 'Delete']) {
      const actionButton = screen.getByRole('button', { name: action })
      expect(actionButton).toBeInTheDocument()
      expect(actionButton).toHaveClass('min-h-11')
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
    const returnLink = screen.getByRole('link', { name: 'Return to documents' })
    expect(returnLink).toHaveClass('min-h-11')
    expect(returnLink).toHaveClass('text-accent')
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
