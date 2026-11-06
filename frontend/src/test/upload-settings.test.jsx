import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { renderApp } from './renderApp.jsx'

const SETTINGS_STORAGE_KEY = 'docmind.account-settings.v1'

describe('Upload Document', () => {
  it('validates missing and unsupported files without adding an upload', () => {
    renderApp({ route: '/upload' })
    const input = screen.getByLabelText('Choose File')
    const picker = input.closest('label')
    expect(picker).toHaveClass('focus-within:outline-2')
    expect(picker).toHaveClass('focus-within:outline-focus')

    const heading = screen.getByRole('heading', { name: 'Upload Document' })
    expect(heading).toHaveClass('text-3xl')
    expect(heading).toHaveClass('sm:text-4xl')
    expect(screen.getByText('Choose File')).toHaveClass('h-11')
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
    const input = screen.getByLabelText('Choose File')
    const pdf = new File(['policy'], 'Remote Work Policy.pdf', { type: 'application/pdf' })

    fireEvent.change(input, { target: { files: [pdf] } })
    const upload = screen.getByTestId('recent-upload-Remote Work Policy.pdf')
    expect(within(upload).getByText('Processing')).toBeInTheDocument()

    await waitFor(() => expect(within(upload).getByText('Ready')).toBeInTheDocument())
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
})
