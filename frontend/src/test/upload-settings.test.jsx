import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { renderApp } from './renderApp.jsx'

const SETTINGS_STORAGE_KEY = 'docmind.account-settings.v1'

describe('Upload document', () => {
  it('validates missing and unsupported files without adding an upload', () => {
    renderApp({ route: '/upload' })
    const input = screen.getByLabelText('Choose file')
    const picker = input.closest('label')
    expect(picker).toHaveClass('focus-within:outline-2')
    expect(picker).toHaveClass('focus-within:outline-focus')

    const heading = screen.getByRole('heading', { name: 'Upload document' })
    expect(heading).toHaveClass('font-display', 'text-[2rem]')
    expect(screen.getByText('Choose file')).toHaveClass('min-h-11')
    expect(screen.getByTestId('upload-drop-area')).toHaveClass('border-dashed', 'border-border-strong')
    expect(screen.getByText('Employee Handbook.pdf')).toBeInTheDocument()
    expect(screen.getAllByText('Ready').length).toBeGreaterThan(0)
    expect(screen.getByText('Supported: PDF • DOCX • TXT')).toBeInTheDocument()
    fireEvent.change(input, { target: { files: [] } })
    expect(screen.getByText('Choose a file first.')).toBeInTheDocument()

    const image = new File(['image'], 'diagram.png', { type: 'image/png' })
    fireEvent.change(input, { target: { files: [image] } })
    expect(screen.getByText('PDF, DOCX, and TXT files only.')).toBeInTheDocument()
    expect(screen.queryByText('diagram.png')).not.toBeInTheDocument()
  })

  it('accepts a PDF and simulates Processing to Ready in Recent Uploads', async () => {
    renderApp({ route: '/upload' })
    const input = screen.getByLabelText('Choose file')
    const pdf = new File(['policy'], 'Remote Work Policy.pdf', { type: 'application/pdf' })

    fireEvent.change(input, { target: { files: [pdf] } })
    const upload = screen.getByTestId('recent-upload-Remote Work Policy.pdf')
    expect(within(upload).getByText('Processing')).toHaveClass('h-6', 'font-mono')

    await waitFor(() => expect(within(upload).getByText('Ready')).toHaveClass('h-6', 'font-mono'))
  })
})

