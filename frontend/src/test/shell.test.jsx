import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { renderApp } from './renderApp.jsx'

describe('DocMind application shell', () => {
  it('shows the brand, primary routes, and profile control', () => {
    renderApp()

    expect(screen.getByText('DocMind')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Dashboard' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Chat' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Documents' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Open profile menu' })).toBeInTheDocument()
  })

  it('opens the account menu and closes it with Escape', async () => {
    const user = userEvent.setup()
    renderApp()

    await user.click(screen.getByRole('button', { name: 'Open profile menu' }))
    expect(screen.getByText('Aung')).toBeInTheDocument()
    expect(screen.getByText('aung@example.com')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Upload Document' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Settings' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Log Out' })).toBeInTheDocument()

    await user.keyboard('{Escape}')
    expect(screen.queryByText('aung@example.com')).not.toBeInTheDocument()
  })

  it('navigates between primary placeholder screens', async () => {
    const user = userEvent.setup()
    renderApp()

    await user.click(screen.getByRole('link', { name: 'Chat' }))
    expect(screen.getByRole('heading', { name: 'Chat' })).toBeInTheDocument()

    await user.click(screen.getByRole('link', { name: 'Documents' }))
    expect(screen.getByRole('heading', { name: 'Documents' })).toBeInTheDocument()
  })
})
