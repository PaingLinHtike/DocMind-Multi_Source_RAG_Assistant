import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { renderApp } from './renderApp.jsx'

describe('Upload Document', () => {
  it('validates missing and unsupported files without adding an upload', () => {
    renderApp({ route: '/upload' })
    const input = screen.getByLabelText('Choose File')

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

    await user.clear(name)
    await user.type(name, 'Aung Min')
    await user.clear(email)
    await user.type(email, 'aung.min@example.com')
    expect(name).toHaveValue('Aung Min')
    expect(email).toHaveValue('aung.min@example.com')

    await user.click(screen.getByRole('button', { name: 'Show password' }))
    expect(password).toHaveAttribute('type', 'text')
    expect(screen.getByRole('button', { name: 'Hide password' })).toBeInTheDocument()
  })

  it('simulates Change Password feedback locally', async () => {
    const user = userEvent.setup()
    renderApp({ route: '/settings' })

    await user.click(screen.getByRole('button', { name: 'Change Password' }))
    expect(screen.getByText('Password change link sent to aung@example.com.')).toBeInTheDocument()
  })
})
