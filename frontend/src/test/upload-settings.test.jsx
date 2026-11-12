import { fireEvent, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { renderApp } from './renderApp.jsx'

describe('Upload Document', () => {
  const recentUpload = {
    id: 'doc-existing', name: 'Employee Handbook.pdf', type: 'PDF', status: 'ready', status_label: 'Ready',
    chunks: 120, uploaded_at: '2026-11-05T10:24:00Z', size_bytes: 2516582, size: '2.4 MB',
    source: 'Upload', storage: 'documents/user-1/doc-existing.pdf',
  }

  const uploadedDocument = {
    id: 'doc-new', name: 'Remote Work Policy.pdf', type: 'PDF', status: 'uploaded', status_label: 'Uploaded',
    chunks: 0, uploaded_at: '2026-11-08T10:24:00Z', size_bytes: 6, size: '6 B',
    source: 'Upload', storage: 'documents/user-1/doc-new.pdf',
  }

  function jsonResponse(body, status = 200) {
    return new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  it('loads recent uploads from Laravel', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ data: [recentUpload] })))
    renderApp({ route: '/upload' })

    expect(screen.getByRole('status')).toHaveTextContent('Loading recent uploads')
    const upload = await screen.findByTestId('recent-upload-Employee Handbook.pdf')
    expect(within(upload).getByText('Ready')).toBeInTheDocument()
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/api/v1/uploads/recent'), expect.objectContaining({ method: 'GET' }))
  })

  it('validates missing and unsupported files without sending an upload request', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ data: [recentUpload] })))
    renderApp({ route: '/upload' })
    await screen.findByText('Employee Handbook.pdf')
    const input = screen.getByLabelText('Choose file')
    const picker = input.closest('label')
    expect(picker).toHaveClass('focus-within:outline-2')
    expect(picker).toHaveClass('focus-within:outline-focus')

    const heading = screen.getByRole('heading', { name: 'Upload document' })
    expect(heading).toHaveClass('text-[2rem]')
    expect(heading).toHaveClass('lg:text-[2.5rem]')
    expect(screen.getByText('Choose file')).toHaveClass('min-h-11')
    expect(screen.getAllByText('Ready').length).toBeGreaterThan(0)
    expect(screen.getByText('Supported: PDF • DOCX • TXT')).toBeInTheDocument()
    fireEvent.change(input, { target: { files: [] } })
    expect(screen.getByText('Choose a file first.')).toBeInTheDocument()

    const image = new File(['image'], 'diagram.png', { type: 'image/png' })
    fireEvent.change(input, { target: { files: [image] } })
    expect(screen.getByText('PDF, DOCX, and TXT files only.')).toBeInTheDocument()
    expect(screen.queryByText('diagram.png')).not.toBeInTheDocument()
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it.each([
    ['PDF', 'Remote Work Policy.pdf', 'application/pdf'],
    ['DOCX', 'Remote Work Policy.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    ['TXT', 'Remote Work Policy.txt', 'text/plain'],
  ])('posts a valid %s as FormData and displays the created uploaded document', async (_type, filename, mimeType) => {
    document.cookie = 'XSRF-TOKEN=csrf-token; path=/'
    const created = { ...uploadedDocument, name: filename, type: filename.split('.').pop().toLocaleUpperCase() }
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(jsonResponse({ data: [recentUpload] }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(jsonResponse({ data: created }, 201)))
    renderApp({ route: '/upload' })
    await screen.findByText('Employee Handbook.pdf')
    const input = screen.getByLabelText('Choose file')
    const file = new File(['policy'], filename, { type: mimeType })

    fireEvent.change(input, { target: { files: [file] } })

    const upload = await screen.findByTestId(`recent-upload-${filename}`)
    expect(within(upload).getByText('Uploaded')).toBeInTheDocument()
    const uploadCall = fetch.mock.calls.find(([url]) => url.endsWith('/api/v1/documents'))
    expect(uploadCall[1].method).toBe('POST')
    expect(uploadCall[1].body).toBeInstanceOf(FormData)
    expect(uploadCall[1].body.get('document')).toEqual(file)
    expect(uploadCall[1].headers).not.toHaveProperty('Content-Type')
  })

  it('disables file selection while an upload is pending', async () => {
    document.cookie = 'XSRF-TOKEN=csrf-token; path=/'
    let resolveUpload
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(jsonResponse({ data: [] }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockImplementationOnce(() => new Promise((resolve) => { resolveUpload = resolve })))
    renderApp({ route: '/upload' })
    await screen.findByText('No recent uploads yet.')
    const input = screen.getByLabelText('Choose file')
    const pdf = new File(['policy'], 'Remote Work Policy.pdf', { type: 'application/pdf' })

    fireEvent.change(input, { target: { files: [pdf] } })
    expect(input).toBeDisabled()
    expect(screen.getByText('Uploading…')).toBeInTheDocument()
    await vi.waitFor(() => expect(fetch.mock.calls.filter(([url]) => url.endsWith('/api/v1/documents'))).toHaveLength(1))

    resolveUpload(jsonResponse({ data: uploadedDocument }, 201))
    expect(await screen.findByTestId('recent-upload-Remote Work Policy.pdf')).toBeInTheDocument()
    expect(input).not.toBeDisabled()
  })

  it('shows Laravel document validation errors without adding a fake upload', async () => {
    document.cookie = 'XSRF-TOKEN=csrf-token; path=/'
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(jsonResponse({ data: [] }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(jsonResponse({
        message: 'The document could not be uploaded.',
        errors: { document: ['The document must not be greater than 10240 kilobytes.'] },
      }, 422)))
    renderApp({ route: '/upload' })
    await screen.findByText('No recent uploads yet.')

    fireEvent.change(screen.getByLabelText('Choose file'), {
      target: { files: [new File(['large'], 'large.pdf', { type: 'application/pdf' })] },
    })

    expect(await screen.findByRole('alert')).toHaveTextContent('The document must not be greater than 10240 kilobytes.')
    expect(screen.queryByTestId('recent-upload-large.pdf')).not.toBeInTheDocument()
  })

  it('reports a network failure without adding a fake upload', async () => {
    document.cookie = 'XSRF-TOKEN=csrf-token; path=/'
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(jsonResponse({ data: [] }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockRejectedValueOnce(new TypeError('Failed to fetch')))
    renderApp({ route: '/upload' })
    await screen.findByText('No recent uploads yet.')

    fireEvent.change(screen.getByLabelText('Choose file'), {
      target: { files: [new File(['policy'], 'offline.pdf', { type: 'application/pdf' })] },
    })

    expect(await screen.findByRole('alert')).toHaveTextContent('Unable to connect to the server. Please try again.')
    expect(screen.queryByTestId('recent-upload-offline.pdf')).not.toBeInTheDocument()
  })

  it('expires the session when recent uploads return 401', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ message: 'Unauthenticated.' }, 401)))
    renderApp({ route: '/upload' })

    expect(await screen.findByRole('heading', { name: 'Welcome back' })).toBeInTheDocument()
  })
})