describe('Settings', () => {
  it('edits account fields locally and toggles password visibility', async () => {
    const user = userEvent.setup()
    renderApp({ route: '/settings' })
    const name = screen.getByLabelText('Name')
    const email = screen.getByLabelText('Email')
    const password = screen.getByLabelText('Password')

    expect(name).toHaveValue('Aung')
    expect(email).toHaveValue('aung@example.com')
    expect(password).toHaveAttribute('type', 'password')
    expect(screen.getByRole('heading', { name: 'Account' })).toHaveClass('text-2xl')
    for (const field of [name, email, password]) expect(field).toHaveClass('h-11')

    await user.clear(name)
    await user.type(name, 'Aung Min')
    await user.clear(email)
    await user.type(email, 'aung.min@example.com')
    expect(name).toHaveValue('Aung Min')
    expect(email).toHaveValue('aung.min@example.com')

    const showPassword = screen.getByRole('button', { name: 'Show password' })
    expect(showPassword.querySelector('svg')).toBeInTheDocument()
    await user.click(showPassword)
    expect(password).toHaveAttribute('type', 'text')
    expect(screen.getByRole('button', { name: 'Hide password' })).toBeInTheDocument()
  })

  it('simulates Change Password feedback locally', async () => {
    const user = userEvent.setup()
    renderApp({ route: '/settings' })

    await user.click(screen.getByRole('button', { name: 'Change Password' }))
    expect(screen.getByText('Password change link sent to aung@example.com.')).toBeInTheDocument()
  })

  it('wraps long account feedback values', async () => {
    const user = userEvent.setup()
    renderApp({ route: '/settings' })
    const email = screen.getByLabelText('Email')

    await user.clear(email)
    await user.type(email, 'aung.min.with.an.extremely.long.account.address.for.testing@example-docmind-domain.com')
    await user.click(screen.getByRole('button', { name: 'Change Password' }))
    expect(screen.getByText(/^Password change link sent/)).toHaveClass('break-all')
  })

  it('saves all account fields locally and restores them after remount', async () => {
    const user = userEvent.setup()
    const first = renderApp({ route: '/settings' })
    const name = screen.getByLabelText('Name')
    const email = screen.getByLabelText('Email')
    const password = screen.getByLabelText('Password')

    await user.clear(name)
    await user.type(name, 'Aung Min')
    await user.clear(email)
    await user.type(email, 'aung.min@example.com')
    await user.clear(password)
    await user.type(password, 'new-secret')

    await user.click(screen.getByRole('button', { name: 'Save Changes' }))

    expect(screen.getByText('Account changes saved.')).toBeInTheDocument()
    expect(JSON.parse(window.localStorage.getItem(SETTINGS_STORAGE_KEY))).toEqual({
      name: 'Aung Min',
      email: 'aung.min@example.com',
      password: 'new-secret',
    })

    first.unmount()
    renderApp({ route: '/settings' })

    expect(screen.getByLabelText('Name')).toHaveValue('Aung Min')
    expect(screen.getByLabelText('Email')).toHaveValue('aung.min@example.com')
    expect(screen.getByLabelText('Password')).toHaveValue('new-secret')
  })

  it('falls back to defaults for broken or incomplete stored settings', () => {
    window.localStorage.setItem(SETTINGS_STORAGE_KEY, '{broken')
    const first = renderApp({ route: '/settings' })

    expect(screen.getByLabelText('Name')).toHaveValue('Aung')
    expect(screen.getByLabelText('Email')).toHaveValue('aung@example.com')
    expect(screen.getByLabelText('Password')).toHaveValue('docmind123')

    first.unmount()
    window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify({ name: 'Stored Name' }))
    renderApp({ route: '/settings' })

    expect(screen.getByLabelText('Name')).toHaveValue('Stored Name')
    expect(screen.getByLabelText('Email')).toHaveValue('aung@example.com')
    expect(screen.getByLabelText('Password')).toHaveValue('docmind123')
  })

  it('keeps the form usable and reports failure when storage rejects a save', async () => {
    const user = userEvent.setup()
    renderApp({ route: '/settings' })
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('Storage blocked')
    })

    try {
      await user.click(screen.getByRole('button', { name: 'Save Changes' }))
    } finally {
      setItem.mockRestore()
    }

    expect(screen.getByText('Unable to save changes in this browser.')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toHaveValue('aung@example.com')
  })

  it('submits the account form with Enter from a field', async () => {
    const user = userEvent.setup()
    renderApp({ route: '/settings' })
    const email = screen.getByLabelText('Email')

    await user.clear(email)
    await user.type(email, 'keyboard@example.com{Enter}')

    expect(screen.getByText('Account changes saved.')).toBeInTheDocument()
    expect(JSON.parse(window.localStorage.getItem(SETTINGS_STORAGE_KEY)).email).toBe('keyboard@example.com')
  })

  it('keeps a persistent live status region for save feedback', () => {
    renderApp({ route: '/settings' })
    const status = document.querySelector('[aria-live="polite"]')

    expect(status).not.toBeNull()
    expect(status).toHaveAttribute('aria-atomic', 'true')
    expect(status).toHaveTextContent('')
  })

  it('clears the save confirmation when an account field changes', async () => {
    const user = userEvent.setup()
    renderApp({ route: '/settings' })

    await user.click(screen.getByRole('button', { name: 'Save Changes' }))
    expect(screen.getByText('Account changes saved.')).toBeInTheDocument()

    await user.type(screen.getByLabelText('Name'), '!')
    expect(screen.queryByText('Account changes saved.')).not.toBeInTheDocument()
  })

  it('falls back to defaults when browser storage cannot be read', () => {
    const getItem = vi.spyOn(window.localStorage, 'getItem').mockImplementation(() => {
      throw new Error('Storage blocked')
    })

    try {
      renderApp({ route: '/settings' })
    } finally {
      getItem.mockRestore()
    }

    expect(screen.getByLabelText('Name')).toHaveValue('Aung')
    expect(screen.getByLabelText('Email')).toHaveValue('aung@example.com')
    expect(screen.getByLabelText('Password')).toHaveValue('docmind123')
  })

  it.each([
    ['null', 'null'],
    ['an array', '[]'],
    ['non-string fields', JSON.stringify({ name: 42, email: null, password: {} })],
  ])('uses defaults for %s stored settings', (_label, stored) => {
    window.localStorage.setItem(SETTINGS_STORAGE_KEY, stored)
    renderApp({ route: '/settings' })

    expect(screen.getByLabelText('Name')).toHaveValue('Aung')
    expect(screen.getByLabelText('Email')).toHaveValue('aung@example.com')
    expect(screen.getByLabelText('Password')).toHaveValue('docmind123')
  })

  it('saves again after a failed save once storage recovers', async () => {
    const user = userEvent.setup()
    renderApp({ route: '/settings' })
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementationOnce(() => {
      throw new Error('Storage blocked')
    })

    try {
      await user.click(screen.getByRole('button', { name: 'Save Changes' }))
      expect(screen.getByText('Unable to save changes in this browser.')).toBeInTheDocument()

      await user.click(screen.getByRole('button', { name: 'Save Changes' }))
    } finally {
      setItem.mockRestore()
    }

    expect(screen.getByText('Account changes saved.')).toBeInTheDocument()
    expect(JSON.parse(window.localStorage.getItem(SETTINGS_STORAGE_KEY))).toEqual({
      name: 'Aung',
      email: 'aung@example.com',
      password: 'docmind123',
    })
  })
})