describe('Settings', () => {
  function jsonResponse(body, status = 200) {
    return new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  it('initializes profile fields from auth and keeps all password fields empty without reading browser storage', () => {
    const getItem = vi.spyOn(Storage.prototype, 'getItem')
    renderApp({ route: '/settings' })

    expect(screen.getByLabelText('Name')).toHaveValue('Aung')
    expect(screen.getByLabelText('Email')).toHaveValue('aung@example.com')
    expect(screen.getByLabelText('Current Password')).toHaveValue('')
    expect(screen.getByLabelText('New Password')).toHaveValue('')
    expect(screen.getByLabelText('Confirm New Password')).toHaveValue('')
    expect(getItem).not.toHaveBeenCalled()
  })

  it('normalizes a profile update and refreshes the authenticated user after success', async () => {
    const user = userEvent.setup()
    const updatedUser = { id: 'user-1', name: 'Aung Min', email: 'aung.min@example.com', created_at: '2026-11-01T10:00:00Z' }
    document.cookie = 'XSRF-TOKEN=csrf-token; path=/'
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(jsonResponse({ data: updatedUser }))
      .mockResolvedValueOnce(jsonResponse({ data: updatedUser })))
    renderApp({ route: '/settings' })

    await user.clear(screen.getByLabelText('Name'))
    await user.type(screen.getByLabelText('Name'), 'Aung Min')
    await user.clear(screen.getByLabelText('Email'))
    await user.type(screen.getByLabelText('Email'), ' AUNG.MIN@EXAMPLE.COM ')
    await user.click(screen.getByRole('button', { name: 'Save changes' }))

    expect(await screen.findByRole('status')).toHaveTextContent('Account changes saved.')
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/api/v1/account/profile'), expect.objectContaining({
      method: 'PATCH',
      body: JSON.stringify({ name: 'Aung Min', email: 'aung.min@example.com' }),
    }))
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/api/v1/auth/user'), expect.objectContaining({ method: 'GET' }))
  })

  it('maps duplicate email errors and retains editable profile values without refreshing auth', async () => {
    const user = userEvent.setup()
    document.cookie = 'XSRF-TOKEN=csrf-token; path=/'
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(jsonResponse({
        message: 'The email has already been taken.',
        errors: { email: ['The email has already been taken.'] },
      }, 422)))
    renderApp({ route: '/settings' })

    await user.clear(screen.getByLabelText('Email'))
    await user.type(screen.getByLabelText('Email'), 'duplicate@example.com')
    await user.click(screen.getByRole('button', { name: 'Save changes' }))

    expect(await screen.findByText('The email has already been taken.')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toHaveValue('duplicate@example.com')
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true')
    expect(fetch.mock.calls.some(([url]) => url.endsWith('/api/v1/auth/user'))).toBe(false)
  })

  it('sends all password fields and clears them after success', async () => {
    const user = userEvent.setup()
    document.cookie = 'XSRF-TOKEN=csrf-token; path=/'
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(new Response(null, { status: 204 })))
    renderApp({ route: '/settings' })

    await user.type(screen.getByLabelText('Current Password'), 'OldPassword123!')
    await user.type(screen.getByLabelText('New Password'), 'NewPassword456!')
    await user.type(screen.getByLabelText('Confirm New Password'), 'NewPassword456!')
    await user.click(screen.getByRole('button', { name: 'Change password' }))

    expect(await screen.findByRole('status')).toHaveTextContent('Password updated.')
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/api/v1/account/password'), expect.objectContaining({
      method: 'PUT',
      body: JSON.stringify({
        current_password: 'OldPassword123!',
        password: 'NewPassword456!',
        password_confirmation: 'NewPassword456!',
      }),
    }))
    expect(screen.getByLabelText('Current Password')).toHaveValue('')
    expect(screen.getByLabelText('New Password')).toHaveValue('')
    expect(screen.getByLabelText('Confirm New Password')).toHaveValue('')
  })

  it('maps a wrong current password and preserves all password values', async () => {
    const user = userEvent.setup()
    document.cookie = 'XSRF-TOKEN=csrf-token; path=/'
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(jsonResponse({
        message: 'The current password is incorrect.',
        errors: { current_password: ['The current password is incorrect.'] },
      }, 422)))
    renderApp({ route: '/settings' })

    await user.type(screen.getByLabelText('Current Password'), 'WrongPassword123!')
    await user.type(screen.getByLabelText('New Password'), 'NewPassword456!')
    await user.type(screen.getByLabelText('Confirm New Password'), 'NewPassword456!')
    await user.click(screen.getByRole('button', { name: 'Change password' }))

    expect(await screen.findByText('The current password is incorrect.')).toBeInTheDocument()
    expect(screen.getByLabelText('Current Password')).toHaveValue('WrongPassword123!')
    expect(screen.getByLabelText('New Password')).toHaveValue('NewPassword456!')
    expect(screen.getByLabelText('Confirm New Password')).toHaveValue('NewPassword456!')
  })

  it('never writes account or password values to localStorage', async () => {
    const user = userEvent.setup()
    document.cookie = 'XSRF-TOKEN=csrf-token; path=/'
    const setItem = vi.spyOn(Storage.prototype, 'setItem')
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(jsonResponse({ message: 'Password updated.' })))
    renderApp({ route: '/settings' })

    await user.type(screen.getByLabelText('Current Password'), 'OldPassword123!')
    await user.type(screen.getByLabelText('New Password'), 'NewPassword456!')
    await user.type(screen.getByLabelText('Confirm New Password'), 'NewPassword456!')
    await user.click(screen.getByRole('button', { name: 'Change password' }))
    await screen.findByText('Password updated.')

    expect(setItem).not.toHaveBeenCalled()
  })

  it('expires the session when an account update returns 401', async () => {
    const user = userEvent.setup()
    document.cookie = 'XSRF-TOKEN=csrf-token; path=/'
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(jsonResponse({ message: 'Unauthenticated.' }, 401)))
    renderApp({ route: '/settings' })

    await user.click(screen.getByRole('button', { name: 'Save changes' }))

    expect(await screen.findByRole('heading', { name: 'Welcome back' })).toBeInTheDocument()
  })
})
